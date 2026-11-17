import BottomNav from "@/src/components/BottomNav";

import InicioScreen from "@/src/features/leitor-gabarito/screens/InicioScreen";
import PreviewScreen from "@/src/features/leitor-gabarito/screens/PreviewScreen";
import ProgressoScreen from "@/src/features/leitor-gabarito/screens/ProgressoScreen";
import QRCodeScreen from "@/src/features/leitor-gabarito/screens/QRCodeScreen";
import SucessoScreen from "@/src/features/leitor-gabarito/screens/SucessoScreen";

import useLeitorGabarito from "@/src/features/leitor-gabarito/hooks/useLeitorGabarito";

import { scannerStyles as s } from "@/src/features/leitor-gabarito/styles/scanner.styles";

import { useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const COR_PRIMARIA = "#2563EB";

export default function Scanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ─── ID recebido da Home ──────────────────────────────

  const { idAvaliacao } = useLocalSearchParams<{
    idAvaliacao?: string;
  }>();

  const idAvaliacaoNumero = Number(idAvaliacao);

  const idValido =
    typeof idAvaliacao === "string" &&
    idAvaliacao.trim() !== "" &&
    Number.isSafeInteger(idAvaliacaoNumero) &&
    idAvaliacaoNumero > 0;

  // ─── Permissão de câmera ──────────────────────────────

  const [permCamera, pedirPermCamera] = useCameraPermissions();

  // ─── Hook do leitor ───────────────────────────────────

  const {
    etapa,
    dadosQRAtual,
    jaLeu,
    fila,
    imagemPreview,
    progresso,
    resultados,
    online,
    pendentes,
    fadeAnim,

    iniciarLeitura,
    aoLerQR,
    sincronizarPendentes,
    enviarFilaAtual,
    removerDaFila,
    refazer,
    confirmarEAdicionarMais,
    confirmarEProsseguir,
    reiniciar,
  } = useLeitorGabarito(idValido ? idAvaliacaoNumero : null);

  // ─── Validação da avaliação ───────────────────────────

  if (!idValido) {
    return (
      <View style={[s.centro, { paddingTop: insets.top }]}>
        <Text style={s.textoInfo}>
          Nenhuma avaliação válida foi selecionada.
        </Text>

        <Pressable
          style={[s.botao, s.botaoPermissao, { marginTop: 20 }]}
          onPress={() => router.back()}
        >
          <Text style={s.botaoTexto}>Voltar para avaliações</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Aguardando permissão de câmera ───────────────────

  if (!permCamera) {
    return (
      <View style={[s.centro, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COR_PRIMARIA} />
      </View>
    );
  }

  // ─── Solicitar permissão de câmera ────────────────────

  if (!permCamera.granted) {
    return (
      <View style={[s.centro, { paddingTop: insets.top }]}>
        <BottomNav />

        <Text style={s.textoInfo}>Precisamos da permissão da câmera</Text>

        <Pressable
          style={[s.botao, s.botaoPermissao, { marginTop: 20 }]}
          onPress={pedirPermCamera}
        >
          <Text style={s.botaoTexto}>Conceder permissão</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Tela: Início ─────────────────────────────────────

  if (etapa === "inicio") {
    return (
      <InicioScreen
        online={online}
        pendentes={pendentes}
        onIniciarLeitura={iniciarLeitura}
        onSincronizar={sincronizarPendentes}
      />
    );
  }

  // ─── Tela: QR Code ────────────────────────────────────

  if (etapa === "qrcode") {
    return (
      <QRCodeScreen
        online={online}
        pendentes={pendentes}
        fila={fila}
        jaLeu={jaLeu}
        insetsTop={insets.top}
        onSincronizar={sincronizarPendentes}
        onBarcodeScanned={aoLerQR}
        onEnviarFila={enviarFilaAtual}
      />
    );
  }

  // ─── Tela: Preview ────────────────────────────────────

  if (etapa === "preview" && imagemPreview) {
    return (
      <PreviewScreen
        online={online}
        pendentes={pendentes}
        insetsTop={insets.top}
        fadeAnim={fadeAnim}
        dadosQRAtual={dadosQRAtual}
        imagemPreview={imagemPreview}
        fila={fila}
        onSincronizar={sincronizarPendentes}
        onRemover={removerDaFila}
        onRefazer={refazer}
        onAdicionarMais={confirmarEAdicionarMais}
        onProsseguir={confirmarEProsseguir}
      />
    );
  }

  // ─── Tela: Enviando / Sincronizando ───────────────────

  if (etapa === "enviando" || etapa === "sincronizando") {
    return (
      <ProgressoScreen
        etapa={etapa}
        progresso={progresso}
        insetsTop={insets.top}
      />
    );
  }

  // ─── Tela: Sucesso ────────────────────────────────────

  if (etapa === "sucesso") {
    return (
      <SucessoScreen
        online={online}
        pendentes={pendentes}
        resultados={resultados}
        fadeAnim={fadeAnim}
        onSincronizar={sincronizarPendentes}
        onReiniciar={reiniciar}
      />
    );
  }

  return null;
}
