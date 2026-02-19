import { useState } from 'react';
import axios from 'axios';
import { Search, Plus, Save, Trash2, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function UniformReturn() {
    const [dni, setDni] = useState('');
    const [user, setUser] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const ALLOWED_ITEMS = ["Polo", "Pantalon", "Chaqueta"];
    // Default items to populate on search
    const DEFAULT_ITEMS = [
        { name: "Polo", qty: 1, fixed: true },
        { name: "Pantalon", qty: 1, fixed: true },
        { name: "Chaqueta", qty: 1, fixed: true }
    ];

    const searchUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setUser(null);
        setItems([]);
        setSuccess('');

        try {
            const res = await axios.get(`http://localhost:8000/api/users/${dni}`);
            setUser(res.data);
            // Pre-populate with default items
            setItems(DEFAULT_ITEMS);
        } catch (err) {
            setError('Usuario no encontrado');
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, { name: 'Polo', qty: 1, fixed: false }]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
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
            items: items.map(i => ({ name: i.name, qty: parseInt(i.qty) })),
            observations: ""
        };

        try {
            await axios.post('http://localhost:8000/api/uniform-returns', payload);
            setSuccess('Devolución registrada correctamente');
            setDni('');
            setUser(null);
            setItems([]);
        } catch (err) {
            console.error(err);
            setError('Error al registrar la devolución');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Devolución de Uniformes</h2>

            {/* Search Section */}
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
                        Buscar
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">
                        {success}
                    </div>
                )}
            </Card>

            {/* Return Form */}
            {user && (
                <Card className="p-6 space-y-6">
                    <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-slate-700">Datos del Trabajador</h3>
                        <p className="text-slate-600">{user.name} {user.surname}</p>
                        <p className="text-slate-500 text-sm">{user.position} - {user.area}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-700">Items a Devolver</h3>
                            <button
                                onClick={addItem}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                            >
                                <Plus size={16} />
                                Agregar Item
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
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                {ALLOWED_ITEMS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
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
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    {!item.fixed && (
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
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
                            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                        >
                            <Save size={20} />
                            Registrar Devolución
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
}
