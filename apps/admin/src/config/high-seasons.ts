export type HighSeason = {
    name: string;
    start: string; // "YYYY-MM-DD" (fixed year) or "MM-DD" (recurs annually)
    end: string;
    recurs?: true;
};

export const HIGH_SEASONS: HighSeason[] = [
    { name: "Holy Week", start: "2025-04-13", end: "2025-04-20" },
    { name: "Holy Week", start: "2026-03-29", end: "2026-04-05" },
    { name: "Holy Week", start: "2027-03-21", end: "2027-03-28" },
    { name: "Christmas",             start: "12-20", end: "12-26", recurs: true },
    { name: "New Year's Eve",        start: "12-27", end: "01-02", recurs: true },
    { name: "Independence Day (CR)", start: "09-14", end: "09-16", recurs: true },
];

export type SeasonMatch = {
    season: HighSeason;
    startDate: Date;
    endDate: Date;
    daysUntil: number; // 0 = active
    state: 'active' | 'upcoming';
};

/** Expand a season entry into concrete start/end Date objects for a given reference year. */
function expandSeason(s: HighSeason, year: number): { startDate: Date; endDate: Date } {
    if (s.recurs) {
        const [sm, sd] = s.start.split('-').map(Number);
        const [em, ed] = s.end.split('-').map(Number);
        const startDate = new Date(year, sm - 1, sd);
        // End month < start month means the window crosses year boundary (e.g. Dec 27 → Jan 2)
        const endYear = em < sm ? year + 1 : year;
        const endDate = new Date(endYear, em - 1, ed);
        return { startDate, endDate };
    } else {
        return {
            startDate: new Date(s.start),
            endDate: new Date(s.end),
        };
    }
}

/** Normalize a Date to midnight UTC for day-level comparisons. */
function toDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Difference in whole days (b - a). */
function dayDiff(a: Date, b: Date): number {
    return Math.round((toDay(b).getTime() - toDay(a).getTime()) / 86_400_000);
}

/**
 * Returns the most urgent active/upcoming season within 30 days, or null.
 * Active seasons take priority over upcoming ones.
 */
export function getActiveOrUpcomingSeason(today: Date): SeasonMatch | null {
    const day = toDay(today);
    const year = day.getFullYear();
    const candidates: SeasonMatch[] = [];

    for (const s of HIGH_SEASONS) {
        // For recurring seasons, check current year and next year window
        const yearsToCheck = s.recurs ? [year - 1, year, year + 1] : [year];
        for (const y of yearsToCheck) {
            const { startDate, endDate } = expandSeason(s, y);
            if (day >= startDate && day <= endDate) {
                candidates.push({ season: s, startDate, endDate, daysUntil: 0, state: 'active' });
            } else {
                const daysUntil = dayDiff(day, startDate);
                if (daysUntil > 0 && daysUntil <= 30) {
                    candidates.push({ season: s, startDate, endDate, daysUntil, state: 'upcoming' });
                }
            }
        }
    }

    if (candidates.length === 0) return null;

    // Active wins over upcoming; among same state, soonest wins
    candidates.sort((a, b) => {
        if (a.state !== b.state) return a.state === 'active' ? -1 : 1;
        return a.daysUntil - b.daysUntil;
    });
    return candidates[0];
}

/**
 * Returns the season name if `date` falls inside any season window, else null.
 * Used to highlight dates in SupplierCheckPanel.
 */
export function getSeasonForDate(date: Date): string | null {
    const day = toDay(date);
    const year = day.getFullYear();

    for (const s of HIGH_SEASONS) {
        const yearsToCheck = s.recurs ? [year - 1, year, year + 1] : [year];
        for (const y of yearsToCheck) {
            const { startDate, endDate } = expandSeason(s, y);
            if (day >= startDate && day <= endDate) {
                return s.name;
            }
        }
    }
    return null;
}

/**
 * Returns the nearest upcoming (or active) season, used for the Season Status column heading.
 * Returns null if none is active or within 60 days.
 */
export function getNextSeason(today: Date): { name: string; startDate: Date; endDate: Date } | null {
    const day = toDay(today);
    const year = day.getFullYear();
    let best: { name: string; startDate: Date; endDate: Date; diff: number } | null = null;

    for (const s of HIGH_SEASONS) {
        const yearsToCheck = s.recurs ? [year - 1, year, year + 1] : [year];
        for (const y of yearsToCheck) {
            const { startDate, endDate } = expandSeason(s, y);
            if (day <= endDate) {
                const diff = day >= startDate ? 0 : dayDiff(day, startDate);
                if (diff <= 60 && (best === null || diff < best.diff)) {
                    best = { name: s.name, startDate, endDate, diff };
                }
            }
        }
    }

    if (!best) return null;
    return { name: best.name, startDate: best.startDate, endDate: best.endDate };
}
