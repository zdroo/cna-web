"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    adminGetRevenueStats,
    adminGetTopSellingVariants,
    adminGetMonthlyProductSales,
    type RevenueGranularity,
    type RevenuePoint,
    type TopVariantPoint,
    type MonthlyProductSales,
} from "@/lib/api/admin";

// ── Config ───────────────────────────────────────────────────
const GRANULARITIES: { value: RevenueGranularity; label: string }[] = [
    { value: "Hour",  label: "Orar" },
    { value: "Day",   label: "Zilnic" },
    { value: "Week",  label: "Săptămânal" },
    { value: "Month", label: "Lunar" },
    { value: "Year",  label: "Anual" },
];

const TOP_PERIODS = [
    { days: 0,   label: "Tot timpul" },
    { days: 30,  label: "30 zile" },
    { days: 90,  label: "90 zile" },
    { days: 365, label: "1 an" },
];

const MONTH_RANGES = [
    { months: 3,  label: "3 luni" },
    { months: 6,  label: "6 luni" },
    { months: 12, label: "12 luni" },
    { months: 24, label: "2 ani" },
];

const TOP_COUNTS = [3, 5, 8, 10];

// ── Helpers ──────────────────────────────────────────────────
function fmtShort(v: number) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`;
    return v.toFixed(0);
}

function fmtLei(v: number) {
    return v.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " lei";
}

function prettifySlug(slug: string) {
    return slug.replace(/-/g, " ");
}

function niceMax(v: number) {
    if (v === 0) return 100;
    const exp = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / exp) * exp;
}

function TabBar<T extends string | number>({
    options, active, onChange,
}: {
    options: { value: T; label: string }[];
    active: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {options.map(({ value, label }) => (
                <button
                    key={String(value)}
                    onClick={() => onChange(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        active === value
                            ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

// ── SVG Revenue Chart ─────────────────────────────────────────
const VIEW_W = 900;
const VIEW_H = 260;
const PAD = { top: 16, right: 16, bottom: 48, left: 64 };
const CHART_W = VIEW_W - PAD.left - PAD.right;
const CHART_H = VIEW_H - PAD.top - PAD.bottom;
const Y_TICKS = 4;

function RevenueChart({ data }: { data: RevenuePoint[] }) {
    const [hovered, setHovered] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    if (data.length === 0) return null;

    const maxVal = niceMax(Math.max(...data.map(d => d.revenue)));
    const barSlot = CHART_W / data.length;
    const barW    = Math.max(4, barSlot * 0.55);
    const barGap  = (barSlot - barW) / 2;
    const yTicks  = Array.from({ length: Y_TICKS + 1 }, (_, i) => (maxVal * i) / Y_TICKS);

    const barH = (v: number) => (v / maxVal) * CHART_H;

    const pts = data.map((d, i) => ({
        x: PAD.left + i * barSlot + barGap + barW / 2,
        y: PAD.top + CHART_H - barH(d.revenue),
    }));

    function catmullRom(points: { x: number; y: number }[]) {
        if (points.length < 2) return "";
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(i - 1, 0)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(i + 2, points.length - 1)];
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        return d;
    }

    const linePath = catmullRom(pts);
    const areaPath = `${linePath} L ${pts.at(-1)!.x} ${PAD.top + CHART_H} L ${pts[0].x} ${PAD.top + CHART_H} Z`;
    const hovPoint = hovered !== null ? data[hovered] : null;

    return (
        <div className="relative w-full select-none">
            <svg ref={svgRef} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="w-full h-auto" style={{ overflow: "visible" }}
                onMouseLeave={() => setHovered(null)}>
                <defs>
                    <clipPath id="chartClip">
                        <rect x={PAD.left} y={PAD.top} width={CHART_W} height={CHART_H} />
                    </clipPath>
                </defs>
                {yTicks.map((tick) => {
                    const y = PAD.top + CHART_H - (tick / maxVal) * CHART_H;
                    return (
                        <g key={tick}>
                            <line x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y}
                                stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11"
                                fill="currentColor" fillOpacity="0.45">
                                {fmtShort(tick)}
                            </text>
                        </g>
                    );
                })}
                <path d={areaPath} fill="currentColor" fillOpacity="0.08" clipPath="url(#chartClip)" />
                <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.7" clipPath="url(#chartClip)" />
                {data.map((d, i) => {
                    const x = PAD.left + i * barSlot + barGap;
                    const h = Math.max(barH(d.revenue), d.revenue > 0 ? 2 : 0);
                    const y = PAD.top + CHART_H - h;
                    const isHov = hovered === i;
                    return (
                        <g key={i}>
                            <rect x={PAD.left + i * barSlot} y={PAD.top} width={barSlot} height={CHART_H}
                                fill="transparent" onMouseEnter={() => setHovered(i)} />
                            <rect x={x} y={y} width={barW} height={h} rx="3"
                                fill="currentColor" fillOpacity={isHov ? 0.9 : 0.5}
                                className="transition-all duration-100" />
                            {isHov && (
                                <circle cx={x + barW / 2} cy={PAD.top + CHART_H - barH(d.revenue)}
                                    r="4" fill="currentColor" />
                            )}
                        </g>
                    );
                })}
                {data.map((d, i) => {
                    const skip = Math.max(1, Math.ceil(data.length / 18));
                    if (i % skip !== 0 && i !== data.length - 1) return null;
                    const x = PAD.left + i * barSlot + barGap + barW / 2;
                    return (
                        <text key={i} x={x} y={PAD.top + CHART_H + 20}
                            textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.45">
                            {d.label}
                        </text>
                    );
                })}
                {hovered !== null && (
                    <line x1={PAD.left + hovered * barSlot + barGap + barW / 2} y1={PAD.top}
                        x2={PAD.left + hovered * barSlot + barGap + barW / 2} y2={PAD.top + CHART_H}
                        stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />
                )}
            </svg>
            {hovPoint !== null && hovered !== null && (
                <div className="absolute pointer-events-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-xs"
                    style={{
                        left: `${((PAD.left + hovered * barSlot + barGap + barW / 2) / VIEW_W) * 100}%`,
                        top: 0,
                        transform: hovered > data.length * 0.7 ? "translate(-110%, 0)" : "translate(10%, 0)",
                    }}>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{hovPoint.label}</p>
                    <p className="text-gray-700 dark:text-gray-300">{hovPoint.revenue.toFixed(2)} lei</p>
                    <p className="text-gray-400 dark:text-gray-500">
                        {hovPoint.orderCount} {hovPoint.orderCount === 1 ? "comandă" : "comenzi"}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Top Products Table ────────────────────────────────────────
function TopProductsTable({ data, loading }: { data: TopVariantPoint[]; loading: boolean }) {
    if (loading) return <Placeholder />;
    if (data.length === 0) return <Empty />;
    const maxRev = data[0]?.revenue ?? 1;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                        {["#", "Produs", "Venituri", "Cantitate", "Comenzi"].map((h, i) => (
                            <th key={h} className={`pb-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider ${i === 0 ? "text-left pr-4 w-8" : i === 1 ? "text-left pr-4" : "text-right pr-4 last:pr-0"}`}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={row.variantId}
                            className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="py-3 pr-4 text-gray-400 dark:text-gray-500 font-mono text-xs">{idx + 1}</td>
                            <td className="py-3 pr-4">
                                <p className="font-medium text-gray-900 dark:text-gray-100">{row.productName}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{prettifySlug(row.variantSlug)}</p>
                                <div className="mt-1.5 h-1 w-full max-w-44 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-800 dark:bg-gray-200 rounded-full"
                                        style={{ width: `${(row.revenue / maxRev) * 100}%` }} />
                                </div>
                            </td>
                            <td className="py-3 pr-4 text-right font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{fmtLei(row.revenue)}</td>
                            <td className="py-3 pr-4 text-right text-gray-600 dark:text-gray-400 tabular-nums">{row.quantitySold.toLocaleString("ro-RO")}</td>
                            <td className="py-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">{row.orderCount.toLocaleString("ro-RO")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Monthly Heatmap ───────────────────────────────────────────
type HeatView = "revenue" | "qty";

function MonthlyHeatmap({ data, loading }: { data: MonthlyProductSales | null; loading: boolean }) {
    const [view, setView] = useState<HeatView>("revenue");

    if (loading) return <Placeholder />;
    if (!data || data.rows.length === 0) return <Empty />;

    const { monthLabels, rows } = data;

    // Global max for colour intensity
    const allValues = rows.flatMap(r => view === "revenue" ? r.monthlyRevenue : r.monthlyQuantity);
    const globalMax = Math.max(...allValues, 1);

    const cellBg = (v: number): React.CSSProperties => {
        if (v === 0) return {};
        const alpha = 0.06 + Math.sqrt(v / globalMax) * 0.52;
        return { backgroundColor: `rgba(59,130,246,${alpha.toFixed(3)})` };
    };

    const cellText = (v: number) =>
        v === 0 ? (
            <span className="text-gray-300 dark:text-gray-700">—</span>
        ) : (
            <span>{view === "revenue" ? fmtShort(v) : v.toLocaleString("ro-RO")}</span>
        );

    const rowTotal = (r: typeof rows[number]) =>
        view === "revenue" ? r.totalRevenue : r.totalQuantity;

    const totalMax = Math.max(...rows.map(rowTotal), 1);

    return (
        <div className="flex flex-col gap-3">
            {/* View toggle */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    {view === "revenue" ? "Valori în lei (format scurt)" : "Unități vândute"}
                </p>
                <TabBar
                    options={[
                        { value: "revenue" as HeatView, label: "Venituri" },
                        { value: "qty" as HeatView, label: "Cantitate" },
                    ]}
                    active={view}
                    onChange={setView}
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs border-separate border-spacing-0.5">
                    <thead>
                        <tr>
                            {/* Product column */}
                            <th className="text-left pb-2 pr-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider min-w-40 sticky left-0 bg-white dark:bg-gray-900 z-10">
                                Produs
                            </th>
                            {monthLabels.map(m => (
                                <th key={m} className="text-center pb-2 px-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider min-w-14 whitespace-nowrap">
                                    {m}
                                </th>
                            ))}
                            <th className="text-right pb-2 pl-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider min-w-16 sticky right-0 bg-white dark:bg-gray-900 z-10">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const total = rowTotal(row);
                            const totalAlpha = 0.06 + Math.sqrt(total / totalMax) * 0.52;
                            return (
                                <tr key={row.variantId}>
                                    {/* Product name – sticky */}
                                    <td className="py-2 pr-4 sticky left-0 bg-white dark:bg-gray-900 z-10">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-36">
                                            {row.productName}
                                        </p>
                                        <p className="text-gray-400 dark:text-gray-500 truncate max-w-36 mt-0.5">
                                            {prettifySlug(row.variantSlug)}
                                        </p>
                                    </td>

                                    {/* Monthly cells */}
                                    {(view === "revenue" ? row.monthlyRevenue : row.monthlyQuantity).map((v, mi) => (
                                        <td key={mi}
                                            className="text-center tabular-nums rounded text-gray-800 dark:text-gray-200 py-2 px-1"
                                            style={cellBg(v)}>
                                            {cellText(v)}
                                        </td>
                                    ))}

                                    {/* Total – sticky */}
                                    <td className="text-right pl-3 tabular-nums font-semibold text-gray-900 dark:text-gray-100 rounded sticky right-0 bg-white dark:bg-gray-900 z-10"
                                        style={{ backgroundColor: `rgba(59,130,246,${totalAlpha.toFixed(3)})` }}>
                                        {view === "revenue" ? fmtShort(total as number) : (total as number).toLocaleString("ro-RO")}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Shared placeholders ───────────────────────────────────────
function Placeholder() {
    return (
        <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            Se încarcă...
        </div>
    );
}
function Empty() {
    return (
        <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            Nicio vânzare în această perioadă.
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────
export default function AdminStatisticiPage() {
    const { token } = useAuth();

    const [granularity, setGranularity] = useState<RevenueGranularity>("Day");
    const [revenueData, setRevenueData]   = useState<RevenuePoint[]>([]);
    const [revenueLoading, setRevenueLoading] = useState(true);

    const [topDays, setTopDays]   = useState(0);
    const [topData, setTopData]   = useState<TopVariantPoint[]>([]);
    const [topLoading, setTopLoading] = useState(true);

    const [heatMonths, setHeatMonths] = useState(12);
    const [heatTop, setHeatTop]       = useState(5);
    const [heatData, setHeatData]     = useState<MonthlyProductSales | null>(null);
    const [heatLoading, setHeatLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        setRevenueLoading(true);
        adminGetRevenueStats(token, granularity)
            .then(setRevenueData).catch(console.error)
            .finally(() => setRevenueLoading(false));
    }, [token, granularity]);

    useEffect(() => {
        if (!token) return;
        setTopLoading(true);
        adminGetTopSellingVariants(token, 10, topDays)
            .then(setTopData).catch(console.error)
            .finally(() => setTopLoading(false));
    }, [token, topDays]);

    useEffect(() => {
        if (!token) return;
        setHeatLoading(true);
        adminGetMonthlyProductSales(token, heatMonths, heatTop)
            .then(setHeatData).catch(console.error)
            .finally(() => setHeatLoading(false));
    }, [token, heatMonths, heatTop]);

    const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
    const totalOrders  = revenueData.reduce((s, d) => s + d.orderCount, 0);
    const bestPoint    = revenueData.reduce<RevenuePoint | null>(
        (best, d) => !best || d.revenue > best.revenue ? d : best, null);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Statistici</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Performanță vânzări</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Venituri perioadă</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {revenueLoading ? "—" : `${totalRevenue.toFixed(2)} lei`}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Comenzi plătite</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {revenueLoading ? "—" : totalOrders}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Cea mai bună perioadă</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {revenueLoading || !bestPoint || bestPoint.revenue === 0 ? "—" : bestPoint.label}
                    </p>
                    {!revenueLoading && bestPoint && bestPoint.revenue > 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{bestPoint.revenue.toFixed(2)} lei</p>
                    )}
                </div>
            </div>

            {/* Revenue chart */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Venituri</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Comenzi plătite</p>
                    </div>
                    <TabBar
                        options={GRANULARITIES.map(g => ({ value: g.value, label: g.label }))}
                        active={granularity}
                        onChange={setGranularity}
                    />
                </div>
                <div className="text-gray-900 dark:text-gray-100">
                    {revenueLoading ? (
                        <Placeholder />
                    ) : revenueData.every(d => d.revenue === 0) ? (
                        <Empty />
                    ) : (
                        <RevenueChart data={revenueData} />
                    )}
                </div>
            </div>

            {/* Top products */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Top produse vândute</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Cele mai vândute variante</p>
                    </div>
                    <TabBar
                        options={TOP_PERIODS.map(p => ({ value: p.days, label: p.label }))}
                        active={topDays}
                        onChange={setTopDays}
                    />
                </div>
                <TopProductsTable data={topData} loading={topLoading} />
            </div>

            {/* Monthly product heatmap */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Vânzări lunare pe produs</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Distribuția vânzărilor pe luni pentru cele mai vândute produse
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <TabBar
                            options={MONTH_RANGES.map(r => ({ value: r.months, label: r.label }))}
                            active={heatMonths}
                            onChange={setHeatMonths}
                        />
                        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                            {TOP_COUNTS.map(n => (
                                <button
                                    key={n}
                                    onClick={() => setHeatTop(n)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        heatTop === n
                                            ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                >
                                    Top {n}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <MonthlyHeatmap data={heatData} loading={heatLoading} />
            </div>
        </div>
    );
}
