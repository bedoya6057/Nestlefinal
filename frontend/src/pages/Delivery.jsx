import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { Search, Package, CheckCircle, FileText, AlertCircle } from 'lucide-react';

export function Delivery() {
    const [dni, setDni] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deliveryData, setDeliveryData] = useState(null);
    const [error, setError] = useState(null);
    const [items, setItems] = useState([]);
    const [deliveryDate, setDeliveryDate] = useState('');

    const determineDefaultItems = (contractType) => {
        if (contractType === "Regular Otro sindicato") {
            return [
                { name: "Juego de Uniforme (Chaqueta, Pantalon, Polo, Polera)", qty: 2 },
                { name: "Jabones de tocador", qty: 24 },
                { name: "Toallas", qty: 2 }
            ];
        } else if (contractType === "Regular PYA") {
            return [
                { name: "Juego de Uniforme (Chaqueta, Pantalon, Polo, Polera)", qty: 3 },
                { name: "Jabones Bolivar", qty: 24 },
                { name: "Jabones de tocador", qty: 22 },
                { name: "Toallas", qty: 2 }
            ];
        } else if (contractType === "Temporal") {
            return [
                { name: "Juego de Uniforme (Chaqueta, Pantalon, Polo, Polera)", qty: 3 },
                { name: "Par de zapatos", qty: 1 },
                { name: "Candado", qty: 1 },
                { name: "Casillero", qty: 1 },
                { name: "Jabones Bolivar", qty: 2 }
            ];
        }
        return [];
    };

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
        setDeliveryData(null);
        try {
            const res = await axios.get(`http://localhost:8000/api/users/${dni}`);
            setUser(res.data);
            setItems(determineDefaultItems(res.data.contract_type));

            // Set default date to current time in local format for input
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setDeliveryDate(now.toISOString().slice(0, 16));
        } catch (err) {
            setError(err.response?.status === 404 ? 'Usuario no encontrado' : 'Error al buscar');
        } finally {
            setLoading(false);
        }
    };

    const processDelivery = async () => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/api/deliveries', {
                dni: user.dni,
                items: items,
                date: new Date(deliveryDate).toISOString()
            });
            setDeliveryData(res.data);
        } catch (err) {
            console.error("Delivery Error:", err);
            const msg = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail))
                : err.message;
            setError(`Error al procesar la entrega: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Entregar Uniformes</h2>

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

            {user && !deliveryData && (
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
                            <label className="text-sm font-medium text-slate-700">Fecha y Hora de Entrega</label>
                            <Input
                                type="datetime-local"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Lista de Items</label>
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={item.name}
                                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                            className="flex-1"
                                            placeholder="Nombre del item"
                                        />
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
                        <Button onClick={processDelivery} disabled={loading} className="w-full text-lg h-12">
                            {loading ? 'Procesando...' : 'Confirmar Entrega y Generar Acta'}
                        </Button>
                    </div>
                </Card>
            )}

            {deliveryData && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl">
                        <CheckCircle size={24} />
                        <span className="font-medium text-lg">Entrega registrada exitosamente</span>
                    </div>

                    <Card className="p-6">
                        <h4 className="font-medium mb-4">Items Entregados:</h4>
                        <ul className="space-y-2 mb-6">
                            {deliveryData.items.map((item, i) => (
                                <li key={i} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                                    <span>{item.name}</span>
                                    <span className="font-bold">x{item.qty}</span>
                                </li>
                            ))}
                        </ul>

                        <a
                            href={`http://localhost:8000${deliveryData.pdf_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            <FileText size={20} />
                            Descargar Acta PDF
                        </a>
                    </Card>
                </div>
            )}
        </div>
    );
}
