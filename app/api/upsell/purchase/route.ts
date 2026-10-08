import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { calculatePlatformFee } from "../../../../lib/billing";
import { updateSaleStatus } from "@/app/actions/paymentActions";


export async function POST(req: Request) {
  try {
    const { strategy_id, previous_pi } = await req.json();
    console.log("Upsell Purchase Attempt:", { strategy_id, previous_pi });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (!previous_pi) {
      return corsResponse({ error: "Contexto da transação anterior ausente (parâmetro pi)" }, 400);
    }

    // 1. Get Strategy and related info
    const { data: strategy, error: strategyError } = await supabase
      .from("upsell_strategies")
      .select(`
        *,
        upsell_offer:upsell_offer_id(*),
        upsell_product:upsell_product_id(*)
      `)
      .eq("id", strategy_id)
      .single();

    if (strategyError || !strategy) {
      console.error("Strategy fetch error:", strategyError);
      return corsResponse({ error: "Estratégia de Upsell não encontrada" }, 404);
    }

    // 2. Get the seller's Stripe config
    const { data: stripeConfig, error: configError } = await supabase
      .from("stripe_configs")
      .select("*")
      .eq("user_id", strategy.user_id)
      .single();

    if (configError || !stripeConfig) {
      console.error("Stripe config fetch error:", configError);
      return corsResponse({ error: "Configuração Stripe do vendedor não encontrada" }, 400);
    }

    const stripe = new Stripe(stripeConfig.secret_key.trim(), {});

    // 3. Retrieve the previous PaymentIntent or Subscription to get customer and payment method
    console.log("Retrieving previous context from Stripe:", previous_pi);
    let customerId: string | null = null;
    let pmId: string | null = null;
    let parentPiId: string = previous_pi;

    if (previous_pi.startsWith("sub_")) {
      // Suporte para identificador de Assinatura Stripe (caso o upsell anterior tenha sido assinatura)
      const sub = await stripe.subscriptions.retrieve(previous_pi);
      customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as any)?.id;
      pmId = typeof sub.default_payment_method === "string"
        ? sub.default_payment_method
        : (sub.default_payment_method as any)?.id;

      if (sub.metadata?.parent_pi) {
        parentPiId = sub.metadata.parent_pi;
      }
    } else {
      const oldPi = await stripe.paymentIntents.retrieve(previous_pi);
      customerId = typeof oldPi.customer === "string" ? oldPi.customer : (oldPi.customer as any)?.id;
      pmId = typeof oldPi.payment_method === "string"
        ? oldPi.payment_method
        : (oldPi.payment_method as any)?.id;

      if (oldPi.metadata?.parent_pi) {
        parentPiId = oldPi.metadata.parent_pi;
      }
    }

    // Fallback inteligente: se o PaymentIntent ou Assinatura não tiver o PM diretamente, busca no Customer
    if (!pmId && customerId) {
      try {
        const cust = (await stripe.customers.retrieve(customerId)) as any;
        if (cust && !cust.deleted && cust.invoice_settings?.default_payment_method) {
          pmId = typeof cust.invoice_settings.default_payment_method === "string"
            ? cust.invoice_settings.default_payment_method
            : cust.invoice_settings.default_payment_method.id;
        }

        if (!pmId) {
          const pms = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 5 });
          if (pms.data.length > 0) {
            pmId = pms.data[0].id;
          }
        }
      } catch (pmLookupErr) {
        console.error("Error fetching fallback payment method for customer:", pmLookupErr);
      }
    }

    if (!customerId || !pmId) {
      console.error("Missing customer or PM in old context:", { customer: customerId, pm: pmId, previous_pi });
      return corsResponse({ error: "Não foi possível recuperar o método de pagamento da transação anterior (Cliente ou Cartão ausente no Stripe)" }, 400);
    }

    // 4. Create new PaymentIntent for the upsell (One-Click)
    const offer = strategy.upsell_offer;
    const product = strategy.upsell_product;
    const amount = offer ? offer.price : product.price;
    const currency = offer ? offer.currency : product.currency;

    console.log("Creating Upsell PI for amount:", amount, currency);

    // 4.1 Fetch previous sale to get customer details (with fallbacks)
    let { data: previousSale } = await supabase
      .from("sales")
      .select("customer_name, customer_email, customer_phone, utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, sck, customer_ip")
      .eq("stripe_payment_intent_id", previous_pi)
      .limit(1)
      .maybeSingle();

    if (!previousSale && previous_pi.startsWith("sub_")) {
      const { data: subSale } = await supabase
        .from("sales")
        .select("customer_name, customer_email, customer_phone, utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, sck, customer_ip")
        .eq("stripe_subscription_id", previous_pi)
        .limit(1)
        .maybeSingle();
      if (subSale) previousSale = subSale;
    }

    if (!previousSale && parentPiId && parentPiId !== previous_pi) {
      const { data: parentSale } = await supabase
        .from("sales")
        .select("customer_name, customer_email, customer_phone, utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, sck, customer_ip")
        .eq("stripe_payment_intent_id", parentPiId)
        .limit(1)
        .maybeSingle();
      if (parentSale) previousSale = parentSale;
    }

    // 4.2 Check if product is configured as subscription in SinglePay
    const { data: upsellCheckout } = await supabase
      .from("checkouts")
      .select("payment_type")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isSubscription = upsellCheckout?.payment_type === "subscription";

    let newPiId: string;
    let subscriptionId: string | null = null;

    if (isSubscription) {
      console.log("Upsell is SUBSCRIPTION. Processing recurring charge via Stripe Subscriptions...");

      // Garantir método de pagamento vinculado ao cliente
      try {
        await stripe.paymentMethods.attach(pmId, { customer: customerId });
      } catch (attachErr: any) {
        // Ignora se o método já estiver anexado a este cliente
        console.log("Note: Payment method already attached or:", attachErr.message);
      }

      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: pmId }
      });

      // Obter ou criar Produto e Preço Recorrente na Stripe
      let stripeProductId = product.stripe_product_id;
      let priceId: string;

      if (stripeProductId) {
        const existingPrices = await stripe.prices.list({
          product: stripeProductId,
          active: true,
          limit: 10
        });

        const matchingRecurring = existingPrices.data.find(
          p => p.type === "recurring" && p.unit_amount === Math.round(amount * 100) && p.currency === currency.toLowerCase()
        );

        if (matchingRecurring) {
          priceId = matchingRecurring.id;
        } else {
          const newPrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            recurring: { interval: "month" }
          });
          priceId = newPrice.id;
        }
      } else {
        const stripeProduct = await stripe.products.create({
          name: product.name || "Digital Content",
          description: product.description || "Access to digital content",
          metadata: { product_id: product.id }
        });
        stripeProductId = stripeProduct.id;

        const newPrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(amount * 100),
          currency: currency.toLowerCase(),
          recurring: { interval: "month" }
        });
        priceId = newPrice.id;
      }

      // Criar assinatura One-Click (off-session)
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        default_payment_method: pmId,
        off_session: true,
        payment_behavior: "allow_incomplete",
        expand: ["latest_invoice", "latest_invoice.payment_intent"],
        metadata: {
          strategy_id: strategy.id,
          parent_pi: parentPiId || previous_pi,
          product_id: product.id,
          user_id: strategy.user_id,
          is_upsell: "true",
          customer_name: previousSale?.customer_name || "",
          customer_email: previousSale?.customer_email || ""
        }
      });

      subscriptionId = subscription.id;
      const invoice = subscription.latest_invoice as any;
      const invoicePaymentIntent = invoice?.payment_intent;
      newPiId = typeof invoicePaymentIntent === "object" && invoicePaymentIntent
        ? invoicePaymentIntent.id
        : (typeof invoicePaymentIntent === "string" ? invoicePaymentIntent : subscription.id);

      console.log("Upsell Subscription Success! ID:", subscription.id, "PI:", newPiId);
    } else {
      // ── FLUXO DE PAGAMENTO ÚNICO ──
      const newPi = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        customer: customerId,
        payment_method: pmId,
        off_session: true,
        confirm: true,
        metadata: {
          strategy_id: strategy.id,
          parent_pi: parentPiId || previous_pi,
          product_id: product.id,
          user_id: strategy.user_id,
          is_upsell: "true",
          customer_name: previousSale?.customer_name || "",
          customer_email: previousSale?.customer_email || ""
        }
      });

      newPiId = newPi.id;
      console.log("Upsell Success! New PI:", newPi.id);
    }

    const platformFee = await calculatePlatformFee(strategy.user_id, amount, currency);

    // 5. Record the sale in Supabase
    const { error: saleError } = await supabase.from("sales").insert({
      user_id: strategy.user_id,
      product_id: product.id,
      offer_id: offer?.id || null,
      stripe_payment_intent_id: newPiId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      customer_name: previousSale?.customer_name || null,
      customer_email: previousSale?.customer_email || null,
      customer_phone: previousSale?.customer_phone || null,
      // Inherit tracking data for Utmify attribution
      utm_source: previousSale?.utm_source || null,
      utm_medium: previousSale?.utm_medium || null,
      utm_campaign: previousSale?.utm_campaign || null,
      utm_content: previousSale?.utm_content || null,
      utm_term: previousSale?.utm_term || null,
      src: previousSale?.src || null,
      sck: previousSale?.sck || null,
      customer_ip: previousSale?.customer_ip || null,
      amount: amount,
      currency: currency,
      platform_fee: platformFee,
      status: "pending",
      is_orderbump: false
    });

    if (saleError) {
      console.error("Error recording upsell sale:", saleError);
      throw new Error("Falha ao registrar a venda do upsell no banco de dados.");
    }
    // 6. Trigger post-purchase actions (Emails, Webhooks, Utmify, etc)
    // By calling updateSaleStatus, it updates from pending to succeeded and fires everything!

    const trackingData = {
      src: previousSale?.src,
      sck: previousSale?.sck,
      utm_source: previousSale?.utm_source,
      utm_medium: previousSale?.utm_medium,
      utm_campaign: previousSale?.utm_campaign,
      utm_content: previousSale?.utm_content,
      utm_term: previousSale?.utm_term,
      ip: previousSale?.customer_ip
    };

    const customerData = {
      name: previousSale?.customer_name || "",
      email: previousSale?.customer_email || "",
      phone: previousSale?.customer_phone || "",
      stripe_customer_id: customerId,
      stripe_payment_method_id: pmId
    };

    // Await execution so Vercel doesn't kill the process before emails and webhooks are sent
    await updateSaleStatus(newPiId, "succeeded", customerData, trackingData).catch(err =>
      console.error("Upsell post-purchase tasks failed:", err)
    );

    return corsResponse({ success: true, pi: newPiId });

  } catch (error: any) {
    console.error("Upsell purchase error:", error);
    return corsResponse({ error: error.message }, 500);
  }
}

function corsResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
