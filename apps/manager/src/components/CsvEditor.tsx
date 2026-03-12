import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';

export default function CsvEditor() {
    const [originalContent, setOriginalContent] = useState('');
    const [rows, setRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCsv();
    }, []);

    const fetchCsv = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/content/csv');
            const data = await res.json();
            setOriginalContent(data.content);

            const parsedRows = data.content.trim().split('\n').map((line: string) => line.split(';'));
            if (parsedRows.length > 0) {
                setHeaders(parsedRows[0]);
                setRows(parsedRows.slice(1));
            }
        } catch (error) {
            console.error('Failed to fetch CSV', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = [...rows];
        newRows[rowIndex][colIndex] = value;
        setRows(newRows);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Reconstruct CSV content
            const headerLine = headers.join(';');
            const bodyLines = rows.map(r => r.join(';')).join('\n');
            const newContent = `${headerLine}\n${bodyLines}`;

            await fetch('/api/content/csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent })
            });
            alert('Saved successfully!');
        } catch (error) {
            console.error('Failed to save', error);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading CSV...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Site Content (CSV)</h2>
                <div className="space-x-2">
                    <button onClick={fetchCsv} className="p-2 border rounded hover:bg-gray-100" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {h.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, colIndex) => (
                                    <td key={colIndex} className="px-3 py-2 whitespace-nowrap">
                                        <input
                                            value={cell}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            className="w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-sm text-gray-500">
                * Changes are saved to <code>sites-content.csv</code>. Run <code>pnpm sync-csv</code> to apply them to the sites.
            </div>
        </div>
    );
}
