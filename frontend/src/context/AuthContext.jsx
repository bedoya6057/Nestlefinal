
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('roperia_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.removeItem('roperia_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (email, password) => {
        return new Promise((resolve, reject) => {
            // Mock API call delay
            setTimeout(() => {
                if (email === 'roperia@roperia.com' && password === 'roperia') {
                    const userData = { email, name: 'Administrador Ropería' };
                    setUser(userData);
                    localStorage.setItem('roperia_user', JSON.stringify(userData));
                    resolve(userData);
                } else {
                    reject(new Error('Credenciales incorrectas'));
                }
            }, 500);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('roperia_user');
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
