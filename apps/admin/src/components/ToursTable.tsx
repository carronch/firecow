import React, { useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X, RefreshCw, Upload, ImageIcon, CalendarDays, ChevronLeft, ChevronRight, Lock, Unlock } from 'lucide-react';

interface Tour {
    id: string;
    supplier_id: string;
    name: string;
    slug: string;
    type: string;
    description: string;
    duration: string;
    max_capacity: number;
    base_price: number;
    high_season_price: number;
    hero_image_url: string;
    gallery_images: string;
    is_active: number;
    name_es?: string;
    description_es?: string;
    duration_es?: string;
}

interface Supplier { id: string; name: string; }

interface TourAvailability {
    id: string;
    tour_id: string;
    date: string;
    time_slot: string | null;
    slots_total: number;
    slots_booked: number;
    price_override: number | null;
    is_blocked: number;
}

type EditRow = Omit<Tour, 'id'>;

const EMPTY_TOUR: EditRow = {
    supplier_id: '', name: '', slug: '', type: 'catamaran', description: '',
    duration: '', max_capacity: 12, base_price: 0, high_season_price: 0,
    hero_image_url: '', gallery_images: '[]', is_active: 1,
    name_es: '', description_es: '', duration_es: '',
};

const TOUR_TYPES = ['catamaran', 'fishing', 'snorkeling', 'diving', 'kayaking', 'adventure', 'other'];

interface Props {
    initialTours: Tour[];
    suppliers: Supplier[];
    apiBase: string;
    agentApiBase: string;
    agentAdminKey: string;
}

// ── Availability panel ──────────────────────────────────────────────────────

interface AvailabilityPanelProps {
    tour: Tour;
    agentApiBase: string;
    agentAdminKey: string;
}

function AvailabilityPanel({ tour, agentApiBase, agentAdminKey }: AvailabilityPanelProps) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
    const [rows, setRows] = useState<TourAvailability[]>([]);
    const [loading, setLoading] = useState(false);
    const [panelError, setPanelError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [saving, setSaving] = useState(false);

    // New-slot form state
    const [newDate, setNewDate] = useState('');
    const [newTimeSlot, setNewTimeSlot] = useState('');
    const [newSlotsTotal, setNewSlotsTotal] = useState(tour.max_capacity || 12);
    const [newPriceOverride, setNewPriceOverride] = useState('');

    const authHeader = { Authorization: `Bearer ${agentAdminKey}` };

    const loadMonth = useCallback(async (y: number, m: number) => {
        setLoading(true);
        setPanelError(null);
        try {
            const pad = String(m).padStart(2, '0');
            const res = await fetch(
                `${agentApiBase}/admin/availability?tour_id=${tour.id}&month=${y}-${pad}`,
                { headers: authHeader }
            );
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setRows(data.availability ?? []);
        } catch (e: any) {
            setPanelError(e.message);
        } finally {
            setLoading(false);
        }
    }, [tour.id, agentApiBase, agentAdminKey]);

    // Load on mount
    React.useEffect(() => { loadMonth(year, month); }, []);

    const prevMonth = () => {
        const [ny, nm] = month === 1 ? [year - 1, 12] : [year, month - 1];
        setYear(ny); setMonth(nm); loadMonth(ny, nm);
    };
    const nextMonth = () => {
        const [ny, nm] = month === 12 ? [year + 1, 1] : [year, month + 1];
        setYear(ny); setMonth(nm); loadMonth(ny, nm);
    };

    const addSlots = async () => {
        if (!newDate) { setPanelError('Date is required'); return; }
        setSaving(true);
        setPanelError(null);
        try {
            const body = {
                tour_id: tour.id,
                date: newDate,
                time_slot: newTimeSlot.trim() || null,
                slots_total: newSlotsTotal,
                price_override: newPriceOverride ? Math.round(parseFloat(newPriceOverride) * 100) : null,
            };
            const res = await fetch(`${agentApiBase}/admin/availability/bulk`, {
                method: 'POST',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify({ slots: [body] }),
            });
            if (!res.ok) throw new Error(await res.text());
            setAdding(false);
            setNewDate(''); setNewTimeSlot(''); setNewSlotsTotal(tour.max_capacity || 12); setNewPriceOverride('');
            loadMonth(year, month);
        } catch (e: any) {
            setPanelError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleBlocked = async (row: TourAvailability) => {
        try {
            const res = await fetch(`${agentApiBase}/admin/availability/${row.id}`, {
                method: 'PUT',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_blocked: row.is_blocked ? 0 : 1 }),
            });
            if (!res.ok) throw new Error(await res.text());
            setRows(rs => rs.map(r => r.id === row.id ? { ...r, is_blocked: r.is_blocked ? 0 : 1 } : r));
        } catch (e: any) {
            setPanelError(e.message);
        }
    };

    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const fmtPrice = (cents: number | null) => cents != null ? `$${(cents / 100).toFixed(0)}` : '—';
    const inp = 'border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-slate-950/50';

    return (
        <div className="p-4 bg-amber-50 border-t border-amber-100 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-1 rounded hover:bg-amber-100"><ChevronLeft size={14} /></button>
                    <span className="text-sm font-semibold text-slate-300 w-36 text-center">{monthName}</span>
                    <button onClick={nextMonth} className="p-1 rounded hover:bg-amber-100"><ChevronRight size={14} /></button>
                </div>
                <button
                    onClick={() => { setAdding(a => !a); setPanelError(null); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                    <Plus size={12} /> Add Slot
                </button>
            </div>

            {panelError && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{panelError}</div>}

            {/* Add slot form */}
            {adding && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/40 backdrop-blur-md border border-amber-200 rounded-lg text-xs">
                    <div>
                        <label className="block text-slate-400 mb-0.5">Date*</label>
                        <input type="date" className={`${inp} w-full`} value={newDate} onChange={e => setNewDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-0.5">Time Slot (optional)</label>
                        <input className={`${inp} w-full`} placeholder="e.g. 09:00" value={newTimeSlot} onChange={e => setNewTimeSlot(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-0.5">Slots Total</label>
                        <input type="number" className={`${inp} w-full`} value={newSlotsTotal} min={1} onChange={e => setNewSlotsTotal(Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-0.5">Price Override (USD, optional)</label>
                        <input className={`${inp} w-full`} placeholder="e.g. 350" value={newPriceOverride} onChange={e => setNewPriceOverride(e.target.value)} />
                    </div>
                    <div className="col-span-2 flex gap-2 mt-1">
                        <button onClick={addSlots} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                            <Check size={12} /> {saving ? 'Saving…' : 'Save Slot'}
                        </button>
                        <button onClick={() => { setAdding(false); setPanelError(null); }} className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 rounded hover:bg-slate-800/30">
                            <X size={12} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Availability table */}
            {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">Loading…</p>
            ) : rows.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No availability slots for this month.</p>
            ) : (
                <table className="min-w-full text-xs border-collapse">
                    <thead>
                        <tr className="text-slate-400">
                            <th className="text-left pb-1 pr-4 font-medium">Date</th>
                            <th className="text-left pb-1 pr-4 font-medium">Time</th>
                            <th className="text-right pb-1 pr-4 font-medium">Available</th>
                            <th className="text-right pb-1 pr-4 font-medium">Total</th>
                            <th className="text-right pb-1 pr-4 font-medium">Price</th>
                            <th className="text-center pb-1 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                        {rows.map(row => (
                            <tr key={row.id} className={row.is_blocked ? 'opacity-50' : ''}>
                                <td className="py-1 pr-4 font-medium text-slate-200">{row.date}</td>
                                <td className="py-1 pr-4 text-slate-400">{row.time_slot ?? 'All day'}</td>
                                <td className="py-1 pr-4 text-right text-slate-200">{row.slots_total - row.slots_booked}</td>
                                <td className="py-1 pr-4 text-right text-slate-400">{row.slots_total}</td>
                                <td className="py-1 pr-4 text-right text-slate-400">{fmtPrice(row.price_override)}</td>
                                <td className="py-1 text-center">
                                    <button
                                        onClick={() => toggleBlocked(row)}
                                        title={row.is_blocked ? 'Unblock' : 'Block'}
                                        className={`p-1 rounded ${row.is_blocked ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                    >
                                        {row.is_blocked ? <Lock size={12} /> : <Unlock size={12} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ToursTable({ initialTours, suppliers, apiBase, agentApiBase, agentAdminKey }: Props) {
    const [rows, setRows] = useState<Tour[]>(initialTours);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<EditRow>(EMPTY_TOUR);
    const [adding, setAdding] = useState(false);
    const [newRow, setNewRow] = useState<EditRow>({ ...EMPTY_TOUR, supplier_id: suppliers[0]?.id ?? '' });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availabilityTourId, setAvailabilityTourId] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const newFileRef = useRef<HTMLInputElement>(null);

    const refresh = useCallback(async () => {
        const res = await fetch(`${apiBase}/api/tours`);
        if (res.ok) setRows(await res.json());
    }, [apiBase]);

    const uploadImage = async (file: File, onUrl: (url: string) => void) => {
        setUploading(true);
        setError(null);
        try {
            const key = `tours/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            const res = await fetch(`${apiBase}/api/upload?key=${encodeURIComponent(key)}`, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!res.ok) throw new Error('Upload failed');
            const { url } = await res.json();
            onUrl(url);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUploading(false);
        }
    };

    const startEdit = (t: Tour) => {
        setEditingId(t.id);
        setEditData({ ...t });
        setAvailabilityTourId(null);
    };

    const cancelEdit = () => { setEditingId(null); setEditData(EMPTY_TOUR); };

    const saveEdit = async (id: string) => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/tours/${id}`, {
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

    const addTour = async () => {
        if (!newRow.name.trim() || !newRow.slug.trim() || !newRow.supplier_id) {
            setError('Name, slug, and supplier are required.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/tours`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRow),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            setRows(rs => [...rs, created]);
            setAdding(false);
            setNewRow({ ...EMPTY_TOUR, supplier_id: suppliers[0]?.id ?? '' });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (t: Tour) => {
        const next = t.is_active ? 0 : 1;
        try {
            const res = await fetch(`${apiBase}/api/tours/${t.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: next }),
            });
            if (!res.ok) throw new Error(await res.text());
            setRows(rs => rs.map(r => r.id === t.id ? { ...r, is_active: next } : r));
        } catch (e: any) {
            setError(e.message);
        }
    };

    const deleteTour = async (id: string, name: string) => {
        if (!confirm(`Delete tour "${name}"?`)) return;
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/tours/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            setRows(rs => rs.filter(r => r.id !== id));
        } catch (e: any) {
            setError(e.message);
        }
    };

    const toggleAvailability = (id: string) => {
        setAvailabilityTourId(av => av === id ? null : id);
        setEditingId(null);
    };

    const supplierName = (id: string) => suppliers.find(s => s.id === id)?.name ?? id;
    const fmtPrice = (cents: number) => `$${Math.round(Number(cents) / 100)}`;
    const inp = 'w-full border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-slate-950/50';
    const sel = `${inp} bg-slate-900/40 backdrop-blur-md`;

    const EditFields = ({ data, onChange }: { data: EditRow; onChange: (d: EditRow) => void }) => (
        <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-lg text-xs">
            <div>
                <label className="block text-slate-400 mb-0.5">Name*</label>
                <input className={inp} value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Name (ES)</label>
                <input className={inp} value={data.name_es || ''} onChange={e => onChange({ ...data, name_es: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Slug*</label>
                <input className={inp} value={data.slug} onChange={e => onChange({ ...data, slug: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Supplier*</label>
                <select className={sel} value={data.supplier_id} onChange={e => onChange({ ...data, supplier_id: e.target.value })}>
                    <option value="">— select —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Type</label>
                <select className={sel} value={data.type} onChange={e => onChange({ ...data, type: e.target.value })}>
                    {TOUR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Duration</label>
                <input className={inp} placeholder="e.g. 6 Hours" value={data.duration} onChange={e => onChange({ ...data, duration: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Duration (ES)</label>
                <input className={inp} placeholder="e.g. 6 Horas" value={data.duration_es || ''} onChange={e => onChange({ ...data, duration_es: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Max Capacity</label>
                <input className={inp} type="number" value={data.max_capacity} onChange={e => onChange({ ...data, max_capacity: Number(e.target.value) })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Base Price (cents)</label>
                <input className={inp} type="number" value={data.base_price} onChange={e => onChange({ ...data, base_price: Number(e.target.value) })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">High Season Price (cents)</label>
                <input className={inp} type="number" value={data.high_season_price} onChange={e => onChange({ ...data, high_season_price: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
                <label className="block text-slate-400 mb-0.5">Hero Image</label>
                <div className="flex gap-2 items-center">
                    <input className={`${inp} flex-1`} placeholder="https://…" value={data.hero_image_url}
                        onChange={e => onChange({ ...data, hero_image_url: e.target.value })} />
                    <button type="button"
                        onClick={() => (data === editData ? fileRef : newFileRef).current?.click()}
                        className="flex items-center gap-1 px-2 py-1 border border-slate-700 rounded text-xs hover:bg-slate-800/30 whitespace-nowrap"
                        disabled={uploading}
                    >
                        <Upload size={12} /> {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                </div>
                {data.hero_image_url && (
                    <img src={data.hero_image_url} alt="" className="mt-1.5 h-12 w-20 object-cover rounded border" />
                )}
            </div>
            <div className="col-span-2">
                <label className="block text-slate-400 mb-0.5">Description</label>
                <textarea className={inp} rows={2} value={data.description} onChange={e => onChange({ ...data, description: e.target.value })} />
            </div>
            <div className="col-span-2">
                <label className="block text-slate-400 mb-0.5">Description (ES)</label>
                <textarea className={inp} rows={2} value={data.description_es || ''} onChange={e => onChange({ ...data, description_es: e.target.value })} />
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, url => setEditData(d => ({ ...d, hero_image_url: url }))); e.target.value = ''; }} />
            <input ref={newFileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, url => setNewRow(d => ({ ...d, hero_image_url: url }))); e.target.value = ''; }} />

            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{rows.length} tours</p>
                <div className="flex gap-2">
                    <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-700 rounded-lg hover:bg-slate-800/30">
                        <RefreshCw size={13} /> Refresh
                    </button>
                    <button
                        onClick={() => { setAdding(true); setEditingId(null); setNewRow({ ...EMPTY_TOUR, supplier_id: suppliers[0]?.id ?? '' }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-sky-500 to-purple-600 border-0 text-white rounded-lg hover:opacity-90"
                    >
                        <Plus size={14} /> Add Tour
                    </button>
                </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

            <div className="space-y-2">
                {/* Add new row form */}
                {adding && (
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border-2 border-green-300 p-4">
                        <p className="text-sm font-semibold text-slate-300 mb-3">New Tour</p>
                        <EditFields data={newRow} onChange={setNewRow} />
                        <div className="flex gap-2 mt-3">
                            <button onClick={addTour} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
                                <Check size={13} /> {saving ? 'Adding…' : 'Add Tour'}
                            </button>
                            <button onClick={() => { setAdding(false); setError(null); }} className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 text-sm rounded-lg hover:bg-slate-800/30">
                                <X size={13} /> Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/60 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-800/60 text-sm">
                        <thead className="bg-slate-800/30">
                            <tr>
                                {['', 'Name', 'Supplier', 'Type', 'Duration', 'Base', 'Active', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 && !adding && (
                                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No tours yet.</td></tr>
                            )}
                            {rows.map(t => (
                                <React.Fragment key={t.id}>
                                    <tr className="hover:bg-slate-800/30">
                                        <td className="px-3 py-2 w-12">
                                            {t.hero_image_url
                                                ? <img src={t.hero_image_url} alt="" className="h-9 w-12 object-cover rounded" />
                                                : <div className="h-9 w-12 bg-gray-100 rounded flex items-center justify-center"><ImageIcon size={14} className="text-gray-400" /></div>
                                            }
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-white">{t.name}</div>
                                            <div className="text-gray-400 text-xs">{t.slug}</div>
                                        </td>
                                        <td className="px-4 py-2 text-slate-400 text-xs">{supplierName(t.supplier_id)}</td>
                                        <td className="px-4 py-2 text-slate-400 text-xs capitalize">{t.type}</td>
                                        <td className="px-4 py-2 text-slate-400 text-xs">{t.duration || '—'}</td>
                                        <td className="px-4 py-2 text-white text-xs">{fmtPrice(t.base_price)}</td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => toggleActive(t)}
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-slate-400'}`}
                                            >
                                                {t.is_active ? 'Active' : 'Off'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => toggleAvailability(t.id)}
                                                    title="Manage Availability"
                                                    className={`p-1.5 rounded ${availabilityTourId === t.id ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                                >
                                                    <CalendarDays size={14} />
                                                </button>
                                                <button onClick={() => editingId === t.id ? cancelEdit() : startEdit(t)} className={`p-1.5 rounded ${editingId === t.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}><Pencil size={14} /></button>
                                                <button onClick={() => deleteTour(t.id, t.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                    {availabilityTourId === t.id && (
                                        <tr>
                                            <td colSpan={8} className="p-0">
                                                <AvailabilityPanel
                                                    tour={t}
                                                    agentApiBase={agentApiBase}
                                                    agentAdminKey={agentAdminKey}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                    {editingId === t.id && (
                                        <tr>
                                            <td colSpan={8} className="px-4 pb-3">
                                                <EditFields data={editData} onChange={setEditData} />
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => saveEdit(t.id)} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-purple-600 border-0 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
                                                        <Check size={13} /> {saving ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 text-sm rounded-lg hover:bg-slate-800/30">
                                                        <X size={13} /> Cancel
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
