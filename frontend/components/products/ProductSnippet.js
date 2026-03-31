/**
 * components/products/ProductSnippet.js
 * Titled horizontal section — matches bi_product_snippet Odoo layout.
 */
import Link from "next/link";
import ProductCard from "./ProductCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProductSnippet({ title, products, viewAllHref, loading }) {
  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm text-secondary hover:underline font-medium">
            View All →
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.slice(0, 6).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-muted text-sm py-6 text-center">No products in this section yet.</p>
      )}
    </section>
  );
}
