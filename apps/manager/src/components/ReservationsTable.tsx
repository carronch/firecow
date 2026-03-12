import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ReservationsTable() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ops/reservations');
            const data = await res.json();
            setLeads(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch leads', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await fetch('/api/ops/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            // Optimistic update
            setLeads(leads.map(l => l.id === id ? { ...l, Lead_Status: newStatus } : l));
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
        }
    };

    if (loading) return <div>Loading Reservations...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Upcoming Reservations</h2>
                <button onClick={fetchLeads} className="p-2 border rounded hover:bg-gray-100" title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="overflow-x-auto border rounded-lg shadow bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leads.map((lead) => (
                            <tr key={lead.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {lead.Tour_Date || lead.Created_Time}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="font-medium text-gray-900">{lead.First_Name} {lead.Last_Name}</div>
                                    <div className="text-gray-500">{lead.Email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {lead.Tour_Name || 'Unknown Tour'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${lead.Amount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <select
                                        value={lead.Lead_Status}
                                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                                        className={`rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 p-1
                                            ${lead.Lead_Status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                lead.Lead_Status === 'Pending Payment' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}
                                    >
                                        <option value="New Lead">New Lead</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Pending Payment">Pending Payment</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leads.length === 0 && <div className="p-8 text-center text-gray-500">No reservations found.</div>}
            </div>
        </div>
    );
}
