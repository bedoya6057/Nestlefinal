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
        if (!dni.trim()) return;
        setLoading(true);
        setError('');
        setUser(null);
        try {
            const res = await axios.get(`/api/users/${dni.trim()}`);
            setUser(res.data);
            setItems(DEFAULT_ITEMS);
        } catch (err) {
            setError('Trabajador no encontrado.');
        } finally {
            setLoading(false);
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const payload = {
                dni: user.dni,
                items: items.map(i => ({ name: i.name, qty: parseInt(i.qty) || 0 })).filter(i => i.qty > 0),
                observations: "Devolución"
            };
            await axios.post('/api/uniform-returns', payload);
            setSuccess('Registrado correctamente.');
            setUser(null);
            setDni('');
        } catch (err) {
            setError('Error de servidor al guardar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Devolución de Uniformes</h2>
            <Card className="p-6">
                <form onSubmit={searchUser} className="flex gap-4">
                    <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="DNI" className="flex-1 px-4 py-2 border rounded-lg" />
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Buscar</button>
                </form>
                {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
                {success && <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">{success}</div>}
            </Card>

            {user && (
                <Card className="p-6 space-y-4">
                    <div className="border-b pb-2">
                        <h3 className="font-bold">{user.name} {user.surname}</h3>
                    </div>
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-4 items-center">
                            <span className="flex-1">{item.name}</span>
                            <input type="number" value={item.qty} onChange={(e) => updateItem(index, 'qty', e.target.value)} className="border p-2 w-24" />
                        </div>
                    ))}
                    <button onClick={handleSubmit} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg">
                        {loading ? 'Guardando...' : 'Registrar Devolución'}
                    </button>
                </Card>
            )}
        </div>
    );
}
