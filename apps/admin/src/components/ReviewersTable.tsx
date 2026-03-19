import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Send, Check, X, Shield, Phone, MapPin, DollarSign } from 'lucide-react';

interface Site {
    id: string;
    slug: string;
    domain: string;
}

interface Reviewer {
    id: string;
    name: string;
    whatsapp_number: string;
    sinpe_number?: string;
    status: string;
    total_gigs_completed: number;
    created_at: string;
}

interface Campaign {
    id: string;
    site_slug: string;
    budget: number;
    bounty_per_review: number;
    dispatched_count: number;
    status: string;
    created_at: string;
}

const EMPTY_REVIEWER = { name: '', whatsapp_number: '', sinpe_number: '' };

export default function ReviewersTable({ sites, apiBase }: { sites: Site[], apiBase: string }) {
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal States
    const [showAddReviewer, setShowAddReviewer] = useState(false);
    const [showLaunchCampaign, setShowLaunchCampaign] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState(EMPTY_REVIEWER);
    const [campData, setCampData] = useState({ site_id: sites[0]?.id || '', requested_reviews: 5, bounty: 5000 });
    const [saving, setSaving] = useState(false);

    const refreshData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [revRes, campRes] = await Promise.all([
                fetch(`${apiBase}/api/reviewers`),
                fetch(`${apiBase}/api/campaigns`)
            ]);
            if (revRes.ok) setReviewers(await revRes.json());
            if (campRes.ok) setCampaigns(await campRes.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    useEffect(() => { refreshData(); }, [refreshData]);

    const addReviewer = async () => {
        if (!formData.name || !formData.whatsapp_number) {
            setError('Name and WhatsApp number are required');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${apiBase}/api/reviewers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error(await res.text());
            await refreshData();
            setShowAddReviewer(false);
            setFormData(EMPTY_REVIEWER);
        } catch (e: any) {
            setError('Error adding reviewer: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const next = currentStatus === 'active' ? 'banned' : 'active';
        try {
            const res = await fetch(`${apiBase}/api/reviewers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: next })
            });
            if (res.ok) await refreshData();
        } catch (e) {}
    };

    const launchCampaign = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${apiBase}/api/campaigns/blast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campData)
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            alert(`Blast successful! Dispatched gigs to ${data.dispatched} reviewers.`);
            await refreshData();
            setShowLaunchCampaign(false);
        } catch (e: any) {
            setError('Error launching campaign: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const inp = 'w-full border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-slate-900/50 text-white';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-sky-400 flex items-center gap-2">
                        <Shield size={20} className="text-emerald-400" />
                        Local Gig Workers Pool
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">{reviewers.length} Reviewers Available</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={refreshData} className="flex flex-row items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-700 rounded-lg hover:bg-slate-800/30">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={() => setShowAddReviewer(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 border-0 text-white rounded-lg hover:opacity-90 transition-shadow shadow-lg shadow-blue-500/20">
                        <Plus size={14} /> Add Reviewer
                    </button>
                    <button onClick={() => setShowLaunchCampaign(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 border-0 text-white rounded-lg hover:opacity-90 transition-shadow shadow-lg shadow-emerald-500/20">
                        <Send size={14} /> Blast WhatsApp Gig
                    </button>
                </div>
            </div>

            {error && <div className="p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-sm rounded-lg">{error}</div>}

            {/* Campaign Modal */}
            {showLaunchCampaign && (
                <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border-2 border-emerald-500 p-6 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-1"><Send size={16} className="inline mr-2 text-emerald-400"/>Launch Gig Campaign</h3>
                    <p className="text-xs text-slate-400 mb-4">This will instantly dispatch a Twilio WhatsApp message to random active reviewers.</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="col-span-2">
                            <label className="block text-slate-400 mb-1">Target Client Site</label>
                            <select className={inp} value={campData.site_id} onChange={e => setCampData({...campData, site_id: e.target.value})}>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.domain || s.slug}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1">Target Number of Reviews</label>
                            <input type="number" className={inp} value={campData.requested_reviews} onChange={e => setCampData({...campData, requested_reviews: parseInt(e.target.value)})} min={1} />
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1">Bounty Per Review (₡)</label>
                            <input type="number" className={inp} value={campData.bounty} onChange={e => setCampData({...campData, bounty: parseInt(e.target.value)})} step={1000} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowLaunchCampaign(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                        <button onClick={launchCampaign} disabled={saving} className="px-4 py-2 text-sm bg-emerald-500 text-white font-bold rounded hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all">
                            {saving ? 'Transmitting...' : 'Dispatch Gig Blast'}
                        </button>
                    </div>
                </div>
            )}

            {/* Add Reviewer Modal */}
            {showAddReviewer && (
                <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-blue-500/50 p-6 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-4">Onboard Local Gig Worker</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                            <label className="block text-slate-400 mb-1">Name</label>
                            <input className={inp} placeholder="Juan Perez" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1">WhatsApp Number</label>
                            <input className={inp} placeholder="+50688888888" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1">SINPE / Payment ID</label>
                            <input className={inp} placeholder="88888888" value={formData.sinpe_number} onChange={e => setFormData({...formData, sinpe_number: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAddReviewer(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                        <button onClick={addReviewer} disabled={saving} className="px-4 py-2 text-sm bg-blue-500 text-white font-bold rounded hover:bg-blue-600 disabled:opacity-50 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                            {saving ? 'Saving...' : 'Add to Pool'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                {/* Active Campaigns List */}
                <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                        <h3 className="font-semibold text-white/90">Campaign History</h3>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{campaigns.length} total</span>
                    </div>
                    <div className="overflow-y-auto max-h-[500px]">
                        {campaigns.length === 0 ? <p className="p-8 text-center text-slate-500 text-sm">No campaigns blasted yet.</p> : (
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs text-slate-500 bg-slate-950/20 uppercase border-b border-slate-800">
                                    <tr>
                                        <th className="px-4 py-2">Site</th>
                                        <th className="px-4 py-2">Cost</th>
                                        <th className="px-4 py-2">Dispatched</th>
                                        <th className="px-4 py-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map(c => (
                                        <tr key={c.id} className="border-b last:border-0 border-slate-800 hover:bg-slate-800/20 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{c.site_slug}</td>
                                            <td className="px-4 py-3">₡{c.budget} <span className="text-xs text-slate-500">(₡{c.bounty_per_review}/each)</span></td>
                                            <td className="px-4 py-3 font-mono text-emerald-400">{c.dispatched_count} Sent</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Reviewer Pool List */}
                <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                        <h3 className="font-semibold text-white/90">Roster</h3>
                    </div>
                    <div className="overflow-y-auto max-h-[500px]">
                        {reviewers.length === 0 ? <p className="p-8 text-center text-slate-500 text-sm">Gig pool is empty.</p> : (
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs text-slate-500 bg-slate-950/20 uppercase border-b border-slate-800">
                                    <tr>
                                        <th className="px-4 py-2">Gig Worker</th>
                                        <th className="px-4 py-2">Payment</th>
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2">Stats</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviewers.map(r => (
                                        <tr key={r.id} className="border-b last:border-0 border-slate-800 hover:bg-slate-800/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-white">{r.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{r.whatsapp_number}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-emerald-500 align-middle">
                                                {r.sinpe_number || '--'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button 
                                                    onClick={() => toggleStatus(r.id, r.status)}
                                                    className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-500'}`}
                                                >
                                                    {r.status.toUpperCase()}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs text-center border-l border-slate-800/50 bg-slate-950/20">
                                                <span className="text-white text-base block font-mono">{r.total_gigs_completed}</span>
                                                Gigs
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
