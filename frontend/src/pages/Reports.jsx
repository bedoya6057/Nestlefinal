import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { FileText, Filter, Package, Shirt, Truck } from 'lucide-react';

export function Reports() {
    const [activeTab, setActiveTab] = useState('deliveries');
    const [reportData, setReportData] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchReport();
    }, [activeTab, month, year]);

    const fetchReport = async () => {
        try {
            let url = '';
            if (activeTab === 'deliveries') url = '/api/delivery/report';
            else if (activeTab === 'laundry') url = '/api/reports/laundry';
            else if (activeTab === 'uniform-return') url = '/api/uniform-returns/report';

            if (url) {
                const res = await axios.get(url, { params: { month, year } });
                setReportData(res.data);
            }
        } catch (err) {
            setReportData([]);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" /> Reportes Generales
            </h2>
            <div className="flex gap-4 border-b">
                <button onClick={() => setActiveTab('deliveries')} className={`pb-2 ${activeTab === 'deliveries' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}>Entregas</button>
                <button onClick={() => setActiveTab('laundry')} className={`pb-2 ${activeTab === 'laundry' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}>Lavandería</button>
                <button onClick={() => setActiveTab('uniform-return')} className={`pb-2 ${activeTab === 'uniform-return' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}>Devoluciones</button>
            </div>
            <Card className="p-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left p-2">Usuario/Guía</th>
                            <th className="text-left p-2">DNI/Estado</th>
                            <th className="text-left p-2">Fecha</th>
                            <th className="text-left p-2">Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, i) => (
                            <tr key={i} className="border-b">
                                <td className="p-2">{row.user || row.guide_number}</td>
                                <td className="p-2">{row.dni || row.status}</td>
                                <td className="p-2">{new Date(row.date).toLocaleDateString()}</td>
                                <td className="p-2">{row.items || row.items_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
