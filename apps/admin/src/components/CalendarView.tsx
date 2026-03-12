import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Pencil, Check } from 'lucide-react';

interface Booking {
    id: string;
    tour_id: string;
    site_id: string;
    customer_name: string;
    customer_email: string;
    booking_date: string;
    party_size: number;
    total_amount: number;
    status: string;
    notes: string;
    created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    refunded:  'bg-yellow-100 text-yellow-800 border-yellow-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    pending:   'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUSES = ['confirmed', 'pending', 'refunded', 'cancelled'];

interface Props {
    initialBookings: Booking[];
    apiBase: string;
}

export default function CalendarView({ initialBookings, apiBase }: Props) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0-indexed
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [filterSite, setFilterSite] = useState('');
    const [selected, setSelected] = useState<Booking | null>(null);
    const [editData, setEditData] = useState<{ booking_date: string; party_size: number; status: string; notes: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sites = useMemo(() => [...new Set(bookings.map(b => b.site_id).filter(Boolean))], [bookings]);

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    // Days in current month grid
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Bookings indexed by date string YYYY-MM-DD
    const byDate = useMemo(() => {
        const map: Record<string, Booking[]> = {};
        for (const b of bookings) {
            if (!b.booking_date) continue;
            if (filterSite && b.site_id !== filterSite) continue;
            const d = b.booking_date.slice(0, 10);
            const [y, m] = d.split('-').map(Number);
            if (y !== year || m - 1 !== month) continue;
            if (!map[d]) map[d] = [];
            map[d].push(b);
        }
        return map;
    }, [bookings, year, month, filterSite]);

    const saveEdit = async () => {
        if (!selected || !editData) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/bookings/${selected.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            setBookings(bs => bs.map(b => b.id === selected.id ? updated : b));
            setSelected(updated);
            setEditData(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const fmtMoney = (n: number) => `$${(Number(n) / 100).toFixed(2)}`;
    const inp = 'w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';

    // Build grid cells: blanks before first day, then day numbers
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="flex gap-6">
            {/* Calendar */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={prevMonth} className="p-1.5 rounded hover:bg-gray-100"><ChevronLeft size={18} /></button>
                        <span className="text-lg font-semibold text-gray-900 w-48 text-center">{monthName}</span>
                        <button onClick={nextMonth} className="p-1.5 rounded hover:bg-gray-100"><ChevronRight size={18} /></button>
                    </div>
                    <select
                        value={filterSite}
                        onChange={e => setFilterSite(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                        <option value="">All sites</option>
                        {sites.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="px-2 py-2 text-xs font-semibold text-gray-500 text-center uppercase">{d}</div>
                        ))}
                    </div>
                    {/* Day cells */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
                        {cells.map((day, i) => {
                            if (!day) return <div key={i} className="min-h-[90px] bg-gray-50/50" />;
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayBookings = byDate[dateStr] || [];
                            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                            return (
                                <div key={i} className="min-h-[90px] p-1.5 hover:bg-gray-50">
                                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
                                        {day}
                                    </div>
                                    <div className="space-y-0.5">
                                        {dayBookings.map(b => (
                                            <button
                                                key={b.id}
                                                onClick={() => { setSelected(b); setEditData(null); }}
                                                className={`w-full text-left px-1.5 py-0.5 rounded border text-xs truncate ${STATUS_COLORS[b.status] ?? STATUS_COLORS.pending}`}
                                            >
                                                {b.customer_name || b.customer_email?.split('@')[0]} ({b.party_size})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Detail panel */}
            {selected && (
                <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5 self-start">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="font-semibold text-gray-900">{selected.customer_name || '—'}</p>
                            <p className="text-gray-400 text-xs">{selected.customer_email}</p>
                        </div>
                        <button onClick={() => { setSelected(null); setEditData(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                            <X size={16} />
                        </button>
                    </div>

                    {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

                    {editData ? (
                        <div className="space-y-2 text-xs">
                            <div>
                                <label className="block text-gray-500 mb-0.5">Booking Date</label>
                                <input type="date" className={inp} value={editData.booking_date}
                                    onChange={e => setEditData(d => d ? { ...d, booking_date: e.target.value } : d)} />
                            </div>
                            <div>
                                <label className="block text-gray-500 mb-0.5">Party Size</label>
                                <input type="number" min={1} className={inp} value={editData.party_size}
                                    onChange={e => setEditData(d => d ? { ...d, party_size: Number(e.target.value) } : d)} />
                            </div>
                            <div>
                                <label className="block text-gray-500 mb-0.5">Status</label>
                                <select className={`${inp} bg-white`} value={editData.status}
                                    onChange={e => setEditData(d => d ? { ...d, status: e.target.value } : d)}>
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-500 mb-0.5">Notes</label>
                                <textarea className={inp} rows={2} value={editData.notes}
                                    onChange={e => setEditData(d => d ? { ...d, notes: e.target.value } : d)} />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={saveEdit} disabled={saving}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    <Check size={12} /> {saving ? 'Saving…' : 'Save'}
                                </button>
                                <button onClick={() => setEditData(null)}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-xs rounded-lg hover:bg-gray-50">
                                    <X size={12} /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Date</dt>
                                    <dd className="font-medium">{selected.booking_date || '—'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Guests</dt>
                                    <dd className="font-medium">{selected.party_size}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Total</dt>
                                    <dd className="font-medium">{fmtMoney(selected.total_amount)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Status</dt>
                                    <dd>
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${STATUS_COLORS[selected.status] ?? STATUS_COLORS.pending}`}>
                                            {selected.status}
                                        </span>
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Site</dt>
                                    <dd className="text-xs text-gray-600">{selected.site_id || '—'}</dd>
                                </div>
                                {selected.notes && (
                                    <div className="pt-1 border-t border-gray-100">
                                        <dt className="text-gray-500 text-xs mb-0.5">Notes</dt>
                                        <dd className="text-xs text-gray-600 break-words">{selected.notes}</dd>
                                    </div>
                                )}
                            </dl>
                            <button
                                onClick={() => setEditData({ booking_date: selected.booking_date || '', party_size: selected.party_size, status: selected.status, notes: selected.notes || '' })}
                                className="mt-4 flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 w-full justify-center"
                            >
                                <Pencil size={13} /> Edit Booking
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
