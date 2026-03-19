import React, { useState, useEffect, useCallback } from 'react';
import CheckoutForm from './CheckoutForm.jsx';

// Mini availability calendar — shows one month, colour-coded by availability
function AvailabilityCalendar({ tourId, apiBase, onSelect, selected }) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [availability, setAvailability] = useState({}); // date → { booked, capacity, available }
    const [loadingMonth, setLoadingMonth] = useState(false);

    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    useEffect(() => {
        if (!tourId || !apiBase) return;
        setLoadingMonth(true);
        fetch(`${apiBase}/api/tours/${tourId}/availability?month=${monthStr}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const map = {};
                for (const d of (Array.isArray(data) ? data : [])) map[d.date] = d;
                setAvailability(map);
            })
            .catch(() => {})
            .finally(() => setLoadingMonth(false));
    }, [tourId, monthStr, apiBase]);

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);

    const monthLabel = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const dayStyle = (day) => {
        if (!day) return '';
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d = new Date(dateStr);
        const todayStr = today.toISOString().split('T')[0];
        if (dateStr < todayStr) return 'text-gray-300 cursor-not-allowed';
        const av = availability[dateStr];
        if (av) {
            if (av.available <= 0) return 'bg-red-100 text-red-400 cursor-not-allowed line-through';
            if (av.available <= 3) return 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer';
            return 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer';
        }
        return 'hover:bg-blue-50 text-gray-700 cursor-pointer';
    };

    return (
        <div className="bg-white/95 rounded-xl shadow-xl border border-white/30 p-3 w-72">
            <div className="flex items-center justify-between mb-2">
                <button onClick={prevMonth} className="p-1 text-gray-500 hover:text-gray-700 text-lg leading-none">‹</button>
                <span className="text-xs font-semibold text-gray-700">{monthLabel} {loadingMonth && '…'}</span>
                <button onClick={nextMonth} className="p-1 text-gray-500 hover:text-gray-700 text-lg leading-none">›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-0.5">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const av = availability[dateStr];
                    const isPast = dateStr < today.toISOString().split('T')[0];
                    const isFull = av && av.available <= 0;
                    const isSelected = selected === dateStr;
                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={isPast || isFull}
                            onClick={() => !isPast && !isFull && onSelect(dateStr)}
                            className={`text-center text-xs py-1 rounded transition-colors ${dayStyle(day)} ${isSelected ? '!bg-blue-600 !text-white font-bold' : ''}`}
                            title={av ? `${av.available}/${av.capacity} spots left` : undefined}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-100 inline-block" />Open</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-100 inline-block" />Few left</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-100 inline-block" />Full</span>
            </div>
        </div>
    );
}

export default function BookingWidget({ tours = [], initialTourId = null, apiBase = '', locale = 'en' }) {
    const tChooseExp = locale === 'es' ? 'Elegir Experiencia' : 'Choose Experience';
    const tDate = locale === 'es' ? 'Fecha' : 'Date';
    const tSelectDate = locale === 'es' ? 'Seleccionar fecha' : 'Select date';
    const tAdults = locale === 'es' ? 'Adultos' : 'Adults';
    const tChildren = locale === 'es' ? 'Niños' : 'Children';
    const tBookNow = locale === 'es' ? 'Reservar' : 'Book Now';
    const tProcessing = locale === 'es' ? 'Procesando...' : 'Processing...';
    const tSecure = locale === 'es' ? 'Reserva segura • Confirmación rápida' : 'Secure booking • Instant confirmation';

    const [selectedTourSlug, setSelectedTourSlug] = useState(initialTourId || (tours[0]?.slug || ''));
    const [date, setDate] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [priceDisplay, setPriceDisplay] = useState(0);

    // Capture UTM params once on mount
    const [utmParams] = useState(() => {
        if (typeof window === 'undefined') return {};
        const p = new URLSearchParams(window.location.search);
        const utm = {};
        for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
            if (p.get(k)) utm[k] = p.get(k);
        }
        return utm;
    });

    const selectedTour = tours.find(t => t.slug === selectedTourSlug) || tours[0];

    // Price calculation
    useEffect(() => {
        if (!selectedTour) return;
        let adultRate = 0;
        let childRate = 0;
        const priceData = selectedTour.data.price;
        if (typeof priceData === 'number') {
            adultRate = priceData;
            childRate = priceData;
        } else {
            adultRate = priceData?.adult || 0;
            childRate = priceData?.child || adultRate;
        }
        if (date && selectedTour.data.seasonalPricing) {
            const bookingDate = new Date(date + 'T00:00:00');
            for (const season of selectedTour.data.seasonalPricing) {
                const start = new Date(season.startDate + 'T00:00:00');
                const end = new Date(season.endDate + 'T23:59:59');
                if (bookingDate >= start && bookingDate <= end) {
                    adultRate = season.price.adult;
                    childRate = season.price.child || adultRate;
                    break;
                }
            }
        }
        setPriceDisplay((adultRate * adults) + (childRate * children));
    }, [selectedTour, date, adults, children]);

    const isBlackoutDate = (dateStr) => selectedTour?.data?.blackoutDates?.includes(dateStr) ?? false;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!date) { setError('Please select a date.'); return; }
        if (isBlackoutDate(date)) { setError('Selected date is unavailable.'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tourId: selectedTourSlug, date, adults, children, utmParams }),
            });
            const data = await res.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else {
                setError(data.error || 'Checkout failed to initialize.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get tour id for availability (use id if available, else slug)
    const tourIdForAvailability = selectedTour?.id || selectedTour?.slug;

    return (
        <>
            <div className="w-full max-w-4xl mx-auto mt-12 p-1 relative z-20">
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden p-4 md:p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                        {/* Tour Select */}
                        {!initialTourId && (
                            <div className="md:col-span-4">
                                <label className="block text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                                    {tChooseExp}
                                </label>
                                <select
                                    value={selectedTourSlug}
                                    onChange={e => setSelectedTourSlug(e.target.value)}
                                    className="w-full bg-white/90 border border-transparent text-slate-900 text-sm rounded-lg block p-3 font-medium"
                                >
                                    {tours.map(t => (
                                        <option key={t.slug} value={t.slug}>{t.data.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date — with availability calendar */}
                        <div className="col-span-1 relative">
                            <label className="block text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{tDate}</label>
                            <button
                                type="button"
                                onClick={() => setShowCalendar(c => !c)}
                                className="w-full bg-white/90 rounded-lg p-3 text-slate-900 font-medium text-sm text-left"
                            >
                                {date || tSelectDate}
                            </button>
                            {showCalendar && (
                                <div className="absolute top-full left-0 mt-2 z-50">
                                    <AvailabilityCalendar
                                        tourId={tourIdForAvailability}
                                        apiBase={apiBase}
                                        selected={date}
                                        onSelect={d => { setDate(d); setShowCalendar(false); }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Adults */}
                        <div className="col-span-1">
                            <label className="block text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{tAdults}</label>
                            <input
                                type="number"
                                min="1"
                                value={adults}
                                onChange={e => setAdults(parseInt(e.target.value) || 1)}
                                className="w-full bg-white/90 rounded-lg p-3 text-slate-900 font-medium"
                            />
                        </div>

                        {/* Children */}
                        <div className="col-span-1">
                            <label className="block text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{tChildren}</label>
                            <input
                                type="number"
                                min="0"
                                value={children}
                                onChange={e => setChildren(parseInt(e.target.value) || 0)}
                                className="w-full bg-white/90 rounded-lg p-3 text-slate-900 font-medium"
                            />
                        </div>

                        {/* Book Now */}
                        <div className="col-span-1">
                            <button
                                type="submit"
                                disabled={loading || !date}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2"
                            >
                                {loading ? tProcessing : tBookNow}
                                {priceDisplay > 0 && <span className="text-xs bg-black/20 px-2 rounded">${priceDisplay}</span>}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/80 text-white text-sm font-bold rounded text-center">
                            {error}
                        </div>
                    )}
                </div>

                <div className="text-center mt-3">
                    <p className="text-blue-200 text-xs flex items-center justify-center gap-1 opacity-80">
                        <span>{tSecure}</span>
                    </p>
                </div>
            </div>

            {/* Checkout Modal */}
            {clientSecret && (
                <CheckoutForm clientSecret={clientSecret} onClose={() => setClientSecret(null)} />
            )}

            {/* Close calendar on outside click */}
            {showCalendar && (
                <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
            )}
        </>
    );
}
