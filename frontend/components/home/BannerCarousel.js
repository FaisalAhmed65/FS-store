/**
 * components/home/BannerCarousel.js
 * 70/30 split banner — carousel left, fixed banner right.
 * Matches Odoo snippet_banner_carousel_split.
 */
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const DEFAULT_SLIDES = [
  { id: 1, src: "https://placehold.co/1200x206/FF69B4/FFF?text=Banner+1", href: "/shop", alt: "Banner 1" },
  { id: 2, src: "https://placehold.co/1200x206/FFDAB9/333?text=Banner+2", href: "/shop", alt: "Banner 2" },
  { id: 3, src: "https://placehold.co/1200x206/87CEEB/333?text=Banner+3", href: "/shop", alt: "Banner 3" },
  { id: 4, src: "https://placehold.co/1200x206/98FB98/333?text=Banner+4", href: "/shop", alt: "Banner 4" },
  { id: 5, src: "https://placehold.co/1200x206/FFD700/333?text=Banner+5", href: "/shop", alt: "Banner 5" },
  { id: 6, src: "https://placehold.co/1200x206/DDA0DD/333?text=Banner+6", href: "/shop", alt: "Banner 6" },
];

const SIDE_BANNER = {
  src: "https://placehold.co/600x206/2C5F2D/FFF?text=Side+Banner",
  href: "/shop",
  alt: "Side Banner",
};

export default function BannerCarousel({ slides = DEFAULT_SLIDES, sideBanner = SIDE_BANNER }) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  const next = useCallback(() => setCurrent((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((i) => (i - 1 + total) % total), [total]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="py-6">
      <div className="px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* 70% Carousel */}
          <div className="lg:col-span-8">
            <div
              className="banner-carousel relative overflow-hidden"
              style={{ borderRadius: 12, height: 206 }}
            >
              {slides.map((slide, i) => (
                <Link
                  key={slide.id}
                  href={slide.href || "/shop"}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    i === current ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                  style={{ height: "100%" }}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full h-full object-cover block"
                    loading="lazy"
                  />
                </Link>
              ))}

              {/* Prev/Next */}
              <button
                onClick={prev}
                className="banner-nav absolute left-4 top-1/2 -translate-y-1/2 z-20"
                aria-label="Previous"
              >
                <i className="fa fa-chevron-left text-gray-700" />
              </button>
              <button
                onClick={next}
                className="banner-nav absolute right-4 top-1/2 -translate-y-1/2 z-20"
                aria-label="Next"
              >
                <i className="fa fa-chevron-right text-gray-700" />
              </button>

              {/* Indicators */}
              <div className="banner-indicators absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={i === current ? "active" : ""}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 30% Fixed Banner */}
          <div className="lg:col-span-4">
            <Link
              href={sideBanner.href || "/shop"}
              className="block overflow-hidden h-full"
              style={{ borderRadius: 12, minHeight: 206 }}
            >
              <img
                src={sideBanner.src}
                alt={sideBanner.alt}
                className="w-full h-full object-cover block hover:scale-105 transition-transform duration-400"
                loading="lazy"
                style={{ borderRadius: 12 }}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
