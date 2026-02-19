import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { Search, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export function LaundryReturn() {
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
            // Ruta relativa corregida para Render
            const res = await axios.get(`/api/laundry/${guideNumber.trim()}/status`);
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
            await axios.post('/api/laundry/return', {
                guide_number: guideNumber,
                items: itemsToReturn
            });
            setSuccess(true);
            
            // Refrescar datos tras el éxito
            const res = await axios.get(`/api/laundry/${guideNumber}/status`);
            setLaundryData(res.data);
            setReturnItems({});
        } catch (err) {
            setError('Error al registrar la devolución.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <RotateCcw className="text-green-600" />
                Recepción de Lavandería
            </h2>

            <Card className="p-6">
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
                    <span className="font-medium text-lg">Recepción registrada exitosamente</span>
                </div>
            )}

            {laundryData && (
                <Card className="p-8">
                    <div className="flex items-start justify-between mb-6 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Guía N° {guideNumber}</h3>
                            <p className="text-slate-500">Gestione el retorno de prendas para esta guía.</p>
                        </div>
                        <div className={`px-4 py-1 rounded-full text-sm font-bold ${laundryData.every(i => i.pending === 0)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                            {laundryData.every(i => i.pending === 0) ? 'COMPLETADO' : 'PENDIENTE'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-12 text-sm text-slate-500 font-medium px-4 mb-2">
                            <div className="col-span-4">Prenda</div>
                            <div className="col-span-2 text-center">Enviado</div>
                            <div className="col-span-2 text-center">Ya Retornado</div>
                            <div className="col-span-2 text-center text-orange-600">Pendiente</div>
                            <div className="col-span-2 text-center">Ingresar</div>
                        </div>

                        {laundryData.map((item, index) => (
                            <div key={index} className={`grid grid-cols-12 items-center p-4 rounded-lg border ${item.pending > 0 ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-75'}`}>
                                <div className="col-span-4 font-medium text-slate-800">{item.name}</div>
                                <div className="col-span-2 text-center text-slate-600">{item.sent}</div>
                                <div className="col-span-2 text-center text-slate-600">{item.returned}</div>
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
                                            className="text-center h-9"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {laundryData.some(i => i.pending > 0) && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <Button onClick={handleSubmit} disabled={loading} className="w-full text-lg h-12 bg-green-600 hover:bg-green-700">
                                {loading ? 'Procesando...' : 'Confirmar Recepción'}
                            </Button>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
