import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Search, FileText, Calendar, Filter, Package, Shirt } from 'lucide-react';

export function Reports() {
    const [activeTab, setActiveTab] = useState('laundry'); // 'laundry' or 'delivery'
    const [reportData, setReportData] = useState([]);
    const [filters, setFilters] = useState({
        dni: '',
        month: '',
        year: ''
    });

    const years = [2024, 2025, 2026, 2027];
    const months = [
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' }
    ];

    const fetchReport = async () => {
        try {
            setReportData([]); // Clear previous data
            const params = {};
            if (filters.dni) params.dni = filters.dni;
            if (filters.month) params.month = filters.month;
            if (filters.year) params.year = filters.year;

            const endpoint = activeTab === 'laundry'
                ? 'http://localhost:8000/api/laundry/report'
                : 'http://localhost:8000/api/delivery/report';

            const res = await axios.get(endpoint, { params });
            setReportData(res.data);
        } catch (err) {
            console.error("Error fetching report:", err);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [activeTab]); // Fetch on tab change and initial load

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" />
                Reportes Generales
            </h2>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('laundry')}
                    className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'laundry'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Shirt size={18} />
                    Reporte Lavandería
                </button>
                <button
                    onClick={() => setActiveTab('delivery')}
                    className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'delivery'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Package size={18} />
                    Reporte Entregas Uniforme
                </button>
            </div>

            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">DNI Usuario</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="dni"
                                value={filters.dni}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Buscar por DNI..."
                            />
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mes</label>
                        <select
                            name="month"
                            value={filters.month}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                        <select
                            name="year"
                            value={filters.year}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={fetchReport}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Filter size={20} />
                        Filtrar
                    </button>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    {/* Dynamic Table based on Active Tab */}
                    {activeTab === 'laundry' ? (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="text-xs uppercase bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">DNI</th>
                                    <th className="px-6 py-4">Prendas</th>
                                    <th className="px-6 py-4">Fecha Solicitud</th>
                                    <th className="px-6 py-4">Fecha Entrega</th>
                                    <th className="px-6 py-4">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                            No se encontraron registros.
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{row.user}</td>
                                            <td className="px-6 py-4">{row.dni}</td>
                                            <td className="px-6 py-4">{row.items}</td>
                                            <td className="px-6 py-4">
                                                {new Date(row.request_date).toLocaleDateString()} {new Date(row.request_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                {row.return_date === '-' || row.return_date.startsWith('Parcial')
                                                    ? row.return_date
                                                    : new Date(row.return_date).toLocaleDateString() + ' ' + new Date(row.return_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'Entregado'
                                                        ? 'bg-green-100 text-green-700'
                                                        : row.status === 'Parcial'
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="text-xs uppercase bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">DNI</th>
                                    <th className="px-6 py-4">Contratación</th>
                                    <th className="px-6 py-4">Prendas Entregadas</th>
                                    <th className="px-6 py-4">Fecha Entrega</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                            No se encontraron registros.
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{row.user}</td>
                                            <td className="px-6 py-4">{row.dni}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                                                    {row.contract_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{row.items}</td>
                                            <td className="px-6 py-4">
                                                {new Date(row.date).toLocaleDateString()} {new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    );
}
