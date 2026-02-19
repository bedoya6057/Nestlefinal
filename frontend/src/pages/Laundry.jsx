import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { Truck, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';

export function Laundry() {
    const [guideNumber, setGuideNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [items, setItems] = useState([
        { name: 'Chaqueta', qty: 0 },
        { name: 'Pantalon', qty: 0 },
        { name: 'Polo', qty: 0 }
    ]);

    const handleQtyChange = (index, value) => {
        const newItems = [...items];
        newItems[index].qty = parseInt(value) || 0;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { name: '', qty: 0, custom: true }]);
    };

    const updateItemName = (index, name) => {
        const newItems = [...items];
        newItems[index].name = name;
        setItems(newItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!guideNumber.trim()) {
            setError('Debe ingresar un número de guía.');
            return;
        }

        const itemsToRegister = items.filter(i => i.qty > 0 && i.name.trim() !== '');
        if (itemsToRegister.length === 0) {
            setError('Debe registrar al menos una prenda.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await axios.post('/api/laundry', {
                guide_number: guideNumber,
                items: itemsToRegister
            });
            setSuccess(true);
            setGuideNumber('');
            setItems([
                { name: 'Chaqueta', qty: 0 },
                { name: 'Pantalon', qty: 0 },
                { name: 'Polo', qty: 0 }
            ]);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al registrar servicio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 space-y-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="text-blue-600" />
                Envío a Lavandería
            </h2>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Guía</label>
                <Input
                    placeholder="Ej: 001-000123"
                    value={guideNumber}
                    onChange={e => setGuideNumber(e.target.value)}
                    className="w-full uppercase"
                />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-medium text-slate-700">Detalle de Prendas</h4>
                    <Button variant="outline" size="sm" onClick={addItem}>+ Agregar</Button>
                </div>

                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <div className="flex-1">
                            {item.custom ? (
                                <Input value={item.name} onChange={e => updateItemName(index, e.target.value)} placeholder="Nombre" />
                            ) : (
                                <div className="px-3 py-2 bg-slate-50 border rounded-md">{item.name}</div>
                            )}
                        </div>
                        <Input type="number" min="0" value={item.qty} onChange={e => handleQtyChange(index, e.target.value)} className="w-32" />
                        {item.custom && (
                            <button onClick={() => removeItem(index)} className="text-red-500 p-2"><Trash2 size={18} /></button>
                        )}
                    </div>
                ))}
            </div>

            {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>}
            {success && <div className="text-green-600 bg-green-50 p-4 rounded-lg">Guía registrada exitosamente</div>}

            <Button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600">
                {loading ? 'Registrando...' : 'Registrar Envío'}
            </Button>
        </Card>
    );
}
