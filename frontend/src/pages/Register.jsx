import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function Register() {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        dni: '',
        contract_type: 'Regular Otro sindicato'
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await axios.post('http://localhost:8000/api/users', formData);
            setStatus('success');
            setFormData({ name: '', surname: '', dni: '', contract_type: 'Regular Otro sindicato' });
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Registrar Trabajador</h2>

            <Card className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Nombre</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Juan"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Apellido</label>
                            <Input
                                value={formData.surname}
                                onChange={e => setFormData({ ...formData, surname: e.target.value })}
                                required
                                placeholder="Perez"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">DNI</label>
                        <Input
                            value={formData.dni}
                            onChange={e => setFormData({ ...formData, dni: e.target.value })}
                            required
                            placeholder="12345678"
                            maxLength={8}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Tipo de Contratación</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                            value={formData.contract_type}
                            onChange={e => setFormData({ ...formData, contract_type: e.target.value })}
                        >
                            <option value="Regular Otro sindicato">Regular Otro sindicato</option>
                            <option value="Regular PYA">Regular PYA</option>
                            <option value="Temporal">Temporal</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={status === 'loading'}>
                            {status === 'loading' ? 'Registrando...' : 'Registrar Trabajador'}
                        </Button>
                    </div>

                    {status === 'success' && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                            <CheckCircle size={20} />
                            <span>Trabajador registrado exitosamente</span>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertCircle size={20} />
                            <span>Error al registrar. Verifica el DNI.</span>
                        </div>
                    )}
                </form>
            </Card>
        </div>
    );
}
