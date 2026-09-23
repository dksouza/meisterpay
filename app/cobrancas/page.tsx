import { getBillingInfo } from "../actions/billingActions";
import BillingClient from "./BillingClient";

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const billingData = await getBillingInfo();

  if (!billingData) {
    return <div>Erro ao carregar informações de cobrança.</div>;
  }

  return <BillingClient initialData={billingData} />;
}
