import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Package, TrendingUp, Shirt } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function Dashboard() {
    const [stats, setStats] = useState({
        users_count: 0,
        deliveries_count: 0,
        laundry_total_count: 0,
        laundry_active_count: 0
    });

    const [laundryServices, setLaundryServices] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const resStats = await axios.get('http://localhost:8000/api/stats');
                setStats(resStats.data);

                const resLaundry = await axios.get('http://localhost:8000/api/laundry');
                setLaundryServices(resLaundry.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        fetchStats();
    }, []);
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Trabajadores</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.users_count}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Entregas Realizadas</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.deliveries_count}</h3>
                        </div>
                    </div>
                </Card>

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
                            <Shirt size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Servicios en Curso</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.laundry_active_count}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Usuarios con Ropa en Lavandería</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="text-xs uppercase bg-slate-100 text-slate-700">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Usuario</th>
                                <th className="px-4 py-3">DNI</th>
                                <th className="px-4 py-3 rounded-r-lg">Prendas Pendientes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {laundryServices.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-4 py-6 text-center text-slate-400">
                                        No hay usuarios con ropa en lavandería.
                                    </td>
                                </tr>
                            ) : (
                                laundryServices.map((service, index) => {
                                    const itemsText = service.pending_items
                                        .map(i => `${i.qty} ${i.name}`)
                                        .join(", ");

                                    return (
                                        <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {service.user_name} {service.user_surname}
                                            </td>
                                            <td className="px-4 py-3">
                                                {service.dni}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-orange-600">
                                                {itemsText}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
