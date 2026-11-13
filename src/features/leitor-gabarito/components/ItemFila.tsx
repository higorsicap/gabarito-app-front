import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { ProvaFila } from "../types/leitorGabarito.types";

const COR_PERIGO = "#DC2626";

interface ItemFilaProps {
  prova: ProvaFila;
  index: number;
  onRemover: () => void;
}

export default function ItemFila({ prova, index, onRemover }: ItemFilaProps) {
  return (
    <View style={styles.item}>
      <Image
        source={{ uri: prova.imagemUri }}
        style={styles.thumb}
        resizeMode="cover"
      />

      <View style={styles.info}>
        <Text style={styles.num}>Prova {index + 1}</Text>

        <Text style={styles.qr} numberOfLines={1}>
          🔗 {prova.dadosQR.titulo ?? prova.dadosQR.raw}
        </Text>
      </View>

      <Pressable style={styles.remover} onPress={onRemover}>
        <Text style={styles.removerTexto}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 8,
    gap: 8,
    width: 200,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  thumb: {
    width: 52,
    height: 68,
    borderRadius: 6,
    backgroundColor: "#1E293B",
  },
  info: { flex: 1 },
  num: { fontSize: 12, fontWeight: "700", color: "#0F172A" },
  qr: { fontSize: 10, color: "#64748B", marginTop: 2 },
  remover: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  removerTexto: { fontSize: 11, color: COR_PERIGO, fontWeight: "700" },
});
