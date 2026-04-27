/**
 * pages/seller/dashboard.js
 * TRD feature flags:
 *   NEXT_PUBLIC_SELLER_SHOW_ORDERS  — shows/hides My Orders section
 */
import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import { sellerApi } from "@/lib/api";
import SellerLayout from "@/components/seller/SellerLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProductCard from "@/components/products/ProductCard";
import { formatPrice } from "@/lib/utils";

const SHOW_ORDERS = true;

const fetcher = () => sellerApi.dashboard().then((r) => r.data);

export default function SellerDashboardPage() {
  const { data, isLoading, error } = useSWR("seller-dashboard", fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <SellerLayout title="Dashboard">
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      </SellerLayout>
    );
  }

  if (error) {
    return (
      <SellerLayout title="Dashboard">
        <p className="text-red-600">Failed to load dashboard. Please refresh.</p>
      </SellerLayout>
    );
  }

  const { seller, total_products, published, pending, total_orders, recent_products, analytics = {} } = data || {};
  const maxRevenue = Math.max(
    1,
    ...(analytics.revenue_chart || []).map((row) => Number(row.revenue || 0))
  );

  return (
    <>
      <Head><title>Seller Dashboard – TRD Store</title></Head>
      <SellerLayout title="Dashboard">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary">
            Welcome, {seller?.business_name}
          </h2>
          {seller?.status === "pending" && (
            <p className="mt-1 text-sm text-orange-600 bg-orange-50 rounded p-2 inline-block">
              ⏳ Your account is pending admin approval. You can add products, but they won't be visible until approved.
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Products", value: total_products ?? 0, color: "bg-blue-50 text-blue-700" },
            { label: "Published",      value: published ?? 0,      color: "bg-green-50 text-green-700" },
            { label: "Pending Review", value: pending   ?? 0,      color: "bg-orange-50 text-orange-700" },
            { label: "Revenue", value: formatPrice(analytics.total_revenue || 0), color: "bg-emerald-50 text-emerald-700" },
            { label: "Conversion", value: `${analytics.conversion_rate ?? 0}%`, color: "bg-cyan-50 text-cyan-700" },
            { label: "Pending Orders", value: analytics.pending_orders ?? 0, color: "bg-amber-50 text-amber-700" },
            { label: "Low Stock", value: analytics.low_stock_count ?? 0, color: "bg-red-50 text-red-700" },
            { label: "Payout Balance", value: formatPrice(analytics.payout_balance || 0), color: "bg-slate-100 text-slate-700" },
            // TRD_HOLD: orders stat — hidden via NEXT_PUBLIC_SELLER_SHOW_ORDERS
            ...(SHOW_ORDERS
              ? [{ label: "Orders", value: total_orders ?? 0, color: "bg-violet-50 text-violet-700" }]
              : []),
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-5 ${color}`}>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-8">
          <Link href="/seller/product/add" className="btn-accent px-5 py-2 rounded font-semibold text-sm">
            + Add Product
          </Link>
          <Link href="/seller/products" className="btn-primary px-5 py-2 rounded font-semibold text-sm">
            View All Products
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 bg-card rounded-xl shadow-card p-5">
            <h3 className="font-bold text-primary mb-4">Revenue Trend</h3>
            <div className="h-44 flex items-end gap-2">
              {(analytics.revenue_chart || []).length === 0 ? (
                <p className="text-sm text-muted self-center mx-auto">No paid orders yet.</p>
              ) : (
                analytics.revenue_chart.map((row) => (
                  <div key={row.date} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-emerald-500/80 min-h-[6px]"
                      style={{ height: `${Math.max(6, (Number(row.revenue || 0) / maxRevenue) * 150)}px` }}
                      title={`${row.date}: ${formatPrice(row.revenue)}`}
                    />
                    <span className="text-[10px] text-muted">{new Date(row.date).getDate()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-card p-5">
            <h3 className="font-bold text-primary mb-4">Payout Tracking</h3>
            {(analytics.recent_payouts || []).length === 0 ? (
              <p className="text-sm text-muted">No payout records yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.recent_payouts.map((payout) => (
                  <div key={payout.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted">{payout.period_start} - {payout.period_end}</span>
                    <span className="font-bold">{formatPrice(payout.net_amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-xl shadow-card p-5">
            <h3 className="font-bold text-primary mb-4">Product Performance</h3>
            {(analytics.product_performance || []).length === 0 ? (
              <p className="text-sm text-muted">No product sales yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.product_performance.slice(0, 5).map((item) => (
                  <div key={item.product_id} className="flex justify-between gap-4 text-sm">
                    <span className="line-clamp-1">{item.product_name}</span>
                    <span className="font-bold whitespace-nowrap">{item.units_sold} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-card p-5">
            <h3 className="font-bold text-primary mb-4">Low Stock Warnings</h3>
            {(analytics.low_stock || []).length === 0 ? (
              <p className="text-sm text-muted">All stocked products look healthy.</p>
            ) : (
              <div className="space-y-3">
                {analytics.low_stock.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 text-sm">
                    <span className="line-clamp-1">{item.name}</span>
                    <span className="font-bold text-red-600 whitespace-nowrap">{item.stock_quantity} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-xl shadow-card p-5">
            <h3 className="font-bold text-primary mb-4">Demand Forecast: Next 7 Days</h3>
            {(analytics.demand_forecast || []).length === 0 ? (
              <p className="text-sm text-muted">Not enough sales history to forecast demand yet.</p>
            ) : (
              <div className="space-y-4">
                {analytics.demand_forecast.slice(0, 5).map((item) => (
                  <div key={item.product_id} className="rounded-lg bg-emerald-50/70 p-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold line-clamp-1">{item.product_name}</span>
                      <span className="font-black text-emerald-700 whitespace-nowrap">
                        {item.forecast_units_next_7_days} units
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Trend: {item.trend} - Confidence: {Math.round((item.confidence || 0) * 100)}% - Stock: {item.stock_quantity}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-card p-5">
            <h3 className="font-bold text-primary mb-4">Stockout Prediction</h3>
            {(analytics.stockout_predictions || []).length === 0 ? (
              <p className="text-sm text-muted">No predicted stockouts in the next two weeks.</p>
            ) : (
              <div className="space-y-4">
                {analytics.stockout_predictions.slice(0, 5).map((item) => (
                  <div key={item.product_id} className="rounded-lg border border-red-100 bg-red-50/60 p-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold line-clamp-1">{item.product_name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${severityClass(item.risk_level)}`}>
                        {item.risk_level}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {item.days_until_stockout === null
                        ? `${item.stock_quantity} left. Watch manually until sales velocity is available.`
                        : `${item.days_until_stockout} days left. Reorder ${item.recommended_reorder_quantity} units.`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-card p-5">
            <h3 className="font-bold text-primary mb-4">Fraud & Anomaly Alerts</h3>
            {(analytics.fraud_alerts || []).length === 0 ? (
              <p className="text-sm text-muted">No suspicious payment or order patterns detected.</p>
            ) : (
              <div className="space-y-4">
                {analytics.fraud_alerts.slice(0, 5).map((item, index) => (
                  <div key={`${item.title}-${item.order_id || index}`} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold">{item.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${severityClass(item.severity)}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{item.detail}</p>
                    {item.order_id && <p className="mt-1 text-[11px] text-muted">Order #{item.order_id}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-card p-5">
            <h3 className="font-bold text-primary mb-4">Dynamic Promotion Suggestions</h3>
            {(analytics.promotion_suggestions || []).length === 0 ? (
              <p className="text-sm text-muted">No slow-moving products need discounts right now.</p>
            ) : (
              <div className="space-y-4">
                {analytics.promotion_suggestions.slice(0, 5).map((item) => (
                  <div key={item.product_id} className="rounded-lg bg-amber-50/70 p-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold line-clamp-1">{item.product_name}</span>
                      <span className="font-black text-amber-700 whitespace-nowrap">
                        {item.suggested_discount_percent}% off
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{item.reason}</p>
                    <p className="mt-1 text-xs text-muted">
                      Suggested rule: {item.suggested_rule}, min order {formatPrice(item.minimum_order_total)}, valid {item.valid_days} days.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent products */}
        {recent_products?.length > 0 && (
          <div>
            <h3 className="font-bold text-primary section-title mb-4">Recent Products</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recent_products.map((p) => (
                <ProductCard key={p.id} product={p} hrefOverride={`/seller/product/${p.id}/edit`} />
              ))}
            </div>
          </div>
        )}
      </SellerLayout>
    </>
  );
}

SellerDashboardPage.getLayout = (page) => page;

function severityClass(severity) {
  if (severity === "critical") return "bg-red-600 text-white";
  if (severity === "high") return "bg-orange-100 text-orange-700";
  if (severity === "medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-200 text-slate-700";
}
