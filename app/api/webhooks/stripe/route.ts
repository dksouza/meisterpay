

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { updateSaleStatus } from "../../../actions/paymentActions";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  // 1. Parse unverified body to inspect event metadata & type
  let eventData;
  try {
    eventData = JSON.parse(body);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const obj = eventData.data?.object;
  const metadataType = obj?.metadata?.type;
  const description = obj?.description || "";

  // Vendas de produtos do vendedor possuem checkout_id, product_id ou offer_id nos metadados
  const isSellerSaleMeta = !!(obj?.metadata?.checkout_id || obj?.metadata?.product_id || obj?.metadata?.offer_id);

  const isPlatformMeta = !isSellerSaleMeta && (
    metadataType === 'platform_billing' ||
    metadataType === 'platform_subscription' ||
    description.includes('Taxas de plataforma meisterpay')
  );

  // 2. Check if this is a Platform Webhook (signed by platform webhook secret or with platform metadata)
  let event: Stripe.Event | null = null;
  let isPlatformEvent = false;

  const platformWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const platformSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!isSellerSaleMeta && platformWebhookSecret && platformSecretKey) {
    try {
      const platformStripe = new Stripe(platformSecretKey, { apiVersion: '2023-10-16' as any });
      event = platformStripe.webhooks.constructEvent(body, sig, platformWebhookSecret.trim());
      isPlatformEvent = true;
    } catch (err) {
      // Signature didn't match platform secret - could be a seller store webhook
    }
  }

  if (!isPlatformEvent && isPlatformMeta) {
    isPlatformEvent = true;
    event = eventData;
  }

  // 3. Handle Platform Webhooks (e.g. cron billing, platform fees, subscriptions)
  if (isPlatformEvent && event) {
    console.log(`[WEBHOOK] Received platform event: ${event.type} (id: ${event.id})`);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[WEBHOOK] Platform PaymentIntent Succeeded: ${pi.id}`);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[WEBHOOK] Platform PaymentIntent Failed: ${pi.id}`);
        break;
      }
      default:
        console.log(`[WEBHOOK] Unhandled platform event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type, platform: true });
  }

  // 4. Handle Seller / Store Webhooks
  const piId = eventData.data?.object?.payment_intent || eventData.data?.object?.id;

  if (!piId || typeof piId !== 'string' || !piId.startsWith('pi_')) {
    // Se não for um evento de PI, tentamos processar mas sem garantia de encontrar o usuário se não tivermos o ID no metadata
    console.log("[WEBHOOK] Event without clear PI ID:", eventData.type);
  }

  // 5. Initialize Supabase with Service Role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  // 6. Identify User for Seller event
  let userId =
    obj?.metadata?.user_id ||
    obj?.subscription_details?.metadata?.user_id ||
    obj?.lines?.data?.[0]?.metadata?.user_id;

  if (!userId && piId && typeof piId === 'string' && piId.startsWith('pi_')) {
    // Lookup in sales table by PaymentIntent
    const { data: sale } = await supabase
      .from("sales")
      .select("user_id")
      .eq("stripe_payment_intent_id", piId)
      .limit(1)
      .maybeSingle();

    if (sale) userId = sale.user_id;
  }

  // Se ainda não achou e é uma invoice de assinatura, procura pelo ID da assinatura
  if (!userId && obj?.subscription) {
    const { data: subSale } = await supabase
      .from("sales")
      .select("user_id")
      .eq("stripe_subscription_id", typeof obj.subscription === 'string' ? obj.subscription : obj.subscription.id)
      .maybeSingle();

    if (subSale) userId = subSale.user_id;
  }

  // Fallback final: procurar pelo Customer ID (muito comum em pagamentos recorrentes onde o PI é novo e sem metadados)
  if (!userId && obj?.customer) {
    const customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer.id;
    const { data: customerSale } = await supabase
      .from("sales")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (customerSale) userId = customerSale.user_id;
  }

  if (!userId) {
    console.error("[WEBHOOK] Could not identify user for event :", eventData.type, "PI/ID:", piId);
    return NextResponse.json({ error: "User identification failed" }, { status: 400 });
  }

  // 7. Get user's Stripe configuration
  const { data: stripeConfig, error: configError } = await supabase
    .from("stripe_configs")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (configError || !stripeConfig || !stripeConfig.secret_key) {
    console.error(`[WEBHOOK] Stripe config not found for user ${userId}:`, configError);
    return NextResponse.json({ error: "User config not found" }, { status: 404 });
  }

  const stripe = new Stripe(stripeConfig.secret_key.trim(), {
    apiVersion: '2023-10-16' as any,
  });

  let sellerEvent: Stripe.Event;

  try {
    // Verify signature with user's webhook_secret
    if (stripeConfig.webhook_secret) {
      sellerEvent = stripe.webhooks.constructEvent(body, sig, stripeConfig.webhook_secret.trim());
    } else {
      console.warn(`[WEBHOOK] Warning: Processing unverified webhook for user ${userId} (No webhook_secret set)`);
      sellerEvent = JSON.parse(body);
    }
  } catch (err: any) {
    console.error(`[WEBHOOK] Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`[WEBHOOK] Received event: ${sellerEvent.type} for user ${userId}`);

  // 6. Final response
  let result = null;

  try {
    switch (sellerEvent.type) {
      case "payment_intent.succeeded": {
        const pi = sellerEvent.data.object as Stripe.PaymentIntent;
        console.log(`[WEBHOOK] PaymentIntent Succeeded: ${pi.id}`);
        result = await updateSaleStatus(pi.id, "succeeded");
        break;
      }

      case "checkout.session.completed": {
        const session = sellerEvent.data.object as Stripe.Checkout.Session;
        console.log(`[WEBHOOK] Checkout Session Completed: ${session.id}`);
        if (session.payment_intent) {
          result = await updateSaleStatus(session.payment_intent as string, "succeeded");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = sellerEvent.data.object as Stripe.PaymentIntent;
        const lastErr = pi.last_payment_error;
        const reason = lastErr?.message || lastErr?.decline_code || "Pagamento recusado pela operadora";
        console.log(`[WEBHOOK] PaymentIntent Failed: ${pi.id} - ${reason}`);
        result = await updateSaleStatus(pi.id, "refused", { failure_reason: reason });
        break;
      }

      case "charge.refunded": {
        const charge = sellerEvent.data.object as Stripe.Charge;
        console.log(`[WEBHOOK] Charge Refunded: ${charge.id}`);
        if (charge.payment_intent) {
          result = await updateSaleStatus(charge.payment_intent as string, "refunded");
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = sellerEvent.data.object as Stripe.Dispute;
        console.log(`[WEBHOOK] Chargeback Created: ${dispute.id}`);
        if (dispute.payment_intent) {
          result = await updateSaleStatus(dispute.payment_intent as string, "chargedback");
        }
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${sellerEvent.type}`);
    }

    return NextResponse.json({
      received: true,
      type: sellerEvent.type,
      utmify_result: result
    });
  } catch (err: any) {
    console.error(`[WEBHOOK] Error processing event: ${err.message}`);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

// Next.js config for raw body (if needed in some versions, but req.text() usually works in App Router)
export const dynamic = 'force-dynamic';
