import React, { useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X, RefreshCw, Upload, ImageIcon } from 'lucide-react';

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
}

interface Supplier { id: string; name: string; }

type EditRow = Omit<Tour, 'id'>;

const EMPTY_TOUR: EditRow = {
    supplier_id: '', name: '', slug: '', type: 'catamaran', description: '',
    duration: '', max_capacity: 12, base_price: 0, high_season_price: 0,
    hero_image_url: '', gallery_images: '[]', is_active: 1,
};

const TOUR_TYPES = ['catamaran', 'fishing', 'snorkeling', 'diving', 'kayaking', 'adventure', 'other'];

interface Props {
    initialTours: Tour[];
    suppliers: Supplier[];
    apiBase: string;
}

export default function ToursTable({ initialTours, suppliers, apiBase }: Props) {
    const [rows, setRows] = useState<Tour[]>(initialTours);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<EditRow>(EMPTY_TOUR);
    const [adding, setAdding] = useState(false);
    const [newRow, setNewRow] = useState<EditRow>({ ...EMPTY_TOUR, supplier_id: suppliers[0]?.id ?? '' });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    const supplierName = (id: string) => suppliers.find(s => s.id === id)?.name ?? id;
    const fmtPrice = (cents: number) => `$${Math.round(Number(cents) / 100)}`;
    const inp = 'w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';
    const sel = `${inp} bg-white`;

    const EditFields = ({ data, onChange }: { data: EditRow; onChange: (d: EditRow) => void }) => (
        <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-lg text-xs">
            <div>
                <label className="block text-gray-500 mb-0.5">Name*</label>
                <input className={inp} value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} />
            </div>
            <div>
                <label className="block text-gray-500 mb-0.5">Slug*</label>
                <input className={inp} value={data.slug} onChange={e => onChange({ ...data, slug: e.target.value })} />
            </div>
            <div>
                <label className="block text-gray-500 mb-0.5">Supplier*</label>
                <select className={sel} value={data.supplier_id} onChange={e => onChange({ ...data, supplier_id: e.target.value })}>
                    <option value="">— select —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-gray-500 mb-0.5">Type</label>
                <select className={sel} value={data.type} onChange={e => onChange({ ...data, type: e.target.value })}>
                    {TOUR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-gray-500 mb-0.5">Duration</label>
                <input className={inp} placeholder="e.g. 6 Hours" value={data.duration} onChange={e => onChange({ ...data, duration: e.target.value })} />
            </div>
            <div>
                <label className="block text-gray-500 mb-0.5">Max Capacity</label>
                <input className={inp} type="number" value={data.max_capacity} onChange={e => onChange({ ...data, max_capacity: Number(e.target.value) })} />
            </div>
            <div>
                <label className="block text-gray-500 mb-0.5">Base Price (cents)</label>
                <input className={inp} type="number" value={data.base_price} onChange={e => onChange({ ...data, base_price: Number(e.target.value) })} />
            </div>
            <div>
                <label className="block text-gray-500 mb-0.5">High Season Price (cents)</label>
                <input className={inp} type="number" value={data.high_season_price} onChange={e => onChange({ ...data, high_season_price: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
                <label className="block text-gray-500 mb-0.5">Hero Image</label>
                <div className="flex gap-2 items-center">
                    <input className={`${inp} flex-1`} placeholder="https://…" value={data.hero_image_url}
                        onChange={e => onChange({ ...data, hero_image_url: e.target.value })} />
                    <button type="button"
                        onClick={() => (data === editData ? fileRef : newFileRef).current?.click()}
                        className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 whitespace-nowrap"
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
                <label className="block text-gray-500 mb-0.5">Description</label>
                <textarea className={inp} rows={2} value={data.description} onChange={e => onChange({ ...data, description: e.target.value })} />
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
                <p className="text-sm text-gray-500">{rows.length} tours</p>
                <div className="flex gap-2">
                    <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        <RefreshCw size={13} /> Refresh
                    </button>
                    <button
                        onClick={() => { setAdding(true); setEditingId(null); setNewRow({ ...EMPTY_TOUR, supplier_id: suppliers[0]?.id ?? '' }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={14} /> Add Tour
                    </button>
                </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

            <div className="space-y-2">
                {/* Add new row form */}
                {adding && (
                    <div className="bg-white rounded-xl border-2 border-green-300 p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">New Tour</p>
                        <EditFields data={newRow} onChange={setNewRow} />
                        <div className="flex gap-2 mt-3">
                            <button onClick={addTour} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
                                <Check size={13} /> {saving ? 'Adding…' : 'Add Tour'}
                            </button>
                            <button onClick={() => { setAdding(false); setError(null); }} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                                <X size={13} /> Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {['', 'Name', 'Supplier', 'Type', 'Duration', 'Base', 'Active', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 && !adding && (
                                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No tours yet.</td></tr>
                            )}
                            {rows.map(t => (
                                <React.Fragment key={t.id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-3 py-2 w-12">
                                            {t.hero_image_url
                                                ? <img src={t.hero_image_url} alt="" className="h-9 w-12 object-cover rounded" />
                                                : <div className="h-9 w-12 bg-gray-100 rounded flex items-center justify-center"><ImageIcon size={14} className="text-gray-400" /></div>
                                            }
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-gray-900">{t.name}</div>
                                            <div className="text-gray-400 text-xs">{t.slug}</div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 text-xs">{supplierName(t.supplier_id)}</td>
                                        <td className="px-4 py-2 text-gray-600 text-xs capitalize">{t.type}</td>
                                        <td className="px-4 py-2 text-gray-600 text-xs">{t.duration || '—'}</td>
                                        <td className="px-4 py-2 text-gray-900 text-xs">{fmtPrice(t.base_price)}</td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => toggleActive(t)}
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                                {t.is_active ? 'Active' : 'Off'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="flex gap-1">
                                                <button onClick={() => editingId === t.id ? cancelEdit() : startEdit(t)} className={`p-1.5 rounded ${editingId === t.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}><Pencil size={14} /></button>
                                                <button onClick={() => deleteTour(t.id, t.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                    {editingId === t.id && (
                                        <tr>
                                            <td colSpan={8} className="px-4 pb-3">
                                                <EditFields data={editData} onChange={setEditData} />
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => saveEdit(t.id)} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                                        <Check size={13} /> {saving ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
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
