import { Pressable, Text, View } from "react-native";

import BottomNav from "@/src/components/BottomNav";
import BannerRede from "../components/BannerRede";

import { inicioStyles as si } from "../styles/inicio.styles";
import { scannerStyles as s } from "../styles/scanner.styles";

interface InicioScreenProps {
  online: boolean;
  pendentes: number;
  onIniciarLeitura: () => void;
  onSincronizar: () => void;
}

export default function InicioScreen({
  online,
  pendentes,
  onIniciarLeitura,
  onSincronizar,
}: InicioScreenProps) {
  return (
    <View style={s.tela}>
      <BottomNav />

      <BannerRede
        online={online}
        pendentes={pendentes}
        onSincronizar={onSincronizar}
      />

      <View style={si.container}>
        <Text style={si.titulo}>Leitor de Gabarito</Text>
        <Text style={si.subtitulo}>
          Escaneie provas para processamento automático
        </Text>

        <Pressable style={si.botao} onPress={onIniciarLeitura}>
          <Text style={si.botaoTexto}>Iniciar leitura</Text>
        </Pressable>

        {pendentes > 0 && (
          <Pressable
            style={[si.botao, si.botaoSinc, !online && si.botaoSincDisabled]}
            onPress={online ? onSincronizar : undefined}
          >
            <Text style={si.botaoSincTexto}>
              {online
                ? `Sincronizar ${pendentes} pendente(s)`
                : `${pendentes} aguardando conexão`}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
