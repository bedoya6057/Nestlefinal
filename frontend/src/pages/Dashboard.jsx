import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Package, TrendingUp, Shirt, RefreshCw, Columns, Briefcase } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function Dashboard() {
    const [stats, setStats] = useState({
        users_count: 0,
        deliveries_count: 0,
        laundry_total_count: 0,
        laundry_active_count: 0,
        laundry_polos_count: 0,
        laundry_pantalones_count: 0,
        laundry_chaquetas_count: 0
    });

    const [laundryServices, setLaundryServices] = useState([]);

    // Filters
    const currentYear = new Date().getFullYear();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(currentYear);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const resStats = await axios.get('http://localhost:8000/api/stats', {
                    params: { month, year }
                });
                setStats(resStats.data);

                const resLaundry = await axios.get('http://localhost:8000/api/laundry');
                setLaundryServices(resLaundry.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        fetchStats();
    }, [month, year]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>

                <div className="flex gap-2">
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Todos los Meses</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                            </option>
                        ))}
                    </select>

                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Todos los Años</option>
                        {Array.from({ length: 5 }, (_, i) => (
                            <option key={currentYear - i} value={currentYear - i}>
                                {currentYear - i}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total de Lavados</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.laundry_total_count}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <RefreshCw size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Servicios en Curso</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.laundry_active_count}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 opacity-0 hidden md:block">
                    {/* Spacer to align grid */}
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Shirt size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Polos Enviados</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.laundry_polos_count || 0}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                            <Columns size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Pantalones Enviados</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.laundry_pantalones_count || 0}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Chaquetas Enviadas</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.laundry_chaquetas_count || 0}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Últimos Movimientos de Lavandería</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="text-xs uppercase bg-slate-100 text-slate-700">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">N° Guía</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Prendas</th>
                                <th className="px-4 py-3 rounded-r-lg">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {laundryServices.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-4 py-6 text-center text-slate-400">
                                        No hay movimientos recientes.
                                    </td>
                                </tr>
                            ) : (
                                laundryServices.map((service, index) => (
                                    <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {service.guide_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            {new Date(service.date).toLocaleDateString()} {new Date(service.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            {service.items_count}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${service.status === 'Completa' ? 'bg-green-100 text-green-700' :
                                                service.status === 'Incompleta' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {service.status}
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
