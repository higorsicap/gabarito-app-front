import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import BolinhaResposta from "./BolinhaResposta";

import type {
  Questao,
  ResultadoProcessado,
} from "../types/leitorGabarito.types";

import type { ResultadoCorrecao } from "../services/compararGabarito";

// ─── Cores ─────────────────────────────────────────────

const COR_PRIMARIA = "#2563EB";
const COR_PERIGO = "#DC2626";
const COR_SUCESSO = "#16A34A";
const COR_NEUTRA = "#94A3B8";

// ─── Props ─────────────────────────────────────────────

interface CardResultadoProps {
  resultado: ResultadoProcessado;
  correcao?: ResultadoCorrecao | null;
}

// ─── Funções auxiliares ────────────────────────────────

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function obterCorSituacao(situacao?: string | null): string {
  switch (situacao) {
    case "acertou":
      return COR_SUCESSO;

    case "errou":
      return COR_PERIGO;

    default:
      return COR_NEUTRA;
  }
}

function obterDadosQR(raw: string): {
  id_avaliacao_saed?: number;
  id_turma?: number;
  nome_estudante?: string;
} {
  try {
    const dados = JSON.parse(raw);

    if (typeof dados !== "object" || dados === null || Array.isArray(dados)) {
      return {};
    }

    return dados;
  } catch {
    return {};
  }
}

// ─── Componente ────────────────────────────────────────

export default function CardResultado({
  resultado,
  correcao = null,
}: CardResultadoProps) {
  const [abaAtiva, setAbaAtiva] = useState(0);

  // Proteção contra resultado indefinido.
  if (!resultado) {
    console.warn("CardResultado: resultado não informado.");

    return null;
  }

  const { dadosQR, retorno } = resultado;

  // ─── Falha no processamento ─────────────────────────

  if (!retorno?.sucesso || !retorno.dados?.cartao_respostas) {
    return (
      <View style={styles.card}>
        <View style={[styles.header, { backgroundColor: COR_PERIGO }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetra}>!</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>Erro ao processar</Text>

            <Text style={styles.turma}>
              {dadosQR?.titulo ?? "Prova não processada"}
            </Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Text style={styles.erroTexto}>
            {retorno?.mensagem ?? "Falha desconhecida"}
          </Text>
        </View>
      </View>
    );
  }

  // ─── Dados da prova ─────────────────────────────────

  const cartao = retorno.dados.cartao_respostas;

  const dadosOriginais = obterDadosQR(dadosQR?.raw ?? "");

  const estudante =
    cartao.nome_estudante?.trim() ||
    dadosQR?.nome_estudante?.trim() ||
    dadosOriginais.nome_estudante?.trim() ||
    "Estudante";

  const turma =
    cartao.turma || String(dadosQR?.id_turma ?? dadosOriginais.id_turma ?? "");

  const idAvaliacao =
    dadosQR?.id_avaliacao_saed ?? dadosOriginais.id_avaliacao_saed;

  const inicial = estudante.charAt(0).toUpperCase();

  const gabaritos = cartao.gabaritos ?? [];

  // ─── Sem disciplinas ────────────────────────────────

  if (gabaritos.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetra}>{inicial}</Text>
          </View>

          <Text style={styles.nome}>{estudante}</Text>
        </View>

        <View style={{ padding: 16 }}>
          <Text style={styles.erroTexto}>Nenhuma disciplina identificada.</Text>
        </View>
      </View>
    );
  }

  // ─── Disciplina selecionada ─────────────────────────

  const indiceAba = Math.min(abaAtiva, gabaritos.length - 1);

  const gabarito = gabaritos[indiceAba];

  // ─── Localizar correção da disciplina ───────────────

  const disciplinaCorrigida = correcao?.disciplinas.find(
    (disciplina) =>
      normalizarTexto(disciplina.desc_disciplina) ===
      normalizarTexto(gabarito.disciplina),
  );

  // ─── Indexar questões corrigidas ────────────────────

  const questoesCorrigidas = new Map(
    disciplinaCorrigida?.questoes.map(
      (questao) => [questao.numero_questao, questao] as const,
    ) ?? [],
  );

  // ─── Organizar questões em linhas de 5 ──────────────

  const linhas: Questao[][] = [];

  for (let i = 0; i < gabarito.questoes.length; i += 5) {
    linhas.push(gabarito.questoes.slice(i, i + 5));
  }

  // ─── Renderização ───────────────────────────────────

  return (
    <View style={styles.card}>
      {/* Cabeçalho */}

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetra}>{inicial}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.nome} numberOfLines={2}>
            {estudante}
          </Text>

          {!!turma && <Text style={styles.turma}>Turma {turma}</Text>}
        </View>
      </View>

      {/* Identificação da avaliação */}

      <View style={styles.tagQR}>
        <Text style={styles.tagQRTexto}>
          🔗 QR · Avaliação {idAvaliacao ?? "não identificada"}
        </Text>
      </View>

      {/* Abas das disciplinas */}

      <View style={styles.abas}>
        {gabaritos.map((g, idx) => (
          <Pressable
            key={`${g.identificador}-${idx}`}
            style={[styles.aba, indiceAba === idx && styles.abaAtiva]}
            onPress={() => setAbaAtiva(idx)}
          >
            <Text
              style={[
                styles.abaTexto,
                indiceAba === idx && styles.abaTextoAtivo,
              ]}
              numberOfLines={1}
            >
              {g.disciplina.split(" ")[0]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Nome da disciplina */}

      <Text style={styles.disciplina}>{gabarito.disciplina}</Text>

      {/* Resumo da correção */}

      {disciplinaCorrigida && (
        <View style={styles.resumo}>
          <Text style={styles.resumoAcertos}>
            ✓ {disciplinaCorrigida.acertos} acerto(s)
          </Text>

          <Text style={styles.resumoErros}>
            ✕ {disciplinaCorrigida.erros} erro(s)
          </Text>
        </View>
      )}

      {/* Bolinhas das respostas */}

      <View style={styles.grade}>
        {linhas.map((linha, li) => (
          <View key={li} style={styles.linha}>
            {linha.map((questao) => {
              const numeroQuestao = Number(questao.questao);

              const questaoCorrigida = questoesCorrigidas.get(numeroQuestao);

              const cor = obterCorSituacao(questaoCorrigida?.situacao);

              return (
                <BolinhaResposta key={questao.questao} {...questao} cor={cor} />
              );
            })}
          </View>
        ))}
      </View>

      {/* Legenda */}

      <View style={styles.legenda}>
        <View style={styles.legendaItem}>
          <View style={[styles.dot, { backgroundColor: COR_SUCESSO }]} />
          <Text style={styles.legendaTexto}>Correta</Text>
        </View>

        <View style={styles.legendaItem}>
          <View style={[styles.dot, { backgroundColor: COR_PERIGO }]} />
          <Text style={styles.legendaTexto}>Errada</Text>
        </View>

        <View style={styles.legendaItem}>
          <View style={[styles.dot, { backgroundColor: COR_NEUTRA }]} />
          <Text style={styles.legendaTexto}>Não identificada</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Estilos ───────────────────────────────────────────

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

  avatarLetra: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },

  nome: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },

  turma: {
    color: "#93C5FD",
    fontSize: 12,
    marginTop: 2,
  },

  erroTexto: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },

  tagQR: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },

  tagQRTexto: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "500",
  },

  abas: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  aba: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },

  abaAtiva: {
    borderBottomWidth: 2,
    borderBottomColor: COR_PRIMARIA,
    backgroundColor: "#FFF",
  },

  abaTexto: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },

  abaTextoAtivo: {
    color: COR_PRIMARIA,
    fontWeight: "700",
  },

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

  resumo: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
  },

  resumoAcertos: {
    fontSize: 12,
    fontWeight: "700",
    color: COR_SUCESSO,
  },

  resumoErros: {
    fontSize: 12,
    fontWeight: "700",
    color: COR_PERIGO,
  },

  grade: {
    padding: 16,
    gap: 10,
  },

  linha: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },

  legenda: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 16,
    paddingTop: 4,
  },

  legendaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  legendaTexto: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
});
