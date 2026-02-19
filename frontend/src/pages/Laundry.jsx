import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { Truck, CheckCircle, AlertCircle, Plus, Trash2, RotateCcw, ArrowRight } from 'lucide-react';

export function Laundry() {
    const [activeTab, setActiveTab] = useState('send'); // 'send' or 'receive'

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="text-blue-600" />
                Gestión de Lavandería
            </h2>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('send')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'send'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Registrar Envío
                </button>
                <button
                    onClick={() => setActiveTab('receive')}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'receive'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Registrar Retorno
                </button>
            </div>

            {activeTab === 'send' ? <LaundrySend /> : <LaundryReceive />}
        </div>
    );
}

function LaundrySend() {
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
            setError('Debe registrar al menos una prenda con cantidad mayor a 0.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await axios.post('http://localhost:8000/api/laundry', {
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
            setError(err.response?.data?.detail || 'Error al registrar servicio de lavandería');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 space-y-6">
            <div className="flex items-center gap-2 mb-4 border-b pb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <ArrowRight size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Envío de Prendas</h3>
                    <p className="text-sm text-slate-500">Registre la salida de prendas hacia la lavandería.</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Guía de Remisión</label>
                <Input
                    placeholder="Ej: 001-000123"
                    value={guideNumber}
                    onChange={e => setGuideNumber(e.target.value)}
                    className="w-full text-lg uppercase"
                />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-medium text-slate-700">Detalle de Prendas</h4>
                    <Button variant="outline" size="sm" onClick={addItem} className="flex items-center gap-1">
                        <Plus size={16} /> Agregar Otro
                    </Button>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 mb-1 block">Prenda</label>
                                {item.custom ? (
                                    <Input
                                        value={item.name}
                                        onChange={e => updateItemName(index, e.target.value)}
                                        placeholder="Nombre de prenda"
                                    />
                                ) : (
                                    <div className="px-3 py-2 bg-white border rounded-md text-slate-700 font-medium">
                                        {item.name}
                                    </div>
                                )}
                            </div>
                            <div className="w-32">
                                <label className="text-xs text-slate-500 mb-1 block">Cantidad</label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={item.qty}
                                    onChange={e => handleQtyChange(index, e.target.value)}
                                    className="text-center"
                                />
                            </div>
                            {item.custom && (
                                <div className="pt-5">
                                    <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-2">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl">
                    <CheckCircle size={24} />
                    <span className="font-medium text-lg">Guía registrada exitosamente</span>
                </div>
            )}

            <div className="pt-4 border-t border-slate-100">
                <Button onClick={handleSubmit} disabled={loading} className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? 'Registrando...' : 'Registrar Envío'}
                </Button>
            </div>
        </Card>
    );
}

function LaundryReceive() {
    const [guideNumber, setGuideNumber] = useState('');
    const [laundryData, setLaundryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [returnItems, setReturnItems] = useState({});

    const searchGuide = async (e) => {
        e.preventDefault();
        if (!guideNumber.trim()) return;

        setLoading(true);
        setError(null);
        setLaundryData(null);
        setReturnItems({});
        setSuccess(false);

        try {
            const res = await axios.get(`http://localhost:8000/api/laundry/${guideNumber.trim()}/status`);
            setLaundryData(res.data);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Guía no encontrada' : 'Error al buscar guía');
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
            setError('Debe ingresar cantidad a devolver en al menos una prenda.');
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:8000/api/laundry/return', {
                guide_number: guideNumber,
                items: itemsToReturn
            });
            setSuccess(true);

            // Refresh
            const res = await axios.get(`http://localhost:8000/api/laundry/${guideNumber}/status`);
            setLaundryData(res.data);
            setReturnItems({});
        } catch (err) {
            setError('Error al registrar la devolución.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 space-y-6">
            <div className="flex items-center gap-2 mb-4 border-b pb-4">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                    <RotateCcw size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Recepción de Prendas</h3>
                    <p className="text-sm text-slate-500">Registre el retorno de prendas desde la lavandería.</p>
                </div>
            </div>

            <form onSubmit={searchGuide} className="flex gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Ingrese N° Guía de Remisión"
                        value={guideNumber}
                        onChange={e => setGuideNumber(e.target.value)}
                        className="w-full uppercase"
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    <Search className="mr-2" size={18} />
                    {loading ? 'Buscando...' : 'Buscar Guía'}
                </Button>
            </form>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl">
                    <CheckCircle size={24} />
                    <span className="font-medium text-lg">Recepción registrada exitosamente</span>
                </div>
            )}

            {laundryData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado de Guía</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono font-bold text-slate-700">{guideNumber}</span>
                            </div>
                        </div>
                        <div className={`px-4 py-1 rounded-full text-xs font-bold ${laundryData.every(i => i.pending === 0)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                            {laundryData.every(i => i.pending === 0) ? 'COMPLETADO' : 'PENDIENTE DE RETORNO'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-12 text-xs uppercase font-bold text-slate-400 px-4">
                            <div className="col-span-4">Prenda</div>
                            <div className="col-span-2 text-center">Enviado</div>
                            <div className="col-span-2 text-center">Retornado</div>
                            <div className="col-span-2 text-center text-orange-600">Pendiente</div>
                            <div className="col-span-2 text-center">Ingresar</div>
                        </div>

                        {laundryData.map((item, index) => (
                            <div key={index} className={`grid grid-cols-12 items-center p-4 rounded-lg border transition-all ${item.pending > 0 ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'}`}>
                                <div className="col-span-4 font-medium text-slate-800">{item.name}</div>
                                <div className="col-span-2 text-center text-slate-600 bg-slate-100 rounded mx-2 py-1">{item.sent}</div>
                                <div className="col-span-2 text-center text-slate-600 bg-slate-100 rounded mx-2 py-1">{item.returned}</div>
                                <div className="col-span-2 text-center font-bold text-orange-600">{item.pending}</div>
                                <div className="col-span-2">
                                    {item.pending > 0 && (
                                        <Input
                                            type="number"
                                            min="0"
                                            max={item.pending}
                                            value={returnItems[item.name] || ''}
                                            onChange={e => handleReturnQtyChange(item.name, e.target.value, item.pending)}
                                            placeholder="0"
                                            className="text-center h-10 border-green-200 focus:border-green-500 focus:ring-green-200"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {laundryData.some(i => i.pending > 0) && (
                        <div className="pt-6 border-t border-slate-100">
                            <Button onClick={handleSubmit} disabled={loading} className="w-full text-lg h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/10">
                                {loading ? 'Procesando...' : 'Confirmar Recepción'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}

// Helper icon component since Search wasn't imported in LaundryReceive scope above
function Search({ className, size }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    );
}
