import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "../../../lib/supabase/server";
import CheckoutPageClient from "./CheckoutPageClient";
import Script from "next/script";


import { Language } from "./translations";

interface PageProps {
  params: Promise<{ hash: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * PUBLIC CHECKOUT PAGE
 * 
 * Performance Optimized: This server component only fetches critical database data.
 * The Stripe PaymentIntent/Subscription creation is deferred to the client side via API
 * to ensure an ultra-fast TTFB (Time to First Byte).
 */
export default async function PublicCheckoutPage({ params, searchParams }: PageProps) {
  const { hash } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const supabase = await createClient();

  // ── 1. Fetch DB data in PARALLEL for maximum speed ──
  // We fetch checkout/offer and then use that result for the next set of parallel calls.

  // First, find the entity (checkout or offer)
  const { data: checkout, error: checkoutError } = await supabase
    .from("checkouts")
    .select("*, products (*)")
    .eq("hash", hash)
    .single();

  let finalProduct = checkout?.products;
  let finalCheckout = checkout;
  let userId = checkout?.user_id;
  let isOffer = false;

  if (checkoutError || !checkout) {
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*, products (*)")
      .eq("hash", hash)
      .single();

    if (offerError || !offer) {
      notFound();
    }

    if (offer.is_active === false) {
      return renderError("Oferta desativada no momento");
    }

    isOffer = true;
    userId = offer.user_id;
    finalCheckout = {
      ...offer,
      title: offer.name,
      payment_type: "single",
    };
    finalProduct = {
      ...offer.products,
      price: offer.price,
      currency: offer.currency,
    };
  } else {
    if (checkout.is_active === false) {
      return renderError("Checkout desativado no momento");
    }
  }

  // Second, fetch Stripe config, Orderbumps and User Profile in parallel
  const [stripeConfigResult, orderbumpsResult, profileResult] = await Promise.all([
    supabase
      .from("stripe_configs")
      .select("publishable_key, has_active_setup:secret_key")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("orderbumps")
      .select(`
        *,
        bump_product:products!bump_product_id(*),
        bump_offer:offers!bump_offer_id(*)
      `)
      .eq("product_id", finalProduct.id)
      .neq("is_active", false)
      .order("order_index", { ascending: true }),
    supabase
      .from("profiles")
      .select("checkout_head_scripts")
      .eq("id", userId)
      .single()
  ]);

  const stripeConfig = stripeConfigResult.data;
  const orderbumps = orderbumpsResult.data || [];
  const profile = profileResult.data;

  if (!stripeConfig?.publishable_key) {
    return renderError("Este vendedor ainda não configurou o gateway de pagamento.");
  }

  const headersList = await headers();
  const detectedCountry = headersList.get("x-vercel-ip-country") || headersList.get("cf-ipcountry") || "BR";

  // ── Language Detection on Server ──
  const langParam = typeof resolvedSearchParams.lang === 'string' ? resolvedSearchParams.lang.toLowerCase() : null;
  let initialLang: Language = 'pt';

  if (['en', 'es', 'pt', 'it', 'fr'].includes(langParam || '')) {
    initialLang = langParam as Language;
  } else {
    const acceptLang = (headersList.get("accept-language") || "").toLowerCase();
    if (acceptLang.startsWith("en") || acceptLang.includes("en-us") || acceptLang.includes("en-gb")) {
      initialLang = "en";
    } else if (acceptLang.startsWith("es") || acceptLang.includes("es-es") || acceptLang.includes("es-mx")) {
      initialLang = "es";
    } else if (acceptLang.startsWith("it") || acceptLang.includes("it-it")) {
      initialLang = "it";
    } else if (acceptLang.startsWith("fr") || acceptLang.includes("fr-fr") || acceptLang.includes("fr-ca")) {
      initialLang = "fr";
    } else if (acceptLang.startsWith("pt")) {
      initialLang = "pt";
    } else {
      const enCountries = ["US", "GB", "CA", "AU", "NZ", "IE"];
      const esCountries = ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PR", "PA", "UY", "GQ"];
      const itCountries = ["IT", "SM", "VA"];
      const frCountries = ["FR", "BE", "MC", "LU"];

      if (enCountries.includes(detectedCountry)) {
        initialLang = "en";
      } else if (esCountries.includes(detectedCountry)) {
        initialLang = "es";
      } else if (itCountries.includes(detectedCountry)) {
        initialLang = "it";
      } else if (frCountries.includes(detectedCountry)) {
        initialLang = "fr";
      }
    }
  }

  // ── 2. Render Page — Stripe logic is now handled by the Client Component ──
  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', position: 'relative' }}>
      {/* Inject custom head scripts if any */}
      {profile?.checkout_head_scripts && (
        <div dangerouslySetInnerHTML={{ __html: profile.checkout_head_scripts }} />
      )}
      
      <Script src="https://cdn.utmify.com.br/scripts/utms/latest.js" strategy="afterInteractive" />
      <Script id="ms-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wrhymn7ksa");
        `}
      </Script>
      <CheckoutPageClient
        hash={hash}
        initialProduct={finalProduct}
        initialCheckout={finalCheckout}
        publishableKey={stripeConfig.publishable_key}
        orderbumps={orderbumps}
        detectedCountry={detectedCountry}
        initialLang={initialLang}
      />
    </div>
  );
}

function renderError(message: string) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'white', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 999999
    }}>
      <div style={{
        padding: '40px', border: '1px solid black',
        borderRadius: '12px', backgroundColor: 'white', textAlign: 'center'
      }}>
        <p style={{ color: 'black', fontSize: '18px', fontWeight: 'normal', margin: 0 }}>
          {message}
        </p>
      </div>
    </div>
  );
}
