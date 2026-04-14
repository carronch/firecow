import React, { useEffect, useState, useCallback } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { getSeasonForDate } from '../config/high-seasons';
import type { Supplier, SupplierCheck } from '../lib/api';

type CheckStatus = 'available' | 'unverified' | 'full';

const STATUS_CYCLE: CheckStatus[] = ['unverified', 'available', 'full'];
const STATUS_LABEL: Record<CheckStatus, string> = {
    available: '✅ Available',
    unverified: '🟡 Unverified',
    full: '🔴 Full',
};
const STATUS_CLASSES: Record<CheckStatus, string> = {
    available: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
    unverified: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
    full: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
};

/** Generate ISO date strings for the next `count` days starting today. */
function getNextDays(count: number): string[] {
    const dates: string[] = [];
    const d = new Date();
    for (let i = 0; i < count; i++) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${day}`);
        d.setDate(d.getDate() + 1);
    }
    return dates;
}

function formatDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
    });
}

interface Props {
    supplier: Supplier | null;
    apiBase: string;
    adminToken: string;
    onClose: () => void;
    onStatusChange: (supplierId: string, status: CheckStatus) => void;
}

export default function SupplierCheckPanel({ supplier, apiBase, adminToken, onClose, onStatusChange }: Props) {
    const [checks, setChecks] = useState<Map<string, SupplierCheck>>(new Map());
    const [saving, setSaving] = useState<string | null>(null);
    const [waDate, setWaDate] = useState<string | null>(null);
    const [waMessage, setWaMessage] = useState('');

    const dates = getNextDays(60);

    const loadChecks = useCallback(async (supplierId: string) => {
        try {
            const res = await fetch(`${apiBase}/api/supplier-checks?supplier_id=${supplierId}`);
            if (!res.ok) return;
            const data: { checks: SupplierCheck[] } = await res.json();
            const map = new Map<string, SupplierCheck>();
            for (const c of data.checks) map.set(c.check_date, c);
            setChecks(map);
        } catch (_) {}
    }, [apiBase]);

    useEffect(() => {
        if (!supplier) { setChecks(new Map()); setWaDate(null); return; }
        loadChecks(supplier.id);
    }, [supplier, loadChecks]);

    const cycleStatus = async (date: string) => {
        if (!supplier) return;
        const current: CheckStatus = checks.get(date)?.status ?? 'unverified';
        const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
        setSaving(date);
        try {
            const seasonName = getSeasonForDate(new Date(date + 'T12:00:00'));
            const res = await fetch(`${apiBase}/api/supplier-checks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify({
                    supplier_id: supplier.id,
                    check_date: date,
                    season_name: seasonName,
                    status: next,
                }),
            });
            if (!res.ok) throw new Error('Save failed');
            const saved: SupplierCheck = await res.json();
            setChecks(prev => new Map(prev).set(date, saved));
            onStatusChange(supplier.id, next);
        } catch (_) {
        } finally {
            setSaving(null);
        }
    };

    const openWa = (date: string) => {
        setWaDate(date);
        setWaMessage(
            `Hola! Estoy verificando disponibilidad para ${formatDate(date)}. ¿Tienen cupo disponible? Gracias!`
        );
    };

    const sendWa = () => {
        if (!supplier?.contact_whatsapp || !waDate) return;
        const phone = supplier.contact_whatsapp.replace(/\D/g, '');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setWaDate(null);
    };

    const isOpen = supplier !== null;

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-[480px] max-w-full bg-slate-900/40 backdrop-blur-md shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                            <h2 className="font-semibold text-white truncate">
                                {supplier?.name ?? ''}
                            </h2>
                            <p className="text-xs text-slate-400">Calendar availability check — next 60 days</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {supplier?.calendar_url && (
                            <a
                                href={supplier.calendar_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-700 rounded-lg hover:bg-slate-800/30 text-slate-300"
                            >
                                <ExternalLink size={12} /> View Calendar
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-slate-400 hover:bg-gray-100 rounded"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* WhatsApp compose section */}
                {waDate && (
                    <div className="px-5 py-3 bg-green-50 border-b border-green-200 shrink-0">
                        <p className="text-xs font-semibold text-green-800 mb-1.5">
                            WhatsApp message for {formatDate(waDate)}
                        </p>
                        <textarea
                            className="w-full text-sm border border-green-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-slate-900/40 backdrop-blur-md resize-none"
                            rows={3}
                            value={waMessage}
                            onChange={e => setWaMessage(e.target.value)}
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={sendWa}
                                className="px-4 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Send via WhatsApp
                            </button>
                            <button
                                onClick={() => setWaDate(null)}
                                className="px-4 py-1.5 text-xs font-medium border border-slate-700 rounded-lg hover:bg-slate-800/30"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Date list */}
                <div className="flex-1 overflow-y-auto">
                    {dates.map(date => {
                        const seasonName = getSeasonForDate(new Date(date + 'T12:00:00'));
                        const check = checks.get(date);
                        const status: CheckStatus = check?.status ?? 'unverified';
                        const isSaving = saving === date;

                        return (
                            <div
                                key={date}
                                className={`flex items-center gap-3 px-5 py-2.5 border-b border-gray-100 ${
                                    seasonName ? 'bg-amber-50' : ''
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <span className={`text-sm ${seasonName ? 'font-semibold text-amber-900' : 'text-slate-300'}`}>
                                        {formatDate(date)}
                                    </span>
                                    {seasonName && (
                                        <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                                            {seasonName}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => cycleStatus(date)}
                                    disabled={isSaving}
                                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors disabled:opacity-50 ${STATUS_CLASSES[status]}`}
                                >
                                    {isSaving ? '...' : STATUS_LABEL[status]}
                                </button>
                                {supplier?.contact_whatsapp && (
                                    <button
                                        onClick={() => openWa(date)}
                                        className="shrink-0 text-xs px-2 py-1 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800/30"
                                        title="Ask via WhatsApp"
                                    >
                                        💬
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
