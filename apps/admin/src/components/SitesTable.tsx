import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, Zap, Pencil, Check, X, Globe, Copy, Phone, ShieldCheck } from 'lucide-react';
import GbpLaunchKit from './GbpLaunchKit';

interface Site {
    id: string;
    slug: string;
    domain: string;
    cf_project_name: string;
    cf_deploy_hook: string;
    supplier_id: string;
    tour_ids: string;
    tagline: string;
    primary_color: string;
    meta_title: string;
    meta_description: string;
    whatsapp_number: string;
    twilio_number: string;
    is_live: number;
    tagline_es?: string;
    meta_title_es?: string;
    meta_description_es?: string;
}

interface Supplier { id: string; name: string; }

const EMPTY_SITE = {
    slug: '', domain: '', cf_project_name: '', cf_deploy_hook: '',
    supplier_id: '', tour_ids: '[]', tagline: '', primary_color: '#0ea5e9',
    meta_title: '', meta_description: '', whatsapp_number: '', twilio_number: '', is_live: 0,
    tagline_es: '', meta_title_es: '', meta_description_es: '',
};

interface Props {
    initialSites: Site[];
    suppliers: Supplier[];
    apiBase: string;
}

export default function SitesTable({ initialSites, suppliers, apiBase }: Props) {
    const [sites, setSites] = useState<Site[]>(initialSites);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<typeof EMPTY_SITE>(EMPTY_SITE);
    const [showCreate, setShowCreate] = useState(false);
    const [newSite, setNewSite] = useState({ ...EMPTY_SITE, supplier_id: suppliers[0]?.id ?? '' });
    const [saving, setSaving] = useState(false);
    const [deploying, setDeploying] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deployMsg, setDeployMsg] = useState<string | null>(null);
    // Track sites saved but not yet deployed
    const [pendingDeploy, setPendingDeploy] = useState<Set<string>>(new Set());

    // Twilio & GBP State
    const [provisioningSite, setProvisioningSite] = useState<string | null>(null);
    const [provisionCountry, setProvisionCountry] = useState('CR');
    const [provisioning, setProvisioning] = useState(false);
    const [showGbpKit, setShowGbpKit] = useState<Site | null>(null);

    const refresh = useCallback(async () => {
        const res = await fetch(`${apiBase}/api/sites`);
        if (res.ok) setSites(await res.json());
    }, [apiBase]);

    const triggerDeploy = async (site: Site) => {
        if (!site.cf_deploy_hook) {
            setError(`No deploy hook set for "${site.slug}".`);
            return;
        }
        if (!confirm(`Trigger a rebuild for "${site.slug}"?`)) return;
        setDeploying(site.id);
        setDeployMsg(null);
        setError(null);
        try {
            const res = await fetch(site.cf_deploy_hook, { method: 'POST' });
            if (res.ok) {
                setDeployMsg(`Rebuild triggered for ${site.slug}!`);
                setPendingDeploy(prev => { const n = new Set(prev); n.delete(site.id); return n; });
            } else {
                setDeployMsg(`Deploy hook returned ${res.status}`);
            }
        } catch (e: any) {
            setError(`Deploy failed: ${e.message}`);
        } finally {
            setDeploying(null);
        }
    };

    const provisionTwilioNumber = async (siteId: string) => {
        setProvisioning(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/twilio/provision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ site_id: siteId, countryCode: provisionCountry }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setSites(ss => ss.map(s => s.id === siteId ? { ...s, twilio_number: data.twilio_number } : s));
            setProvisioningSite(null);
        } catch (e: any) {
            setError('Provision failed: ' + e.message);
        } finally {
            setProvisioning(false);
        }
    };

    const startEdit = (s: Site) => {
        setEditingId(s.id);
        setEditData({
            slug: s.slug, domain: s.domain, cf_project_name: s.cf_project_name,
            cf_deploy_hook: s.cf_deploy_hook, supplier_id: s.supplier_id,
            tour_ids: s.tour_ids, tagline: s.tagline, primary_color: s.primary_color,
            meta_title: s.meta_title, meta_description: s.meta_description,
            whatsapp_number: s.whatsapp_number, twilio_number: s.twilio_number || '', is_live: s.is_live,
            tagline_es: s.tagline_es || '', meta_title_es: s.meta_title_es || '', meta_description_es: s.meta_description_es || '',
        });
    };

    const saveEdit = async (id: string) => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/sites/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            setSites(ss => ss.map(s => s.id === id ? updated : s));
            setEditingId(null);
            setPendingDeploy(prev => new Set([...prev, id]));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const createSite = async () => {
        if (!newSite.slug.trim()) { setError('Slug is required.'); return; }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/sites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSite),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            setSites(ss => [...ss, created]);
            setShowCreate(false);
            setNewSite({ ...EMPTY_SITE, supplier_id: suppliers[0]?.id ?? '' });
            setPendingDeploy(prev => new Set([...prev, created.id]));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const duplicateSite = async (s: Site) => {
        setSaving(true);
        setError(null);
        try {
            const { id: _id, ...rest } = s as any;
            const res = await fetch(`${apiBase}/api/sites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...rest, slug: `${s.slug}-copy`, is_live: 0, cf_deploy_hook: '' }),
            });
            if (!res.ok) throw new Error(await res.text());
            const created = await res.json();
            setSites(ss => [...ss, created]);
            // Open edit immediately so user can set the correct slug
            startEdit(created);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleLive = async (s: Site) => {
        const next = s.is_live ? 0 : 1;
        try {
            const res = await fetch(`${apiBase}/api/sites/${s.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_live: next }),
            });
            if (!res.ok) throw new Error(await res.text());
            setSites(ss => ss.map(r => r.id === s.id ? { ...r, is_live: next } : r));
        } catch (e: any) {
            setError(e.message);
        }
    };

    const supplierName = (id: string) => suppliers.find(s => s.id === id)?.name ?? id;
    const inp = 'w-full border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-slate-950/50';
    const sel = `${inp} bg-slate-900/40 backdrop-blur-md`;

    const SiteForm = ({ data, onChange }: { data: typeof EMPTY_SITE; onChange: (d: typeof EMPTY_SITE) => void }) => (
        <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
                <label className="block text-slate-400 mb-0.5">Slug*</label>
                <input className={inp} placeholder="isla-tortuga-costa-rica" value={data.slug} onChange={e => onChange({ ...data, slug: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Domain</label>
                <input className={inp} placeholder="mysite.com" value={data.domain} onChange={e => onChange({ ...data, domain: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Supplier</label>
                <select className={sel} value={data.supplier_id} onChange={e => onChange({ ...data, supplier_id: e.target.value })}>
                    <option value="">— none —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">CF Project Name</label>
                <input className={inp} placeholder="my-cf-pages-project" value={data.cf_project_name} onChange={e => onChange({ ...data, cf_project_name: e.target.value })} />
            </div>
            <div className="col-span-2">
                <label className="block text-slate-400 mb-0.5">CF Deploy Hook URL</label>
                <input className={inp} placeholder="https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/…" value={data.cf_deploy_hook} onChange={e => onChange({ ...data, cf_deploy_hook: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Tagline</label>
                <input className={inp} placeholder="Your adventure starts here" value={data.tagline} onChange={e => onChange({ ...data, tagline: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Tagline (ES)</label>
                <input className={inp} placeholder="Tu aventura comienza aquí" value={data.tagline_es || ''} onChange={e => onChange({ ...data, tagline_es: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">WhatsApp Number</label>
                <input className={inp} placeholder="+50612345678" value={data.whatsapp_number} onChange={e => onChange({ ...data, whatsapp_number: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Primary Color</label>
                <div className="flex gap-1 items-center">
                    <input type="color" value={data.primary_color} onChange={e => onChange({ ...data, primary_color: e.target.value })} className="h-7 w-10 border rounded cursor-pointer" />
                    <input className={`${inp} flex-1`} value={data.primary_color} onChange={e => onChange({ ...data, primary_color: e.target.value })} />
                </div>
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Meta Title</label>
                <input className={inp} value={data.meta_title} onChange={e => onChange({ ...data, meta_title: e.target.value })} />
            </div>
            <div>
                <label className="block text-slate-400 mb-0.5">Meta Title (ES)</label>
                <input className={inp} value={data.meta_title_es || ''} onChange={e => onChange({ ...data, meta_title_es: e.target.value })} />
            </div>
            <div className="col-span-2">
                <label className="block text-slate-400 mb-0.5">Meta Description</label>
                <textarea className={inp} rows={2} value={data.meta_description} onChange={e => onChange({ ...data, meta_description: e.target.value })} />
            </div>
            <div className="col-span-2">
                <label className="block text-slate-400 mb-0.5">Meta Description (ES)</label>
                <textarea className={inp} rows={2} value={data.meta_description_es || ''} onChange={e => onChange({ ...data, meta_description_es: e.target.value })} />
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{sites.length} sites</p>
                <div className="flex gap-2">
                    <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-700 rounded-lg hover:bg-slate-800/30">
                        <RefreshCw size={13} /> Refresh
                    </button>
                    <button onClick={() => { setShowCreate(true); setEditingId(null); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-sky-500 to-purple-600 border-0 text-white rounded-lg hover:opacity-90">
                        <Plus size={14} /> New Site
                    </button>
                </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
            {deployMsg && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{deployMsg}</div>}

            {/* Create form */}
            {showCreate && (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border-2 border-blue-300 p-5">
                    <p className="text-sm font-semibold text-slate-300 mb-3">Create New Site</p>
                    <SiteForm data={newSite} onChange={setNewSite} />
                    <div className="flex gap-2 mt-3">
                        <button onClick={createSite} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-purple-600 border-0 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
                            <Check size={13} /> {saving ? 'Creating…' : 'Create Site'}
                        </button>
                        <button onClick={() => { setShowCreate(false); setError(null); }} className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 text-sm rounded-lg hover:bg-slate-800/30">
                            <X size={13} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {sites.length === 0 && !showCreate && (
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/60 p-10 text-center text-gray-400">No sites yet.</div>
                )}
                {sites.map(s => {
                    const needsDeploy = pendingDeploy.has(s.id);
                    return (
                        <div key={s.id} className={`bg-slate-900/40 backdrop-blur-md rounded-xl border overflow-hidden ${needsDeploy ? 'border-amber-300' : 'border-slate-800/60'}`}>
                            <div className="flex items-center gap-4 px-5 py-3">
                                <div style={{ background: s.primary_color || '#0ea5e9' }} className="w-3 h-3 rounded-full flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-white">{s.slug}</span>
                                        <button onClick={() => toggleLive(s)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-slate-400'}`}>
                                            {s.is_live ? 'Live' : 'Staging'}
                                        </button>
                                        {needsDeploy && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse inline-block" />
                                                Deploy needed
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-0.5 flex items-center gap-3">
                                        {s.domain && <span className="flex items-center gap-1"><Globe size={10} />{s.domain}</span>}
                                        {s.twilio_number && <span className="flex items-center gap-1 text-green-400"><Phone size={10} />{s.twilio_number}</span>}
                                        <span>{supplierName(s.supplier_id)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => { setProvisioningSite(s.id); setEditingId(null); }}
                                        disabled={!!s.twilio_number}
                                        title={s.twilio_number ? `Number provisioned: ${s.twilio_number}` : 'Provision Twilio Number'}
                                        className={`p-1.5 rounded disabled:opacity-40 transition-colors ${
                                            provisioningSite === s.id ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                        }`}
                                    >
                                        <Phone size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowGbpKit(s)}
                                        title="Generate GBP Launch Kit"
                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    >
                                        <ShieldCheck size={14} />
                                    </button>
                                    <button
                                        onClick={() => triggerDeploy(s)}
                                        disabled={deploying === s.id || !s.cf_deploy_hook}
                                        title={s.cf_deploy_hook ? 'Trigger rebuild' : 'No deploy hook set'}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-lg disabled:opacity-40 transition-colors ${
                                            needsDeploy && s.cf_deploy_hook
                                                ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'
                                                : 'border-slate-700 hover:bg-slate-800/30'
                                        }`}
                                    >
                                        <Zap size={12} className={deploying === s.id ? 'animate-pulse text-yellow-300' : needsDeploy ? '' : ''} />
                                        {deploying === s.id ? 'Deploying…' : 'Deploy'}
                                    </button>
                                    <button
                                        onClick={() => duplicateSite(s)}
                                        disabled={saving}
                                        title="Duplicate site"
                                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-40"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        onClick={() => editingId === s.id ? setEditingId(null) : startEdit(s)}
                                        className={`p-1.5 rounded ${editingId === s.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                    >
                                        <Pencil size={14} />
                                    </button>
                                </div>
                            </div>

                            {editingId === s.id && (
                                <div className="border-t border-slate-800/60 px-5 py-4 bg-blue-50">
                                    <SiteForm data={editData} onChange={setEditData} />
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => saveEdit(s.id)} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-purple-600 border-0 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
                                            <Check size={13} /> {saving ? 'Saving…' : 'Save'}
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 text-sm rounded-lg hover:bg-slate-800/30 bg-slate-900/40 backdrop-blur-md">
                                            <X size={13} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {provisioningSite === s.id && (
                                <div className="border-t border-slate-800/60 px-5 py-4 bg-slate-900/60 backdrop-blur">
                                    <p className="text-sm font-semibold text-slate-300 mb-2">Provision Local Virtual Number via Twilio</p>
                                    <p className="text-xs text-slate-400 mb-3">Select the country of this supplier to provision a localized number.</p>
                                    <div className="flex gap-2 items-center">
                                        <select 
                                            className={`${sel} w-auto`}
                                            value={provisionCountry} 
                                            onChange={e => setProvisionCountry(e.target.value)}
                                        >
                                            <option value="CR">Costa Rica (+506)</option>
                                            <option value="US">United States (+1)</option>
                                            <option value="MX">Mexico (+52)</option>
                                            <option value="PA">Panama (+507)</option>
                                        </select>
                                        <button onClick={() => provisionTwilioNumber(s.id)} disabled={provisioning} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
                                            <Phone size={13} /> {provisioning ? 'Purchasing API...' : 'Purchase Number'}
                                        </button>
                                        <button onClick={() => setProvisioningSite(null)} className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 text-sm rounded-lg hover:bg-slate-800/30 text-white">
                                            <X size={13} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* GBP Launch Kit Modal */}
            {showGbpKit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-3xl">
                        <button onClick={() => setShowGbpKit(null)} className="absolute -top-4 -right-4 bg-slate-800 hover:bg-red-500 text-white p-2 text-xs font-bold rounded-full border-2 border-emerald-500 z-50 transition-colors">
                            <X size={16} />
                        </button>
                        <GbpLaunchKit site={showGbpKit} />
                    </div>
                </div>
            )}
        </div>
    );
}
