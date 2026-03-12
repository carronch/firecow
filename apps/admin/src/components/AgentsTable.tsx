import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, Check, X, Copy, Eye, EyeOff, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';

interface AgentKey {
    id: string;
    key_prefix: string;
    agent_name: string;
    agent_email: string | null;
    markup_pct: number | null;
    markup_fixed_cents: number | null;
    is_active: number;
    total_bookings: number;
    total_revenue: number;
    created_at: string;
    last_used_at: string | null;
}

interface Props {
    initialKeys: AgentKey[];
    agentApiBase: string;
    agentAdminKey: string;
}

interface NewKeyForm {
    agent_name: string;
    agent_email: string;
    markup_pct: string;
    markup_fixed_cents: string;
}

const EMPTY_FORM: NewKeyForm = {
    agent_name: '',
    agent_email: '',
    markup_pct: '',
    markup_fixed_cents: '',
};

export default function AgentsTable({ initialKeys, agentApiBase, agentAdminKey }: Props) {
    const [rows, setRows] = useState<AgentKey[]>(initialKeys);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<NewKeyForm>({ ...EMPTY_FORM });
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<NewKeyForm>>({});

    const authHeader = { Authorization: `Bearer ${agentAdminKey}` };

    const refresh = useCallback(async () => {
        try {
            const res = await fetch(`${agentApiBase}/admin/api-keys`, { headers: authHeader });
            if (res.ok) {
                const data = await res.json();
                setRows(data.keys ?? []);
            }
        } catch {}
    }, [agentApiBase, agentAdminKey]);

    const generateKey = async () => {
        if (!form.agent_name.trim()) { setError('Agent name is required'); return; }
        setSaving(true);
        setError(null);
        try {
            const body: Record<string, unknown> = { agent_name: form.agent_name };
            if (form.agent_email.trim()) body.agent_email = form.agent_email.trim();
            if (form.markup_pct.trim()) body.markup_pct = parseFloat(form.markup_pct) / 100;
            if (form.markup_fixed_cents.trim()) body.markup_fixed_cents = Math.round(parseFloat(form.markup_fixed_cents) * 100);

            const res = await fetch(`${agentApiBase}/admin/api-keys`, {
                method: 'POST',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setGeneratedKey(data.api_key);
            setForm({ ...EMPTY_FORM });
            await refresh();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (row: AgentKey) => {
        setEditingId(row.id);
        setEditForm({
            agent_name: row.agent_name,
            agent_email: row.agent_email ?? '',
            markup_pct: row.markup_pct != null ? String(Math.round(row.markup_pct * 100)) : '',
            markup_fixed_cents: row.markup_fixed_cents != null ? String(row.markup_fixed_cents / 100) : '',
        });
    };

    const saveEdit = async (id: string) => {
        setSaving(true);
        setError(null);
        try {
            const body: Record<string, unknown> = {};
            if (editForm.agent_name) body.agent_name = editForm.agent_name;
            if (editForm.agent_email !== undefined) body.agent_email = editForm.agent_email || null;
            body.markup_pct = editForm.markup_pct?.trim() ? parseFloat(editForm.markup_pct) / 100 : null;
            body.markup_fixed_cents = editForm.markup_fixed_cents?.trim() ? Math.round(parseFloat(editForm.markup_fixed_cents) * 100) : null;

            const res = await fetch(`${agentApiBase}/admin/api-keys/${id}`, {
                method: 'PUT',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await res.text());
            setEditingId(null);
            await refresh();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (row: AgentKey) => {
        try {
            const res = await fetch(`${agentApiBase}/admin/api-keys/${row.id}`, {
                method: 'PUT',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: row.is_active ? 0 : 1 }),
            });
            if (!res.ok) throw new Error(await res.text());
            setRows(rs => rs.map(r => r.id === row.id ? { ...r, is_active: r.is_active ? 0 : 1 } : r));
        } catch (e: any) {
            setError(e.message);
        }
    };

    const copyKey = async () => {
        if (!generatedKey) return;
        await navigator.clipboard.writeText(generatedKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const fmtMarkup = (row: AgentKey) => {
        const parts: string[] = [];
        if (row.markup_pct != null) parts.push(`${Math.round(row.markup_pct * 100)}%`);
        if (row.markup_fixed_cents != null) parts.push(`$${(row.markup_fixed_cents / 100).toFixed(0)} flat`);
        return parts.length ? parts.join(' + ') : '—';
    };

    const fmtRevenue = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
    const fmtDate = (iso: string | null) => iso ? iso.slice(0, 10) : '—';
    const inp = 'w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{rows.length} agent key{rows.length !== 1 ? 's' : ''}</p>
                <div className="flex gap-2">
                    <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        <RefreshCw size={13} /> Refresh
                    </button>
                    <button
                        onClick={() => { setAdding(a => !a); setError(null); setGeneratedKey(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={14} /> Generate Key
                    </button>
                </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

            {/* Generated key display */}
            {generatedKey && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                    <p className="text-sm font-semibold text-green-800">Key generated — save it now, it cannot be retrieved again.</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 font-mono text-xs bg-white border border-green-200 rounded px-3 py-2 break-all">{generatedKey}</code>
                        <button onClick={copyKey} className="flex items-center gap-1 px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap">
                            <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <button onClick={() => setGeneratedKey(null)} className="text-xs text-green-700 underline">Dismiss</button>
                </div>
            )}

            {/* New key form */}
            {adding && !generatedKey && (
                <div className="bg-white rounded-xl border-2 border-green-300 p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">New Agent Key</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <label className="block text-gray-500 mb-0.5">Agent Name*</label>
                            <input className={inp} placeholder="e.g. Airbnb Experiences" value={form.agent_name}
                                onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-0.5">Contact Email</label>
                            <input className={inp} type="email" placeholder="agent@example.com" value={form.agent_email}
                                onChange={e => setForm(f => ({ ...f, agent_email: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-0.5">Markup % (e.g. 15 for 15%)</label>
                            <input className={inp} type="number" min="0" step="0.1" placeholder="15" value={form.markup_pct}
                                onChange={e => setForm(f => ({ ...f, markup_pct: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-0.5">Fixed Fee USD (e.g. 25)</label>
                            <input className={inp} type="number" min="0" step="0.01" placeholder="25.00" value={form.markup_fixed_cents}
                                onChange={e => setForm(f => ({ ...f, markup_fixed_cents: e.target.value }))} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">Commission = MAX(base_price × %, fixed fee). Leave both blank for no markup.</p>
                    <div className="flex gap-2">
                        <button onClick={generateKey} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
                            <Check size={13} /> {saving ? 'Generating…' : 'Generate Key'}
                        </button>
                        <button onClick={() => { setAdding(false); setError(null); }}
                            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                            <X size={13} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Agent', 'Key Prefix', 'Markup', 'Bookings', 'Revenue', 'Last Used', 'Active', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No agent keys yet. Generate one above.</td></tr>
                        )}
                        {rows.map(row => (
                            <React.Fragment key={row.id}>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{row.agent_name}</div>
                                        {row.agent_email && <div className="text-gray-400 text-xs">{row.agent_email}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <code className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5">{row.key_prefix}…</code>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{fmtMarkup(row)}</td>
                                    <td className="px-4 py-3 text-gray-700 text-xs">{row.total_bookings.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-gray-700 text-xs">{fmtRevenue(row.total_revenue)}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(row.last_used_at)}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => toggleActive(row)}
                                            className={`flex items-center gap-1 text-xs ${row.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                            {row.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                            {row.is_active ? 'Active' : 'Off'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => editingId === row.id ? setEditingId(null) : startEdit(row)}
                                            className={`p-1.5 rounded ${editingId === row.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                                            <Pencil size={14} />
                                        </button>
                                    </td>
                                </tr>
                                {editingId === row.id && (
                                    <tr>
                                        <td colSpan={8} className="px-4 pb-3">
                                            <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg text-xs">
                                                <div>
                                                    <label className="block text-gray-500 mb-0.5">Agent Name</label>
                                                    <input className={inp} value={editForm.agent_name ?? ''} onChange={e => setEditForm(f => ({ ...f, agent_name: e.target.value }))} />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-500 mb-0.5">Contact Email</label>
                                                    <input className={inp} type="email" value={editForm.agent_email ?? ''} onChange={e => setEditForm(f => ({ ...f, agent_email: e.target.value }))} />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-500 mb-0.5">Markup % (e.g. 15)</label>
                                                    <input className={inp} type="number" min="0" step="0.1" value={editForm.markup_pct ?? ''} onChange={e => setEditForm(f => ({ ...f, markup_pct: e.target.value }))} />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-500 mb-0.5">Fixed Fee USD</label>
                                                    <input className={inp} type="number" min="0" step="0.01" value={editForm.markup_fixed_cents ?? ''} onChange={e => setEditForm(f => ({ ...f, markup_fixed_cents: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => saveEdit(row.id)} disabled={saving}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                                    <Check size={13} /> {saving ? 'Saving…' : 'Save'}
                                                </button>
                                                <button onClick={() => setEditingId(null)}
                                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
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
    );
}
