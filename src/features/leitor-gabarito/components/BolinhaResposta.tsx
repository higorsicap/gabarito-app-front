import { StyleSheet, Text, View } from "react-native";

import type { Questao } from "../types/leitorGabarito.types";

// ─── Cores ─────────────────────────────────────────────

const COR_SUCESSO = "#16A34A";
const COR_ERRO = "#DC2626";
const COR_NAO_IDENTIFICADA = "#94A3B8";

// ─── Props ─────────────────────────────────────────────

interface BolinhaRespostaProps extends Questao {
  cor?: string;
  situacao?: string | null;
}

// ─── Função auxiliar ───────────────────────────────────

function obterCorResposta(
  resposta: string | null,
  situacao?: string | null,
  cor?: string,
): string {
  // Sem resposta identificada.
  if (
    typeof resposta !== "string" ||
    resposta.trim() === "" ||
    resposta.trim() === "?"
  ) {
    return COR_NAO_IDENTIFICADA;
  }

  // Se a situação foi informada, ela tem prioridade.
  switch (situacao) {
    case "acertou":
      return COR_SUCESSO;

    case "errou":
      return COR_ERRO;

    case "em_branco":
    case "inconsistente":
    case "nao_identificada":
      return COR_NAO_IDENTIFICADA;
  }

  // Cor calculada pelo CardResultado.
  return cor ?? COR_NAO_IDENTIFICADA;
}

// ─── Componente ────────────────────────────────────────

export default function BolinhaResposta({
  questao,
  resposta,
  cor,
  situacao,
}: BolinhaRespostaProps) {
  const respostaFormatada =
    typeof resposta === "string" ? resposta.trim().toUpperCase() : "";

  const possuiResposta = respostaFormatada !== "" && respostaFormatada !== "?";

  const corFinal = obterCorResposta(resposta, situacao, cor);

  return (
    <View style={styles.item}>
      {/* Número da questão */}

      <Text style={styles.num}>{questao}</Text>

      {/* Bolinha da alternativa */}

      <View style={[styles.circulo, { backgroundColor: corFinal }]}>
        <Text style={styles.letra}>
          {possuiResposta ? respostaFormatada : "?"}
        </Text>
      </View>
    </View>
  );
}

// ─── Estilos ───────────────────────────────────────────

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    gap: 4,
    width: 48,
  },

  num: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },

  circulo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  letra: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
