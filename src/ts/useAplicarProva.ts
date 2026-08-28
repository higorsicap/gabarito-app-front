import { useCallback, useEffect, useState } from "react";

import { Alert } from "react-native";

import {
  AlunoSelect,
  AvaliacaoSelect,
  EscolaSelect,
  TurmaSelect,
  atualizarPausaDispositivo,
  buscarBateriaDispositivo,
  buscarDataHoraDispositivo,
  buscarDisciplinasAplicadas,
  buscarRespostasAluno,
  listarAlunoEscolaTurma,
  preencherSelectAvaliacao,
  preencherSelectEscola,
  preencherSelectTurma,
} from "@/src/database/services/provaRepository";

import {
  DispositivoConectado,
  getDispositivos,
  liberarProvaParaDispositivo,
  startServer,
  stopServer,
  subscribe,
} from "@/src/services/socketServer";

export interface DispositivoOption {
  id: string | number;
  nome: string;
}

export interface DisciplinaAplicada {
  id_disciplina?: string | number;
  nome: string;
  total: number;
  respondidas?: number;
}

export type StatusAluno =
  | "Pendente"
  | "Não iniciado"
  | "Iniciado"
  | "Pausado"
  | "Concluído";

export function useConsulta() {
  // ============================================================
  // LISTAS
  // ============================================================

  const [avaliacoesOpcoes, setAvaliacoesOpcoes] = useState<AvaliacaoSelect[]>(
    [],
  );

  const [servidorAtivo, setServidorAtivo] = useState(false);

  const [escolasOpcoes, setEscolasOpcoes] = useState<EscolaSelect[]>([]);

  const [turmasOpcoes, setTurmasOpcoes] = useState<TurmaSelect[]>([]);

  const [dispositivosOpcoes, setDispositivosOpcoes] = useState<
    DispositivoOption[]
  >([]);

  const [dispositivosAtribuidos, setDispositivosAtribuidos] = useState<
    Record<number, string>
  >({});

  const [statusAlunos, setStatusAlunos] = useState<Record<number, StatusAluno>>(
    {},
  );

  // ============================================================
  // 📝 RESPOSTAS POR ALUNO E DISCIPLINA
  //
  // {
  //   161: {
  //     "12": 2,
  //     "13": 0
  //   }
  // }
  // ============================================================

  const [respostasAlunos, setRespostasAlunos] = useState<
    Record<number, Record<string, number>>
  >({});

  // ============================================================
  // 🔋 BATERIA POR ALUNO
  //
  // {
  //   161: 19,
  //   17831: 87,
  //   2422: 45
  // }
  // ============================================================

  const [bateriasAlunos, setBateriasAlunos] = useState<
    Record<number, number | null>
  >({});

  // ============================================================
  // 🕐 ÚLTIMA COMUNICAÇÃO POR ALUNO
  //
  // {
  //   161: "2026-08-28 08:37:42",
  //   17831: "2026-08-28 08:38:01"
  // }
  //
  // Não salva nada aqui.
  // Esse estado existe somente enquanto a tela está aberta.
  // O valor real vem do campo dispositivos.atualizado_em.
  // ============================================================

  const [datasHoraAlunos, setDatasHoraAlunos] = useState<
    Record<number, string | null>
  >({});

  // ============================================================
  // CARREGAMENTO
  // ============================================================

  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);

  const [carregandoTurmas, setCarregandoTurmas] = useState(false);

  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  // ============================================================
  // FILTROS
  // ============================================================

  const [avaliacao, setAvaliacao] = useState("");
  const [escola, setEscola] = useState("");
  const [turma, setTurma] = useState("");
  const [dispositivo, setDispositivo] = useState("");
  const [ano, setAno] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");

  // ============================================================
  // ALUNOS
  // ============================================================

  const [alunos, setAlunos] = useState<AlunoSelect[]>([]);

  const [menuAberto, setMenuAberto] = useState<number | null>(null);

  // ============================================================
  // 🔄 DISPOSITIVOS VIA SOCKET
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const atualizarListaDispositivos = (
      listaServer: DispositivoConectado[],
    ) => {
      if (!isMounted) return;

      const opcoesMapeadas: DispositivoOption[] = (listaServer || []).map(
        (d) => ({
          id: d.id,
          nome: `${d.nome || "Tablet"} (${d.ip || "Sem IP"})`,
        }),
      );

      setDispositivosOpcoes(opcoesMapeadas);
    };

    atualizarListaDispositivos(getDispositivos());

    const unsubscribe = subscribe(
      (_respostas: unknown, novosDispositivos: DispositivoConectado[]) => {
        atualizarListaDispositivos(novosDispositivos);
      },
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // ============================================================
  // 🏛️ DADOS INICIAIS
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    async function carregarDadosIniciais() {
      try {
        setCarregandoOpcoes(true);

        const [dadosAvaliacoes, dadosEscolas] = await Promise.all([
          preencherSelectAvaliacao(),
          preencherSelectEscola(),
        ]);

        if (!isMounted) return;

        setAvaliacoesOpcoes(
          Array.isArray(dadosAvaliacoes) ? dadosAvaliacoes : [],
        );

        setEscolasOpcoes(Array.isArray(dadosEscolas) ? dadosEscolas : []);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        if (isMounted) {
          setCarregandoOpcoes(false);
        }
      }
    }

    carregarDadosIniciais();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================
  // 🏫 TURMAS POR ESCOLA
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    async function carregarTurmasPorEscola() {
      setTurma("");
      setAlunos([]);
      setDispositivosAtribuidos({});
      setStatusAlunos({});
      setRespostasAlunos({});
      setBateriasAlunos({});
      setDatasHoraAlunos({});

      if (!escola) {
        setTurmasOpcoes([]);
        return;
      }

      try {
        setCarregandoTurmas(true);

        const dadosTurmas = await preencherSelectTurma(escola);

        if (!isMounted) return;

        setTurmasOpcoes(Array.isArray(dadosTurmas) ? dadosTurmas : []);
      } catch (error) {
        console.error("Erro ao buscar turmas:", error);

        if (isMounted) {
          setTurmasOpcoes([]);
        }
      } finally {
        if (isMounted) {
          setCarregandoTurmas(false);
        }
      }
    }

    carregarTurmasPorEscola();

    return () => {
      isMounted = false;
    };
  }, [escola]);

  // ============================================================
  // 👨‍🎓 BUSCA ALUNOS + DISCIPLINAS
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    async function carregarAlunosAutomaticamente() {
      if (!escola || !turma) {
        setAlunos([]);
        setDispositivosAtribuidos({});
        setStatusAlunos({});
        setRespostasAlunos({});
        setBateriasAlunos({});
        setDatasHoraAlunos({});
        return;
      }

      try {
        setCarregandoAlunos(true);

        const dadosAlunos = await listarAlunoEscolaTurma(escola, turma);

        if (!isMounted) return;

        const listaAlunos = Array.isArray(dadosAlunos) ? dadosAlunos : [];

        let disciplinasAplicadas: DisciplinaAplicada[] = [];

        if (avaliacao) {
          disciplinasAplicadas = await obterDisciplinaAplicada(
            String(avaliacao),
          );
        }

        if (!isMounted) return;

        const alunosComDisciplinas = listaAlunos.map((aluno) => ({
          ...aluno,
          disciplinasAplicadas,
        }));

        setAlunos(alunosComDisciplinas);
      } catch (error) {
        console.error("Erro ao listar alunos e disciplinas:", error);

        if (isMounted) {
          setAlunos([]);
          setRespostasAlunos({});
          setBateriasAlunos({});
          setDatasHoraAlunos({});
        }
      } finally {
        if (isMounted) {
          setCarregandoAlunos(false);
        }
      }
    }

    carregarAlunosAutomaticamente();

    return () => {
      isMounted = false;
    };
  }, [turma, escola, avaliacao]);

  // ============================================================
  // 📝 ATUALIZAR RESPOSTAS
  // ============================================================

  const atualizarRespostasAlunos = useCallback(async () => {
    if (!avaliacao || alunos.length === 0) {
      setRespostasAlunos({});
      return;
    }

    try {
      const novoMapa: Record<number, Record<string, number>> = {};

      for (const aluno of alunos) {
        try {
          const respostas = await buscarRespostasAluno(
            aluno.id,
            Number(avaliacao),
          );

          const mapaDisciplinas: Record<string, number> = {};

          for (const resposta of respostas) {
            if (
              resposta.id_disciplina === null ||
              resposta.id_disciplina === undefined
            ) {
              continue;
            }

            mapaDisciplinas[String(resposta.id_disciplina)] = Number(
              resposta.respondidas ?? 0,
            );
          }

          novoMapa[aluno.id] = mapaDisciplinas;
        } catch (error) {
          console.error(
            `❌ Erro ao buscar respostas do aluno ${aluno.id}:`,
            error,
          );

          novoMapa[aluno.id] = {};
        }
      }

      setRespostasAlunos(novoMapa);
    } catch (error) {
      console.error("❌ Erro ao atualizar respostas dos alunos:", error);
    }
  }, [avaliacao, alunos]);

  // ============================================================
  // 🔋 ATUALIZAR BATERIAS
  // ============================================================

  const atualizarBateriasAlunos = useCallback(async () => {
    if (alunos.length === 0) {
      return;
    }

    try {
      const novoMapa: Record<number, number | null> = {};

      for (const aluno of alunos) {
        try {
          // aluno.id = id_estudante_origem
          const bateria = await buscarBateriaDispositivo(aluno.id);

          novoMapa[aluno.id] =
            bateria !== null && bateria !== undefined ? Number(bateria) : null;

          console.log(`🔋 [Bateria] Aluno=${aluno.id} | Bateria=${bateria}`);
        } catch (error) {
          console.error(
            `❌ [Bateria] Erro ao buscar bateria do aluno ${aluno.id}:`,
            error,
          );

          novoMapa[aluno.id] = null;
        }
      }

      setBateriasAlunos(novoMapa);
    } catch (error) {
      console.error("❌ [Bateria] Erro ao atualizar baterias:", error);
    }
  }, [alunos]);

  // ============================================================
  // 🕐 ATUALIZAR ÚLTIMA COMUNICAÇÃO
  // ============================================================

  const atualizarDatasHoraAlunos = useCallback(async () => {
    if (alunos.length === 0) {
      return;
    }

    try {
      const novoMapa: Record<number, string | null> = {};

      for (const aluno of alunos) {
        try {
          // aluno.id = id_estudante_origem
          const dataHora = await buscarDataHoraDispositivo(aluno.id);

          novoMapa[aluno.id] = dataHora;

          console.log(
            `🕐 [Comunicação] Aluno=${aluno.id} | Atualizado em=${dataHora}`,
          );
        } catch (error) {
          console.error(
            `❌ [Comunicação] Erro ao buscar data/hora do aluno ${aluno.id}:`,
            error,
          );

          novoMapa[aluno.id] = null;
        }
      }

      setDatasHoraAlunos(novoMapa);
    } catch (error) {
      console.error("❌ [Comunicação] Erro ao atualizar datas:", error);
    }
  }, [alunos]);

  // ============================================================
  // 🔄 ATUALIZAÇÃO AUTOMÁTICA
  //
  // 1. Respostas
  // 2. Bateria
  // 3. Última comunicação
  // 4. Aguarda 3 segundos
  // 5. Repete
  // ============================================================

  useEffect(() => {
    if (!avaliacao || alunos.length === 0) {
      return;
    }

    let ativo = true;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const atualizar = async () => {
      if (!ativo) {
        return;
      }

      console.log(
        "🔄 [Painel] Atualizando respostas, bateria e última comunicação...",
      );

      // ========================================================
      // 📝 RESPOSTAS
      // ========================================================

      await atualizarRespostasAlunos();

      if (!ativo) {
        return;
      }

      // ========================================================
      // 🔋 BATERIA
      // ========================================================

      await atualizarBateriasAlunos();

      if (!ativo) {
        return;
      }

      // ========================================================
      // 🕐 ÚLTIMA COMUNICAÇÃO
      // ========================================================

      await atualizarDatasHoraAlunos();

      if (!ativo) {
        return;
      }

      console.log("✅ [Painel] Atualização concluída.");

      // Aguarda 3 segundos para executar
      // novamente.
      timeoutId = setTimeout(atualizar, 3000);
    };

    atualizar();

    return () => {
      ativo = false;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    avaliacao,
    alunos,
    atualizarRespostasAlunos,
    atualizarBateriasAlunos,
    atualizarDatasHoraAlunos,
  ]);

  // ============================================================
  // 📝 OBTER RESPOSTAS DE UMA DISCIPLINA
  // ============================================================

  const obterRespostasDisciplina = useCallback(
    (alunoId: number, idDisciplina?: string | number): number => {
      if (idDisciplina === undefined || idDisciplina === null) {
        return 0;
      }

      return respostasAlunos[alunoId]?.[String(idDisciplina)] ?? 0;
    },
    [respostasAlunos],
  );

  // ============================================================
  // 🔋 OBTER BATERIA DO ALUNO
  // ============================================================

  const obterBateriaAluno = useCallback(
    (alunoId: number): number => {
      return bateriasAlunos[alunoId] ?? 0;
    },
    [bateriasAlunos],
  );

  // ============================================================
  // 🕐 OBTER DATA/HORA DO ALUNO
  // ============================================================

  const obterDataHoraAluno = useCallback(
    (alunoId: number): string | null => {
      return datasHoraAlunos[alunoId] ?? null;
    },
    [datasHoraAlunos],
  );

  // ============================================================
  // 📱 ATRIBUIR DISPOSITIVO
  // ============================================================

  function atribuirDispositivo(alunoId: number, dispositivoId: string) {
    setDispositivosAtribuidos((prev) => ({
      ...prev,
      [alunoId]: dispositivoId,
    }));
  }

  // ============================================================
  // 📊 STATUS
  // ============================================================

  function obterStatusAluno(
    alunoId: number,
    statusOriginal?: string,
  ): StatusAluno {
    if (statusAlunos[alunoId]) {
      return statusAlunos[alunoId];
    }

    if (statusOriginal === "Concluído") {
      return "Concluído";
    }

    const temDispositivo = Boolean(dispositivosAtribuidos[alunoId]);

    return temDispositivo ? "Não iniciado" : "Pendente";
  }

  // ============================================================
  // 🧹 LIMPAR FILTROS
  // ============================================================

  function limparFiltros() {
    setAvaliacao("");
    setEscola("");
    setTurma("");
    setDispositivo("");
    setAno("");
    setHorarioInicio("");

    setAlunos([]);
    setDispositivosAtribuidos({});
    setStatusAlunos({});
    setRespostasAlunos({});
    setBateriasAlunos({});
    setDatasHoraAlunos({});
  }

  // ============================================================
  // 📂 MENU
  // ============================================================

  function toggleMenu(id: number) {
    setMenuAberto((prev) => (prev === id ? null : id));
  }

  // ============================================================
  // 🔋 CONSULTAR BATERIA DIRETAMENTE
  // ============================================================

  async function obterBateriaDispositivo(
    idEstudanteOrigem: number,
  ): Promise<number | null> {
    if (!idEstudanteOrigem) {
      return null;
    }

    return await buscarBateriaDispositivo(idEstudanteOrigem);
  }

  // ============================================================
  // 📚 DISCIPLINAS
  // ============================================================

  async function obterDisciplinaAplicada(
    avaliacaoOuDispositivoId: string,
  ): Promise<DisciplinaAplicada[]> {
    if (!avaliacaoOuDispositivoId) {
      return [];
    }

    return await buscarDisciplinasAplicadas(avaliacaoOuDispositivoId);
  }

  // ============================================================
  // 🚀 INICIAR
  // ============================================================

  async function handleIniciar(idAluno: number) {
    if (!avaliacao) {
      Alert.alert(
        "Aviso",
        "Por favor, selecione uma Avaliação no filtro antes de iniciar.",
      );

      return;
    }

    const dispositivoId = dispositivosAtribuidos[idAluno];

    if (!dispositivoId) {
      Alert.alert(
        "Aviso",
        "Selecione um dispositivo para este aluno antes de iniciar.",
      );

      return;
    }

    const aluno = alunos.find((a) => a.id === idAluno);

    try {
      setMenuAberto(null);

      await liberarProvaParaDispositivo(dispositivoId, avaliacao, {
        id: idAluno,
        nome: aluno?.nome || "Aluno Sem Nome",
      });

      setStatusAlunos((prev) => ({
        ...prev,
        [idAluno]: "Iniciado",
      }));

      console.log(
        `✅ Prova liberada para ${aluno?.nome} no Tablet (${dispositivoId})`,
      );
    } catch (error: unknown) {
      console.error("❌ Erro ao liberar prova no banco:", error);

      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível liberar a prova.";

      Alert.alert("Erro", mensagem);
    }
  }

  // ============================================================
  // 🚀 INICIAR TODOS
  // ============================================================

  async function handleIniciarTodos() {
    if (!avaliacao) {
      Alert.alert(
        "Aviso",
        "Por favor, selecione uma Avaliação no filtro antes de iniciar para todos.",
      );

      return;
    }

    const alunosParaIniciar = alunos.filter((aluno) => {
      const dispId = dispositivosAtribuidos[aluno.id];

      const status = obterStatusAluno(aluno.id, aluno.status);

      return dispId && status !== "Concluído" && status !== "Iniciado";
    });

    if (alunosParaIniciar.length === 0) {
      Alert.alert(
        "Aviso",
        "Nenhum aluno elegível encontrado. Certifique-se de vincular os dispositivos aos alunos antes de iniciar.",
      );

      return;
    }

    Alert.alert(
      "Confirmação",
      `Deseja iniciar a prova para ${alunosParaIniciar.length} aluno(s)?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Iniciar",
          onPress: async () => {
            setMenuAberto(null);

            const promessas = alunosParaIniciar.map(async (aluno) => {
              const dispositivoId = dispositivosAtribuidos[aluno.id];

              try {
                await liberarProvaParaDispositivo(dispositivoId, avaliacao, {
                  id: aluno.id,
                  nome: aluno.nome || "Aluno Sem Nome",
                });

                setStatusAlunos((prev) => ({
                  ...prev,
                  [aluno.id]: "Iniciado",
                }));
              } catch (error) {
                console.error(
                  `❌ Erro ao liberar prova para o aluno ${aluno.nome}:`,
                  error,
                );
              }
            });

            await Promise.allSettled(promessas);

            Alert.alert("Sucesso", "Processo de liberação em massa concluído!");
          },
        },
      ],
      {
        cancelable: true,
      },
    );
  }

  // ============================================================
  // ⏸️ PAUSAR
  // ============================================================

  async function handlePausar(idAluno: number) {
    const dispositivoId = dispositivosAtribuidos[idAluno];

    if (!dispositivoId) {
      Alert.alert("Aviso", "Nenhum dispositivo está vinculado a este aluno.");

      return;
    }

    const estaPausadoAtual = statusAlunos[idAluno] === "Pausado";

    const novoStatusPausa = !estaPausadoAtual;

    try {
      setMenuAberto(null);

      await atualizarPausaDispositivo(dispositivoId, novoStatusPausa);

      setStatusAlunos((prev) => ({
        ...prev,
        [idAluno]: novoStatusPausa ? "Pausado" : "Iniciado",
      }));

      console.log(
        `✅ Status do Dispositivo ${dispositivoId} atualizado para Pausado=${novoStatusPausa}`,
      );
    } catch (error: unknown) {
      console.error(`❌ Erro ao atualizar pausa do aluno ${idAluno}:`, error);

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao tentar pausar/retomar a prova.";

      Alert.alert("Erro", mensagem);
    }
  }

  // ============================================================
  // 🔄 REINICIAR
  // ============================================================

  function handleReiniciar(id: number) {
    console.log("Reiniciando estado do aluno ID:", id);

    setStatusAlunos((prev) => ({
      ...prev,
      [id]: "Não iniciado",
    }));

    setMenuAberto(null);
  }

  // ============================================================
  // 📡 SERVIDOR
  // ============================================================

  function handleIniciarServidor() {
    console.log("Iniciando Socket Server...");

    startServer();

    setServidorAtivo(true);
  }

  function handleEncerrarServidor() {
    console.log("Encerrando Socket Server...");

    stopServer();

    setServidorAtivo(false);
  }

  // ============================================================
  // RETURN
  // ============================================================

  return {
    avaliacoesOpcoes,

    servidorAtivo,

    escolasOpcoes,
    turmasOpcoes,

    dispositivosOpcoes,
    dispositivosAtribuidos,

    atribuirDispositivo,
    obterStatusAluno,

    carregandoOpcoes,
    carregandoTurmas,
    carregandoAlunos,

    filtros: {
      avaliacao,
      setAvaliacao,

      escola,
      setEscola,

      turma,
      setTurma,

      dispositivo,
      setDispositivo,

      ano,
      setAno,

      horarioInicio,
      setHorarioInicio,
    },

    menuAberto,
    alunos,

    limparFiltros,
    toggleMenu,

    handleIniciar,
    handleIniciarTodos,
    handlePausar,
    handleReiniciar,

    handleIniciarServidor,
    handleEncerrarServidor,

    // ==========================================================
    // 🔋 BATERIA
    // ==========================================================

    bateriasAlunos,
    obterBateriaAluno,
    obterBateriaDispositivo,
    atualizarBateriasAlunos,

    // ==========================================================
    // 📚 DISCIPLINAS
    // ==========================================================

    obterDisciplinaAplicada,

    // ==========================================================
    // 📝 RESPOSTAS
    // ==========================================================

    respostasAlunos,
    obterRespostasDisciplina,
    atualizarRespostasAlunos,

    // ==========================================================
    // 🕐 ÚLTIMA COMUNICAÇÃO
    // ==========================================================

    datasHoraAlunos,
    obterDataHoraAluno,
    atualizarDatasHoraAlunos,
  };
}
