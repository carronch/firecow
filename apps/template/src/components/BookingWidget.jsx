import React, { useState, useEffect } from 'react';
import CheckoutForm from './CheckoutForm.jsx';

export default function BookingWidget({ tours = [], initialTourId = null }) {
    const [selectedTourSlug, setSelectedTourSlug] = useState(initialTourId || (tours[0]?.slug || ''));
    const [date, setDate] = useState('');
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);

    // Computed state
    const selectedTour = tours.find(t => t.slug === selectedTourSlug) || tours[0];
    const [priceDisplay, setPriceDisplay] = useState(0);

    // Price Calculation Effect
    useEffect(() => {
        if (!selectedTour) return;

        let adultRate = 0;
        let childRate = 0;
        const priceData = selectedTour.data.price;

        // Base Price
        if (typeof priceData === 'number') {
            adultRate = priceData;
            childRate = priceData; // Fallback if number
        } else {
            adultRate = priceData.adult || 0;
            childRate = priceData.child || adultRate;
        }

        // Seasonal Overrides
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

        const total = (adultRate * adults) + (childRate * children);
        setPriceDisplay(total);
    }, [selectedTour, date, adults, children]);

    // Validation
    const isBlackoutDate = (dateStr) => {
        if (!selectedTour?.data?.blackoutDates) return false;
        return selectedTour.data.blackoutDates.includes(dateStr);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!date) {
            setError("Please select a date.");
            return;
        }
        if (isBlackoutDate(date)) {
            setError("Selected date is unavailable.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tourId: selectedTourSlug,
                    date,
                    adults,
                    children
                })
            });
            const data = await res.json();

            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else {
                setError(data.error || "Checkout failed to initialize.");
            }
        } catch (err) {
            console.error(err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="w-full max-w-4xl mx-auto mt-12 p-1 relative z-20">
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden p-4 md:p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                        {/* Tour Select */}
                        <div className={`col-span-1 ${initialTourId ? 'hidden' : 'md:col-span-4'}`}>
                            <label className="block text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                                Choose Experience
                            </label>
                            <select
                                value={selectedTourSlug}
                                onChange={(e) => setSelectedTourSlug(e.target.value)}
                                className="w-full bg-white/90 border border-transparent text-slate-900 text-sm rounded-lg block p-3 font-medium"
                            >
                                {tours.map(t => (
                                    <option key={t.slug} value={t.slug}>{t.data.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div className="col-span-1">
                            <label className="block text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Date</label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-white/90 rounded-lg p-3 text-slate-900 font-medium"
                                required
                            />
                        </div>

                        {/* Guests */}
                        <div className="col-span-1">
                            <label className="block text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Adults</label>
                            <input
                                type="number"
                                min="1"
                                value={adults}
                                onChange={(e) => setAdults(parseInt(e.target.value) || 0)}
                                className="w-full bg-white/90 rounded-lg p-3 text-slate-900 font-medium"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-blue-100 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Children</label>
                            <input
                                type="number"
                                min="0"
                                value={children}
                                onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                                className="w-full bg-white/90 rounded-lg p-3 text-slate-900 font-medium"
                            />
                        </div>

                        {/* Action */}
                        <div className="col-span-1 md:col-start-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processing...' : 'Book Now'}
                                <span className="text-xs bg-black/20 px-2 rounded">${priceDisplay}</span>
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
                        <span>Secure booking • Instant confirmation</span>
                    </p>
                </div>
            </div>

            {/* Checkout Modal */}
            {clientSecret && (
                <CheckoutForm clientSecret={clientSecret} onClose={() => setClientSecret(null)} />
            )}
        </>
    );
}
