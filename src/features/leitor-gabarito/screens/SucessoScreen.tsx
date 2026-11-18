import { Animated, Pressable, ScrollView, Text, View } from "react-native";

import BottomNav from "@/src/components/BottomNav";

import BannerRede from "../components/BannerRede";
import CardResultado from "../components/CardResultado";

import type { ResultadoProcessado } from "../types/leitorGabarito.types";

import type { ResultadoCorrecao } from "../services/compararGabarito";

import { scannerStyles as s } from "../styles/scanner.styles";

interface SucessoScreenProps {
  online: boolean;
  pendentes: number;
  resultados: ResultadoProcessado[];
  correcoes: ResultadoCorrecao[];
  fadeAnim: Animated.Value;
  onSincronizar: () => void;
  onReiniciar: () => void;
}

export default function SucessoScreen({
  online,
  pendentes,
  resultados,
  correcoes,
  fadeAnim,
  onSincronizar,
  onReiniciar,
}: SucessoScreenProps) {
  const sucessos = resultados.filter(
    (resultado) => resultado.retorno?.sucesso,
  ).length;

  const falhas = resultados.length - sucessos;

  console.log("========== SUCESSO SCREEN ==========");

  console.log("Resultados recebidos:", resultados.length);

  console.log("Correções recebidas:", correcoes.length);

  return (
    <Animated.View style={[s.tela, { opacity: fadeAnim }]}>
      <BottomNav />

      <BannerRede
        online={online}
        pendentes={pendentes}
        onSincronizar={onSincronizar}
      />

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.badgeSucesso, falhas > 0 && s.badgeAviso]}>
          <Text style={[s.badgeSucessoTexto, falhas > 0 && s.badgeAvisoTexto]}>
            {falhas === 0
              ? `✓ ${sucessos} prova(s) processada(s) com sucesso`
              : `⚠ ${sucessos} ok · ${falhas} com erro`}
          </Text>
        </View>

        {resultados.map((resultado, index) => (
          <CardResultado
            key={resultado.id}
            resultado={resultado}
            correcao={correcoes[index] ?? null}
          />
        ))}

        <Pressable style={[s.botao, { marginTop: 8 }]} onPress={onReiniciar}>
          <Text style={s.botaoTexto}>Novo lote de provas</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}
