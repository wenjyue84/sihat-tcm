"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/stores/useAppStore";
import { useLanguage } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import {
  HerbalProduct,
  getProductByFormulaName,
  getRecommendedProducts,
  formatPrice,
  getProductTypeLabel,
} from "@/lib/herbShopData";
import {
  ShoppingCart,
  Package,
  Truck,
  Clock,
  Leaf,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Check,
  ExternalLink,
  Sparkles,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface HerbShopProps {
  formulaName?: string; // Single formula to display
  diagnosis?: string; // Diagnosis to get recommendations
  formulas?: { name: string }[]; // Multiple formulas from report
  onAddToCart?: (product: HerbalProduct) => void;
  compact?: boolean;
}

interface CartItem {
  product: HerbalProduct;
  quantity: number;
}

export function HerbShop({
  formulaName,
  diagnosis,
  formulas,
  onAddToCart,
  compact = false,
}: HerbShopProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();

  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<HerbalProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set());
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  // Get products to display
  const getProducts = (): HerbalProduct[] => {
    if (formulaName) {
      const product = getProductByFormulaName(formulaName);
      return product ? [product] : [];
    }

    if (formulas && formulas.length > 0) {
      const products = formulas
        .map((f) => getProductByFormulaName(f.name))
        .filter((p): p is HerbalProduct => p !== undefined);
      return products;
    }

    if (diagnosis) {
      return getRecommendedProducts(diagnosis);
    }

    return [];
  };

  const products = getProducts();

  const toggleProductExpand = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const handleBuyNow = (product: HerbalProduct) => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }

    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleAddToCart = (product: HerbalProduct) => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }

    // Mark as added
    setAddedToCart((prev) => new Set(prev).add(product.id));

    // Call parent handler if provided
    onAddToCart?.(product);

    // Reset after 2 seconds
    setTimeout(() => {
      setAddedToCart((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 2000);
  };

  const handleProceedToCheckout = () => {
    if (selectedProduct) {
      // In a real app, this would navigate to checkout or external pharmacy
      window.open(
        `https://wa.me/60123456789?text=${encodeURIComponent(
          `Hi, I would like to order: ${selectedProduct.formulaName} (${selectedProduct.formulaNameZh}) - ${formatPrice(selectedProduct.price, selectedProduct.currency)}`
        )}`,
        "_blank"
      );
    }
    setIsDialogOpen(false);
  };

  const handleLoginRedirect = () => {
    // Store current page to redirect back after login
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    router.push("/login");
  };

  const getLocalizedName = (product: HerbalProduct): string => {
    switch (language) {
      case "zh":
        return product.formulaNameZh;
      case "ms":
        return product.formulaNameMs;
      default:
        return product.formulaName;
    }
  };

  const getLocalizedDescription = (product: HerbalProduct): string => {
    switch (language) {
      case "zh":
        return product.descriptionZh;
      case "ms":
        return product.descriptionMs;
      default:
        return product.description;
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Section Header */}
        {!compact && (
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                {t.herbShop?.title || "One-Click Remedy"}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t.herbShop?.subtitle || "Get your personalized herbal remedy delivered"}
              </p>
            </div>
            {!user && (
              <div className="ml-auto">
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                  <Lock className="h-3 w-3" />
                  {t.herbShop?.loginToPurchase || "Login to purchase"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Product Cards */}
        <div className="space-y-3">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-white to-emerald-50/50 dark:from-stone-800 dark:to-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-semibold text-stone-800 dark:text-stone-100">
                        {getLocalizedName(product)}
                      </h4>
                      {product.isPopular && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                          <Sparkles className="h-3 w-3" />
                          {t.herbShop?.popular || "Popular"}
                        </span>
                      )}
                    </div>
                    {language !== "zh" && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-2">
                        {product.formulaNameZh}
                      </p>
                    )}
                    <p className="text-sm text-stone-600 dark:text-stone-300 line-clamp-2">
                      {getLocalizedDescription(product)}
                    </p>
                  </div>

                  {/* Price & Actions */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {formatPrice(product.price, product.currency)}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
                      {product.quantity}
                    </p>

                    {/* Buy Now Button - Only for logged-in users */}
                    {user ? (
                      <div className="flex flex-col gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleBuyNow(product)}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                          {t.herbShop?.buyNow || "Buy Now"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddToCart(product)}
                          disabled={addedToCart.has(product.id)}
                          className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        >
                          {addedToCart.has(product.id) ? (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                              {t.herbShop?.added || "Added!"}
                            </>
                          ) : (
                            <>
                              <Package className="h-3.5 w-3.5 mr-1.5" />
                              {t.herbShop?.addToCart || "Add to Cart"}
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsLoginPromptOpen(true)}
                        className="text-stone-500 dark:text-stone-400 border-stone-300 dark:border-stone-600"
                      >
                        <Lock className="h-3.5 w-3.5 mr-1.5" />
                        {t.herbShop?.loginToBuy || "Login to Buy"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-800/50">
                  <span className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                    <Package className="h-3.5 w-3.5" />
                    {getProductTypeLabel(product.productType, language)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                    <Clock className="h-3.5 w-3.5" />
                    {product.preparationTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                    <Truck className="h-3.5 w-3.5" />
                    {product.estimatedDelivery}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {product.pharmacyPartner}
                  </span>
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => toggleProductExpand(product.id)}
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-2"
                >
                  {expandedProducts.has(product.id) ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      {t.herbShop?.hideDetails || "Hide Details"}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      {t.herbShop?.showDetails || "Show Details"}
                    </>
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedProducts.has(product.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 border-t border-emerald-100 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10">
                      {/* Indications */}
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-blue-500" />
                          {t.herbShop?.indications || "Indications"}
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {product.indications.map((indication, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full"
                            >
                              {indication}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Ingredients */}
                      <div>
                        <h5 className="text-sm font-medium text-stone-700 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
                          <Leaf className="h-3.5 w-3.5 text-emerald-500" />
                          {t.herbShop?.ingredients || "Ingredients"}
                        </h5>
                        <div className="grid grid-cols-2 gap-1.5">
                          {product.ingredients.map((ing, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1"
                            >
                              <div className="h-1 w-1 rounded-full bg-emerald-400" />
                              <span>
                                {language === "zh"
                                  ? `${ing.nameZh} ${ing.weight}`
                                  : `${ing.name} (${ing.weight})`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-stone-500 dark:text-stone-400 text-center mt-3 px-4">
          {t.herbShop?.disclaimer ||
            "⚠️ These products are for reference only. Please consult a licensed TCM practitioner before use."}
        </p>
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              {t.herbShop?.confirmOrder || "Confirm Your Order"}
            </DialogTitle>
            <DialogDescription>
              {t.herbShop?.orderDescription ||
                "Your order will be processed by our pharmacy partner"}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Summary */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-stone-800 dark:text-stone-100">
                      {getLocalizedName(selectedProduct)}
                    </h4>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {selectedProduct.formulaNameZh}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {formatPrice(selectedProduct.price, selectedProduct.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {selectedProduct.quantity}
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    {selectedProduct.estimatedDelivery}
                  </span>
                </div>
              </div>

              {/* Pharmacy Info */}
              <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-3">
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  <span className="font-medium">
                    {t.herbShop?.fulfillmentBy || "Fulfilled by"}:
                  </span>{" "}
                  {selectedProduct.pharmacyPartner}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {selectedProduct.pharmacyLocation}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  {t.common?.cancel || "Cancel"}
                </Button>
                <Button
                  onClick={handleProceedToCheckout}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t.herbShop?.orderNow || "Order via WhatsApp"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Login Prompt Dialog */}
      <Dialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-emerald-600" />
              {t.herbShop?.loginRequired || "Login Required"}
            </DialogTitle>
            <DialogDescription>
              {t.herbShop?.loginDescription ||
                "Please log in to purchase herbal remedies and track your orders."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Benefits List */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                {t.herbShop?.memberBenefits || "Member Benefits:"}
              </p>
              <ul className="space-y-1.5">
                <li className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {t.herbShop?.benefit1 || "Purchase personalized remedies"}
                </li>
                <li className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {t.herbShop?.benefit2 || "Track order history"}
                </li>
                <li className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {t.herbShop?.benefit3 || "Save diagnosis reports"}
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsLoginPromptOpen(false)}
                className="flex-1"
              >
                {t.common?.cancel || "Cancel"}
              </Button>
              <Button
                onClick={handleLoginRedirect}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t.herbShop?.loginNow || "Login Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
