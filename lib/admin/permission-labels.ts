const LABELS: Record<string, string> = {
  "*": "Everything, including managing staff",
  "catalog.manage": "Products, categories and brands",
  "catalog.view-cost": "See product cost prices",
  "inventory.manage": "Adjust stock",
  "orders.view": "View orders",
  "orders.manage": "Manage orders and fulfilment",
  "orders.refund": "Refund payments",
  "customers.manage": "View customers and add notes",
  "promotions.manage": "Discount codes",
  "content.manage": "Website content",
  "shipping.manage": "Delivery zones",
  "reports.view": "Reports",
  "settings.manage": "Business details and ordering limits",
  "staff.manage": "Staff and roles",
};

/** A permission slug in words a shop owner would use. Unknown slugs are shown as they are. */
export function permissionLabel(slug: string): string {
  return LABELS[slug] ?? slug;
}
