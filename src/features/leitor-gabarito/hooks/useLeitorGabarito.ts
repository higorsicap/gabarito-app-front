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

import { obterGabaritoAvaliacao } from "@/src/database/services/corrigirProvaRepository";

import { enviarUmaProva } from "../services/leitorGabaritoApi";

import {
  compararTodasDisciplinas,
  type ResultadoCorrecao,
} from "../services/compararGabarito";

import type {
  DadosQR,
  Etapa,
  ProgressoProcessamento,
  ProvaFila,
  RespostaAPI,
  ResultadoProcessado,
} from "../types/leitorGabarito.types";

// ─── QR Code ────────────────────────────────────────────────

function parsearQR(raw: string): DadosQR {
  try {
    const dados = JSON.parse(raw);

    if (dados === null || typeof dados !== "object" || Array.isArray(dados)) {
      throw new Error("QR Code inválido.");
    }

    return {
      ...dados,
      raw,
    };
  } catch {
    return {
      raw,
      titulo: "QR code lido",
      descricao: raw,
    };
  }
}

// Recupera o ID original da avaliação presente no QR Code.
function obterIdAvaliacaoQR(raw: string): number | null {
  try {
    const dados = JSON.parse(raw);

    const id = Number(dados?.id_avaliacao_saed);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

// ─── Hook principal ────────────────────────────────────────

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

  const [correcoes, setCorrecoes] = useState<ResultadoCorrecao[]>([]);

  const proximoId = useRef(1);

  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);

  const [fadeAnim] = useState(() => new Animated.Value(1));

  // ─── Animação ───────────────────────────────────────────

  const fadeIn = () => {
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  // ─── Rede e pendências ─────────────────────────────────

  const atualizarContadorPendentes = async () => {
    try {
      const total = await contarPendentes();
      setPendentes(total);
    } catch (error) {
      console.error("Erro ao contar provas pendentes:", error);
    }
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

  // ─── Correção automática ───────────────────────────────

  const corrigirProva = async (
    retorno: RespostaAPI,
    qrCodeOriginal: string,
    idAvaliacaoSaed: number | null = idAvaliacao,
  ): Promise<ResultadoCorrecao | null> => {
    try {
      if (!retorno.sucesso || !retorno.dados?.cartao_respostas) {
        console.warn("Correção não realizada: retorno inválido da API.");
        return null;
      }

      if (
        idAvaliacaoSaed === null ||
        !Number.isSafeInteger(idAvaliacaoSaed) ||
        idAvaliacaoSaed <= 0
      ) {
        console.warn("ID da avaliação inválido.");
        return null;
      }

      // Utiliza o QR Code original lido pelo aplicativo.
      const dadosQR = parsearQR(qrCodeOriginal);

      const idAvaliacaoQR = Number(dadosQR.id_avaliacao_saed);

      console.log("========== VALIDANDO AVALIAÇÃO ==========");

      console.log("ID da avaliação selecionada:", idAvaliacaoSaed);

      console.log("ID da avaliação no QR Code:", idAvaliacaoQR);

      if (
        !Number.isSafeInteger(idAvaliacaoQR) ||
        idAvaliacaoQR !== idAvaliacaoSaed
      ) {
        console.warn(
          "Avaliação divergente!",
          "Selecionada:",
          idAvaliacaoSaed,
          "QR Code:",
          idAvaliacaoQR,
        );

        return null;
      }

      const avaliacaoSQLite = await obterGabaritoAvaliacao(idAvaliacaoSaed);

      if (!avaliacaoSQLite) {
        console.warn("Gabarito não encontrado no SQLite:", idAvaliacaoSaed);
        return null;
      }

      if (Number(avaliacaoSQLite.id_avaliacao_saed) !== idAvaliacaoQR) {
        console.warn("ID do SQLite divergente do QR Code.");
        return null;
      }

      const cartao = retorno.dados.cartao_respostas;

      if (!Array.isArray(cartao.gabaritos)) {
        console.warn("Nenhuma disciplina retornada pela IA.");
        return null;
      }

      const resultado = compararTodasDisciplinas(
        avaliacaoSQLite,
        cartao.gabaritos,
      );

      console.log(
        "========== RESULTADO DA CORREÇÃO ==========\n",
        JSON.stringify(
          {
            estudante: {
              id_estudante_origem: dadosQR.id_estudante_origem,

              nome_estudante: dadosQR.nome_estudante,

              id_turma: dadosQR.id_turma,

              id_serie: dadosQR.id_serie,
            },

            avaliacao: {
              id_avaliacao_saed: avaliacaoSQLite.id_avaliacao_saed,

              id_avaliacao_saed_mob: avaliacaoSQLite.id_avaliacao_saed_mob,
            },

            correcao: resultado,
          },
          null,
          2,
        ),
        "\n============================================",
      );

      return resultado;
    } catch (error) {
      console.error("Erro ao corrigir gabarito:", error);

      return null;
    }
  };

  // ─── Abrir scanner ─────────────────────────────────────

  const abrirScanner = async (_qr: DadosQR) => {
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
        error?.message || error?.toString() || "Falha ao abrir o scanner.",
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

  // ─── Fila de provas ────────────────────────────────────

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
      void enviarTodas(filaFinal);
    } else {
      void salvarOffline(filaFinal);
    }
  };

  const removerDaFila = (id: number) => {
    setFila((prev) => prev.filter((p) => p.id !== id));
  };

  const enviarFilaAtual = () => {
    if (fila.length === 0) return;

    if (online) {
      void enviarTodas(fila);
    } else {
      void salvarOffline(fila);
    }
  };

  const refazer = () => {
    if (dadosQRAtual) {
      void abrirScanner(dadosQRAtual);
    }
  };

  // ─── Reiniciar ─────────────────────────────────────────

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
    setCorrecoes([]);

    proximoId.current = 1;
  };

  // ─── Salvar offline ────────────────────────────────────

  const salvarOffline = async (filaParaSalvar: ProvaFila[]) => {
    try {
      if (
        idAvaliacao === null ||
        !Number.isSafeInteger(idAvaliacao) ||
        idAvaliacao <= 0
      ) {
        throw new Error("ID original da avaliação inválido.");
      }

      // O hook recebe id_avaliacao_saed.
      const avaliacaoSQLite = await obterGabaritoAvaliacao(idAvaliacao);

      if (!avaliacaoSQLite) {
        throw new Error("Avaliação não encontrada no SQLite.");
      }

      // O banco offline precisa do ID local.
      const idAvaliacaoLocal = avaliacaoSQLite.id_avaliacao_saed_mob;

      // Valida os QR Codes antes de salvar.
      for (const prova of filaParaSalvar) {
        const idQR = obterIdAvaliacaoQR(prova.dadosQR.raw);

        if (idQR !== idAvaliacao) {
          throw new Error("Existe uma prova com QR Code de outra avaliação.");
        }
      }

      const registros: prova_sync_saed[] = await Promise.all(
        filaParaSalvar.map(async (p) => ({
          id_avaliacao_saed_mob: idAvaliacaoLocal,

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
    } catch (error) {
      console.error("Erro ao salvar provas offline:", error);

      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as provas localmente.",
      );
    }
  };

  // ─── Sincronizar pendentes ─────────────────────────────

  const sincronizarPendentes = async () => {
    try {
      const lista = await obterPendentes();

      if (lista.length === 0) {
        return;
      }

      setEtapa("sincronizando");

      setProgresso({
        atual: 0,
        total: lista.length,
        itemAtual: "",
        imagemAtual: "",
      });

      const novosResultados: ResultadoProcessado[] = [];
      const novasCorrecoes: ResultadoCorrecao[] = [];

      for (const prova of lista) {
        const dadosQR = parsearQR(prova.qr_code);

        const label = dadosQR.titulo ?? dadosQR.raw;

        setProgresso((prev) => ({
          ...prev,
          itemAtual: label,
          imagemAtual: prova.arq_prova,
        }));

        try {
          // Recupera o ID original do QR Code salvo.
          const idAvaliacaoSaed = obterIdAvaliacaoQR(prova.qr_code);

          if (idAvaliacaoSaed === null) {
            throw new Error("QR Code pendente sem ID de avaliação válido.");
          }

          const retorno = await enviarUmaProva(prova.arq_prova, prova.qr_code);

          const correcao = await corrigirProva(
            retorno,
            prova.qr_code,
            idAvaliacaoSaed,
          );

          if (correcao) {
            novasCorrecoes.push(correcao);
          }

          // Mantém a regra original:
          // sucesso na API significa envio sincronizado.
          if (retorno.sucesso && prova.id_prova_sync) {
            await marcarSincronizado(prova.id_prova_sync, prova.arq_prova);
          }

          novosResultados.push({
            id: prova.id_prova_sync ?? 0,
            dadosQR,
            retorno,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro desconhecido";

          console.error("Erro ao sincronizar prova:", msg);

          novosResultados.push({
            id: prova.id_prova_sync ?? 0,
            dadosQR,
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

      await atualizarContadorPendentes();

      setResultados(novosResultados);
      setCorrecoes(novasCorrecoes);

      fadeIn();
      setEtapa("sucesso");
    } catch (error) {
      console.error("Erro ao sincronizar pendentes:", error);

      Alert.alert("Erro", "Não foi possível iniciar a sincronização.");

      setEtapa("inicio");
    }
  };

  // ─── Enviar provas online ──────────────────────────────

  const enviarTodas = async (filaParaEnviar: ProvaFila[]) => {
    setEtapa("enviando");

    setProgresso({
      atual: 0,
      total: filaParaEnviar.length,
      itemAtual: "",
      imagemAtual: "",
    });

    const novosResultados: ResultadoProcessado[] = [];
    const novasCorrecoes: ResultadoCorrecao[] = [];

    for (const prova of filaParaEnviar) {
      const label = prova.dadosQR.titulo ?? prova.dadosQR.raw;

      setProgresso((prev) => ({
        ...prev,
        itemAtual: label,
        imagemAtual: prova.imagemUri,
      }));

      try {
        const idQR = obterIdAvaliacaoQR(prova.dadosQR.raw);

        if (idAvaliacao === null || idQR !== idAvaliacao) {
          throw new Error("O QR Code não pertence à avaliação selecionada.");
        }

        // Envia o JSON original do QR Code para a API.
        const retorno = await enviarUmaProva(
          prova.imagemUri,
          prova.dadosQR.raw,
        );

        // Corrige com o gabarito oficial do SQLite.
        const correcao = await corrigirProva(
          retorno,
          prova.dadosQR.raw,
          idAvaliacao,
        );

        if (correcao) {
          novasCorrecoes.push(correcao);
        }

        novosResultados.push({
          id: prova.id,
          dadosQR: prova.dadosQR,
          retorno,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";

        console.error("Erro ao enviar prova:", msg);

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
    setCorrecoes(novasCorrecoes);

    fadeIn();
    setEtapa("sucesso");
  };

  // ─── Retorno para a tela ───────────────────────────────

  return {
    etapa,
    dadosQRAtual,
    jaLeu,
    fila,
    imagemPreview,
    progresso,
    resultados,
    correcoes,
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
