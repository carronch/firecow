import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, DollarSign, Users, RotateCcw } from 'lucide-react';

type Period = '7d' | '30d' | '90d' | '360d' | 'all';

interface Summary {
    total_bookings: number;
    total_revenue_cents: number;
    confirmed_revenue_cents: number;
    confirmed_count: number;
    refunded_count: number;
    cancelled_count: number;
    pending_count: number;
}

interface BySite {
    site_id: string;
    site_slug: string;
    booking_count: number;
    revenue_cents: number;
    confirmed_count: number;
    refunded_count: number;
}

interface Trend {
    date: string;
    booking_count: number;
    revenue_cents: number;
}

interface BySource {
    utm_source: string;
    booking_count: number;
    revenue_cents: number;
}

interface Props {
    apiBase: string;
}

const PERIODS: { label: string; value: Period }[] = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: '360 days', value: '360d' },
    { label: 'All time', value: 'all' },
];

export default function AnalyticsDashboard({ apiBase }: Props) {
    const [period, setPeriod] = useState<Period>('30d');
    const [summary, setSummary] = useState<Summary | null>(null);
    const [bySite, setBySite] = useState<BySite[]>([]);
    const [trends, setTrends] = useState<Trend[]>([]);
    const [bySource, setBySource] = useState<BySource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async (p: Period) => {
        setLoading(true);
        setError(null);
        try {
            const [s, site, t, src] = await Promise.all([
                fetch(`${apiBase}/api/analytics/summary?period=${p}`).then(r => r.json()),
                fetch(`${apiBase}/api/analytics/by-site?period=${p}`).then(r => r.json()),
                fetch(`${apiBase}/api/analytics/trends?period=${p}`).then(r => r.json()),
                fetch(`${apiBase}/api/analytics/by-source?period=${p}`).then(r => r.json()),
            ]);
            setSummary(s);
            setBySite(Array.isArray(site) ? site : []);
            setTrends(Array.isArray(t) ? t : []);
            setBySource(Array.isArray(src) ? src : []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(period); }, [period]);

    const fmtMoney = (cents: number) => `$${(Number(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pct = (n: number, total: number) => total ? `${Math.round((n / total) * 100)}%` : '—';

    const maxRevenue = Math.max(...trends.map(t => t.revenue_cents), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${period === p.value ? 'bg-slate-900/40 backdrop-blur-md shadow text-white' : 'text-slate-400 hover:text-slate-300'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <button onClick={() => load(period)} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-700 rounded-lg hover:bg-slate-800/30 disabled:opacity-50">
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    icon={<DollarSign size={18} />}
                    label="Confirmed Revenue"
                    value={summary ? fmtMoney(summary.confirmed_revenue_cents) : '—'}
                    sub={summary ? `${summary.confirmed_count} confirmed` : ''}
                    color="green"
                />
                <StatCard
                    icon={<Users size={18} />}
                    label="Total Bookings"
                    value={summary ? String(summary.total_bookings) : '—'}
                    sub={summary ? `${summary.pending_count} pending` : ''}
                    color="blue"
                />
                <StatCard
                    icon={<TrendingUp size={18} />}
                    label="Avg Booking Value"
                    value={summary && summary.confirmed_count ? fmtMoney(summary.confirmed_revenue_cents / summary.confirmed_count) : '—'}
                    sub="per confirmed booking"
                    color="purple"
                />
                <StatCard
                    icon={<RotateCcw size={18} />}
                    label="Refund Rate"
                    value={summary ? pct(summary.refunded_count, summary.total_bookings) : '—'}
                    sub={summary ? `${summary.refunded_count} refunded` : ''}
                    color="amber"
                />
            </div>

            {/* Revenue trend */}
            {trends.length > 0 && (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/60 p-5">
                    <p className="text-sm font-semibold text-slate-300 mb-4">Revenue Trend</p>
                    <div className="flex items-end gap-1 h-28">
                        {trends.map(t => (
                            <div key={t.date} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${t.date}: ${fmtMoney(t.revenue_cents)} (${t.booking_count} bookings)`}>
                                <div
                                    className="w-full bg-blue-500 rounded-sm min-h-[2px] transition-all group-hover:bg-gradient-to-r from-sky-500 to-purple-600 border-0"
                                    style={{ height: `${Math.max(2, (t.revenue_cents / maxRevenue) * 100)}%` }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{trends[0]?.date}</span>
                        <span>{trends[trends.length - 1]?.date}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* By Site */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/60 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-slate-300">Revenue by Site</p>
                    </div>
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-800/30">
                            <tr>
                                {['Site', 'Bookings', 'Revenue', 'Refunds'].map(h => (
                                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bySite.length === 0 && (
                                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">No data</td></tr>
                            )}
                            {bySite.map(s => (
                                <tr key={s.site_id} className="hover:bg-slate-800/30">
                                    <td className="px-4 py-2 font-medium text-white text-xs">{s.site_slug || s.site_id}</td>
                                    <td className="px-4 py-2 text-slate-400 text-xs">{s.booking_count}</td>
                                    <td className="px-4 py-2 text-white font-medium text-xs">{fmtMoney(s.revenue_cents)}</td>
                                    <td className="px-4 py-2 text-xs">
                                        <span className={s.refunded_count > 0 ? 'text-yellow-600' : 'text-gray-400'}>{s.refunded_count}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* By Source / UTM */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/60 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-300">Traffic Sources</p>
                        <span className="text-xs text-gray-400">via UTM tracking</span>
                    </div>
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-800/30">
                            <tr>
                                {['Source', 'Bookings', 'Revenue', 'Ad Spend'].map(h => (
                                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bySource.length === 0 && (
                                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">No UTM data yet — bookings will show source once UTM tracking is active</td></tr>
                            )}
                            {bySource.map(s => (
                                <tr key={s.utm_source} className="hover:bg-slate-800/30">
                                    <td className="px-4 py-2 font-medium text-white text-xs capitalize">{s.utm_source}</td>
                                    <td className="px-4 py-2 text-slate-400 text-xs">{s.booking_count}</td>
                                    <td className="px-4 py-2 text-white font-medium text-xs">{fmtMoney(s.revenue_cents)}</td>
                                    <td className="px-4 py-2 text-gray-400 text-xs">—</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Google Ads connect placeholder */}
                    <div className="px-5 py-3 bg-slate-800/30 border-t border-gray-100">
                        <p className="text-xs text-slate-400">
                            <span className="font-medium text-slate-300">Connect Google Ads</span> to unlock the Ad Spend column and see ROAS per campaign automatically.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
    const colors: Record<string, string> = {
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/60 p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>{icon}</div>
            <p className="text-xs text-slate-400 mb-0.5">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
    );
}
