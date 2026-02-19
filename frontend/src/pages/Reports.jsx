import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { FileText, Package, Truck, Shirt } from 'lucide-react';

export function Reports() {
    const [activeTab, setActiveTab] = useState('deliveries');
    const [reportData, setReportData] = useState([]);

    useEffect(() => { fetchReport(); }, [activeTab]);

    const fetchReport = async () => {
        const url = activeTab === 'deliveries' ? '/api/delivery/report' : 
                    activeTab === 'laundry' ? '/api/reports/laundry' : '/api/uniform-returns/report';
        try {
            const res = await axios.get(url);
            setReportData(res.data);
        } catch (err) { setReportData([]); }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-2"><FileText /> Reportes</h2>
            <div className="flex gap-4 border-b">
                <button onClick={() => setActiveTab('deliveries')} className={`pb-2 ${activeTab === 'deliveries' ? 'border-b-2 border-blue-600' : ''}`}>Entregas</button>
                <button onClick={() => setActiveTab('laundry')} className={`pb-2 ${activeTab === 'laundry' ? 'border-b-2 border-blue-600' : ''}`}>Lavandería</button>
            </div>
            <Card className="p-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="p-3 text-left">Referencia</th>
                            <th className="p-3 text-left">Estado/DNI</th>
                            <th className="p-3 text-left">Items</th>
                            {activeTab === 'laundry' && <th className="p-3 text-left text-orange-600">Pendientes</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, i) => (
                            <tr key={i} className="border-b">
                                <td className="p-3">{row.user || row.guide_number}</td>
                                <td className="p-3">{row.dni || row.status}</td>
                                <td className="p-3">{row.items || row.items_count}</td>
                                {activeTab === 'laundry' && <td className="p-3 font-bold text-orange-600">{row.pending_items}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
