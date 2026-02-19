import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Truck, FileText, Menu, X, LogOut, Shirt } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Delivery } from './pages/Delivery';
import { Laundry } from './pages/Laundry';
import { Reports } from './pages/Reports';
import { UniformReturn } from './pages/UniformReturn';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useState } from 'react';

function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const links = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/delivery', icon: Package, label: 'Entregar Uniformes' },
    { path: '/laundry', icon: Truck, label: 'Lavandería' },
    { path: '/uniform-return', icon: Shirt, label: 'Devolución Uniformes' },
    { path: '/reports', icon: FileText, label: 'Reportes' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <div className={`
                fixed top-0 left-0 h-full bg-slate-900 text-white w-64 transition-transform duration-300 z-40
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
        <div className="p-6 border-b border-slate-800 flex flex-col items-start gap-3">
          <div className="bg-white p-3 rounded-xl shadow-lg w-full flex justify-center">
            <img src="/logo.png" alt="Sodexo" className="h-16 w-auto object-contain" />
          </div>
          <div className="mt-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Ropería System</h1>
            <p className="text-sm text-slate-400">Gestión de Uniformes</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                                    ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                                `}
              >
                <Icon size={20} />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{user?.username}</p>
              <p className="text-xs text-slate-500">Operador</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-50 flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64 p-8">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/delivery" element={<Delivery />} />
                    <Route path="/laundry" element={<Laundry />} />
                    <Route path="/uniform-return" element={<UniformReturn />} />
                    <Route path="/reports" element={<Reports />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
