import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";

import BottomNav from "@/src/components/BottomNav";

import { progressoStyles as sp } from "../styles/progresso.styles";
import { scannerStyles as s } from "../styles/scanner.styles";

import type { ProgressoProcessamento } from "../types/leitorGabarito.types";

interface ProgressoScreenProps {
  etapa: "enviando" | "sincronizando";
  progresso: ProgressoProcessamento;
  insetsTop: number;
}

const COR_PRIMARIA = "#2563EB";

export default function ProgressoScreen({
  etapa,
  progresso,
  insetsTop,
}: ProgressoScreenProps) {
  const pct =
    progresso.total > 0
      ? Math.round((progresso.atual / progresso.total) * 100)
      : 0;

  const isSinc = etapa === "sincronizando";

  return (
    <View style={s.tela}>
      <BottomNav />

      <View style={[s.cabecalho, { paddingTop: insetsTop + 35 }]}>
        <Text style={s.titulo}>{isSinc ? "Sincronizando" : "Processando"}</Text>

        <Text style={s.subtitulo}>
          {progresso.atual} de {progresso.total} prova
          {progresso.total !== 1 ? "s" : ""} concluída
          {progresso.total !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={sp.barraFundo}>
        <View style={[sp.barraPreenchimento, { width: `${pct}%` as any }]} />
      </View>

      <ScrollView
        contentContainerStyle={sp.lista}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: progresso.total }).map((_, i) => {
          const numProva = i + 1;
          const isConcluida = i < progresso.atual;
          const isAtiva = i === progresso.atual && progresso.itemAtual !== "";

          if (isConcluida) {
            return (
              <View key={`prova-${i}`} style={[sp.card, sp.cardFeito]}>
                <View style={[sp.dot, sp.dotFeito]} />

                <Text style={sp.textoFeito}>Prova {numProva}</Text>

                <Text style={sp.check}>✓</Text>
              </View>
            );
          }

          if (isAtiva) {
            return (
              <View key={`prova-${i}`} style={[sp.card, sp.cardAtivo]}>
                {progresso.imagemAtual ? (
                  <Image
                    source={{
                      uri: progresso.imagemAtual,
                    }}
                    style={sp.thumb}
                    resizeMode="cover"
                  />
                ) : (
                  <ActivityIndicator
                    size="small"
                    color={COR_PRIMARIA}
                    style={{ width: 56 }}
                  />
                )}

                <View style={{ flex: 1 }}>
                  <View style={sp.ativoTopo}>
                    <ActivityIndicator size="small" color={COR_PRIMARIA} />

                    <Text style={sp.textoAtivo}>Prova {numProva}</Text>
                  </View>

                  <Text style={sp.subAtivo} numberOfLines={1}>
                    🔗 {progresso.itemAtual}
                  </Text>
                </View>
              </View>
            );
          }

          return (
            <View key={`prova-${i}`} style={[sp.card, sp.cardPendente]}>
              <View style={[sp.dot, sp.dotPendente]} />

              <Text style={sp.textoPendente}>Prova {numProva}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
