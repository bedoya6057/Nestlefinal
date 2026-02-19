import { useState } from 'react';
import axios from 'axios';
import { Search, Plus, Save, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function UniformReturn() {
    const [dni, setDni] = useState('');
    const [user, setUser] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const ALLOWED_ITEMS = ["Polo", "Pantalon", "Chaqueta"];
    const DEFAULT_ITEMS = [
        { name: "Polo", qty: 1, fixed: true },
        { name: "Pantalon", qty: 1, fixed: true },
        { name: "Chaqueta", qty: 1, fixed: true }
    ];

    const searchUser = async (e) => {
        if (e) e.preventDefault();
        const cleanDni = dni.trim();
        if (!cleanDni) return;

        setLoading(true);
        setError('');
        setUser(null);
        setItems([]);
        setSuccess('');

        try {
            // CORRECCIÓN: Uso de ruta relativa para Render
            const res = await axios.get(`/api/users/${cleanDni}`);
            setUser(res.data);
            setItems(DEFAULT_ITEMS);
        } catch (err) {
            setError('Trabajador no encontrado en el sistema.');
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, { name: 'Polo', qty: 1, fixed: false }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        setError('');

        const payload = {
            dni: user.dni,
            items: items.map(i => ({ 
                name: i.name, 
                qty: parseInt(i.qty) || 0 
            })).filter(i => i.qty > 0),
            observations: "Retorno de equipo por cese o renovación"
        };

        try {
            // CORRECCIÓN: Ruta relativa para el POST
            await axios.post('/api/uniform-returns', payload);
            
            setSuccess('Registro de devolución guardado exitosamente.');
            // Limpieza de formulario tras éxito
            setDni('');
            setUser(null);
            setItems([]);
        } catch (err) {
            console.error("Error al guardar:", err);
            setError('Error de servidor: No se pudo registrar la devolución.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Devolución de Uniformes</h2>

            <Card className="p-6">
                <form onSubmit={searchUser} className="flex gap-4">
                    <input
                        type="text"
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        placeholder="Ingrese DNI del trabajador"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Search size={20} />
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>

                {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
                {success && <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">{success}</div>}
            </Card>

            {user && (
                <Card className="p-6 space-y-6">
                    <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-slate-700">Ficha del Trabajador</h3>
                        <p className="text-slate-600 font-medium">{user.name} {user.surname}</p>
                        <p className="text-slate-500 text-sm">DNI: {user.dni}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-700">Equipos a Devolver</h3>
                            <button onClick={addItem} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                                <Plus size={16} /> Agregar Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-end gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Prenda</label>
                                        {item.fixed ? (
                                            <div className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-300">
                                                {item.name}
                                            </div>
                                        ) : (
                                            <select
                                                value={item.name}
                                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                className="w-full px-4 py-2 border rounded-lg outline-none bg-white"
                                            >
                                                {ALLOWED_ITEMS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        )}
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Cantidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.qty}
                                            onChange={(e) => updateItem(index, 'qty', e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg outline-none"
                                        />
                                    </div>
                                    {!item.fixed && (
                                        <button onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || items.length === 0}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm flex items-center gap-2"
                        >
                            <Save size={20} />
                            {loading ? 'Guardando...' : 'Registrar Devolución'}
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
}
