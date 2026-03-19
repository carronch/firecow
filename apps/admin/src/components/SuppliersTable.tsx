import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, RefreshCw, CalendarSearch } from 'lucide-react';
import { getNextSeason } from '../config/high-seasons';
import SupplierCheckPanel from './SupplierCheckPanel';

interface Supplier {
    id: string;
    name: string;
    contact_email: string;
    contact_whatsapp: string;
    location: string;
    calendar_url?: string;
}

type CheckStatus = 'available' | 'unverified' | 'full';

type EditRow = Omit<Supplier, 'id'>;

const EMPTY: EditRow = { name: '', contact_email: '', contact_whatsapp: '', location: '', calendar_url: '' };

const STATUS_LABEL: Record<CheckStatus, string> = {
    available: '✅ Available',
    unverified: '🟡 Unverified',
    full: '🔴 Full',
};
const STATUS_CLASSES: Record<CheckStatus, string> = {
    available: 'bg-green-100 text-green-800',
    unverified: 'bg-amber-100 text-amber-800',
    full: 'bg-red-100 text-red-800',
};

interface Props {
    initialSuppliers: Supplier[];
    apiBase: string;
}

export default function SuppliersTable({ initialSuppliers, apiBase }: Props) {
    const [rows, setRows] = useState<Supplier[]>(initialSuppliers);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<EditRow>(EMPTY);
    const [adding, setAdding] = useState(false);
    const [newRow, setNewRow] = useState<EditRow>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [panelSupplier, setPanelSupplier] = useState<Supplier | null>(null);
    const [seasonStatuses, setSeasonStatuses] = useState<Map<string, CheckStatus>>(new Map());
    const [nextSeasonName, setNextSeasonName] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        const res = await fetch(`${apiBase}/api/suppliers`);
        if (res.ok) setRows(await res.json());
    }, [apiBase]);

    // Load season status badges on mount
    useEffect(() => {
        const season = getNextSeason(new Date());
        if (!season) return;
        setNextSeasonName(season.name);
        fetch(`${apiBase}/api/supplier-checks?season=${encodeURIComponent(season.name)}`)
            .then(r => r.ok ? r.json() : null)
            .then((data: { checks: Array<{ supplier_id: string; status: CheckStatus; check_date: string }> } | null) => {
                if (!data) return;
                // Build map: supplier_id → most restrictive status
                const map = new Map<string, CheckStatus>();
                for (const c of data.checks) {
                    const prev = map.get(c.supplier_id) ?? 'unverified';
                    // full > unverified > available
                    if (c.status === 'full' || prev === 'unverified' || (prev === 'available' && c.status !== 'full')) {
                        if (c.status === 'full') map.set(c.supplier_id, 'full');
                        else if (prev !== 'full') map.set(c.supplier_id, c.status);
                    }
                }
                setSeasonStatuses(map);
            })
            .catch(() => {});
    }, [apiBase]);

    const handleStatusChange = useCallback((supplierId: string, status: CheckStatus) => {
        setSeasonStatuses(prev => {
            const next = new Map(prev);
            const current = next.get(supplierId) ?? 'unverified';
            // Only update if new status is more restrictive or badge was unverified
            if (current === 'unverified' || status === 'full' || (status === 'available' && current !== 'full')) {
                next.set(supplierId, status);
            }
            return next;
        });
    }, []);

    const startEdit = (s: Supplier) => {
        setEditingId(s.id);
        setEditData({
            name: s.name,
            contact_email: s.contact_email,
            contact_whatsapp: s.contact_whatsapp,
            location: s.location,
            calendar_url: s.calendar_url ?? '',
        });
    };

    const cancelEdit = () => { setEditingId(null); setEditData(EMPTY); };

    const saveEdit = async (id: string) => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/suppliers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            setRows(rs => rs.map(r => r.id === id ? updated : r));
            setEditingId(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const addSupplier = async () => {
        if (!newRow.name.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/suppliers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRow),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            setRows(rs => [...rs, created]);
            setAdding(false);
            setNewRow(EMPTY);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteSupplier = async (id: string, name: string) => {
        if (!confirm(`Delete supplier "${name}"? This cannot be undone.`)) return;
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/suppliers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            setRows(rs => rs.filter(r => r.id !== id));
        } catch (e: any) {
            setError(e.message);
        }
    };

    const cell = 'px-4 py-2.5 text-sm';
    const input = 'w-full border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-slate-950/50';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{rows.length} suppliers</p>
                <div className="flex gap-2">
                    <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-700 rounded-lg hover:bg-slate-800/30">
                        <RefreshCw size={13} /> Refresh
                    </button>
                    <button
                        onClick={() => { setAdding(true); setEditingId(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-sky-500 to-purple-600 border-0 text-white rounded-lg hover:opacity-90"
                    >
                        <Plus size={14} /> Add Supplier
                    </button>
                </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

            <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/60 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-800/60 text-sm">
                    <thead className="bg-slate-800/30">
                        <tr>
                            {['Name', 'Email', 'WhatsApp', 'Location', nextSeasonName ? `${nextSeasonName} Status` : 'Season Status', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map(s => editingId === s.id ? (
                            <tr key={s.id} className="bg-blue-50">
                                <td className={cell}><input className={input} value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} /></td>
                                <td className={cell}><input className={input} value={editData.contact_email} onChange={e => setEditData(d => ({ ...d, contact_email: e.target.value }))} /></td>
                                <td className={cell}><input className={input} value={editData.contact_whatsapp} onChange={e => setEditData(d => ({ ...d, contact_whatsapp: e.target.value }))} /></td>
                                <td className={cell}><input className={input} value={editData.location} onChange={e => setEditData(d => ({ ...d, location: e.target.value }))} /></td>
                                <td className={cell}><input className={input} placeholder="https://…" value={editData.calendar_url ?? ''} onChange={e => setEditData(d => ({ ...d, calendar_url: e.target.value }))} /></td>
                                <td className={`${cell} whitespace-nowrap`}>
                                    <div className="flex gap-1">
                                        <button onClick={() => saveEdit(s.id)} disabled={saving} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"><Check size={12} />Save</button>
                                        <button onClick={cancelEdit} className="flex items-center gap-1 px-2 py-1 border border-slate-700 text-xs rounded hover:bg-slate-800/30"><X size={12} />Cancel</button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <tr key={s.id} className="hover:bg-slate-800/30">
                                <td className={`${cell} font-medium text-white`}>{s.name}</td>
                                <td className={`${cell} text-slate-400`}>{s.contact_email || '—'}</td>
                                <td className={`${cell} text-slate-400`}>{s.contact_whatsapp || '—'}</td>
                                <td className={`${cell} text-slate-400`}>{s.location || '—'}</td>
                                <td className={cell}>
                                    {(() => {
                                        const status = seasonStatuses.get(s.id) ?? 'unverified';
                                        return (
                                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[status]}`}>
                                                {STATUS_LABEL[status]}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className={`${cell} whitespace-nowrap`}>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setPanelSupplier(s)}
                                            className="flex items-center gap-1 p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                            title="Check Calendar"
                                        >
                                            <CalendarSearch size={14} />
                                        </button>
                                        <button onClick={() => startEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                                        <button onClick={() => deleteSupplier(s.id, s.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Add new row */}
                        {adding && (
                            <tr className="bg-green-50">
                                <td className={cell}><input className={input} placeholder="Supplier name*" value={newRow.name} onChange={e => setNewRow(d => ({ ...d, name: e.target.value }))} /></td>
                                <td className={cell}><input className={input} placeholder="email" value={newRow.contact_email} onChange={e => setNewRow(d => ({ ...d, contact_email: e.target.value }))} /></td>
                                <td className={cell}><input className={input} placeholder="+506…" value={newRow.contact_whatsapp} onChange={e => setNewRow(d => ({ ...d, contact_whatsapp: e.target.value }))} /></td>
                                <td className={cell}><input className={input} placeholder="City, Country" value={newRow.location} onChange={e => setNewRow(d => ({ ...d, location: e.target.value }))} /></td>
                                <td className={cell}><input className={input} placeholder="Calendar URL" value={newRow.calendar_url ?? ''} onChange={e => setNewRow(d => ({ ...d, calendar_url: e.target.value }))} /></td>
                                <td className={`${cell} whitespace-nowrap`}>
                                    <div className="flex gap-1">
                                        <button onClick={addSupplier} disabled={saving} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"><Check size={12} />Add</button>
                                        <button onClick={() => { setAdding(false); setNewRow(EMPTY); }} className="flex items-center gap-1 px-2 py-1 border border-slate-700 text-xs rounded hover:bg-slate-800/30"><X size={12} />Cancel</button>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {rows.length === 0 && !adding && (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No suppliers yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <SupplierCheckPanel
                supplier={panelSupplier}
                apiBase={apiBase}
                onClose={() => setPanelSupplier(null)}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}
