/**
 * components/layout/Footer.js
 * TRD Store footer — matches Odoo custom_footer.
 * Features: Bengali/English bilingual text, Bangladesh payment methods.
 */
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

const footerColumns = [
  {
    title: "Gaming",
    titleBn: "গেমিং",
    links: [
      { label: "Gaming Monitors", labelBn: "গেমিং মনিটর", href: "/shop?q=gaming+monitors" },
      { label: "Gaming Consoles", labelBn: "গেমিং কনসোল", href: "/shop?q=gaming+consoles" },
      { label: "Gaming Accessories", labelBn: "গেমিং আ্যক্সেসরিজ", href: "/shop?q=gaming+accessories" },
      { label: "PC Gaming", labelBn: "পিসি গেমিং", href: "/shop?q=pc+gaming" },
      { label: "VR Gaming", labelBn: "ভিআর গেমিং", href: "/shop?q=vr+gaming" },
    ],
  },
  {
    title: "Toys & Games",
    titleBn: "খেলনা ও গেমস",
    links: [
      { label: "Action Figures", labelBn: "অ্যাকশন ফিগার", href: "/shop?q=action+figures" },
      { label: "Board Games", labelBn: "বোর্ড গেমস", href: "/shop?q=board+games" },
      { label: "Puzzles", labelBn: "পাজল", href: "/shop?q=puzzles" },
      { label: "Educational Toys", labelBn: "শিক্ষামূলক খেলনা", href: "/shop?q=educational+toys" },
      { label: "Outdoor Toys", labelBn: "আউটডোর খেলনা", href: "/shop?q=outdoor+toys" },
    ],
  },
  {
    title: "Stationery",
    titleBn: "স্টেশনারি",
    links: [
      { label: "Pens & Pencils", labelBn: "কলম ও পেন্সিল", href: "/shop?q=pens" },
      { label: "Notebooks", labelBn: "নোটবুক", href: "/shop?q=notebooks" },
      { label: "Art Supplies", labelBn: "আর্ট সাপ্লাই", href: "/shop?q=art+supplies" },
      { label: "Office Supplies", labelBn: "অফিস সাপ্লাই", href: "/shop?q=office+supplies" },
      { label: "Craft Supplies", labelBn: "ক্র্যাফট সাপ্লাই", href: "/shop?q=craft+supplies" },
    ],
  },
  {
    title: "Top Brands",
    titleBn: "টপ ব্র্যান্ড",
    links: [
      { label: "Sony", labelBn: "সনি", href: "/shop?brand=sony" },
      { label: "Samsung", labelBn: "স্যামসাং", href: "/shop?brand=samsung" },
      { label: "Apple", labelBn: "অ্যাপল", href: "/shop?brand=apple" },
      { label: "Logitech", labelBn: "লজিটেক", href: "/shop?brand=logitech" },
      { label: "Razer", labelBn: "রেজার", href: "/shop?brand=razer" },
    ],
  },
  {
    title: "Discover Now",
    titleBn: "এখনই আবিষ্কার করুন",
    links: [
      { label: "Flash Deals", labelBn: "ফ্ল্যাশ ডিল", href: "/shop?filter=deals" },
      { label: "New Arrivals", labelBn: "নতুন আগমন", href: "/shop?filter=new-arrivals" },
      { label: "Bestsellers", labelBn: "বেস্টসেলার", href: "/shop?filter=bestsellers" },
      { label: "Free Delivery", labelBn: "ফ্রি ডেলিভারি", href: "/shop?filter=free-delivery" },
      { label: "Sell on TRD", labelBn: "টিআরডিতে বিক্রি করুন", href: "/seller/register" },
    ],
  },
  {
    title: "Popular",
    titleBn: "জনপ্রিয়",
    links: [
      { label: "Smart Watches", labelBn: "স্মার্ট ওয়াচ", href: "/shop?q=smart+watches" },
      { label: "Headphones", labelBn: "হেডফোন", href: "/shop?q=headphones" },
      { label: "Keyboards", labelBn: "কীবোর্ড", href: "/shop?q=keyboards" },
      { label: "Mice", labelBn: "মাউস", href: "/shop?q=mice" },
      { label: "Speakers", labelBn: "স্পিকার", href: "/shop?q=speakers" },
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
  { label: "Terms & Conditions", labelBn: "শর্তাবলী", href: "#" },
  { label: "Privacy Policy", labelBn: "গোপনীয়তা নীতি", href: "#" },
  { label: "Warranty Policy", labelBn: "ওয়ারেন্টি নীতি", href: "#" },
  { label: "Return Policy", labelBn: "ফেরত নীতি", href: "#" },
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
              <span className="t-bn">মোবাইলে কেনাকাটা করুন</span>
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
                    <span className="t-bn">ডাউনলোড করুন</span>
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
              <span className="t-bn">আমাদের সাথে যোগ দিন</span>
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
              <span className="t-bn">পেমেন্ট পদ্ধতি</span>
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
              <PaymentBadge label={isBn ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery"} bg="#1a6e2e" icon="fa-money" />
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-gray-800 w-full" style={{ background: "#060a14" }}>
        <div className="w-full px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* copyright */}
          <span className="text-xs text-gray-500">
            © {new Date().getFullYear()} TRD Store.{" "}
            <span className="t-en">All rights reserved.</span>
            <span className="t-bn">সর্বস্বত্ব সংরক্ষিত।</span>
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

  {
    title: "Gaming",
    links: [
      { label: "Gaming Monitors", href: "/shop?q=gaming+monitors" },
      { label: "Gaming Consoles", href: "/shop?q=gaming+consoles" },
      { label: "Gaming Accessories", href: "/shop?q=gaming+accessories" },
      { label: "PC Gaming", href: "/shop?q=pc+gaming" },
      { label: "VR Gaming", href: "/shop?q=vr+gaming" },
    ],
  },
  {
    title: "Toys & Games",
    links: [
      { label: "Action Figures", href: "/shop?q=action+figures" },
      { label: "Board Games", href: "/shop?q=board+games" },
      { label: "Puzzles", href: "/shop?q=puzzles" },
      { label: "Educational Toys", href: "/shop?q=educational+toys" },
      { label: "Outdoor Toys", href: "/shop?q=outdoor+toys" },
    ],
  },
  {
    title: "Stationery",
    links: [
      { label: "Pens & Pencils", href: "/shop?q=pens" },
      { label: "Notebooks", href: "/shop?q=notebooks" },
      { label: "Art Supplies", href: "/shop?q=art+supplies" },
      { label: "Office Supplies", href: "/shop?q=office+supplies" },
      { label: "Craft Supplies", href: "/shop?q=craft+supplies" },
    ],
  },
  {
    title: "Top Brands",
    links: [
      { label: "Sony", href: "/shop?brand=sony" },
      { label: "Samsung", href: "/shop?brand=samsung" },
      { label: "Apple", href: "/shop?brand=apple" },
      { label: "Logitech", href: "/shop?brand=logitech" },
      { label: "Razer", href: "/shop?brand=razer" },
    ],
  },
  {
    title: "Discover Now",
    links: [
      { label: "Flash Deals", href: "/shop?filter=deals" },
      { label: "New Arrivals", href: "/shop?filter=new-arrivals" },
      { label: "Bestsellers", href: "/shop?filter=bestsellers" },
      { label: "Free Delivery", href: "/shop?filter=free-delivery" },
      { label: "Sell on TRD", href: "/seller/register" },
    ],
  },
  {
    title: "Popular",
    links: [
      { label: "Smart Watches", href: "/shop?q=smart+watches" },
      { label: "Headphones", href: "/shop?q=headphones" },
      { label: "Keyboards", href: "/shop?q=keyboards" },
      { label: "Mice", href: "/shop?q=mice" },
      { label: "Speakers", href: "/shop?q=speakers" },
    ],
  },
];

const socialLinks = [
  { icon: "fa-facebook-f", href: "#", label: "Facebook" },
  { icon: "fa-twitter", href: "#", label: "Twitter" },
  { icon: "fa-instagram", href: "#", label: "Instagram" },
  { icon: "fa-linkedin-in", href: "#", label: "LinkedIn" },
];

const paymentIcons = [
  { alt: "Mastercard", icon: "fa-cc-mastercard" },
  { alt: "Visa", icon: "fa-cc-visa" },
  { alt: "Amex", icon: "fa-cc-amex" },
  { alt: "Cash on Delivery",  icon: "fa-money" },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0a0e1a", color: "#9ca3af" }}>
      {/* main columns */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white text-sm font-bold mb-3">{col.title}</h4>
              <ul className="space-y-1.5">
                {col.links.map((lnk) => (
                  <li key={lnk.label}>
                    <Link
                      href={lnk.href}
                      className="text-xs text-gray-400 hover:text-white transition-colors no-underline"
                    >
                      {lnk.label}
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
            <h4 className="text-white text-sm font-bold mb-3">Shop on the Go</h4>
            <div className="flex gap-2">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-white font-semibold no-underline"
                style={{ background: "#1a1a2e", border: "1px solid #374151" }}
              >
                <i className="fa fa-apple text-lg" />
                <span>
                  <span className="block text-[9px] text-gray-400 leading-none">Download on the</span>
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
            <h4 className="text-white text-sm font-bold mb-3">Connect with Us</h4>
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
        </div>
      </div>

      {/* bottom bar */}
      <div
        className="border-t border-gray-800"
        style={{ background: "#060a14" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* copyright */}
          <span className="text-xs text-gray-500">
            © {new Date().getFullYear()} TRD Store. All rights reserved.
          </span>

          {/* payment icons */}
          <div className="flex items-center gap-3">
            {paymentIcons.map((p) => (
              <i
                key={p.alt}
                className={`fa ${p.icon} text-xl text-gray-500`}
                title={p.alt}
              />
            ))}
          </div>

          {/* policy links */}
          <div className="flex items-center gap-4">
            {["Terms & Conditions", "Privacy Policy", "Warranty Policy", "Return Policy"].map(
              (txt) => (
                <Link
                  key={txt}
                  href="#"
                  className="text-xs text-gray-500 hover:text-gray-300 no-underline"
                >
                  {txt}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
