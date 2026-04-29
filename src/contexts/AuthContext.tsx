import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/user';

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (user: User) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: any) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    async function loadUser() {
        const stored = await AsyncStorage.getItem('@user');

        if (stored) {
            setUser(JSON.parse(stored));
        }

        setLoading(false);
    }

    useEffect(() => {
        loadUser();
    }, []);

    async function login(user: User) {
        setUser(user);
        await AsyncStorage.setItem('@user', JSON.stringify(user));
    }

    async function logout() {
        setUser(null);
        await AsyncStorage.removeItem('@user');
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}