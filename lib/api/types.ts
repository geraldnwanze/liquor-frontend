/** Shapes returned by the Laravel public API (app/Http/Resources/Catalog). Keep in sync with the backend resources. */

export interface Money {
  kobo: number;
  formatted: string;
  currency: "NGN";
}

export interface Paginated<T> {
  data: T[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface NamedRef {
  name: string;
  slug: string;
}

export interface ProductImage {
  url: string;
  alt: string | null;
}

export type ProductStatus = "draft" | "active" | "archived" | "discontinued";

export interface ProductListItem {
  slug: string;
  name: string;
  brand: NamedRef | null;
  category: NamedRef | null;
  image: ProductImage | null;
  status: ProductStatus;
  in_stock: boolean;
  variant_count: number;
  is_demo: boolean;
  price_from: Money | null;
  compare_at_price: Money | null;
  /** Average of approved reviews; null until there is one. */
  rating: Rating | null;
}

export interface Rating {
  average: number;
  count: number;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  photos: string[];
  reply: { text: string; at: string | null } | null;
  verified_purchase: boolean;
  created_at: string;
}

export interface ReviewList {
  data: Review[];
  summary: { count: number; average: number | null; distribution: Record<"1" | "2" | "3" | "4" | "5", number> };
  meta: { current_page: number; last_page: number; total: number };
}

export interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  photos: string[];
  reply: string | null;
  verified_purchase: boolean;
  product: { name: string; slug: string } | null;
  customer: { name: string; email: string } | null;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  volume_ml: number | null;
  price: Money;
  sale_price: Money | null;
  in_stock: boolean;
  low_stock: boolean;
}

export interface Product {
  slug: string;
  name: string;
  rating: Rating | null;
  status: ProductStatus;
  brand: NamedRef | null;
  category: NamedRef | null;
  short_description: string | null;
  description: string | null;
  country_of_origin: string | null;
  abv: string | null;
  flavor_profile: string[] | null;
  tasting_notes: string | null;
  serving_suggestions: string | null;
  authenticity_note: string | null;
  is_age_restricted: boolean;
  is_demo: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  seo: { title: string; description: string | null };
}

export interface Category {
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  parent?: NamedRef | null;
  children?: Category[];
  seo: { title: string; description: string | null };
}

export interface ProductQuery {
  category?: string;
  q?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  page?: number;
  per_page?: number;
}

/* ---- Cart, delivery and orders (see docs/ARCHITECTURE.md in the backend repo) ---- */

export type CartIssue = "unavailable" | "out_of_stock" | "insufficient_stock" | "over_line_limit";

export interface CartItem {
  id: string;
  variant_id: string;
  quantity: number;
  max_quantity: number;
  unit_price: Money;
  line_total: Money;
  price_changed_from: Money | null;
  issues: CartIssue[];
  product: { slug: string; name: string; image: ProductImage | null };
  variant: { sku: string; name: string; volume_ml: number | null };
}

export interface CartDiscount {
  code: string;
  /** False when the code was applied earlier but no longer works; `problem` says why and the price is unaffected. */
  applied: boolean;
  type: "percentage" | "fixed" | "free_delivery" | null;
  amount: Money;
  free_delivery: boolean;
  problem: { code: string; message: string } | null;
}

export interface CartDelivery {
  zone: string;
  fee: Money;
  /** The delivery fee a free-delivery code removed, when one applies. */
  fee_waived: Money | null;
  free_threshold: Money | null;
  estimate: string | null;
  is_estimate: boolean;
}

export interface Cart {
  /** Never sent to the browser: the guest token lives in an httpOnly cookie. */
  token: null;
  items: CartItem[];
  item_count: number;
  subtotal: Money;
  has_issues: boolean;
  discount: CartDiscount | null;
  delivery: CartDelivery | null;
}

export interface DeliveryZone {
  name: string;
  state: string;
  city: string | null;
  fee: Money;
  free_threshold: Money | null;
  estimate: string | null;
  notes: string | null;
}

export interface PublicSettings {
  currency: "NGN";
  business: { name: string | null; logo_url: string | null };
  homepage?: HomepageContent;
  commerce: { minimum_age: number; max_quantity_per_line: number; max_units_per_order: number; reservation_minutes: number };
}

export interface OrderItem {
  sku: string;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: Money;
  line_total: Money;
}

export type FulfilmentStatus = "unfulfilled" | "processing" | "out_for_delivery" | "delivered" | "delivery_failed";

export interface Order {
  reference: string;
  status: "pending_payment" | "paid" | "cancelled" | "expired";
  payment_status: "pending" | "paid" | "failed" | "partially_refunded" | "refunded";
  fulfilment?: { status: FulfilmentStatus; label: string };
  /** Carrier name and tracking reference only; the carrier's phone is never sent to customers. */
  shipment?: { carrier: string | null; tracking_reference: string | null; estimated_delivery_at: string | null } | null;
  timeline?: { type: string; label: string; at: string }[];
  currency: "NGN";
  subtotal: Money;
  discount: Money;
  discount_code?: string | null;
  delivery_fee: Money;
  total: Money;
  items: OrderItem[];
  customer: { name: string; email: string; phone: string };
  delivery: { zone: string; state: string; city: string; address: string; instructions: string | null };
  reservation_expires_at?: string;
  created_at: string;
}

/* ---- Accounts ---- */

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_staff?: boolean;
  roles?: string[];
  /** Which screens to show. Every action is checked again on the server. */
  permissions?: string[];
}

export interface Address {
  id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  state: string;
  city: string;
  address_line: string;
  instructions: string | null;
  is_default: boolean;
}

/* ---- Payments ---- */

export interface PaymentGateway {
  id: string;
  label: string;
}

export type PaymentState = "pending" | "succeeded" | "failed" | "abandoned" | "review";

export interface PaymentInfo {
  reference: string;
  gateway: string;
  state: PaymentState;
  amount: Money;
  /** Present only while the payment is pending: the gateway's own page to send the customer to. */
  authorization_url?: string;
  message: string;
  order: { reference: string; status: Order["status"]; payment_status: Order["payment_status"] };
}


/* ---- Receipts ---- */

export interface Receipt {
  number: string;
  issued_at: string;
  currency: "NGN";
  business: { name: string; address: string | null; phone: string | null; email: string | null; registration_number: string | null; logo_url: string | null };
  customer: { name: string; email: string; phone: string };
  delivery: { address: string; city: string; state: string };
  items: { description: string; sku: string; quantity: number; unit_price: Money; line_total: Money }[];
  subtotal: Money;
  discount: Money;
  discount_code?: string | null;
  delivery_fee: Money;
  total: Money;
  payment: { method: string; reference: string; paid_at: string | null } | null;
  refunded: Money;
  status: "paid" | "cancelled";
  footer: string | null;
}

/* ---- Admin: orders ---- */

export interface AdminOrderRow {
  reference: string;
  customer: { name: string; email: string };
  status: Order["status"];
  payment_status: Order["payment_status"];
  fulfilment_status: FulfilmentStatus;
  fulfilment_label: string;
  units: number;
  total: Money;
  city: string;
  created_at: string;
}

export interface AdminOrderSummary {
  today: { orders_placed: number; orders_paid: number; sales: Money };
  status: Record<Order["status"], number>;
  fulfilment: Record<FulfilmentStatus, number>;
  payments_needing_review: number;
}

export interface AdminOrder {
  reference: string;
  status: Order["status"];
  payment_status: Order["payment_status"];
  fulfilment_status: FulfilmentStatus;
  fulfilment_label: string;
  next_fulfilment: { value: FulfilmentStatus; label: string }[];
  can_cancel: boolean;
  subtotal: Money;
  discount: Money;
  discount_code?: string | null;
  delivery_fee: Money;
  total: Money;
  customer: { name: string; email: string; phone: string; has_account: boolean };
  delivery: { zone: string; state: string; city: string; address: string; instructions: string | null };
  age_confirmed_at: string | null;
  items: OrderItem[];
  payments: { reference: string; gateway: string; state: PaymentState; review_reason: string | null; amount: Money; refunded: Money; channel: string | null; paid_at: string | null; created_at: string }[];
  refunds: { amount: Money; state: string; reason: string; created_at: string }[];
  shipment: { carrier: string | null; tracking_reference: string | null; carrier_phone: string | null; notes: string | null; estimated_delivery_at: string | null; dispatched_at: string | null; delivered_at: string | null } | null;
  events: { type: string; from: string | null; to: string | null; note: string | null; customer_visible: boolean; by: string | null; at: string }[];
  created_at: string;
  paid_at: string | null;
}

/* ---- Admin: catalogue ---- */

export type AdminProductStatus = "draft" | "active" | "archived" | "discontinued";

export interface AdminVariant {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  name: string;
  volume_ml: number | null;
  price_kobo: number;
  sale_price_kobo: number | null;
  /** Only present when the signed-in staff member may see cost. */
  cost_price_kobo?: number | null;
  on_hand: number;
  reserved: number;
  available: number;
  low_stock_threshold: number;
  is_active: boolean;
  sort_order: number;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  status: AdminProductStatus;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  short_description: string | null;
  description: string | null;
  country_of_origin: string | null;
  abv: number | string | null;
  flavor_profile: string[] | null;
  tasting_notes: string | null;
  serving_suggestions: string | null;
  authenticity_note: string | null;
  is_featured: boolean;
  is_age_restricted: boolean;
  is_demo: boolean;
  seo_title: string | null;
  seo_description: string | null;
  variants?: AdminVariant[];
  images?: { id: string; url: string; alt: string | null; sort_order: number }[];
  updated_at: string | null;
}

export interface StockMovement {
  id: string;
  delta: number;
  on_hand_after: number;
  reason: string;
  note: string | null;
  by: { id: string; name: string } | null;
  created_at: string;
}

/* ---- Admin: discounts ---- */

export type DiscountStatus = "active" | "scheduled" | "expired" | "disabled";

export interface AdminDiscount {
  id: string;
  code: string;
  name: string;
  type: "percentage" | "fixed" | "free_delivery";
  type_label: string;
  percent: number | null;
  amount_kobo: number | null;
  max_discount_kobo: number | null;
  min_order_kobo: number | null;
  scope: "order" | "products" | "categories";
  products?: { id: string; name: string; slug: string }[];
  categories?: { id: string; name: string; slug: string }[];
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  is_active: boolean;
  status: DiscountStatus;
  uses: number;
  given?: Money;
  delivery_waived?: Money;
  recent_redemptions?: { order: string | null; state: string; amount: Money; delivery_waived: Money; email: string; at: string }[];
  created_at: string | null;
}

/* ---- Admin: customers ---- */

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  suspended_at: string | null;
  erased?: boolean;
  paid_orders: number;
  spent: Money;
  joined_at: string | null;
}

export interface AdminCustomerNote {
  id: string;
  body: string;
  by: string | null;
  at: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  erased?: boolean;
  date_of_birth: string | null;
  joined_at: string | null;
  stats: { orders: number; paid_orders: number; spent: Money };
  addresses: { label: string | null; recipient_name: string; phone: string; state: string; city: string; address_line: string; instructions: string | null; is_default: boolean }[];
  orders: { reference: string; status: Order["status"]; payment_status: Order["payment_status"]; fulfilment_status: FulfilmentStatus; total: Money; created_at: string }[];
  notes: AdminCustomerNote[];
}

/* ---- Admin: settings ---- */

export interface AdminSettings {
  business: { name: string | null; address: string | null; phone: string | null; email: string | null; registration_number: string | null; receipt_footer: string | null; logo_url: string | null };
  commerce: { minimum_age: number; reservation_minutes: number; max_quantity_per_line: number; max_units_per_order: number };
  defaults: { business_name: string };
}

export interface AdminDeliveryZone {
  id: string;
  name: string;
  state: string;
  city: string | null;
  fee_kobo: number;
  free_threshold_kobo: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  notes: string | null;
  is_active: boolean;
  sort_order: number;
}

/* ---- Admin: staff and roles ---- */

export interface AdminStaffMember {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  roles: { slug: string; name: string }[];
  created_at: string | null;
}

export interface AdminRole {
  slug: string;
  name: string;
  permissions: string[];
}

/* ---- Admin: reports ---- */

export interface ReportSalesRow {
  period: string;
  orders: number;
  gross: Money;
  discounts: Money;
  refunded: Money;
  net: Money;
}

export interface ReportSales {
  range: { from: string; to: string; group: "day" | "week" | "month"; timezone: string };
  totals: { orders: number; gross: Money; items: Money; discounts: Money; delivery: Money; refunded: Money; net: Money; average_order: Money };
  series: ReportSalesRow[];
}

export interface ReportProducts {
  sort: "revenue" | "units";
  products: { sku: string; product: string; variant: string; units: number; orders: number; revenue: Money }[];
}

export interface ReportDiscounts {
  totals: { uses: number; given: Money; delivery_waived: Money; revenue: Money };
  discounts: { id: string; code: string; name: string; uses: number; given: Money; delivery_waived: Money; revenue: Money }[];
}

export interface ReportStock {
  counts: { on_sale: number; low: number; out_of_stock: number };
  variants: { id: string; product_id: string; product: string; variant: string; sku: string; available: number; on_hand: number; reserved: number; threshold: number }[];
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  body: string;
  status: "draft" | "sent";
  sent_at: string | null;
  recipient_count: number | null;
  /** Per-email outcome once sent. */
  delivery: { queued: number; sent: number; failed: number } | null;
}

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  body: string;
  meta_description: string | null;
  status: "draft" | "published";
  show_in_footer: boolean;
  sort_order: number;
  updated_at: string;
}

export interface PublicPage {
  title: string;
  slug: string;
  body: string;
  meta_description: string | null;
  updated_at: string;
}

export interface AdminCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  products_count: number;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  country: string | null;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  products_count: number;
}

/** Front-page wording staff can change. A null text means "use the shop's built-in wording". */
export interface HomepageContent {
  announcement_text: string | null;
  announcement_link: string | null;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_title_emphasis: string | null;
  hero_text: string | null;
  hero_primary_label: string | null;
  hero_primary_href: string | null;
  hero_secondary_label: string | null;
  hero_secondary_href: string | null;
  hero_image_url: string | null;
  show_best_sellers: boolean;
  show_new_arrivals: boolean;
  show_on_sale: boolean;
  show_how_it_works: boolean;
  show_promises: boolean;
}
