/**
 * pages/index.js  — Homepage
 * Matches the TRD Odoo storefront homepage at commit 9d17f33.
 * Sections (in order):
 *   1. Category Carousel Bar (sticky)
 *   2. Subcategory Badges
 *   3. Banner Carousel with Fixed Banner
 *   4. Featured Products
 *   5. Category Badges — All Categories
 *   6. Homepage Combined Section (Reasons / Mega Deals / In Focus)
 *   7. Free Delivery Products
 *   8. Latest Drops — Newest Products
 *   9. Category Showcase with Subcategories
 */
import Head from "next/head";
import useSWR from "swr";
import { productsApi, categoriesApi } from "@/lib/api";

import CategoryCarouselBar from "@/components/home/CategoryCarouselBar";
import SubcategoryBadges from "@/components/home/SubcategoryBadges";
import BannerCarousel from "@/components/home/BannerCarousel";
import ProductSection from "@/components/home/ProductSection";
import CategoryBadges from "@/components/home/CategoryBadges";
import CombinedSection from "@/components/home/CombinedSection";
import CategoryShowcase from "@/components/home/CategoryShowcase";

const fetcher = (fn) => fn().then((r) => r.data);

export default function HomePage() {
  const { data: featured, isLoading: l1 } = useSWR("home/featured", () => fetcher(productsApi.featured));
  const { data: freeDelivery, isLoading: l2 } = useSWR("home/free-delivery", () => fetcher(productsApi.freeDelivery));
  const { data: newArrivals, isLoading: l3 } = useSWR("home/new-arrivals", () => fetcher(productsApi.newArrivals));

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "TRD Store";

  return (
    <>
      <Head>
        <title>{siteName} – Shop Smart</title>
        <meta name="description" content="Best deals on electronics, fashion, home & more." />
      </Head>

      {/* 1. Category Carousel Bar — sticky below header */}
      <CategoryCarouselBar />

      {/* 2. Subcategory Badges */}
      <SubcategoryBadges />

      {/* 3. Banner Carousel (70/30 split) */}
      <BannerCarousel />

      {/* 4. Featured Products */}
      <ProductSection
        title="Featured Products"
        titleBn="ফিচার্ড প্রোডাক্ট"
        icon="fa-star"
        products={featured?.results ?? featured ?? []}
        loading={l1}
        viewAllHref="/shop?filter=featured"
      />

      {/* 5. Category Badges — All Categories */}
      <CategoryBadges />

      {/* 6. Combined Section: Reasons to Shop | Mega Deals | In Focus */}
      <CombinedSection />

      {/* 7. Free Delivery Products */}
      <ProductSection
        title="Free Delivery"
        titleBn="ফ্রি ডেলিভারি"
        icon="fa-truck"
        iconColor="#059669"
        products={freeDelivery?.results ?? freeDelivery ?? []}
        loading={l2}
        viewAllHref="/shop?filter=free-delivery"
      />

      {/* 8. Latest Drops — Newest Products */}
      <ProductSection
        title="Latest Drops"
        titleBn="নতুন প্রোডাক্ট"
        icon="fa-bolt"
        products={newArrivals?.results ?? newArrivals ?? []}
        loading={l3}
        viewAllHref="/shop?filter=new-arrivals"
      />

      {/* 9. Category Showcase with Subcategories */}
      <CategoryShowcase />
    </>
  );
}
