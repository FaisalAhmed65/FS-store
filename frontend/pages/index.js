import Head from "next/head";
import useSWR from "swr";
import { productsApi } from "@/lib/api";
import { FALLBACK_PRODUCTS } from "@/lib/fallbackData";

import CategoryCarouselBar from "@/components/home/CategoryCarouselBar";
import SubcategoryBadges from "@/components/home/SubcategoryBadges";
import BannerCarousel from "@/components/home/BannerCarousel";
import SmartDealFinder from "@/components/home/SmartDealFinder";
import ProductSection from "@/components/home/ProductSection";
import CategoryBadges from "@/components/home/CategoryBadges";
import CombinedSection from "@/components/home/CombinedSection";
import CategoryShowcase from "@/components/home/CategoryShowcase";

const fetcher = (fn) => fn().then((r) => r.data);
const asList = (data) => data?.results ?? data ?? [];

export default function HomePage() {
  const { data: featured } = useSWR("home/featured", () => fetcher(productsApi.featured));
  const { data: freeDelivery } = useSWR("home/free-delivery", () => fetcher(productsApi.freeDelivery));
  const { data: newArrivals } = useSWR("home/new-arrivals", () => fetcher(productsApi.newArrivals));

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "TRD Store";
  const featuredProducts = asList(featured).length ? asList(featured) : FALLBACK_PRODUCTS.slice(0, 6);
  const freeDeliveryProducts = asList(freeDelivery).length
    ? asList(freeDelivery)
    : FALLBACK_PRODUCTS.filter((product) => product.is_free_delivery).slice(0, 6);
  const newArrivalProducts = asList(newArrivals).length
    ? asList(newArrivals)
    : FALLBACK_PRODUCTS.filter((product) => product.is_new_arrival || product.is_featured).slice(0, 6);

  return (
    <>
      <Head>
        <title>{siteName} - Shop Smart</title>
        <meta name="description" content="Best deals on electronics, fashion, home & more." />
      </Head>

      <CategoryCarouselBar />
      <SubcategoryBadges />
      <BannerCarousel />
      <SmartDealFinder />

      <ProductSection
        title="Featured Products"
        icon="fa-star"
        products={featuredProducts}
        loading={false}
        viewAllHref="/shop?deal_type=featured"
      />

      <CategoryBadges />
      <CombinedSection />

      <ProductSection
        title="Free Delivery"
        icon="fa-truck"
        iconColor="#059669"
        products={freeDeliveryProducts}
        loading={false}
        viewAllHref="/shop?free_delivery=1"
      />

      <ProductSection
        title="Latest Drops"
        icon="fa-bolt"
        products={newArrivalProducts}
        loading={false}
        viewAllHref="/shop?deal_type=new_arrivals"
      />

      <CategoryShowcase />
    </>
  );
}
