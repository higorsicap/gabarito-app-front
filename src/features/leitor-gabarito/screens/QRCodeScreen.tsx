import { Pressable, ScrollView, Text, View } from "react-native";

import { CameraView } from "expo-camera";

import BottomNav from "@/src/components/BottomNav";

import BannerRede from "../components/BannerRede";
import ItemFila from "../components/ItemFila";

import type { ProvaFila } from "../types/leitorGabarito.types";

import { scannerStyles as s } from "../styles/scanner.styles";

interface QRCodeScreenProps {
  online: boolean;
  pendentes: number;
  fila: ProvaFila[];

  jaLeu: boolean;
  insetsTop: number;

  onSincronizar: () => void;
  onBarcodeScanned: (resultado: { data: string }) => void;
  onEnviarFila: () => void;
}

export default function QRCodeScreen({
  online,
  pendentes,
  fila,
  jaLeu,
  insetsTop,
  onSincronizar,
  onBarcodeScanned,
  onEnviarFila,
}: QRCodeScreenProps) {
  return (
    <View style={s.tela}>
      <BottomNav />

      <BannerRede
        online={online}
        pendentes={pendentes}
        onSincronizar={onSincronizar}
      />

      <View style={[s.cabecalho, { paddingTop: insetsTop + 12 }]}>
        <Text style={s.titulo}>Leitura de QR Code</Text>

        <Text style={s.subtitulo}>
          Posicione o QR Code dentro da área de leitura.
        </Text>
      </View>

      <View style={{ flex: 1, overflow: "hidden" }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={jaLeu ? undefined : onBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />

        {jaLeu && (
          <View
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
              backgroundColor: "rgba(0,0,0,0.7)",
              padding: 14,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              QR Code identificado. Abrindo scanner...
            </Text>
          </View>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <Text style={s.subtitulo}>{fila.length} prova(s) na fila</Text>

        {fila.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginVertical: 12 }}
            >
              {fila.map((prova, index) => (
                <ItemFila
                  key={prova.id}
                  prova={prova}
                  index={index}
                  onRemover={() => {}}
                />
              ))}
            </ScrollView>

            <Pressable style={s.botao} onPress={onEnviarFila}>
              <Text style={s.botaoTexto}>
                {online
                  ? `Enviar ${fila.length} prova(s)`
                  : `Salvar ${fila.length} prova(s) offline`}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
