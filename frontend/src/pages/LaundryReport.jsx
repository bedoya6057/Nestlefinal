import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Search, FileText, Calendar, Filter } from 'lucide-react';

export function LaundryReport() {
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
            const params = {};
            if (filters.dni) params.dni = filters.dni;
            if (filters.month) params.month = filters.month;
            if (filters.year) params.year = filters.year;

            const res = await axios.get('http://localhost:8000/api/laundry/report', { params });
            setReportData(res.data);
        } catch (err) {
            console.error("Error fetching report:", err);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []); // Initial load

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" />
                Reporte de Lavandería
            </h2>

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
                </div>
            </Card>
        </div>
    );
}
