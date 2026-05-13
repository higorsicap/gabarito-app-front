import { useAuth } from '@/src/contexts/AuthContext';

import NetInfo from '@react-native-community/netinfo';

import { router } from 'expo-router';

import {
    useEffect,
    useRef,
    useState
} from 'react';

import {
    ActivityIndicator,
    View
} from 'react-native';

export default function Index() {

    const {
        user,
        loading
    } = useAuth();

    const [isConnected, setIsConnected] =
        useState<boolean | null>(null);

    const redirected =
        useRef(false);

    useEffect(() => {

        const unsubscribe =
            NetInfo.addEventListener(
                (state) => {

                    const conectado =
                        !!state.isConnected;

                    setIsConnected(
                        conectado
                    );

                }
            );

        return () =>
            unsubscribe();

    }, []);

    useEffect(() => {

        if (loading) return;

        if (isConnected === null)
            return;

        if (redirected.current)
            return;

        redirected.current = true;

        // 🔥 NÃO LOGADO
        if (!user) {

            router.replace(
                '/(auth)/login'
            );

            return;

        }

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

    }, [
        user,
        loading,
        isConnected
    ]);

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