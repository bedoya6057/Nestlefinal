import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Package, Shirt, RefreshCw, FileText, Users, LogOut } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Register } from './pages/Register';
import { Delivery } from './pages/Delivery';
import { Laundry } from './pages/Laundry';
import { LaundryReturn } from './pages/LaundryReturn';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import clsx from 'clsx';
import { AnimatePresence } from 'framer-motion';

function NavLink({ to, icon: Icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium",
        isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      <Icon size={20} />
      {children}
    </Link>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-slate-800 flex justify-center">
        <div className="bg-white/95 p-3 rounded-xl shadow-lg w-full flex justify-center items-center">
          <img src="/logo.png" alt="Sodexo Logo" className="h-16 w-auto object-contain" />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
        <NavLink to="/register" icon={UserPlus}>Registrar Usuario</NavLink>
        <NavLink to="/delivery" icon={Package}>Entregar Uniformes</NavLink>
        <NavLink to="/laundry" icon={Shirt}>Lavandería (Envío)</NavLink>
        <NavLink to="/laundry-return" icon={RefreshCw}>Entregar Lavado</NavLink>
        <NavLink to="/reportes" icon={FileText}>Reportes</NavLink>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <Users size={16} />
          </div>
          <div>
            <p className="font-medium text-white">{user?.name || 'User'}</p>
            <p className="text-xs">{user?.email || 'Sodexo'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-center shadow-sm z-30 sticky top-0">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 text-center uppercase tracking-wide">
            Sistema de gestión de ropería
          </h1>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <AnimatePresence mode='wait'>
            {children}
          </AnimatePresence>
        </main>
      </div>
    </div>
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
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/delivery" element={<Delivery />} />
                  <Route path="/laundry" element={<Laundry />} />
                  <Route path="/laundry-return" element={<LaundryReturn />} />
                  <Route path="/reportes" element={<Reports />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
