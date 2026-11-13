import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "@/src/components/BottomNav";
import { useHome } from "@/src/ts/useSaed";

export default function Home() {
  const router = useRouter();

  const { loading, provasFiltradas } = useHome();

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#ffffff00" }}>
      <SafeAreaView style={styles.container} edges={[]}>
        {/* HEADER */}
        <BottomNav />

        {/* CONTEÚDO */}
        <View style={styles.content}>
          <Text style={styles.title}>Lista de Avaliações disponíveis:</Text>
        </View>

        {/* LISTAGEM */}
        <View style={{ flex: 1 }}>
          {loading && (
            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
          )}

          <FlatList
            data={provasFiltradas}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{
              paddingHorizontal: 10,
              paddingBottom: 20,
            }}
            ListEmptyComponent={() => {
              if (loading) return null;

              return (
                <Text style={styles.emptyText}>
                  Nenhuma prova salva offline
                </Text>
              );
            }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{item.prova}</Text>
                  <Text style={styles.data}>Municipio: {item.cliente}</Text>
                  <Text style={styles.data}>Ano Letivo: {item.ano}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    console.log("ID da avaliação selecionada:", item.id_prova);

                    router.push({
                      pathname: "/(professor)/scanner",
                      params: {
                        idAvaliacao: String(item.id_prova),
                      },
                    });
                  }}
                  style={styles.botaoScan}
                  hitSlop={10}
                >
                  <Ionicons name="camera-outline" size={24} color="#2563EB" />
                </Pressable>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#efefef",
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  nome: {
    fontSize: 16,
    fontWeight: "bold",
  },
  data: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  botaoScan: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    color: "#666",
  },
});
