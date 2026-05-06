import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

function AuthGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0]; // 🔥 pode ser undefined

    const isLogin = currentRoute === 'login';

    // 🔥 NÃO LOGADO → força login
    if (!user && !isLogin) {
      router.replace('/login');
      return;
    }

    // 🔥 LOGADO → não deixa voltar pro login
    if (user && isLogin) {
      router.replace('/home');
      return;
    }

  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
}