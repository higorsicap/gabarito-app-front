import { useEffect, useRef, useState } from "react";
import { Alert, Animated } from "react-native";

import NetInfo from "@react-native-community/netinfo";
import DocumentScanner from "react-native-document-scanner-plugin";

import {
  contarPendentes,
  copiarImagemParaPermanente,
  marcarSincronizado,
  obterPendentes,
  salvaGabarito,
  type prova_sync_saed,
} from "@/src/database/services/leitorGabaritoRepository";

import { enviarUmaProva } from "../services/leitorGabaritoApi";

import type {
  DadosQR,
  Etapa,
  ProgressoProcessamento,
  ProvaFila,
  RespostaAPI,
  ResultadoProcessado,
} from "../types/leitorGabarito.types";

function parsearQR(raw: string): DadosQR {
  try {
    return { raw, ...JSON.parse(raw) };
  } catch {
    return {
      raw,
      titulo: "QR code lido",
      descricao: raw,
    };
  }
}

export default function useLeitorGabarito(idAvaliacao: number | null) {
  const [etapa, setEtapa] = useState<Etapa>("inicio");

  const [dadosQRAtual, setDadosQRAtual] = useState<DadosQR | null>(null);

  const [jaLeu, setJaLeu] = useState(false);

  const [fila, setFila] = useState<ProvaFila[]>([]);

  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  const [progresso, setProgresso] = useState<ProgressoProcessamento>({
    atual: 0,
    total: 0,
    itemAtual: "",
    imagemAtual: "",
  });

  const [resultados, setResultados] = useState<ResultadoProcessado[]>([]);

  const proximoId = useRef(1);

  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);

  const [fadeAnim] = useState(() => new Animated.Value(1));
  // ─── Animação ────────────────────────────────────────────────

  const fadeIn = () => {
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  // ─── Rede e pendências ───────────────────────────────────────

  const atualizarContadorPendentes = async () => {
    const total = await contarPendentes();
    setPendentes(total);
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const conectado =
        state.isConnected === true && state.isInternetReachable !== false;

      setOnline(conectado);
    });

    atualizarContadorPendentes();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (online) {
      atualizarContadorPendentes();
    }
  }, [online]);

  // ─── QR Code ─────────────────────────────────────────────────

  const abrirScanner = async (qr: DadosQR) => {
    try {
      const result = await DocumentScanner.scanDocument();

      if (!result?.scannedImages?.length) {
        Alert.alert(
          "Nenhum documento detectado",
          "Tente enquadrar melhor a folha.",
        );

        setJaLeu(false);
        return;
      }

      setImagemPreview(result.scannedImages[0]);

      fadeIn();
      setEtapa("preview");
    } catch (error: any) {
      console.error("Erro ao abrir scanner:", error);

      Alert.alert(
        "Erro",
        error?.message ||
          error?.toString() ||
          JSON.stringify(error) ||
          "Falha ao abrir o scanner.",
      );

      setJaLeu(false);
    }
  };

  const aoLerQR = ({ data }: { data: string }) => {
    if (jaLeu) return;

    setJaLeu(true);

    const qr = parsearQR(data);

    setDadosQRAtual(qr);

    abrirScanner(qr);
  };

  // ─── Fila de provas ──────────────────────────────────────────

  const confirmarEAdicionarMais = () => {
    if (!imagemPreview || !dadosQRAtual) return;

    setFila((prev) => [
      ...prev,
      {
        id: proximoId.current++,
        dadosQR: dadosQRAtual,
        imagemUri: imagemPreview,
      },
    ]);

    setImagemPreview(null);
    setDadosQRAtual(null);
    setJaLeu(false);
    setEtapa("qrcode");
  };

  const confirmarEProsseguir = () => {
    if (!imagemPreview || !dadosQRAtual) return;

    const filaFinal: ProvaFila[] = [
      ...fila,
      {
        id: proximoId.current++,
        dadosQR: dadosQRAtual,
        imagemUri: imagemPreview,
      },
    ];

    setFila(filaFinal);
    setImagemPreview(null);
    setDadosQRAtual(null);

    if (online) {
      enviarTodas(filaFinal);
    } else {
      salvarOffline(filaFinal);
    }
  };

  const removerDaFila = (id: number) => {
    setFila((prev) => prev.filter((p) => p.id !== id));
  };

  const enviarFilaAtual = () => {
    if (fila.length === 0) return;

    if (online) {
      enviarTodas(fila);
    } else {
      salvarOffline(fila);
    }
  };

  const refazer = () => {
    if (dadosQRAtual) {
      abrirScanner(dadosQRAtual);
    }
  };

  // ─── Salvar offline ──────────────────────────────────────────

  const salvarOffline = async (filaParaSalvar: ProvaFila[]) => {
    try {
      const registros: prova_sync_saed[] = await Promise.all(
        filaParaSalvar.map(async (p) => ({
          id_avaliacao_saed_mob: Number(p.dadosQR.id ?? p.dadosQR.raw),
          qr_code: p.dadosQR.raw,
          arq_prova: await copiarImagemParaPermanente(p.imagemUri),
          data_sync: new Date().toISOString(),
          sincronizado: 0,
        })),
      );

      await salvaGabarito(registros);

      await atualizarContadorPendentes();

      Alert.alert(
        "Salvo offline",
        `${filaParaSalvar.length} prova${
          filaParaSalvar.length !== 1 ? "s" : ""
        } salva${
          filaParaSalvar.length !== 1 ? "s" : ""
        }. Serão enviadas quando a internet voltar.`,
        [
          {
            text: "OK",
            onPress: reiniciar,
          },
        ],
      );
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as provas localmente.");
    }
  };

  // ─── Sincronizar pendentes ───────────────────────────────────

  const sincronizarPendentes = async () => {
    const lista = await obterPendentes();

    if (lista.length === 0) return;

    setEtapa("sincronizando");

    setProgresso({
      atual: 0,
      total: lista.length,
      itemAtual: "",
      imagemAtual: "",
    });

    const novosResultados: ResultadoProcessado[] = [];

    for (const prova of lista) {
      const label = parsearQR(prova.qr_code).titulo ?? prova.qr_code;

      setProgresso((prev) => ({
        ...prev,
        itemAtual: label,
        imagemAtual: prova.arq_prova,
      }));

      try {
        const retorno = await enviarUmaProva(
          prova.arq_prova,
          String(prova.id_avaliacao_saed_mob),
        );

        if (retorno.sucesso && prova.id_prova_sync) {
          await marcarSincronizado(prova.id_prova_sync, prova.arq_prova);
        }

        novosResultados.push({
          id: prova.id_prova_sync ?? 0,
          dadosQR: parsearQR(prova.qr_code),
          retorno,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";

        novosResultados.push({
          id: prova.id_prova_sync ?? 0,
          dadosQR: parsearQR(prova.qr_code),
          retorno: {
            sucesso: false,
            mensagem: msg,
          },
        });
      }

      setProgresso((prev) => ({
        ...prev,
        atual: prev.atual + 1,
        itemAtual: "",
        imagemAtual: "",
      }));
    }

    await atualizarContadorPendentes();

    setResultados(novosResultados);

    fadeIn();
    setEtapa("sucesso");
  };

  // ─── Enviar provas ───────────────────────────────────────────

  const enviarTodas = async (filaParaEnviar: ProvaFila[]) => {
    setEtapa("enviando");

    setProgresso({
      atual: 0,
      total: filaParaEnviar.length,
      itemAtual: "",
      imagemAtual: "",
    });

    const novosResultados: ResultadoProcessado[] = [];

    for (const prova of filaParaEnviar) {
      const label = prova.dadosQR.titulo ?? prova.dadosQR.raw;

      setProgresso((prev) => ({
        ...prev,
        itemAtual: label,
        imagemAtual: prova.imagemUri,
      }));

      try {
        const retorno = await enviarUmaProva(
          prova.imagemUri,
          prova.dadosQR.id ?? prova.dadosQR.raw,
        );

        novosResultados.push({
          id: prova.id,
          dadosQR: prova.dadosQR,
          retorno,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";

        novosResultados.push({
          id: prova.id,
          dadosQR: prova.dadosQR,
          retorno: {
            sucesso: false,
            mensagem: msg,
          } as RespostaAPI,
        });
      }

      setProgresso((prev) => ({
        ...prev,
        atual: prev.atual + 1,
        itemAtual: "",
        imagemAtual: "",
      }));
    }

    setResultados(novosResultados);

    fadeIn();
    setEtapa("sucesso");
  };

  // ─── Reiniciar ───────────────────────────────────────────────

  const reiniciar = () => {
    setEtapa("inicio");
    setDadosQRAtual(null);
    setJaLeu(false);
    setFila([]);
    setImagemPreview(null);

    setProgresso({
      atual: 0,
      total: 0,
      itemAtual: "",
      imagemAtual: "",
    });

    setResultados([]);

    proximoId.current = 1;
  };

  // ─── Retorno para a tela ──────────────────────────────────────

  return {
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

    iniciarLeitura: () => setEtapa("qrcode"),

    aoLerQR,
    sincronizarPendentes,
    enviarFilaAtual,
    removerDaFila,
    refazer,
    confirmarEAdicionarMais,
    confirmarEProsseguir,
    reiniciar,
  };
}
