import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import BolinhaResposta from "./BolinhaResposta";

import type {
  Questao,
  ResultadoProcessado,
} from "../types/leitorGabarito.types";

const COR_PRIMARIA = "#2563EB";
const COR_PERIGO = "#DC2626";

const COR_LETRA: Record<string, string> = {
  A: "#0EA5E9",
  B: "#0EA5E9",
  C: "#0EA5E9",
  D: "#0EA5E9",
};

interface CardResultadoProps {
  resultado: ResultadoProcessado;
}

export default function CardResultado({ resultado }: CardResultadoProps) {
  const [abaAtiva, setAbaAtiva] = useState(0);
  const { dadosQR, retorno } = resultado;

  if (!retorno.sucesso || !retorno.dados?.cartao_respostas) {
    return (
      <View style={styles.card}>
        <View style={[styles.header, { backgroundColor: COR_PERIGO }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetra}>!</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>Erro ao processar</Text>
            <Text style={styles.turma}>{dadosQR.titulo ?? dadosQR.raw}</Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Text style={styles.erroTexto}>
            {retorno.mensagem ?? "Falha desconhecida"}
          </Text>
        </View>
      </View>
    );
  }

  const cartao = retorno.dados.cartao_respostas;
  const gabarito = cartao.gabaritos[abaAtiva];
  const estudante =
    typeof cartao.estudante === "string" && cartao.estudante.trim()
      ? cartao.estudante.trim()
      : "Estudante";

  const turma = typeof cartao.turma === "string" ? cartao.turma : "";

  const inicial = estudante.charAt(0).toUpperCase();
  (" ");

  const linhas: Questao[][] = [];

  for (let i = 0; i < gabarito.questoes.length; i += 5) {
    linhas.push(gabarito.questoes.slice(i, i + 5));
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetra}>{inicial}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.nome} numberOfLines={2}>
            {estudante}
          </Text>

          {!!turma && <Text style={styles.turma}>{turma}</Text>}
        </View>
      </View>

      <View style={styles.tagQR}>
        <Text style={styles.tagQRTexto}>
          🔗 QR · {dadosQR.titulo ?? dadosQR.raw}
        </Text>
      </View>

      <View style={styles.abas}>
        {cartao.gabaritos.map((g, idx) => (
          <Pressable
            key={g.identificador}
            style={[styles.aba, abaAtiva === idx && styles.abaAtiva]}
            onPress={() => setAbaAtiva(idx)}
          >
            <Text
              style={[
                styles.abaTexto,
                abaAtiva === idx && styles.abaTextoAtivo,
              ]}
              numberOfLines={1}
            >
              {g.disciplina.split(" ")[0]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.disciplina}>{gabarito.disciplina}</Text>

      <View style={styles.grade}>
        {linhas.map((linha, li) => (
          <View key={li} style={styles.linha}>
            {linha.map((questao) => (
              <BolinhaResposta key={questao.questao} {...questao} />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legenda}>
        {Object.entries(COR_LETRA).map(([letra, cor]) => (
          <View key={letra} style={styles.legendaItem}>
            <View style={[styles.dot, { backgroundColor: cor }]} />
            <Text style={styles.legendaTexto}>{letra}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 20,
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#2f4990",
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarLetra: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  nome: { color: "#FFF", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  turma: { color: "#93C5FD", fontSize: 12, marginTop: 2 },
  erroTexto: { fontSize: 14, color: "#475569", textAlign: "center" },
  tagQR: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },
  tagQRTexto: { fontSize: 11, color: "#2563EB", fontWeight: "500" },
  abas: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  aba: { flex: 1, paddingVertical: 12, alignItems: "center" },
  abaAtiva: {
    borderBottomWidth: 2,
    borderBottomColor: COR_PRIMARIA,
    backgroundColor: "#FFF",
  },
  abaTexto: { fontSize: 12, fontWeight: "500", color: "#94A3B8" },
  abaTextoAtivo: { color: COR_PRIMARIA, fontWeight: "700" },
  disciplina: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    paddingTop: 14,
    paddingHorizontal: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grade: { padding: 16, gap: 10 },
  linha: { flexDirection: "row", gap: 8, justifyContent: "center" },
  legenda: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 16,
    paddingTop: 4,
  },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendaTexto: { fontSize: 11, color: "#64748B", fontWeight: "600" },
});
