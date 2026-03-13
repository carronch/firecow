import React, { useEffect, useState } from 'react';
import { getActiveOrUpcomingSeason, type SeasonMatch } from '../config/high-seasons';

export default function SeasonAlert() {
    const [match, setMatch] = useState<SeasonMatch | null | undefined>(undefined);

    useEffect(() => {
        const m = getActiveOrUpcomingSeason(new Date());
        if (!m) { setMatch(null); return; }
        const key = `season-dismissed-${m.season.name}-${m.startDate.getFullYear()}`;
        if (sessionStorage.getItem(key)) { setMatch(null); return; }
        setMatch(m);
    }, []);

    if (match === undefined || match === null) return null;

    const isActive = match.state === 'active';
    const key = `season-dismissed-${match.season.name}-${match.startDate.getFullYear()}`;

    const dismiss = () => {
        sessionStorage.setItem(key, '1');
        setMatch(null);
    };

    return (
        <div
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm border-b ${
                isActive
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
        >
            <span className="flex-1">
                {isActive
                    ? `⚠️ ${match.season.name} is NOW — confirm supplier availability`
                    : `📅 ${match.season.name} starts in ${match.daysUntil} day${match.daysUntil === 1 ? '' : 's'} — check suppliers`}
            </span>
            <a
                href="/suppliers"
                className={`shrink-0 font-medium underline underline-offset-2 hover:opacity-75 ${
                    isActive ? 'text-red-700' : 'text-amber-700'
                }`}
            >
                Go to Suppliers →
            </a>
            <button
                onClick={dismiss}
                aria-label="Dismiss alert"
                className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${
                    isActive
                        ? 'border-red-300 hover:bg-red-100'
                        : 'border-amber-300 hover:bg-amber-100'
                }`}
            >
                Dismiss
            </button>
        </div>
    );
}
