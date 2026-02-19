import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Search, FileText, Filter, Package, Shirt, Truck } from 'lucide-react';

export function Reports() {
    const [activeTab, setActiveTab] = useState('deliveries');
    const [reportData, setReportData] = useState([]);
    const [guideFilter, setGuideFilter] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [activeTab, month, year]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = '';
            let params = {};

            if (activeTab === 'deliveries') {
                url = '/api/delivery/report';
                params = { month: parseInt(month), year: parseInt(year) };
            } else if (activeTab === 'laundry') {
                url = '/api/reports/laundry';
                if (guideFilter.trim()) {
                    params = { guide_number: guideFilter.trim() };
                }
            } else if (activeTab === 'uniform-return') {
                url = '/api/uniform-returns/report';
            }

            const res = await axios.get(url, { params });
            setReportData(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error cargando reporte:", err);
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchReport();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" />
                Reportes Generales
            </h2>

            {/* Selector de Pestañas */}
            <div className="flex gap-4 border-b border-slate-200">
                <button onClick={() => setActiveTab('deliveries')} className={`pb-4 px-2 font-medium flex items-center gap-2 ${activeTab === 'deliveries' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
                    <Package size={18} /> Entregas
                </button>
                <button onClick={() => setActiveTab('laundry')} className={`pb-4 px-2 font-medium flex items-center gap-2 ${activeTab === 'laundry' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
                    <Truck size={18} /> Lavandería
                </button>
                <button onClick={() => setActiveTab('uniform-return')} className={`pb-4 px-2 font-medium flex items-center gap-2 ${activeTab === 'uniform-return' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
                    <Shirt size={18} /> Devoluciones
                </button>
            </div>

            {/* Filtros Restaurados */}
            <Card className="p-4 flex flex-wrap gap-4 items-center bg-white shadow-sm border border-slate-100">
                <div className="flex gap-2 items-center text-slate-600">
                    <Filter size={20} />
                    <span className="font-medium text-sm">Filtros:</span>
                </div>

                {activeTab === 'deliveries' && (
                    <div className="flex gap-2">
                        <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' }).toUpperCase()}</option>
                            ))}
                        </select>
                        <select value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                    </div>
                )}

                {activeTab === 'laundry' && (
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por N° Guía"
                                value={guideFilter}
                                onChange={(e) => setGuideFilter(e.target.value)}
                                className="pl-10 px-4 py-2 border rounded-lg bg-white text-sm w-64"
                            />
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                            Buscar Guía
                        </button>
                    </form>
                )}
            </Card>

            {/* Tabla de Resultados */}
            <Card className="overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Usuario / Guía</th>
                                <th className="px-6 py-4">DNI / Estado</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic">Buscando en la base de datos...</td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic">No se encontraron registros.</td></tr>
                            ) : (
                                reportData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {row.user || row.guide_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'laundry' ? (
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.status === 'Completa' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {row.status}
                                                </span>
                                            ) : (row.dni || "-")}
                                        </td>
                                        <td className="px-6 py-4">
                                            {row.date ? new Date(row.date).toLocaleDateString('es-PE') : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {row.items || row.items_count || "Sin detalle"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
