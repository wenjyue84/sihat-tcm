/**
 * TCM Domain - Herb Shop Utilities
 *
 * Business logic for herb shop/e-commerce features.
 * Data is in @/lib/herbShopData (to be migrated to @/data/tcm)
 */

import { HERBAL_PRODUCTS, DIAGNOSIS_TO_PRODUCTS, type HerbalProduct } from "@/lib/herbShopData";

// Re-export types
export type { HerbalProduct } from "@/lib/herbShopData";

/**
 * Get recommended products based on diagnosis
 */
export function getRecommendedProducts(diagnosis: string): HerbalProduct[] {
  const normalizedDiagnosis = diagnosis
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, "_");

  let productIds: string[] = [];

  if (DIAGNOSIS_TO_PRODUCTS[normalizedDiagnosis]) {
    productIds = DIAGNOSIS_TO_PRODUCTS[normalizedDiagnosis];
  } else {
    for (const [key, ids] of Object.entries(DIAGNOSIS_TO_PRODUCTS)) {
      if (
        normalizedDiagnosis.includes(key.replace(/_/g, "")) ||
        key.replace(/_/g, "").includes(normalizedDiagnosis.replace(/_/g, ""))
      ) {
        productIds = [...productIds, ...ids];
      }
    }
  }

  const uniqueIds = [...new Set(productIds)];
  const products = uniqueIds.map((id) => HERBAL_PRODUCTS[id]).filter(Boolean);

  if (products.length === 0) {
    return Object.values(HERBAL_PRODUCTS)
      .filter((p) => p.isPopular)
      .slice(0, 3);
  }

  return products;
}

/**
 * Get product by formula name (supports Chinese/English/Malay)
 */
export function getProductByFormulaName(formulaName: string): HerbalProduct | undefined {
  const normalizedName = formulaName.toLowerCase();

  return Object.values(HERBAL_PRODUCTS).find(
    (product) =>
      product.formulaName.toLowerCase().includes(normalizedName) ||
      product.formulaNameZh.includes(formulaName) ||
      normalizedName.includes(product.formulaName.toLowerCase().split(" ")[0])
  );
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = "MYR"): string {
  return `${currency} ${price.toFixed(2)}`;
}

/**
 * Get localized product type label
 */
export function getProductTypeLabel(
  type: HerbalProduct["productType"],
  language: "en" | "zh" | "ms" = "en"
): string {
  const labels = {
    tea_bags: { en: "Tea Bags", zh: "茶包", ms: "Beg Teh" },
    granules: { en: "Granules", zh: "颗粒剂", ms: "Granul" },
    raw_herbs: { en: "Raw Herbs", zh: "中药饮片", ms: "Herba Mentah" },
    capsules: { en: "Capsules", zh: "胶囊", ms: "Kapsul" },
  };
  return labels[type]?.[language] || labels[type]?.en || type;
}

/**
 * Get all popular products
 */
export function getPopularProducts(): HerbalProduct[] {
  return Object.values(HERBAL_PRODUCTS).filter((p) => p.isPopular);
}

/**
 * Get product by ID
 */
export function getProductById(id: string): HerbalProduct | undefined {
  return HERBAL_PRODUCTS[id];
}

/**
 * Get all products in stock
 */
export function getInStockProducts(): HerbalProduct[] {
  return Object.values(HERBAL_PRODUCTS).filter((p) => p.inStock);
}
