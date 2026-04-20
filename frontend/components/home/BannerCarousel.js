import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { HERO_SLIDES } from "@/lib/fallbackData";

const SIDE_PROMOS = [
  {
    href: "/shop?free_delivery=1",
    image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=800&q=80",
    title: "Pantry restock",
    copy: "Daily essentials delivered fast",
  },
  {
    href: "/shop?deal_type=bestseller",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    title: "Most loved",
    copy: "Best sellers across the store",
  },
];

export default function BannerCarousel({ slides = HERO_SLIDES }) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  const next = useCallback(() => setCurrent((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (!total) return null;

  return (
    <section className="homepage-hero">
      <div className="homepage-shell">
        <div className="homepage-hero-grid">
          <div className="hero-carousel banner-carousel">
            {slides.map((slide, i) => (
              <Link
                key={slide.id}
                href={slide.href || "/shop"}
                className={`hero-slide ${i === current ? "is-active" : ""}`}
                aria-hidden={i !== current}
              >
                <img src={slide.src} alt={slide.title} className="hero-slide-image" loading={i === 0 ? "eager" : "lazy"} />
                <span className="hero-scrim" />
                <span className="hero-copy">
                  <span className="hero-eyebrow">{slide.eyebrow}</span>
                  <span className="hero-title">{slide.title}</span>
                  <span className="hero-description">{slide.copy}</span>
                  <span className="hero-cta">{slide.cta}</span>
                </span>
              </Link>
            ))}

            <button onClick={prev} className="banner-nav hero-nav hero-nav-prev" aria-label="Previous promotion">
              <i className="fa fa-chevron-left" />
            </button>
            <button onClick={next} className="banner-nav hero-nav hero-nav-next" aria-label="Next promotion">
              <i className="fa fa-chevron-right" />
            </button>

            <div className="banner-indicators hero-indicators">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrent(i)}
                  className={i === current ? "active" : ""}
                  aria-label={`Go to ${slide.title}`}
                />
              ))}
            </div>
          </div>

          <div className="hero-side-promos">
            {SIDE_PROMOS.map((promo) => (
              <Link key={promo.href} href={promo.href} className="hero-side-card">
                <img src={promo.image} alt={promo.title} className="hero-side-image" loading="lazy" />
                <span className="hero-side-scrim" />
                <span className="hero-side-copy">
                  <span>{promo.title}</span>
                  <small>{promo.copy}</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
