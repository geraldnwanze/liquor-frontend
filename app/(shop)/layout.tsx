import { Suspense } from "react";
import { CartProvider } from "@/components/cart/cart-provider";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WishlistProvider } from "@/components/wishlist/wishlist-provider";

/**
 * The customer-facing shell, in the dark luxe theme (see `.luxe` in globals.css). The admin (app/admin) deliberately
 * does not use it, and neither does the root layout, so the theme never leaks outside the shop.
 */
export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="luxe flex min-h-dvh flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <CartProvider>
        <WishlistProvider>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
          {/* usePathname() resolves at request time, so the bar streams in after the prerendered page. */}
          <Suspense>
            <MobileTabBar />
          </Suspense>
        </WishlistProvider>
      </CartProvider>
    </div>
  );
}
