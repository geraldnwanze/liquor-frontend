import type { Metadata } from "next";
import { AddressesManager } from "@/components/account/addresses-manager";
import { getMyAddresses, requireUser } from "@/lib/api/account";
import { getDeliveryZones } from "@/lib/api/catalog";

export const metadata: Metadata = { title: "Saved addresses" };

export default async function AddressesPage() {
  await requireUser("/account/addresses");
  const [addresses, zones] = await Promise.all([getMyAddresses(), getDeliveryZones()]);

  return (
    <section aria-labelledby="addresses-heading">
      <h2 id="addresses-heading" className="text-2xl font-semibold text-accent">
        Saved addresses
      </h2>
      <p className="mb-5 mt-1 text-muted">Choose one at checkout instead of typing it again. We deliver to the states and cities listed when you add an address.</p>
      <AddressesManager addresses={addresses} zones={zones} />
    </section>
  );
}
