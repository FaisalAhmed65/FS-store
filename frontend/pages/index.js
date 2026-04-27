import Head from "next/head";
import useSWR from "swr";
import { productsApi } from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";

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
  const { lang } = useLang();
  const isBn = lang === "bn";
  const { data: featured, isLoading: featuredLoading } = useSWR("home/featured", () => fetcher(productsApi.featured));
  const { data: freeDelivery, isLoading: freeDeliveryLoading } = useSWR("home/free-delivery", () => fetcher(productsApi.freeDelivery));
  const { data: newArrivals, isLoading: newArrivalsLoading } = useSWR("home/new-arrivals", () => fetcher(productsApi.newArrivals));
  const { data: recommendations, isLoading: recommendationsLoading } = useSWR(
    "home/recommendations",
    () => productsApi.recommendations({ limit: 12 }).then((r) => r.data),
    { revalidateOnFocus: false }
  );
  const { data: allProducts, isLoading: allProductsLoading } = useSWR("home/products", () =>
    productsApi.list({ ordering: "-created_at" }).then((r) => r.data)
  );

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "TRD Store";
  const allProductList = asList(allProducts);
  const featuredList = asList(featured);
  const freeDeliveryProducts = asList(freeDelivery);
  const newArrivalList = asList(newArrivals);
  const recommendationList = asList(recommendations);
  const featuredProducts = featuredList.length ? featuredList : allProductList.slice(0, 6);
  const newArrivalProducts = newArrivalList.length ? newArrivalList : allProductList.slice(0, 6);

  return (
    <>
      <Head>
        <title>{isBn ? `${siteName} - স্মার্ট কেনাকাটা` : `${siteName} - Shop Smart`}</title>
        <meta
          name="description"
          content={isBn ? "ইলেকট্রনিক্স, ফ্যাশন, হোম এবং আরও অনেক পণ্যে সেরা ডিল।" : "Best deals on electronics, fashion, home & more."}
        />
      </Head>

      <CategoryCarouselBar />
      <SubcategoryBadges />
      <BannerCarousel />
      <SmartDealFinder />

      <ProductSection
        title="Recommended for You"
        titleBn="আপনার জন্য প্রস্তাবিত"
        icon="fa-magic"
        iconColor="#0f766e"
        products={recommendationList}
        loading={recommendationsLoading}
        viewAllHref="/shop"
      />

      <ProductSection
        title="Featured Products"
        titleBn="ফিচার্ড পণ্য"
        icon="fa-star"
        products={featuredProducts}
        loading={featuredLoading || (!featuredList.length && allProductsLoading)}
        viewAllHref="/shop?deal_type=featured"
      />

      <CategoryBadges />
      <CombinedSection />

      <ProductSection
        title="Free Delivery"
        titleBn="ফ্রি ডেলিভারি"
        icon="fa-truck"
        iconColor="#059669"
        products={freeDeliveryProducts}
        loading={freeDeliveryLoading}
        viewAllHref="/shop?free_delivery=1"
      />

      <ProductSection
        title="Latest Drops"
        titleBn="সর্বশেষ পণ্য"
        icon="fa-bolt"
        products={newArrivalProducts}
        loading={newArrivalsLoading || (!newArrivalList.length && allProductsLoading)}
        viewAllHref="/shop?deal_type=new_arrivals"
      />

      <CategoryShowcase />
    </>
  );
}
