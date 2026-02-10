import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { Search, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export function LaundryReturn() {
    const [dni, setDni] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [laundryStatus, setLaundryStatus] = useState([]);
    const [returnItems, setReturnItems] = useState({}); // { "Item Name": qty_to_return }

    const searchUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUser(null);
        setLaundryStatus([]);
        setReturnItems({});
        setSuccess(false);

        try {
            // CORRECCIÓN: Rutas relativas para funcionar en Render
            const resUser = await axios.get(`/api/users/${dni}`);
            setUser(resUser.data);

            const resStatus = await axios.get(`/api/laundry/${dni}/status`);
            setLaundryStatus(resStatus.data);

        } catch (err) {
            setError(err.response?.status === 404 ? 'Usuario no encontrado' : 'Error al buscar información');
        } finally {
            setLoading(false);
        }
    };

    const handleReturnQtyChange = (itemName, value, maxPending) => {
        let qty = parseInt(value) || 0;
        if (qty < 0) qty = 0;
        if (qty > maxPending) qty = maxPending;

        setReturnItems(prev => ({
            ...prev,
            [itemName]: qty
        }));
    };

    const handleSubmit = async () => {
        const itemsToReturn = Object.entries(returnItems)
            .filter(([_, qty]) => qty > 0)
            .map(([name, qty]) => ({ name, qty }));

        if (itemsToReturn.length === 0) {
            setError('Debe seleccionar al menos una prenda para devolver.');
            return;
        }

        setLoading(true);
        try {
            // CORRECCIÓN: Ruta relativa para registrar la devolución
            await axios.post('/api/laundry/return', {
                dni: user.dni,
                items: itemsToReturn
            });
            setSuccess(true);
            
            // CORRECCIÓN: Actualizar estado con ruta relativa
            const resStatus = await axios.get(`/api/laundry/${dni}/status`);
            setLaundryStatus(resStatus.data);
            setReturnItems({}); 
        } catch (err) {
            setError('Error al registrar la devolución.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Entregar Lavado (Devolución)</h2>

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
                    <span className="font-medium text-lg">Devolución registrada exitosamente</span>
                </div>
            )}

            {user && (
                <Card className="p-8">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{user.name} {user.surname}</h3>
                            <p className="text-slate-500 mt-1">DNI: {user.dni}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                            <RotateCcw size={24} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-medium text-slate-700">Prendas en Proceso (Pendientes de Devolución):</h4>

                        {laundryStatus.length === 0 ? (
                            <p className="text-slate-500 italic text-center py-4">Este usuario no tiene prendas pendientes en lavandería.</p>
                        ) : (
                            <div className="space-y-4">
                                {laundryStatus.map((item, index) => (
                                    <div key={index} className={`flex items-center justify-between p-4 rounded-lg border ${item.pending > 0 ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent'}`}>
                                        <div>
                                            <span className="font-medium text-slate-800 block">{item.name}</span>
                                            <div className="text-xs text-slate-500 mt-1 space-x-3">
                                                <span>Enviadas: {item.sent}</span>
                                                <span>Devueltas: {item.returned}</span>
                                                <span className={item.pending > 0 ? "text-orange-600 font-bold" : "text-green-600 font-bold"}>
                                                    Pendientes: {item.pending}
                                                </span>
                                            </div>
                                        </div>

                                        {item.pending > 0 && (
                                            <div className="flex items-center gap-3">
                                                <label className="text-sm text-slate-500">Devolver:</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={item.pending}
                                                    value={returnItems[item.name] || ''}
                                                    onChange={e => handleReturnQtyChange(item.name, e.target.value, item.pending)}
                                                    placeholder="0"
                                                    className="w-24 text-center"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {laundryStatus.some(i => i.pending > 0) && (
                            <div className="pt-6 border-t border-slate-100">
                                <Button onClick={handleSubmit} disabled={loading} className="w-full text-lg h-12 bg-green-600 hover:bg-green-700">
                                    {loading ? 'Procesando...' : 'Registrar Devolución'}
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
