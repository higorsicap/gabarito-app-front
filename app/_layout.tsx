import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

import { iniciarDb } from '../src/database/migrations';

function AuthGuard() {

  const { user, loading } = useAuth();

  const segments = useSegments();

  const router = useRouter();

  useEffect(() => {

    iniciarDb();

  }, []);

  useEffect(() => {

    if (loading) return;

    const currentRoute = segments[0];

    const isLogin = currentRoute === 'login';

    // NÃO LOGADO
    if (!user && !isLogin) {

      router.replace('/login');

      return;

    }

    // LOGADO
    if (user && isLogin) {

      router.replace('/home');

      return;

    }

  }, [user, loading, segments, router]);

  if (loading) {

    return (

      <View
        style={{
          flex: 1,
          justifyContent: 'center'
        }}
      >
        <ActivityIndicator size="large" />
      </View>

    );

  }

  return (

    <Stack
      screenOptions={{
        headerShown: false
      }}
    />

  );

}

export default function Layout() {

  return (

    <AuthProvider>

      <AuthGuard />

    </AuthProvider>

  );

}