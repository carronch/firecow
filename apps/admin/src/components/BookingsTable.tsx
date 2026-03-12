import React, { useState, useCallback } from 'react';
import { RefreshCw, RotateCcw, Pencil, Check, X } from 'lucide-react';

interface Booking {
    id: string;
    tour_id: string;
    site_id: string;
    stripe_payment_intent_id: string;
    customer_email: string;
    customer_name: string;
    booking_date: string;
    party_size: number;
    total_amount: number;
    status: string;
    notes: string;
    created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
    confirmed:  'bg-green-100 text-green-800',
    refunded:   'bg-yellow-100 text-yellow-800',
    cancelled:  'bg-red-100 text-red-800',
    pending:    'bg-gray-100 text-gray-700',
};

const STATUSES = ['confirmed', 'pending', 'refunded', 'cancelled'];

interface Props {
    initialBookings: Booking[];
    apiBase: string;
}

export default function BookingsTable({ initialBookings, apiBase }: Props) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [loading, setLoading] = useState(false);
    const [refunding, setRefunding] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ booking_date: string; party_size: number; status: string; notes: string }>({
        booking_date: '', party_size: 1, status: 'confirmed', notes: '',
    });

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/bookings`);
            if (res.ok) setBookings(await res.json());
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    const startEdit = (b: Booking) => {
        setEditingId(b.id);
        setEditData({ booking_date: b.booking_date || '', party_size: b.party_size, status: b.status, notes: b.notes || '' });
    };

    const saveEdit = async (id: string) => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/bookings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            setBookings(bs => bs.map(b => b.id === id ? updated : b));
            setEditingId(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRefund = useCallback(async (booking: Booking) => {
        if (!booking.stripe_payment_intent_id) {
            setError('No payment intent ID on this booking.');
            return;
        }
        if (!confirm(`Refund $${(Number(booking.total_amount) / 100).toFixed(2)} for ${booking.customer_name || booking.customer_email}?`)) return;

        setRefunding(booking.id);
        setError(null);
        try {
            const res = await fetch('/api/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentIntentId: booking.stripe_payment_intent_id,
                    bookingId: booking.id,
                    apiBase,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Refund failed');
            setBookings(bs => bs.map(b => b.id === booking.id ? { ...b, status: 'refunded' } : b));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setRefunding(null);
        }
    }, [apiBase]);

    const fmt = (iso: string) => iso ? new Date(iso).toLocaleDateString() : '—';
    const fmtMoney = (n: number) => `$${(Number(n) / 100).toFixed(2)}`;
    const inp = 'w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{bookings.length} bookings</p>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Customer', 'Tour / Site', 'Date', 'Guests', 'Total', 'Status', 'Notes', 'Created', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                        No bookings yet.
                                    </td>
                                </tr>
                            )}
                            {bookings.map(b => (
                                <React.Fragment key={b.id}>
                                    <tr className={`hover:bg-gray-50 ${editingId === b.id ? 'bg-blue-50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{b.customer_name || '—'}</div>
                                            <div className="text-gray-400 text-xs">{b.customer_email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            <div className="text-xs font-mono">{b.tour_id?.slice(0, 8)}…</div>
                                            <div className="text-gray-400 text-xs">{b.site_id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(b.booking_date)}</td>
                                        <td className="px-4 py-3 text-gray-600 text-center">{b.party_size}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{fmtMoney(b.total_amount)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">{b.notes ? (() => { try { const n = JSON.parse(b.notes); return n.utm_source ? `utm: ${n.utm_source}` : b.notes; } catch { return b.notes; } })() : '—'}</td>
                                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmt(b.created_at)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex gap-1 items-center">
                                                {b.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleRefund(b)}
                                                        disabled={refunding === b.id}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        <RotateCcw size={12} />
                                                        {refunding === b.id ? 'Refunding…' : 'Refund'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => editingId === b.id ? setEditingId(null) : startEdit(b)}
                                                    className={`p-1.5 rounded ${editingId === b.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {editingId === b.id && (
                                        <tr className="bg-blue-50">
                                            <td colSpan={9} className="px-4 pb-4 pt-1">
                                                <div className="grid grid-cols-4 gap-3 text-xs">
                                                    <div>
                                                        <label className="block text-gray-500 mb-0.5">Booking Date</label>
                                                        <input type="date" className={inp} value={editData.booking_date}
                                                            onChange={e => setEditData(d => ({ ...d, booking_date: e.target.value }))} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-500 mb-0.5">Party Size</label>
                                                        <input type="number" min={1} className={inp} value={editData.party_size}
                                                            onChange={e => setEditData(d => ({ ...d, party_size: Number(e.target.value) }))} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-500 mb-0.5">Status</label>
                                                        <select className={`${inp} bg-white`} value={editData.status}
                                                            onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
                                                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-500 mb-0.5">Notes</label>
                                                        <input className={inp} value={editData.notes}
                                                            onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => saveEdit(b.id)} disabled={saving}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                                        <Check size={12} /> {saving ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button onClick={() => setEditingId(null)}
                                                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-xs rounded-lg hover:bg-gray-50 bg-white">
                                                        <X size={12} /> Cancel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
