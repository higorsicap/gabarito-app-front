import { Animated, Pressable, ScrollView, Text, View } from "react-native";

import BottomNav from "@/src/components/BottomNav";

import BannerRede from "../components/BannerRede";
import CardResultado from "../components/CardResultado";

import type { ResultadoProcessado } from "../types/leitorGabarito.types";

import { scannerStyles as s } from "../styles/scanner.styles";

interface SucessoScreenProps {
  online: boolean;
  pendentes: number;
  resultados: ResultadoProcessado[];
  fadeAnim: Animated.Value;
  onSincronizar: () => void;
  onReiniciar: () => void;
}

export default function SucessoScreen({
  online,
  pendentes,
  resultados,
  fadeAnim,
  onSincronizar,
  onReiniciar,
}: SucessoScreenProps) {
  const sucessos = resultados.filter(
    (resultado) => resultado.retorno.sucesso,
  ).length;

  const falhas = resultados.length - sucessos;

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
              ? `✓  ${sucessos} prova${sucessos !== 1 ? "s" : ""} processada${sucessos !== 1 ? "s" : ""} com sucesso`
              : `⚠  ${sucessos} ok · ${falhas} com erro`}
          </Text>
        </View>

        {resultados.map((resultado) => (
          <CardResultado key={resultado.id} resultado={resultado} />
        ))}

        <Pressable style={[s.botao, { marginTop: 8 }]} onPress={onReiniciar}>
          <Text style={s.botaoTexto}>Novo lote de provas</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}
