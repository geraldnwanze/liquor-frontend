import type { Metadata } from "next";
import { CheckoutExperience } from "@/components/checkout/checkout-experience";
import { getDeliveryZones, getPublicSettings } from "@/lib/api/catalog";

// Private, transactional page: never indexed (and the service worker never saves it).
export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const [zones, settings] = await Promise.all([getDeliveryZones(), getPublicSettings()]);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-accent">Checkout</h1>
      <div className="mt-6">
        <CheckoutExperience zones={zones} settings={settings} />
      </div>
    </div>
  );
}
