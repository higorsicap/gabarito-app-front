import {
    Stack,
    useRouter,
    useSegments
} from 'expo-router';

import { useEffect } from 'react';

import {
    ActivityIndicator,
    View
} from 'react-native';

import {
    AuthProvider,
    useAuth
} from '@/src/contexts/AuthContext';

import { iniciarDb } from '@/src/database/migrations';

function AuthGuard() {

    const {
        user,
        loading
    } = useAuth();

    const segments =
        useSegments();

    const router =
        useRouter();

    // 🔥 inicia banco
    useEffect(() => {

        iniciarDb();

    }, []);

    useEffect(() => {

        if (loading) return;

        const group =
            segments[0];

        const inAuthGroup =
            group === '(auth)';

        // =====================================
        // 🔥 NÃO LOGADO
        // =====================================

        if (!user && !inAuthGroup) {

            router.replace(
                '/(auth)/login'
            );

            return;

        }

        // =====================================
        // 🔥 LOGADO
        // =====================================

        if (user && inAuthGroup) {

            // 🔥 PROFESSOR
            if (
                user.tipo_acesso ===
                'professor'
            ) {

                router.replace(
                    '/(professor)/home'
                );

                return;

            }

            // 🔥 APLICADOR
            router.replace(
                '/(aplicador)/home'
            );

            return;

        }

    }, [
        user,
        loading,
        segments,
        router
    ]);

    // =====================================
    // 🔥 LOADING
    // =====================================

    if (loading) {

        return (

            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >

                <ActivityIndicator
                    size="large"
                />

            </View>

        );

    }

    // =====================================
    // 🔥 STACK
    // =====================================

    return (

        <Stack
            screenOptions={{
                headerShown: false
            }}
        />

    );

}

export default function RootLayout() {

    return (

        <AuthProvider>

            <AuthGuard />

        </AuthProvider>

    );

}