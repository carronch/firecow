import React, { useState } from 'react';
import { Send, Copy, Check } from 'lucide-react';

export default function ManualBookingForm() {
    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        tourDate: '',
        description: '', // Tour Name
        amount: ''
    });
    const [generating, setGenerating] = useState(false);
    const [paymentLink, setPaymentLink] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setPaymentLink('');
        try {
            const res = await fetch('/api/ops/payment-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(formData.amount),
                    description: formData.description,
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                    customerPhone: formData.customerPhone,
                    tourDate: formData.tourDate
                })
            });
            const data = await res.json();
            if (data.url) {
                setPaymentLink(data.url);
            } else {
                alert('Error generating link: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to generate link', error);
            alert('Failed to generate link');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(paymentLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="border rounded-lg shadow bg-white p-6">
            <h2 className="text-xl font-bold mb-4">Manual Booking & Payment Link</h2>

            {!paymentLink ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Customer Name</label>
                            <input required
                                className="w-full p-2 border rounded"
                                value={formData.customerName}
                                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" required
                                className="w-full p-2 border rounded"
                                value={formData.customerEmail}
                                onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone (Whatsapp)</label>
                            <input
                                className="w-full p-2 border rounded"
                                value={formData.customerPhone}
                                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tour Date</label>
                            <input type="date" required
                                className="w-full p-2 border rounded"
                                value={formData.tourDate}
                                onChange={e => setFormData({ ...formData, tourDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tour Name / Description</label>
                            <input required
                                className="w-full p-2 border rounded"
                                placeholder="e.g. Private Charter 4 Pax"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Amount ($ USD)</label>
                            <input type="number" required
                                className="w-full p-2 border rounded"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={generating}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2"
                    >
                        {generating ? 'Generating Link & Lead...' : (
                            <>
                                <Send className="w-4 h-4" /> Generate Payment Link
                            </>
                        )}
                    </button>
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800">
                        ✅ <strong>Success!</strong> Lead created in Zoho and Payment Link generated.
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Payment Link</label>
                        <div className="flex gap-2">
                            <input readOnly value={paymentLink} className="w-full p-2 border rounded bg-gray-50" />
                            <button onClick={copyToClipboard} className="p-2 border rounded hover:bg-gray-100" title="Copy">
                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setPaymentLink('');
                            setFormData({
                                customerName: '',
                                customerEmail: '',
                                customerPhone: '',
                                tourDate: '',
                                description: '',
                                amount: ''
                            });
                        }}
                        className="text-blue-600 text-sm hover:underline"
                    >
                        Create Another Booking
                    </button>
                </div>
            )}
        </div>
    );
}
