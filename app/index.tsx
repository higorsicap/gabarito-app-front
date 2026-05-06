import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (user) {
            router.replace('/home');
        } else {
            router.replace('/login');
        }
    }, [user, loading]);

    return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator />
        </View>
    );
}