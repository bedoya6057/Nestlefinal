import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { Search, Shirt, CheckCircle, AlertCircle, ArrowRightLeft, Truck } from 'lucide-react';
import clsx from 'clsx';

export function Laundry() {
    const [activeTab, setActiveTab] = useState('shipment'); // 'shipment' | 'return'

    // --- SHIPMENT STATE ---
    const [guideNumber, setGuideNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [items, setItems] = useState([
        { name: 'Chaqueta', qty: 0 },
        { name: 'Pantalon', qty: 0 },
        { name: 'Polo', qty: 0 }
    ]);

    // --- RETURN STATE ---
    const [returnGuide, setReturnGuide] = useState('');
    const [returnLoading, setReturnLoading] = useState(false);
    const [returnError, setReturnError] = useState(null);
    const [returnSuccess, setReturnSuccess] = useState(null); // null, 'Completa', 'Incompleta'
    const [returnObservation, setReturnObservation] = useState('');
    const [sentItems, setSentItems] = useState(null); // Items fetched from DB
    const [returnQuantities, setReturnQuantities] = useState({}); // { "Chaqueta": 2 }

    // --- SHIPMENT HANDLERS ---
    const handleQtyChange = (index, value) => {
        const newItems = [...items];
        newItems[index].qty = parseInt(value) || 0;
        setItems(newItems);
    };

    const handleShipmentSubmit = async () => {
        const itemsToRegister = items.map(i => ({ ...i, qty: i.qty }));
        if (!guideNumber) {
            setError('Debe ingresar Número de Guía.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await axios.post('http://localhost:8000/api/laundry', {
                guide_number: guideNumber,
                weight: 0,
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
            console.error(err);
            const detail = err.response?.data?.detail;
            if (typeof detail === 'object') {
                setError(JSON.stringify(detail));
            } else {
                setError(detail || 'Error al registrar lavado');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- RETURN HANDLERS ---
    const handleSearchGuide = async () => {
        if (!returnGuide) {
            setReturnError('Ingrese un número de guía');
            return;
        }
        setReturnLoading(true);
        setReturnError(null);
        setSentItems(null);
        setReturnSuccess(null);
        setReturnObservation('');

        try {
            const res = await axios.get(`http://localhost:8000/api/laundry/guide/${returnGuide}`);
            const fetchedItems = JSON.parse(res.data.items_json);
            setSentItems(fetchedItems);
            // Initialize return quantities to 0
            const initialQuantities = {};
            fetchedItems.forEach(item => {
                initialQuantities[item.name] = 0;
            });
            setReturnQuantities(initialQuantities);
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (typeof detail === 'object') {
                setReturnError(JSON.stringify(detail));
            } else {
                setReturnError(detail || 'Error al buscar la guía');
            }
        } finally {
            setReturnLoading(false);
        }
    };

    const handleReturnQtyChange = (name, value) => {
        const qty = parseInt(value) || 0;
        // Validate max quantity
        const sentItem = sentItems.find(i => i.name === name);
        if (sentItem && qty > sentItem.qty) return;

        setReturnQuantities(prev => ({ ...prev, [name]: qty }));
    };

    const handleReturnSubmit = async () => {
        setReturnLoading(true);
        setReturnError(null);

        const itemsToReturn = Object.entries(returnQuantities).map(([name, qty]) => ({
            name,
            qty
        }));

        try {
            const res = await axios.post('http://localhost:8000/api/laundry/return', {
                guide_number: returnGuide,
                items: itemsToReturn
            });

            setReturnSuccess(res.data.status);
            setReturnObservation(res.data.observation);
            // Clear items to force re-search or reset
            setSentItems(null);
            setReturnGuide('');
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (typeof detail === 'object') {
                setReturnError(JSON.stringify(detail));
            } else {
                setReturnError(detail || 'Error al registrar devolución');
            }
        } finally {
            setReturnLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Gestión de Lavandería</h2>

            {/* TABS */}
            <div className="flex border-b border-slate-200">
                <button
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'shipment'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                    onClick={() => setActiveTab('shipment')}
                >
                    <Truck size={18} />
                    Registrar Envío
                </button>
                <button
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'return'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                    onClick={() => setActiveTab('return')}
                >
                    <ArrowRightLeft size={18} />
                    Registrar Devolución
                </button>
            </div>

            {/* SHIPMENT CONTENT */}
            {activeTab === 'shipment' && (
                <Card className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Número de Guía</label>
                            <Input
                                placeholder="Ej. G-2024-001"
                                value={guideNumber}
                                onChange={e => setGuideNumber(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-4 mt-6">
                            <h4 className="font-medium text-slate-700">Detalle de Prendas a Enviar:</h4>
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
                            <Button onClick={handleShipmentSubmit} disabled={loading} className="w-full text-lg h-12">
                                {loading ? 'Registrando...' : 'Registrar Envío'}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl mt-4">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl mt-4">
                            <CheckCircle size={24} />
                            <span className="font-medium text-lg">Envío registrado exitosamente</span>
                        </div>
                    )}
                </Card>
            )}

            {/* RETURN CONTENT */}
            {activeTab === 'return' && (
                <Card className="p-6 space-y-4">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar Guía de Envío</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <Input
                                    placeholder="Ingrese Número de Guía (Ej. G-2024-001)"
                                    value={returnGuide}
                                    onChange={e => setReturnGuide(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                        </div>
                        <Button onClick={handleSearchGuide} disabled={returnLoading}>
                            Buscar
                        </Button>
                    </div>

                    {returnError && (
                        <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {returnError}
                        </div>
                    )}

                    {sentItems && (
                        <div className="mt-6 border-t border-slate-100 pt-6 space-y-6">
                            <h4 className="font-medium text-slate-800">Registrar Devolución de Prendas:</h4>
                            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">
                                Ingrese la cantidad de prendas que están siendo devueltas. Si falta alguna, el sistema lo marcará como incompleto.
                            </div>

                            <div className="space-y-3">
                                {sentItems.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div>
                                            <span className="font-bold text-slate-700 block">{item.name}</span>
                                            <span className="text-xs text-slate-500">Enviado: {item.qty}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium text-slate-700">Devuelve:</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max={item.qty}
                                                value={returnQuantities[item.name]}
                                                onChange={e => handleReturnQtyChange(item.name, e.target.value)}
                                                className={clsx(
                                                    "w-24 text-center font-bold",
                                                    returnQuantities[item.name] < item.qty ? "text-orange-600 border-orange-200" : "text-green-600 border-green-200"
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button onClick={handleReturnSubmit} disabled={returnLoading} className="w-full h-12 text-lg mt-4" variant="secondary">
                                {returnLoading ? 'Procesando...' : 'Confirmar Devolución'}
                            </Button>
                        </div>
                    )}

                    {returnSuccess && (
                        <div className={clsx(
                            "flex flex-col gap-1 p-4 rounded-xl mt-4 border",
                            returnSuccess === 'Completa' ? "bg-green-50 border-green-200 text-green-800" : "bg-orange-50 border-orange-200 text-orange-800"
                        )}>
                            <div className="flex items-center gap-2 font-bold text-lg">
                                {returnSuccess === 'Completa' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                                <span>Devolución {returnSuccess}</span>
                            </div>
                            {returnObservation && (
                                <p className="text-sm ml-8 opacity-90">{returnObservation}</p>
                            )}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
