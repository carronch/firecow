import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash, Calendar } from 'lucide-react';

interface Price {
    adult: number;
    child?: number;
}

interface SeasonalPrice {
    name: string;
    startDate: string;
    endDate: string;
    price: Price;
}

interface TourData {
    title: string;
    description: string;
    price: Price;
    seasonalPricing?: SeasonalPrice[];
    blackoutDates?: string[];
}

export default function TourEditor({ site, id }: { site: string, id: string }) {
    const [data, setData] = useState<TourData | null>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTour();
    }, [site, id]);

    const fetchTour = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/content/tour?site=${site}&id=${id}`);
            const json = await res.json();
            // Handle legacy price (number) vs new price (object)
            if (typeof json.data.price === 'number') {
                json.data.price = { adult: json.data.price };
            }
            setData(json.data);
            setContent(json.content);
        } catch (error) {
            console.error('Failed to fetch tour', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        try {
            await fetch(`/api/content/tour?site=${site}&id=${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, content })
            });
            alert('Saved successfully!');
        } catch (error) {
            console.error('Failed to save', error);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const addSeason = () => {
        if (!data) return;
        const newSeason: SeasonalPrice = {
            name: 'New Season',
            startDate: '',
            endDate: '',
            price: { adult: 0 }
        };
        setData({ ...data, seasonalPricing: [...(data.seasonalPricing || []), newSeason] });
    };

    const removeSeason = (index: number) => {
        if (!data?.seasonalPricing) return;
        const newSeasons = [...data.seasonalPricing];
        newSeasons.splice(index, 1);
        setData({ ...data, seasonalPricing: newSeasons });
    };

    if (loading || !data) return <div>Loading Tour...</div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-4 border-b">
                <h2 className="text-2xl font-bold">Edit Tour: {data.title}</h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4 p-6 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                        value={data.title}
                        onChange={e => setData({ ...data, title: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        value={data.description}
                        onChange={e => setData({ ...data, description: e.target.value })}
                        className="w-full p-2 border rounded h-24"
                    />
                </div>
            </div>

            {/* Base Pricing */}
            <div className="grid gap-4 p-6 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-lg">Base Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Adult Price ($)</label>
                        <input
                            type="number"
                            value={data.price.adult}
                            onChange={e => setData({ ...data, price: { ...data.price, adult: Number(e.target.value) } })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Child Price ($)</label>
                        <input
                            type="number"
                            value={data.price.child || ''}
                            onChange={e => setData({ ...data, price: { ...data.price, child: Number(e.target.value) } })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>
            </div>

            {/* Seasonal Pricing */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Seasonal Pricing</h3>
                    <button onClick={addSeason} className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded flex items-center gap-1 hover:bg-green-200">
                        <Plus className="w-4 h-4" /> Add Season
                    </button>
                </div>

                {data.seasonalPricing?.map((season, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-yellow-50 relative">
                        <button onClick={() => removeSeason(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                            <Trash className="w-4 h-4" />
                        </button>
                        <div className="grid gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">Season Name</label>
                                <input
                                    value={season.name}
                                    onChange={e => {
                                        const newSeasons = [...(data.seasonalPricing || [])];
                                        newSeasons[idx].name = e.target.value;
                                        setData({ ...data, seasonalPricing: newSeasons });
                                    }}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500">Start Date</label>
                                    <input
                                        type="date"
                                        value={season.startDate}
                                        onChange={e => {
                                            const newSeasons = [...(data.seasonalPricing || [])];
                                            newSeasons[idx].startDate = e.target.value;
                                            setData({ ...data, seasonalPricing: newSeasons });
                                        }}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500">End Date</label>
                                    <input
                                        type="date"
                                        value={season.endDate}
                                        onChange={e => {
                                            const newSeasons = [...(data.seasonalPricing || [])];
                                            newSeasons[idx].endDate = e.target.value;
                                            setData({ ...data, seasonalPricing: newSeasons });
                                        }}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500">Adult Price</label>
                                    <input
                                        type="number"
                                        value={season.price.adult}
                                        onChange={e => {
                                            const newSeasons = [...(data.seasonalPricing || [])];
                                            newSeasons[idx].price.adult = Number(e.target.value);
                                            setData({ ...data, seasonalPricing: newSeasons });
                                        }}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500">Child Price</label>
                                    <input
                                        type="number"
                                        value={season.price.child || ''}
                                        onChange={e => {
                                            const newSeasons = [...(data.seasonalPricing || [])];
                                            newSeasons[idx].price.child = Number(e.target.value);
                                            setData({ ...data, seasonalPricing: newSeasons });
                                        }}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Blackout Dates */}
            <div className="p-6 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-lg mb-4">Blackout Dates</h3>
                <p className="text-sm text-gray-500 mb-2">Dates when this tour cannot be booked.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {data.blackoutDates?.map((date, idx) => (
                        <span key={idx} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {date}
                            <button onClick={() => {
                                const newDates = [...(data.blackoutDates || [])];
                                newDates.splice(idx, 1);
                                setData({ ...data, blackoutDates: newDates });
                            }}>x</button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="date"
                        id="new-blackout-date"
                        className="p-2 border rounded"
                    />
                    <button
                        onClick={() => {
                            const dateInput = document.getElementById('new-blackout-date') as HTMLInputElement;
                            if (dateInput.value) {
                                setData({ ...data, blackoutDates: [...(data.blackoutDates || []), dateInput.value] });
                                dateInput.value = '';
                            }
                        }}
                        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                    >
                        Add Date
                    </button>
                </div>
            </div>
        </div>
    );
}
