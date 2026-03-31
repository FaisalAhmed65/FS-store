/**
 * pages/index.js  — Homepage
 * Mirrors the TRD Odoo storefront: category showcase + 4 product snippet sections.
 */
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { productsApi, categoriesApi } from "@/lib/api";
import ProductSnippet from "@/components/products/ProductSnippet";
import { mediaUrl } from "@/lib/utils";

const fetcher = (fn) => fn().then((r) => r.data);

export default function HomePage() {
  const { data: featured,    isLoading: l1 } = useSWR("home/featured",    () => fetcher(productsApi.featured));
  const { data: deals,       isLoading: l2 } = useSWR("home/deals",       () => fetcher(productsApi.deals));
  const { data: newArrivals, isLoading: l3 } = useSWR("home/new-arrivals",() => fetcher(productsApi.newArrivals));
  const { data: bestsellers, isLoading: l4 } = useSWR("home/bestsellers", () => fetcher(productsApi.bestsellers));
  const { data: categories,  isLoading: l5 } = useSWR("home/showcase",    () => fetcher(categoriesApi.showcase));

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "TRD Store";

  return (
    <>
      <Head>
        <title>{siteName} – Shop Smart</title>
        <meta name="description" content="Best deals on electronics, fashion, home & more." />
      </Head>

      {/* Hero banner */}
      <section className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <p className="text-accent font-semibold text-sm mb-2 uppercase tracking-widest">
              Huge Sale Now Live
            </p>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              Shop Smart.<br />Save More.
            </h1>
            <p className="text-gray-300 mb-6 max-w-md">
              Discover thousands of products at unbeatable prices — electronics, fashion, home &amp; more.
            </p>
            <Link href="/shop" className="btn-accent inline-block px-8 py-3 rounded font-bold text-lg">
              Shop Now
            </Link>
          </div>
          <div className="flex-1 text-center opacity-80">
            <div className="text-9xl">🛒</div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* Category Showcase — matches bi_ecommerce_category_snippet */}
        {categories && categories.length > 0 && (
          <section className="my-8">
            <h2 className="section-title">Shop by Category</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category_slug=${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-3 bg-card rounded-lg shadow-card hover:shadow-card-hover transition-shadow group"
                >
                  {cat.image ? (
                    <div className="relative w-12 h-12">
                      <Image
                        src={mediaUrl(cat.image)}
                        alt={cat.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                      🏷️
                    </div>
                  )}
                  <span className="text-xs font-medium text-center text-gray-700 group-hover:text-primary line-clamp-2">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Deal of the Day banner */}
        <section className="my-8 bg-gradient-to-r from-primary to-blue-900 rounded-xl text-white p-6 flex justify-between items-center">
          <div>
            <span className="text-accent text-xs font-bold uppercase tracking-widest">Limited Time</span>
            <h2 className="text-2xl font-black mt-1">Deal of the Day</h2>
            <p className="text-gray-300 text-sm mt-1">Up to 70% off on select items</p>
          </div>
          <Link href="/shop?filter=deals" className="btn-accent px-6 py-2 rounded font-bold">
            See Deals
          </Link>
        </section>

        {/* Product snippet sections — matches bi_product_snippet */}
        <ProductSnippet
          title="Featured Products"
          products={featured?.results ?? featured}
          loading={l1}
          viewAllHref="/shop?filter=featured"
        />
        <ProductSnippet
          title="🔥 Hot Deals"
          products={deals?.results ?? deals}
          loading={l2}
          viewAllHref="/shop?filter=deals"
        />
        <ProductSnippet
          title="New Arrivals"
          products={newArrivals?.results ?? newArrivals}
          loading={l3}
          viewAllHref="/shop?filter=new-arrivals"
        />
        <ProductSnippet
          title="Best Sellers"
          products={bestsellers?.results ?? bestsellers}
          loading={l4}
          viewAllHref="/shop?filter=bestsellers"
        />
      </div>
    </>
  );
}
