import { StyleSheet, Text, View } from "react-native";
import type { Questao } from "../types/leitorGabarito.types";

const COR_LETRA: Record<string, string> = {
  A: "#0EA5E9",
  B: "#0EA5E9",
  C: "#0EA5E9",
  D: "#0EA5E9",
};

export default function BolinhaResposta({ questao, resposta }: Questao) {
  const cor = COR_LETRA[resposta] ?? "#94A3B8";

  return (
    <View style={styles.item}>
      <Text style={styles.num}>{questao}</Text>
      <View style={[styles.circulo, { backgroundColor: cor }]}>
        <Text style={styles.letra}>{resposta ?? "?"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: "center", gap: 4, width: 48 },
  num: { fontSize: 10, color: "#94A3B8", fontWeight: "500" },
  circulo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  letra: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
