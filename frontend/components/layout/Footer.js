/**
 * components/layout/Footer.js
 * TRD Store footer â€” matches Odoo custom_footer.
 * Features: Bengali/English bilingual text, Bangladesh payment methods.
 */
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

const footerColumns = [
  {
    title: "Gaming",
    titleBn: "à¦—à§‡à¦®à¦¿à¦‚",
    links: [
      { label: "Gaming Monitors", labelBn: "à¦—à§‡à¦®à¦¿à¦‚ à¦®à¦¨à¦¿à¦Ÿà¦°", href: "/shop?q=gaming+monitors" },
      { label: "Gaming Consoles", labelBn: "à¦—à§‡à¦®à¦¿à¦‚ à¦•à¦¨à¦¸à§‹à¦²", href: "/shop?q=gaming+consoles" },
      { label: "Gaming Accessories", labelBn: "à¦—à§‡à¦®à¦¿à¦‚ à¦†à§à¦¯à¦•à§à¦¸à§‡à¦¸à¦°à¦¿à¦œ", href: "/shop?q=gaming+accessories" },
      { label: "PC Gaming", labelBn: "à¦ªà¦¿à¦¸à¦¿ à¦—à§‡à¦®à¦¿à¦‚", href: "/shop?q=pc+gaming" },
      { label: "VR Gaming", labelBn: "à¦­à¦¿à¦†à¦° à¦—à§‡à¦®à¦¿à¦‚", href: "/shop?q=vr+gaming" },
    ],
  },
  {
    title: "Toys & Games",
    titleBn: "à¦–à§‡à¦²à¦¨à¦¾ à¦“ à¦—à§‡à¦®à¦¸",
    links: [
      { label: "Action Figures", labelBn: "à¦…à§à¦¯à¦¾à¦•à¦¶à¦¨ à¦«à¦¿à¦—à¦¾à¦°", href: "/shop?q=action+figures" },
      { label: "Board Games", labelBn: "à¦¬à§‹à¦°à§à¦¡ à¦—à§‡à¦®à¦¸", href: "/shop?q=board+games" },
      { label: "Puzzles", labelBn: "à¦ªà¦¾à¦œà¦²", href: "/shop?q=puzzles" },
      { label: "Educational Toys", labelBn: "à¦¶à¦¿à¦•à§à¦·à¦¾à¦®à§‚à¦²à¦• à¦–à§‡à¦²à¦¨à¦¾", href: "/shop?q=educational+toys" },
      { label: "Outdoor Toys", labelBn: "à¦†à¦‰à¦Ÿà¦¡à§‹à¦° à¦–à§‡à¦²à¦¨à¦¾", href: "/shop?q=outdoor+toys" },
    ],
  },
  {
    title: "Stationery",
    titleBn: "à¦¸à§à¦Ÿà§‡à¦¶à¦¨à¦¾à¦°à¦¿",
    links: [
      { label: "Pens & Pencils", labelBn: "à¦•à¦²à¦® à¦“ à¦ªà§‡à¦¨à§à¦¸à¦¿à¦²", href: "/shop?q=pens" },
      { label: "Notebooks", labelBn: "à¦¨à§‹à¦Ÿà¦¬à§à¦•", href: "/shop?q=notebooks" },
      { label: "Art Supplies", labelBn: "à¦†à¦°à§à¦Ÿ à¦¸à¦¾à¦ªà§à¦²à¦¾à¦‡", href: "/shop?q=art+supplies" },
      { label: "Office Supplies", labelBn: "à¦…à¦«à¦¿à¦¸ à¦¸à¦¾à¦ªà§à¦²à¦¾à¦‡", href: "/shop?q=office+supplies" },
      { label: "Craft Supplies", labelBn: "à¦•à§à¦°à§à¦¯à¦¾à¦«à¦Ÿ à¦¸à¦¾à¦ªà§à¦²à¦¾à¦‡", href: "/shop?q=craft+supplies" },
    ],
  },
  {
    title: "Top Brands",
    titleBn: "à¦Ÿà¦ª à¦¬à§à¦°à§à¦¯à¦¾à¦¨à§à¦¡",
    links: [
      { label: "Sony", labelBn: "à¦¸à¦¨à¦¿", href: "/shop?brand=sony" },
      { label: "Samsung", labelBn: "à¦¸à§à¦¯à¦¾à¦®à¦¸à¦¾à¦‚", href: "/shop?brand=samsung" },
      { label: "Apple", labelBn: "à¦…à§à¦¯à¦¾à¦ªà¦²", href: "/shop?brand=apple" },
      { label: "Logitech", labelBn: "à¦²à¦œà¦¿à¦Ÿà§‡à¦•", href: "/shop?brand=logitech" },
      { label: "Razer", labelBn: "à¦°à§‡à¦œà¦¾à¦°", href: "/shop?brand=razer" },
    ],
  },
  {
    title: "Discover Now",
    titleBn: "à¦à¦–à¦¨à¦‡ à¦†à¦¬à¦¿à¦·à§à¦•à¦¾à¦° à¦•à¦°à§à¦¨",
    links: [
      { label: "Flash Deals", labelBn: "à¦«à§à¦²à§à¦¯à¦¾à¦¶ à¦¡à¦¿à¦²", href: "/shop?filter=deals" },
      { label: "New Arrivals", labelBn: "à¦¨à¦¤à§à¦¨ à¦†à¦—à¦®à¦¨", href: "/shop?filter=new-arrivals" },
      { label: "Bestsellers", labelBn: "à¦¬à§‡à¦¸à§à¦Ÿà¦¸à§‡à¦²à¦¾à¦°", href: "/shop?filter=bestsellers" },
      { label: "Free Delivery", labelBn: "à¦«à§à¦°à¦¿ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿", href: "/shop?filter=free-delivery" },
      { label: "Sell on TRD", labelBn: "à¦Ÿà¦¿à¦†à¦°à¦¡à¦¿à¦¤à§‡ à¦¬à¦¿à¦•à§à¦°à¦¿ à¦•à¦°à§à¦¨", href: "/seller/register" },
    ],
  },
  {
    title: "Popular",
    titleBn: "à¦œà¦¨à¦ªà§à¦°à¦¿à¦¯à¦¼",
    links: [
      { label: "Smart Watches", labelBn: "à¦¸à§à¦®à¦¾à¦°à§à¦Ÿ à¦“à¦¯à¦¼à¦¾à¦š", href: "/shop?q=smart+watches" },
      { label: "Headphones", labelBn: "à¦¹à§‡à¦¡à¦«à§‹à¦¨", href: "/shop?q=headphones" },
      { label: "Keyboards", labelBn: "à¦•à§€à¦¬à§‹à¦°à§à¦¡", href: "/shop?q=keyboards" },
      { label: "Mice", labelBn: "à¦®à¦¾à¦‰à¦¸", href: "/shop?q=mice" },
      { label: "Speakers", labelBn: "à¦¸à§à¦ªà¦¿à¦•à¦¾à¦°", href: "/shop?q=speakers" },
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
  { label: "Terms & Conditions", labelBn: "à¦¶à¦°à§à¦¤à¦¾à¦¬à¦²à§€", href: "#" },
  { label: "Privacy Policy", labelBn: "à¦—à§‹à¦ªà¦¨à§€à¦¯à¦¼à¦¤à¦¾ à¦¨à§€à¦¤à¦¿", href: "#" },
  { label: "Warranty Policy", labelBn: "à¦“à¦¯à¦¼à¦¾à¦°à§‡à¦¨à§à¦Ÿà¦¿ à¦¨à§€à¦¤à¦¿", href: "#" },
  { label: "Return Policy", labelBn: "à¦«à§‡à¦°à¦¤ à¦¨à§€à¦¤à¦¿", href: "#" },
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
              <span className="t-en">Shop on the Go</span>
              <span className="t-bn">à¦®à§‹à¦¬à¦¾à¦‡à¦²à§‡ à¦•à§‡à¦¨à¦¾à¦•à¦¾à¦Ÿà¦¾ à¦•à¦°à§à¦¨</span>
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
                    <span className="t-en">Download on the</span>
                    <span className="t-bn">à¦¡à¦¾à¦‰à¦¨à¦²à§‹à¦¡ à¦•à¦°à§à¦¨</span>
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
              <span className="t-en">Connect with Us</span>
              <span className="t-bn">à¦†à¦®à¦¾à¦¦à§‡à¦° à¦¸à¦¾à¦¥à§‡ à¦¯à§‹à¦— à¦¦à¦¿à¦¨</span>
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
              <span className="t-en">Payment Methods</span>
              <span className="t-bn">à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦ªà¦¦à§à¦§à¦¤à¦¿</span>
            </h4>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Bangladesh Mobile Banking */}
              <PaymentBadge label="bKash" bg="#e40084" />
              <PaymentBadge label="Nagad" bg="#f05829" />
              <PaymentBadge label="Rocket" bg="#7b1fa2" />
              {/* Cards */}
              <span title="Visa" className="text-gray-400">
                <i className="fa fa-cc-visa text-2xl" />
              </span>
              <span title="Mastercard" className="text-gray-400">
                <i className="fa fa-cc-mastercard text-2xl" />
              </span>
              {/* COD */}
              <PaymentBadge label={isBn ? "à¦•à§à¦¯à¦¾à¦¶ à¦…à¦¨ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿" : "Cash on Delivery"} bg="#1a6e2e" icon="fa-money" />
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-gray-800 w-full" style={{ background: "#060a14" }}>
        <div className="w-full px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* copyright */}
          <span className="text-xs text-gray-500">
            Â© {new Date().getFullYear()} TRD Store.{" "}
            <span className="t-en">All rights reserved.</span>
            <span className="t-bn">à¦¸à¦°à§à¦¬à¦¸à§à¦¬à¦¤à§à¦¬ à¦¸à¦‚à¦°à¦•à§à¦·à¦¿à¦¤à¥¤</span>
          </span>

          {/* policy links */}
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
