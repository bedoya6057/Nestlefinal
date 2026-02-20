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
        const fetchDashboardData = async () => {
            try {
                // Obtener Estadísticas filtradas
                const resStats = await axios.get('/api/stats', {
                    params: {
                        month: month === "" ? null : month,
                        year: year === "" ? null : year
                    }
                });
                setStats(resStats.data);

                // Obtener últimos movimientos (Lista detallada con pendientes)
                const resLaundry = await axios.get('/api/reports/laundry');
                setLaundryServices(resLaundry.data);
            } catch (err) {
                console.error("Error al cargar datos del dashboard:", err);
            }
        };

        fetchDashboardData();
    }, [month, year]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Dashboard de Gestión</h2>

                <div className="flex gap-2">
                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value === "" ? "" : parseInt(e.target.value))}
                        className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                        <option value="">Todos los Meses</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('es-ES', { month: 'long' }).toUpperCase()}
                            </option>
                        ))}
                    </select>

                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value === "" ? "" : parseInt(e.target.value))}
                        className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                        <option value="">Todos los Años</option>
                        <option value={currentYear}>{currentYear}</option>
                        <option value={currentYear - 1}>{currentYear - 1}</option>
                    </select>
                </div>
            </div>

            {/* Tarjetas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<TrendingUp />}
                    label="Total Lavandería"
                    value={stats.laundry_total_count}
                    color="bg-indigo-100 text-indigo-600"
                />
                <StatCard
                    icon={<RefreshCw />}
                    label="Guías Activas"
                    value={stats.laundry_active_count}
                    color="bg-purple-100 text-purple-600"
                />
                <StatCard
                    icon={<Users />}
                    label="Total Trabajadores"
                    value={stats.users_count}
                    color="bg-blue-100 text-blue-600"
                />
                <StatCard
                    icon={<Package />}
                    label="Total Entregas"
                    value={stats.deliveries_count}
                    color="bg-emerald-100 text-emerald-600"
                />
            </div>

            {/* Inventario en Lavandería */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    icon={<Shirt />}
                    label="Polos en Lavado"
                    value={stats.laundry_polos_count}
                    color="bg-blue-50 text-blue-500"
                />
                <StatCard
                    icon={<Columns />}
                    label="Pantalones en Lavado"
                    value={stats.laundry_pantalones_count}
                    color="bg-slate-50 text-slate-500"
                />
                <StatCard
                    icon={<Briefcase />}
                    label="Chaquetas en Lavado"
                    value={stats.laundry_chaquetas_count}
                    color="bg-emerald-50 text-emerald-500"
                />
            </div>

            {/* Tabla de Movimientos Críticos */}
            <Card className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    Últimos Movimientos
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                            <tr>
                                <th className="px-4 py-3">Guía</th>
                                <th className="px-4 py-3">F. Envío</th>
                                <th className="px-4 py-3">Resumen</th>
                                <th className="px-4 py-3">Pendiente Real</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">F. Retorno</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {laundryServices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-slate-400">
                                        No hay registros de lavandería disponibles.
                                    </td>
                                </tr>
                            ) : (
                                laundryServices.map((service, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-bold text-slate-900">{service.guide_number}</td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {new Date(service.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-xs">{service.items_count}</td>
                                        <td className="px-4 py-3 text-orange-600 font-bold">
                                            {service.pending_items}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${service.status === 'Completo' || service.status === 'Completa' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {service.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 font-medium">
                                            {service.return_date ? new Date(service.return_date).toLocaleDateString() : '-'}
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

// Sub-componente para las tarjetas
function StatCard({ icon, label, value, color }) {
    return (
        <Card className="p-5 border-none shadow-sm bg-white">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
                    <h3 className="text-2xl font-black text-slate-900">{value || 0}</h3>
                </div>
            </div>
        </Card>
    );
}
