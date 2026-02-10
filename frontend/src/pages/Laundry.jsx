import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { Search, Shirt, CheckCircle, AlertCircle } from 'lucide-react';

export function Laundry() {
    const [dni, setDni] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [items, setItems] = useState([
        { name: 'Chaqueta', qty: 0 },
        { name: 'Pantalon', qty: 0 },
        { name: 'Polo', qty: 0 }
    ]);

    const searchUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUser(null);
        setSuccess(false);

        try {
            // CORRECCIÓN: Usar ruta relativa para que funcione en Render
            const res = await axios.get(`/api/users/${dni}`);

            if (res.data.contract_type !== 'Regular Otro sindicato') {
                setError('Este usuario no está habilitado para este servicio.');
                return;
            }

            setUser(res.data);
            setItems([
                { name: 'Chaqueta', qty: 0 },
                { name: 'Pantalon', qty: 0 },
                { name: 'Polo', qty: 0 }
            ]);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Usuario no encontrado' : 'Error al buscar');
        } finally {
            setLoading(false);
        }
    };

    const handleQtyChange = (index, value) => {
        const newItems = [...items];
        newItems[index].qty = parseInt(value) || 0;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        const itemsToRegister = items.filter(i => i.qty > 0);
        if (itemsToRegister.length === 0) {
            setError('Debe seleccionar al menos una prenda.');
            return;
        }

        setLoading(true);
        try {
            // CORRECCIÓN: Usar ruta relativa para el envío de datos
            await axios.post('/api/laundry', {
                dni: user.dni,
                items: itemsToRegister
            });
            setSuccess(true);
            setUser(null);
            setDni('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al registrar lavado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Registro de Lavandería</h2>

            <Card className="p-6">
                <form onSubmit={searchUser} className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por DNI..."
                            value={dni}
                            onChange={e => setDni(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        <Search className="mr-2" size={18} />
                        {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                </form>
            </Card>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl">
                    <CheckCircle size={24} />
                    <span className="font-medium text-lg">Prendas registradas para lavado exitosamente</span>
                </div>
            )}

            {user && (
                <Card className="p-8">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{user.name} {user.surname}</h3>
                            <p className="text-slate-500 mt-1">DNI: {user.dni}</p>
                            <div className="mt-2 text-sm text-blue-600 font-medium">
                                {user.contract_type} (Habilitado)
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                            <Shirt size={24} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-slate-700">Seleccione las prendas:</h4>
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <span className="font-medium text-slate-700">{item.name}</span>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-slate-500">Cantidad:</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={item.qty}
                                        onChange={e => handleQtyChange(index, e.target.value)}
                                        className="w-24 text-center"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <Button onClick={handleSubmit} disabled={loading} className="w-full text-lg h-12">
                            {loading ? 'Registrando...' : 'Registrar Ingreso a Lavandería'}
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
