import { useState } from "react";
import { useRouter } from "next/router";

const CATEGORIES = [
  { value: "", label: "Any category" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "home-living", label: "Home & Living" },
  { value: "beauty", label: "Beauty" },
  { value: "grocery", label: "Grocery" },
  { value: "books", label: "Books" },
];

const BUDGETS = [
  { value: "", label: "Any budget" },
  { value: "3000", label: "Under BDT 3,000" },
  { value: "10000", label: "Under BDT 10,000" },
  { value: "50000", label: "Under BDT 50,000" },
];

const PRIORITIES = [
  { value: "deals", label: "Best deal" },
  { value: "free_delivery", label: "Free delivery" },
  { value: "new_arrivals", label: "Newest drops" },
  { value: "bestseller", label: "Most loved" },
];

const QUICK_MATCHES = [
  { label: "Gift under BDT 3,000", query: { max_price: "3000", deal_type: "deals" } },
  { label: "Fast delivery picks", query: { free_delivery: "1" } },
  { label: "Work setup", query: { search: "work setup", category_slug: "electronics" } },
];

export default function SmartDealFinder() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [priority, setPriority] = useState("deals");

  function goToShop(query) {
    router.push({ pathname: "/shop", query });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const query = {};

    if (category) query.category_slug = category;
    if (budget) query.max_price = budget;
    if (priority === "free_delivery") query.free_delivery = "1";
    if (priority === "deals") query.deal_type = "deals";
    if (priority === "new_arrivals") query.deal_type = "new_arrivals";
    if (priority === "bestseller") query.deal_type = "bestseller";

    goToShop(query);
  }

  return (
    <section id="quick-match" className="quick-match">
      <div className="homepage-shell">
        <div className="quick-match-panel">
          <div className="quick-match-copy">
            <span className="quick-match-kicker">Quick Match</span>
            <h2>Find the right shelf in seconds</h2>
            <p>Pick a budget and what matters most. TRD prepares a focused shop view instead of making you dig through endless rows.</p>
          </div>

          <form className="quick-match-form" onSubmit={handleSubmit}>
            <label>
              <span>Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Budget</span>
              <select value={budget} onChange={(event) => setBudget(event.target.value)}>
                {BUDGETS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                {PRIORITIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <button type="submit">Build my shelf</button>
          </form>

          <div className="quick-match-pills" aria-label="Quick shopping shortcuts">
            {QUICK_MATCHES.map((item) => (
              <button key={item.label} type="button" onClick={() => goToShop(item.query)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
