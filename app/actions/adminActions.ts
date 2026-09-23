"use server";

import { createClient } from "../../lib/supabase/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { convertToBRL } from "../../lib/currency";
import { sendEmail } from "../../lib/mail";

export async function getPendingUsers() {
  const supabase = await createClient();

  // Verify if current user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { error: "Acesso restrito a administradores" };

  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { users };
}

export async function approveUser(userId: string) {
  const supabase = await createClient();

  // Fetch user profile email
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId);

  if (error) return { error: error.message };

  // Send email if user email exists
  if (userProfile?.email) {
    try {
      await sendEmail({
        to: userProfile.email,
        subject: "Seja muito bem vindo!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #8b5cf6; margin: 0; font-size: 24px; font-weight: bold;">meisterpay</h2>
            </div>
            <div style="background-color: #f9fafb; padding: 28px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <h3 style="color: #111827; margin-top: 0; font-size: 18px;">Seja muito bem vindo!</h3>
              <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                Parabéns, seu cadastro foi aceito e está liberado para uso. Ótimas vendas!
              </p>
              <div>
                <a href="https://app.meisterpay.com.br/login" style="background-color: #8b5cf6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
                  Acessar Plataforma
                </a>
              </div>
            </div>
            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af;">
              <p>© meisterpay. Todos os direitos reservados.</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("[APPROVE_USER_EMAIL_ERROR]", emailErr);
    }
  }

  revalidatePath("/admin/aprovacoes");
  return { success: true };
}

export async function rejectUser(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ status: "blocked" })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/aprovacoes");
  return { success: true };
}

export async function getUserDetailsForAdmin(userId: string) {
  const supabase = await createClient();

  // Verify if current user is admin
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: "Não autorizado" };

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", currentUser.id)
    .single();

  if (!adminProfile?.is_admin) return { error: "Acesso restrito" };

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: userProfile, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !userProfile) return { error: "Usuário não encontrado" };

  let hasCard = false;
  let cardLast4 = null;
  let cardBrand = null;

  if (userProfile.stripe_customer_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      } as any);
      const paymentMethods = await stripe.paymentMethods.list({
        customer: userProfile.stripe_customer_id,
        type: "card",
      });
      if (paymentMethods.data.length > 0) {
        hasCard = true;
        cardLast4 = paymentMethods.data[0].card?.last4;
        cardBrand = paymentMethods.data[0].card?.brand;
      }
    } catch (err) {
      console.error("Error fetching card info for admin:", err);
    }
  }

  // Calculate unbilled platform fees using supabaseAdmin to bypass RLS
  const { data: unbilledSales } = await supabaseAdmin
    .from("sales")
    .select("platform_fee")
    .eq("user_id", userId)
    .eq("is_fee_billed", false)
    .eq("status", "succeeded");

  const pendingFees = unbilledSales?.reduce((acc, s) => acc + (Number(s.platform_fee) || 0), 0) || 0;

  // Calculate total faturado (total volume of succeeded sales) using supabaseAdmin to bypass RLS
  const { data: succeededSales } = await supabaseAdmin
    .from("sales")
    .select("amount, currency, created_at, offer_id, product_id")
    .eq("user_id", userId)
    .eq("status", "succeeded");

  const totalsByCurrency: Record<string, number> = {};
  let totalFaturadoBRL = 0;

  const totalsHojeByCurrency: Record<string, number> = {};
  let totalHojeBRL = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (succeededSales && succeededSales.length > 0) {
    for (const sale of succeededSales) {
      const amt = Number(sale.amount) || 0;
      const curr = (sale.currency || "BRL").trim().toUpperCase();
      totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + amt;
      const brlValue = await convertToBRL(amt, curr);
      totalFaturadoBRL += brlValue;

      if (sale.created_at && new Date(sale.created_at) >= todayStart) {
        totalsHojeByCurrency[curr] = (totalsHojeByCurrency[curr] || 0) + amt;
        totalHojeBRL += brlValue;
      }
    }
  }

  // Fetch offers for the user
  const { data: userOffers } = await supabaseAdmin
    .from("offers")
    .select(`
      id,
      name,
      price,
      currency,
      hash,
      is_active,
      created_at,
      product_id,
      products (
        id,
        name,
        delivery_link,
        image_url,
        description
      )
    `)
    .eq("user_id", userId);

  // Fetch all products for the user (in case some products don't have explicit offers)
  const { data: userProducts } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("user_id", userId);

  // Fetch upsell strategies for the user
  const { data: userUpsells } = await supabaseAdmin
    .from("upsell_strategies")
    .select(`
      id,
      name,
      type,
      is_active,
      upsell_page_url,
      product_id,
      upsell_product_id,
      upsell_offer_id,
      upsell_product:upsell_product_id(id, name, delivery_link),
      upsell_offer:upsell_offer_id(id, name, price, currency, hash)
    `)
    .eq("user_id", userId);

  const offerList = [...(userOffers || [])];

  // Add virtual offers for products that don't have an offer entry yet
  if (userProducts && userProducts.length > 0) {
    const existingProductIds = new Set(offerList.map((o) => o.product_id));
    for (const prod of userProducts) {
      if (!existingProductIds.has(prod.id)) {
        offerList.push({
          id: `product_${prod.id}`,
          name: prod.name || "Oferta Principal",
          price: prod.price || 0,
          currency: prod.currency || "BRL",
          hash: null,
          is_active: prod.status !== "Inativo",
          created_at: prod.created_at,
          product_id: prod.id,
          products: prod
        });
      }
    }
  }

  // Collect all product IDs and offer IDs that are configured as target upsells
  const upsellTargetProductIds = new Set(
    (userUpsells || [])
      .map((u) => u.upsell_product_id)
      .filter(Boolean)
  );
  const upsellTargetOfferIds = new Set(
    (userUpsells || [])
      .map((u) => u.upsell_offer_id)
      .filter(Boolean)
  );

  // Filter offerList to only include MAIN offers/products (exclude those configured as upsell targets)
  let mainOfferList = offerList.filter((offer) => {
    if (offer.product_id && upsellTargetProductIds.has(offer.product_id)) {
      return false;
    }
    if (offer.id && upsellTargetOfferIds.has(offer.id)) {
      return false;
    }
    return true;
  });

  // Fallback to offerList if all products were filtered out
  if (mainOfferList.length === 0) {
    mainOfferList = offerList;
  }

  // Calculate stats for each main offer
  const offersWithStats = await Promise.all(mainOfferList.map(async (offer) => {
    const offerSales = (succeededSales || []).filter(
      (s) => s.offer_id === offer.id || (!s.offer_id && s.product_id === offer.product_id)
    );

    const salesCount = offerSales.length;
    let revenueBRL = 0;
    for (const s of offerSales) {
      const amt = Number(s.amount) || 0;
      const curr = (s.currency || "BRL").trim().toUpperCase();
      revenueBRL += await convertToBRL(amt, curr);
    }

    const offerSalesToday = offerSales.filter(
      (s) => s.created_at && new Date(s.created_at) >= todayStart
    );
    const salesTodayCount = offerSalesToday.length;
    let revenueTodayBRL = 0;
    for (const s of offerSalesToday) {
      const amt = Number(s.amount) || 0;
      const curr = (s.currency || "BRL").trim().toUpperCase();
      revenueTodayBRL += await convertToBRL(amt, curr);
    }

    const linkedUpsells = await Promise.all(
      (userUpsells || [])
        .filter((u) => u.product_id === offer.product_id)
        .map(async (u) => {
          const uSales = (succeededSales || []).filter((s) => {
            if (u.upsell_offer_id && s.offer_id) {
              return s.offer_id === u.upsell_offer_id;
            }
            if (u.upsell_product_id && s.product_id) {
              return s.product_id === u.upsell_product_id;
            }
            return false;
          });

          const salesCount = uSales.length;
          let revenueBRL = 0;
          for (const s of uSales) {
            const amt = Number(s.amount) || 0;
            const curr = (s.currency || "BRL").trim().toUpperCase();
            revenueBRL += await convertToBRL(amt, curr);
          }

          const uSalesToday = uSales.filter(
            (s) => s.created_at && new Date(s.created_at) >= todayStart
          );
          const salesTodayCount = uSalesToday.length;
          let revenueTodayBRL = 0;
          for (const s of uSalesToday) {
            const amt = Number(s.amount) || 0;
            const curr = (s.currency || "BRL").trim().toUpperCase();
            revenueTodayBRL += await convertToBRL(amt, curr);
          }

          return {
            id: u.id,
            name: u.name,
            type: u.type || "Upsell",
            isActive: u.is_active,
            upsellPageUrl: u.upsell_page_url || null,
            productName: (u.upsell_product as any)?.name || null,
            deliveryLink: (u.upsell_product as any)?.delivery_link || null,
            offerName: (u.upsell_offer as any)?.name || null,
            price: (u.upsell_offer as any)?.price || null,
            currency: (u.upsell_offer as any)?.currency || "BRL",
            hash: (u.upsell_offer as any)?.hash || null,
            salesCount,
            revenueBRL,
            salesTodayCount,
            revenueTodayBRL
          };
        })
    );

    const productObj = offer.products as any;

    return {
      id: offer.id,
      name: offer.name,
      price: offer.price,
      currency: offer.currency || "BRL",
      hash: offer.hash,
      isActive: offer.is_active,
      productId: offer.product_id,
      productName: productObj?.name || "Produto sem nome",
      deliveryLink: productObj?.delivery_link || null,
      productImageUrl: productObj?.image_url || null,
      salesCount,
      revenueBRL,
      salesTodayCount,
      revenueTodayBRL,
      upsells: linkedUpsells,
      upsell: linkedUpsells.length > 0 ? linkedUpsells[0] : null
    };
  }));

  // Sort by salesCount descending, then revenueBRL descending
  offersWithStats.sort((a, b) => b.salesCount - a.salesCount || b.revenueBRL - a.revenueBRL);

  const topOffers = offersWithStats.slice(0, 3);

  // Check if there are failed charges in history using supabaseAdmin
  const { data: failedCharges } = await supabaseAdmin
    .from("billing_history")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(1);

  const isInadimplente = failedCharges && failedCharges.length > 0;

  return {
    success: true,
    details: {
      profile: userProfile,
      hasCard,
      cardLast4,
      cardBrand,
      pendingFees,
      isInadimplente,
      totalFaturadoBRL,
      totalsByCurrency,
      totalHojeBRL,
      totalsHojeByCurrency,
      topOffers
    }
  };
}

export async function updateUserFee(userId: string, feePercentage: number) {
  const supabase = await createClient();

  // Verify if current user is admin
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: "Não autorizado" };

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", currentUser.id)
    .single();

  if (!adminProfile?.is_admin) return { error: "Acesso restrito" };

  const { error } = await supabase
    .from("profiles")
    .update({ fee_percentage: feePercentage })
    .eq("id", userId);

  if (error) return { error: error.message };

  return { success: true };
}
