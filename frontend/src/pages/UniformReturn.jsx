import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { Search, Package, CheckCircle, AlertCircle } from 'lucide-react';

export function UniformReturn() {
    const [dni, setDni] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [returnData, setReturnData] = useState(null);
    const [error, setError] = useState(null);
    const [items, setItems] = useState([]);
    const [returnDate, setReturnDate] = useState('');

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleAddItem = () => {
        setItems([...items, { name: "", qty: 1 }]);
    };

    const searchUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUser(null);
        setReturnData(null);
        try {
            const res = await axios.get(`http://localhost:8000/api/users/${dni}`);
            setUser(res.data);
            // Pre-populate with default items as requested
            setItems([
                { name: "Pantalon", qty: 1 },
                { name: "Polo", qty: 1 },
                { name: "Chaqueta", qty: 1 }
            ]);

            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setReturnDate(now.toISOString().slice(0, 16));
        } catch (err) {
            setError(err.response?.status === 404 ? 'Usuario no encontrado' : 'Error al buscar');
        } finally {
            setLoading(false);
        }
    };

    const processReturn = async () => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/api/uniform-returns', {
                dni: user.dni,
                items: items,
                date: new Date(returnDate).toISOString()
            });
            setReturnData(res.data);
        } catch (err) {
            console.error("Return Error:", err);
            const msg = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail))
                : err.message;
            setError(`Error al procesar la devolución: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Devolución de Uniformes</h2>

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
                        Buscar
                    </Button>
                </form>
            </Card>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {user && !returnData && (
                <Card className="p-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{user.name} {user.surname}</h3>
                            <p className="text-slate-500 mt-1">DNI: {user.dni}</p>
                            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {user.contract_type}
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Package size={24} />
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Fecha y Hora de Devolución</label>
                            <Input
                                type="datetime-local"
                                value={returnDate}
                                onChange={(e) => setReturnDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Items Devueltos</label>
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        {item.name && ['Polo', 'Pantalon', 'Chaqueta'].includes(item.name) ? (
                                            <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
                                                {item.name}
                                            </div>
                                        ) : (
                                            <select
                                                value={item.name}
                                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="">Seleccionar Prenda...</option>
                                                <option value="Polo">Polo</option>
                                                <option value="Pantalon">Pantalon</option>
                                                <option value="Chaqueta">Chaqueta</option>
                                            </select>
                                        )}
                                        <Input
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                                            className="w-20"
                                            min="1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 px-3"
                                            onClick={() => handleRemoveItem(index)}
                                        >
                                            X
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full dashed border-2 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-500"
                                    onClick={handleAddItem}
                                >
                                    + Agregar Item
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-100 pt-8">
                        <Button onClick={processReturn} disabled={loading} className="w-full text-lg h-12 bg-red-600 hover:bg-red-700">
                            {loading ? 'Procesando...' : 'Confirmar Devolución'}
                        </Button>
                    </div>
                </Card>
            )}

            {returnData && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl">
                        <CheckCircle size={24} />
                        <span className="font-medium text-lg">Devolución registrada exitosamente</span>
                    </div>

                    <Card className="p-6">
                        <h4 className="font-medium mb-4">Items Devueltos:</h4>
                        <ul className="space-y-2 mb-6">
                            {returnData.items?.map((item, i) => (
                                <li key={i} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                                    <span>{item.name}</span>
                                    <span className="font-bold">x{item.qty}</span>
                                </li>
                            )) || JSON.parse(returnData.items_json).map((item, i) => (
                                <li key={i} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                                    <span>{item.name}</span>
                                    <span className="font-bold">x{item.qty}</span>
                                </li>
                            ))}
                        </ul>
                        <Button onClick={() => window.location.reload()} className="w-full">
                            Nueva Devolución
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
}
