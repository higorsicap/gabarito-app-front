import {
    Animated,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import BottomNav from "@/src/components/BottomNav";

import BannerRede from "../components/BannerRede";
import ItemFila from "../components/ItemFila";

import type { DadosQR, ProvaFila } from "../types/leitorGabarito.types";

import { scannerStyles as s } from "../styles/scanner.styles";

interface PreviewScreenProps {
  online: boolean;
  pendentes: number;
  insetsTop: number;

  fadeAnim: Animated.Value;

  dadosQRAtual: DadosQR | null;
  imagemPreview: string;
  fila: ProvaFila[];

  onSincronizar: () => void;
  onRemover: (id: number) => void;
  onRefazer: () => void;
  onAdicionarMais: () => void;
  onProsseguir: () => void;
}

export default function PreviewScreen({
  online,
  pendentes,
  insetsTop,
  fadeAnim,
  dadosQRAtual,
  imagemPreview,
  fila,
  onSincronizar,
  onRemover,
  onRefazer,
  onAdicionarMais,
  onProsseguir,
}: PreviewScreenProps) {
  const totalNaFila = fila.length + 1;

  return (
    <Animated.View style={[s.tela, { opacity: fadeAnim }]}>
      <BottomNav />

      <BannerRede
        online={online}
        pendentes={pendentes}
        onSincronizar={onSincronizar}
      />

      <View style={[s.cabecalho, { paddingTop: insetsTop + 12 }]}>
        <Text style={s.titulo}>Prova {totalNaFila}</Text>

        <Text style={s.subtitulo}>
          🔗 {dadosQRAtual?.titulo ?? dadosQRAtual?.raw ?? ""}
        </Text>
      </View>

      <Image
        source={{ uri: imagemPreview }}
        style={s.preview}
        resizeMode="contain"
      />

      {fila.length > 0 && (
        <ScrollView
          horizontal
          style={s.filaScroll}
          contentContainerStyle={s.filaScrollContent}
          showsHorizontalScrollIndicator={false}
        >
          {fila.map((prova, index) => (
            <ItemFila
              key={prova.id}
              prova={prova}
              index={index}
              onRemover={() => onRemover(prova.id)}
            />
          ))}
        </ScrollView>
      )}

      <View style={s.acoes}>
        <Pressable
          style={[s.botao, s.botaoPerigo, s.botaoIcone]}
          onPress={onRefazer}
        >
          <Text style={s.botaoTexto}>↩</Text>
        </Pressable>

        <Pressable
          style={[s.botao, s.botaoSecundario]}
          onPress={onAdicionarMais}
        >
          <Text style={s.botaoTextoSecundario}>+ Adicionar prova</Text>
        </Pressable>

        <Pressable
          style={[s.botao, !online && s.botaoOffline]}
          onPress={onProsseguir}
        >
          <Text style={s.botaoTexto}>
            {online ? `Enviar ${totalNaFila}  ✓` : "💾  Salvar offline"}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
