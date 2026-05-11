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

    const { user, loading } = useAuth();

    const [isConnected, setIsConnected] =
        useState<boolean | null>(null);

    // 🔥 evita múltiplos redirects
    const redirected = useRef(false);

    useEffect(() => {

        const unsubscribe = NetInfo.addEventListener(
            (state) => {

                const conectado =
                    !!state.isConnected &&
                    !!state.isInternetReachable;

                setIsConnected(conectado);

            }
        );

        return () => unsubscribe();

    }, []);

    useEffect(() => {

        // 🔥 ainda carregando auth
        if (loading) return;

        // 🔥 aguardando netinfo
        if (isConnected === null) return;

        // 🔥 evita navegar múltiplas vezes
        if (redirected.current) return;

        redirected.current = true;

        // 🔥 ONLINE
        if (isConnected) {

            if (user) {

                router.replace('/home');

            } else {

                router.replace('/login');

            }

        }

        // 🔥 OFFLINE
        else {

            router.replace('/download');

        }

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

            <ActivityIndicator size="large" />

        </View>

    );

}