import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function maskValue(val?: string) {
  if (!val) return { exists: false, masked: null, length: 0, mode: "missing" };
  const length = val.length;
  const isTest = val.includes("test");
  const isLive = val.includes("live");
  const mode = isTest ? "test" : isLive ? "live" : "unknown";
  
  if (length <= 10) {
    return { exists: true, masked: val.substring(0, 3) + "***", length, mode, fullValue: val };
  }
  const prefix = val.substring(0, 8);
  const suffix = val.substring(length - 4);
  return {
    exists: true,
    masked: `${prefix}...${suffix}`,
    length,
    mode,
    fullValue: val, // useful for debugging env vars directly
  };
}

export async function GET() {
  const stripeKeys = [
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "CRON_SECRET"
  ];

  const envInfo: Record<string, any> = {};

  for (const key of stripeKeys) {
    envInfo[key] = maskValue(process.env[key]);
  }

  // Also collect any other process.env variables that contain 'STRIPE'
  const allStripeEnvVars: Record<string, any> = {};
  Object.keys(process.env).forEach((envKey) => {
    if (envKey.toUpperCase().includes("STRIPE")) {
      allStripeEnvVars[envKey] = maskValue(process.env[envKey]);
    }
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    checkedKeys: envInfo,
    allStripeEnvVarsFound: allStripeEnvVars,
  });
}
