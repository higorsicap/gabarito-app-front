import BottomNav from '@/src/components/BottomNav';
import { listarProvas } from '@/src/services/listaProvaService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {

  const { user, loading: authLoading } = useAuth();

  const [provas, setProvas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarProvas = useCallback(async () => {
    try {
      // 🔥 espera auth carregar
      if (authLoading) return;

      // 🔥 sem usuário → limpa
      if (!user?.id_aplicador) {
        setProvas([]);
        return;
      }

      setLoading(true);

      const res = await listarProvas({
        id_aplicador: user.id_aplicador
      });

      const data = res?.data || res;

      if (!Array.isArray(data)) {
        setProvas([]);
        return;
      }

      // 🔥 remove duplicados
      const listaUnica = Array.from(
        new Map(
          data.map((item: any) => [item.id_avaliacao, item])
        ).values()
      );

      const lista = listaUnica.map((item: any, index: number) => ({
        id: item.id_avaliacao ?? index,
        cliente: item.nome_cliente,
        prova: item.descricao_avaliacao,
        ano: item.id_anoletivo
      }));

      setProvas(lista);

    } catch (e: any) {
      console.log('Erro ao carregar provas:', e.message);
      setProvas([]);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    carregarProvas();
  }, [carregarProvas]);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>
        <Text style={styles.title}>Lista de provas atribuídas:</Text>
      </View>

      <View style={{ flex: 1 }}>

        {(loading || authLoading) && (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        )}

        <FlatList
          data={provas}
          keyExtractor={(item, index) =>
            item?.id ? String(item.id) : String(index)
          }

          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 120
          }}

          ListEmptyComponent={() => {
            if (loading || authLoading) return null;

            if (!user) {
              return (
                <Text style={{ marginTop: 20, textAlign: 'center' }}>
                  Usuário não autenticado
                </Text>
              );
            }

            return (
              <Text style={{ marginTop: 20, textAlign: 'center' }}>
                Nenhuma prova encontrada
              </Text>
            );
          }}

          renderItem={({ item }) => (
            <View style={styles.card}>

              <View style={{ flex: 1 }}>
                <Text style={styles.nome}>{item.prova}</Text>
                <Text style={styles.data}>{item.cliente}</Text>
                <Text style={styles.data}>Ano: {item.ano}</Text>
              </View>

              <View style={styles.actions}>

                {/* 📷 */}
                <TouchableOpacity
                  style={styles.btnCamera}
                  onPress={() =>
                    router.push({
                      pathname: '../scanner',
                      params: { prova: item.id }
                    })
                  }
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                </TouchableOpacity>

                {/* ⬇️ */}
                <TouchableOpacity
                  style={styles.btnDownload}
                  onPress={() => console.log('Download', item.id)}
                >
                  <Ionicons name="download" size={20} color="#fff" />
                </TouchableOpacity>

              </View>
            </View>
          )}
        />
      </View>

      <View style={styles.navbar}>
        <BottomNav />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efefef',
  },

  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    marginBottom: 10
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  card: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2
  },

  nome: {
    fontSize: 16,
    fontWeight: 'bold'
  },

  data: {
    fontSize: 12,
    color: '#777',
    marginTop: 4
  },

  actions: {
    flexDirection: 'row',
    gap: 10
  },

  btnCamera: {
    backgroundColor: '#4dabf7',
    padding: 10,
    borderRadius: 8
  },

  btnDownload: {
    backgroundColor: '#51cf66',
    padding: 10,
    borderRadius: 8
  },

  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  }
});