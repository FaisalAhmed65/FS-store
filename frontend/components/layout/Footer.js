/**
 * components/layout/Footer.js
 * TRD Store footer - matches Odoo custom_footer.
 * Features: Bengali/English bilingual text, Bangladesh payment methods.
 */
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

const footerColumns = [
  {
    title: "Gaming",
    titleBn: "\u0997\u09c7\u09ae\u09bf\u0982",
    links: [
      { label: "Gaming Monitors",    labelBn: "\u0997\u09c7\u09ae\u09bf\u0982 \u09ae\u09a8\u09bf\u099f\u09b0",       href: "/shop?q=gaming+monitors" },
      { label: "Gaming Consoles",    labelBn: "\u0997\u09c7\u09ae\u09bf\u0982 \u0995\u09a8\u09b8\u09cb\u09b2",       href: "/shop?q=gaming+consoles" },
      { label: "Gaming Accessories", labelBn: "\u0997\u09c7\u09ae\u09bf\u0982 \u0986\u09a8\u09c1\u09b7\u0999\u09cd\u0997\u09bf\u0995",   href: "/shop?q=gaming+accessories" },
      { label: "PC Gaming",          labelBn: "\u09aa\u09bf\u09b8\u09bf \u0997\u09c7\u09ae\u09bf\u0982",         href: "/shop?q=pc+gaming" },
      { label: "VR Gaming",          labelBn: "\u09ad\u09bf\u0986\u09b0 \u0997\u09c7\u09ae\u09bf\u0982",        href: "/shop?q=vr+gaming" },
    ],
  },
  {
    title: "Toys & Games",
    titleBn: "\u0996\u09c7\u09b2\u09a8\u09be \u0993 \u0997\u09c7\u09ae\u09b8",
    links: [
      { label: "Action Figures",   labelBn: "\u0985\u09cd\u09af\u09be\u0995\u09b6\u09a8 \u09ab\u09bf\u0997\u09be\u09b0",       href: "/shop?q=action+figures" },
      { label: "Board Games",      labelBn: "\u09ac\u09cb\u09b0\u09cd\u09a1 \u0997\u09c7\u09ae\u09b8",           href: "/shop?q=board+games" },
      { label: "Puzzles",          labelBn: "\u09aa\u09be\u099c\u09b2",                  href: "/shop?q=puzzles" },
      { label: "Educational Toys", labelBn: "\u09b6\u09bf\u0995\u09cd\u09b7\u09be\u09ae\u09c2\u09b2\u0995 \u0996\u09c7\u09b2\u09a8\u09be",    href: "/shop?q=educational+toys" },
      { label: "Outdoor Toys",     labelBn: "\u0986\u0989\u099f\u09a1\u09cb\u09b0 \u0996\u09c7\u09b2\u09a8\u09be",        href: "/shop?q=outdoor+toys" },
    ],
  },
  {
    title: "Stationery",
    titleBn: "\u09b8\u09cd\u099f\u09c7\u09b6\u09a8\u09be\u09b0\u09bf",
    links: [
      { label: "Pens & Pencils",  labelBn: "\u0995\u09b2\u09ae \u0993 \u09aa\u09c7\u09a8\u09cd\u09b8\u09bf\u09b2",  href: "/shop?q=pens" },
      { label: "Notebooks",       labelBn: "\u09a8\u09cb\u099f\u09ac\u09c1\u0995",           href: "/shop?q=notebooks" },
      { label: "Art Supplies",    labelBn: "\u0986\u09b0\u09cd\u099f \u09b8\u09be\u09aa\u09cd\u09b2\u09be\u0987",    href: "/shop?q=art+supplies" },
      { label: "Office Supplies", labelBn: "\u0985\u09ab\u09bf\u09b8 \u09b8\u09be\u09aa\u09cd\u09b2\u09be\u0987",   href: "/shop?q=office+supplies" },
      { label: "Craft Supplies",  labelBn: "\u0995\u09cd\u09b0\u09cd\u09af\u09be\u09ab\u099f \u09b8\u09be\u09aa\u09cd\u09b2\u09be\u0987", href: "/shop?q=craft+supplies" },
    ],
  },
  {
    title: "Top Brands",
    titleBn: "\u09b6\u09c0\u09b0\u09cd\u09b7 \u09ac\u09cd\u09b0\u09cd\u09af\u09be\u09a8\u09cd\u09a1",
    links: [
      { label: "Sony",     labelBn: "\u09b8\u09a8\u09bf",     href: "/shop?brand=sony" },
      { label: "Samsung",  labelBn: "\u09b8\u09cd\u09af\u09be\u09ae\u09b8\u09be\u0982", href: "/shop?brand=samsung" },
      { label: "Apple",    labelBn: "\u0985\u09cd\u09af\u09be\u09aa\u09b2",  href: "/shop?brand=apple" },
      { label: "Logitech", labelBn: "\u09b2\u099c\u09bf\u099f\u09c7\u0995",  href: "/shop?brand=logitech" },
      { label: "Razer",    labelBn: "\u09b0\u09c7\u099c\u09be\u09b0",   href: "/shop?brand=razer" },
    ],
  },
  {
    title: "Discover Now",
    titleBn: "\u098f\u0996\u09a8\u0987 \u0986\u09ac\u09bf\u09b7\u09cd\u0995\u09be\u09b0 \u0995\u09b0\u09c1\u09a8",
    links: [
      { label: "Flash Deals",   labelBn: "\u09ab\u09cd\u09b2\u09cd\u09af\u09be\u09b6 \u09a1\u09bf\u09b2",          href: "/shop?filter=deals" },
      { label: "New Arrivals",  labelBn: "\u09a8\u09a4\u09c1\u09a8 \u0986\u0997\u09ae\u09a8",            href: "/shop?filter=new-arrivals" },
      { label: "Bestsellers",   labelBn: "\u09ac\u09c7\u09b8\u09cd\u099f\u09b8\u09c7\u09b2\u09be\u09b0",           href: "/shop?filter=bestsellers" },
      { label: "Free Delivery", labelBn: "\u09ab\u09cd\u09b0\u09bf \u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf",        href: "/shop?filter=free-delivery" },
      { label: "Sell on TRD",   labelBn: "\u099f\u09bf\u0986\u09b0\u09a1\u09bf\u09a4\u09c7 \u09ac\u09bf\u0995\u09cd\u09b0\u09bf \u0995\u09b0\u09c1\u09a8", href: "/seller/register" },
    ],
  },
  {
    title: "Popular",
    titleBn: "\u099c\u09a8\u09aa\u09cd\u09b0\u09bf\u09af\u09bc",
    links: [
      { label: "Smart Watches", labelBn: "\u09b8\u09cd\u09ae\u09be\u09b0\u09cd\u099f \u0993\u09af\u09bc\u09be\u099a", href: "/shop?q=smart+watches" },
      { label: "Headphones",    labelBn: "\u09b9\u09c7\u09a1\u09ab\u09cb\u09a8",        href: "/shop?q=headphones" },
      { label: "Keyboards",     labelBn: "\u0995\u09c0\u09ac\u09cb\u09b0\u09cd\u09a1",       href: "/shop?q=keyboards" },
      { label: "Mice",          labelBn: "\u09ae\u09be\u0989\u09b8",           href: "/shop?q=mice" },
      { label: "Speakers",      labelBn: "\u09b8\u09cd\u09aa\u09bf\u0995\u09be\u09b0",       href: "/shop?q=speakers" },
    ],
  },
];

const socialLinks = [
  { icon: "fa-facebook-f", href: "#", label: "Facebook" },
  { icon: "fa-twitter", href: "#", label: "Twitter" },
  { icon: "fa-instagram", href: "#", label: "Instagram" },
  { icon: "fa-linkedin-in", href: "#", label: "LinkedIn" },
];

const policyLinks = [
  { label: "Terms & Conditions", labelBn: "\u09b6\u09b0\u09cd\u09a4\u09be\u09ac\u09b2\u09c0", href: "#" },
  { label: "Privacy Policy",     labelBn: "\u0997\u09cb\u09aa\u09a8\u09c0\u09af\u09bc\u09a4\u09be \u09a8\u09c0\u09a4\u09bf", href: "#" },
  { label: "Warranty Policy",    labelBn: "\u0993\u09af\u09bc\u09be\u09b0\u09c7\u09a8\u09cd\u099f\u09bf \u09a8\u09c0\u09a4\u09bf", href: "#" },
  { label: "Return Policy",      labelBn: "\u09ab\u09c7\u09b0\u09a4 \u09a8\u09c0\u09a4\u09bf", href: "#" },
];

// Bangladesh-specific payment icons (text badges, Font Awesome fallbacks)
function PaymentBadge({ label, bg, color = "#fff", icon }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold"
      style={{ backgroundColor: bg, color }}
      title={label}
    >
      {icon ? <i className={`fa ${icon} text-base`} /> : null}
      {label}
    </span>
  );
}

export default function Footer() {
  const { lang } = useLang();
  const isBn = lang === "bn";

  return (
    <footer className="w-full" style={{ background: "#0a0e1a", color: "#9ca3af" }}>
      {/* main columns */}
      <div className="w-full px-4 pt-10 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white text-sm font-bold mb-3">
                {isBn ? col.titleBn : col.title}
              </h4>
              <ul className="space-y-1.5 list-none p-0 m-0">
                {col.links.map((lnk) => (
                  <li key={lnk.label}>
                    <Link
                      href={lnk.href}
                      className="text-xs text-gray-400 hover:text-white transition-colors no-underline"
                    >
                      {isBn ? lnk.labelBn : lnk.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Shop on the Go + Connect with Us */}
        <div className="flex flex-wrap items-start justify-between gap-8 mt-10 pt-8 border-t border-gray-800">
          {/* app store */}
          <div>
            <h4 className="text-white text-sm font-bold mb-3">
              {isBn ? "\u09ae\u09cb\u09ac\u09be\u0987\u09b2\u09c7 \u0995\u09c7\u09a8\u09be\u0995\u09be\u099f\u09be \u0995\u09b0\u09c1\u09a8" : "Shop on the Go"}
            </h4>
            <div className="flex gap-2">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-white font-semibold no-underline"
                style={{ background: "#1a1a2e", border: "1px solid #374151" }}
              >
                <i className="fa fa-apple text-lg" />
                <span>
                  <span className="block text-[9px] text-gray-400 leading-none">
                    {isBn ? "\u09a1\u09be\u0989\u09a8\u09b2\u09cb\u09a1 \u0995\u09b0\u09c1\u09a8" : "Download on the"}
                  </span>
                  App Store
                </span>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-white font-semibold no-underline"
                style={{ background: "#1a1a2e", border: "1px solid #374151" }}
              >
                <i className="fa fa-android text-lg text-green-400" />
                <span>
                  <span className="block text-[9px] text-gray-400 leading-none">GET IT ON</span>
                  Google Play
                </span>
              </a>
            </div>
          </div>

          {/* social */}
          <div>
            <h4 className="text-white text-sm font-bold mb-3">
              {isBn ? "\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u09b8\u09be\u09a5\u09c7 \u09af\u09cb\u0997 \u09a6\u09bf\u09a8" : "Connect with Us"}
            </h4>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-gray-900 hover:scale-110 transition-transform no-underline"
                  style={{ background: "#fccc04" }}
                >
                  <i className={`fa ${s.icon}`} />
                </a>
              ))}
            </div>
          </div>

          {/* BD Payment Methods */}
          <div>
            <h4 className="text-white text-sm font-bold mb-3">
              {isBn ? "\u09aa\u09c7\u09ae\u09c7\u09a8\u09cd\u099f \u09aa\u09a6\u09cd\u09a7\u09a4\u09bf" : "Payment Methods"}
            </h4>
            <div className="flex flex-wrap gap-2 items-center">
              <PaymentBadge label="bKash" bg="#e40084" />
              <PaymentBadge label="Nagad" bg="#f05829" />
              <PaymentBadge label="Rocket" bg="#7b1fa2" />
              <span title="Visa" className="text-gray-400">
                <i className="fa fa-cc-visa text-2xl" />
              </span>
              <span title="Mastercard" className="text-gray-400">
                <i className="fa fa-cc-mastercard text-2xl" />
              </span>
              <PaymentBadge
                label={isBn ? "\u0995\u09cd\u09af\u09be\u09b6 \u0985\u09a8 \u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf" : "Cash on Delivery"}
                bg="#1a6e2e"
                icon="fa-money"
              />
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-gray-800 w-full" style={{ background: "#060a14" }}>
        <div className="w-full px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} TRD Store.{" "}
            {isBn ? "\u09b8\u09b0\u09cd\u09ac\u09b8\u09cd\u09ac\u09a4\u09cd\u09ac \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4\u09f7" : "All rights reserved."}
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            {policyLinks.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="text-xs text-gray-500 hover:text-gray-300 no-underline"
              >
                {isBn ? p.labelBn : p.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}