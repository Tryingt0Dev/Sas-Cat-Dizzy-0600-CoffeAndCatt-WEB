"use client";

import { useEffect } from "react";

export function CatalogProductTracker({
  businessSlug,
  productId
}: {
  businessSlug: string;
  productId: string;
}) {
  useEffect(() => {
    const key = `catg:${businessSlug}:product-view:${productId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");

    void fetch("/api/catalog/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessSlug,
        productId,
        event: "product_view"
      }),
      keepalive: true
    }).catch(() => undefined);
  }, [businessSlug, productId]);

  return null;
}
