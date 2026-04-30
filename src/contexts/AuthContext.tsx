import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

// 🔥 define o tipo AQUI mesmo
type User = {
    id_aplicador: number;
    cpf_aplicador?: string;
    token?: any;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;

    login: (user: User) => Promise<void>;
    logout: () => Promise<void>;

    getIdAplicador: () => number | null;
    isAuthenticated: boolean;
};

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: any) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    async function loadUser() {
        try {
            const stored = await AsyncStorage.getItem('@user');

            if (stored) {
                const parsed = JSON.parse(stored);

                if (parsed?.id_aplicador) {
                    setUser(parsed);
                } else {
                    await AsyncStorage.removeItem('@user');
                }
            }
        } catch (error) {
            console.log('Erro ao carregar usuário:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUser();
    }, []);

    async function login(userData: User) {
        try {
            if (!userData?.id_aplicador) {
                throw new Error('Usuário inválido (sem id_aplicador)');
            }

            setUser(userData);
            await AsyncStorage.setItem('@user', JSON.stringify(userData));

        } catch (error) {
            console.log('Erro no login:', error);
            throw error;
        }
    }

    async function logout() {
        try {
            setUser(null);
            await AsyncStorage.removeItem('@user');
        } catch (error) {
            console.log('Erro no logout:', error);
        }
    }

    function getIdAplicador() {
        return user?.id_aplicador ?? null;
    }

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                getIdAplicador,
                isAuthenticated
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}