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
            const res = await axios.get(`/api/users/${cleanDni}`);
            setUser(res.data);
            setItems(DEFAULT_ITEMS);
        } catch (err) {
            setError('Trabajador no encontrado.');
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
            observations: "Devolución de uniforme"
        };

        try {
            await axios.post('/api/uniform-returns', payload);
            setSuccess('Devolución registrada correctamente.');
            setDni('');
            setUser(null);
            setItems([]);
        } catch (err) {
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
                        placeholder="Ingrese DNI"
                        className="flex-1 px-4 py-2 border rounded-lg outline-none"
                    />
                    <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                        <Search size={20} /> Buscar
                    </button>
                </form>
                {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
                {success && <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">{success}</div>}
            </Card>

            {user && (
                <Card className="p-6 space-y-6">
                    <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold">{user.name} {user.surname}</h3>
                        <p className="text-sm text-slate-500">DNI: {user.dni}</p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Equipos a Devolver</h4>
                            <button onClick={addItem} className="text-blue-600 text-sm flex items-center gap-1">
                                <Plus size={16} /> Agregar Item
                            </button>
                        </div>
                        {items.map((item, index) => (
                            <div key={index} className="flex items-end gap-4 p-4 bg-slate-50 rounded-lg border">
                                <div className="flex-1">
                                    <label className="block text-xs mb-1">Prenda</label>
                                    {item.fixed ? (
                                        <div className="px-4 py-2 bg-slate-200 rounded-lg border">{item.name}</div>
                                    ) : (
                                        <select
                                            value={item.name}
                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg bg-white"
                                        >
                                            {ALLOWED_ITEMS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.qty}
                                        onChange={(e) => updateItem(index, 'qty', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                {!item.fixed && (
                                    <button onClick={() => removeItem(index)} className="p-2 text-red-500">
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button onClick={handleSubmit} disabled={loading} className="bg-green-600 text-white px-8 py-3 rounded-lg">
                            Registrar Devolución
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
}
