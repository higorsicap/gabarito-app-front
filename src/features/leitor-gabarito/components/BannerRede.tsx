import { Pressable, StyleSheet, Text, View } from "react-native";

interface BannerRedeProps {
  online: boolean;
  pendentes: number;
  onSincronizar: () => void;
}

export default function BannerRede({
  online,
  pendentes,
  onSincronizar,
}: BannerRedeProps) {
  if (online && pendentes === 0) return null;

  if (!online) {
    return (
      <View style={[styles.banner, styles.offline]}>
        <Text style={styles.icone}>📵</Text>

        <Text style={styles.texto}>
          Sem internet · as provas serão salvas para envio posterior
        </Text>
      </View>
    );
  }

  return (
    <Pressable style={[styles.banner, styles.pendente]} onPress={onSincronizar}>
      <Text style={styles.icone}>☁️</Text>

      <View style={{ flex: 1 }}>
        <Text style={styles.texto}>
          {pendentes} prova{pendentes !== 1 ? "s" : ""} aguardando sincronização
        </Text>

        <Text style={styles.subtexto}>Toque para sincronizar agora</Text>
      </View>

      <Text style={styles.seta}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  offline: { backgroundColor: "#1E293B" },
  pendente: { backgroundColor: "#FEF3C7" },
  icone: { fontSize: 16 },
  texto: { flex: 1, fontSize: 12, fontWeight: "600", color: "#0F172A" },
  subtexto: { fontSize: 11, color: "#64748B", marginTop: 1 },
  seta: { fontSize: 20, color: "#D97706", fontWeight: "700" },
});
