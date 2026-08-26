import { useEffect, useState } from "react";
import { Alert } from "react-native";

import {
  AlunoSelect,
  AvaliacaoSelect,
  EscolaSelect,
  TurmaSelect,
  atualizarPausaDispositivo,
  buscarDisciplinasAplicadas,
  listarAlunoEscolaTurma,
  preencherSelectAvaliacao,
  preencherSelectEscola,
  preencherSelectTurma,
  verificarBateriaDispositivo,
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
  // 1. Listas para os Selects
  const [avaliacoesOpcoes, setAvaliacoesOpcoes] = useState<AvaliacaoSelect[]>(
    [],
  );
  const [servidorAtivo, setServidorAtivo] = useState(false);
  const [escolasOpcoes, setEscolasOpcoes] = useState<EscolaSelect[]>([]);
  const [turmasOpcoes, setTurmasOpcoes] = useState<TurmaSelect[]>([]);

  // Lista de Dispositivos recebidos via socket/polling
  const [dispositivosOpcoes, setDispositivosOpcoes] = useState<
    DispositivoOption[]
  >([]);

  // Mapeamento individual de Dispositivo por Aluno: { [idAluno]: idDispositivo }
  const [dispositivosAtribuidos, setDispositivosAtribuidos] = useState<
    Record<number, string>
  >({});

  // Mapeamento individual do Status de Ação do Aluno: { [idAluno]: StatusAluno }
  const [statusAlunos, setStatusAlunos] = useState<Record<number, StatusAluno>>(
    {},
  );

  // Estados de Carregamento
  const [carregandoOpcoes, setCarregandoOpcoes] = useState<boolean>(true);
  const [carregandoTurmas, setCarregandoTurmas] = useState<boolean>(false);
  const [carregandoAlunos, setCarregandoAlunos] = useState<boolean>(false);

  // 2. Filtros
  const [avaliacao, setAvaliacao] = useState<string>("");
  const [escola, setEscola] = useState<string>("");
  const [turma, setTurma] = useState<string>("");
  const [dispositivo, setDispositivo] = useState<string>("");
  const [ano, setAno] = useState<string>("");
  const [horarioInicio, setHorarioInicio] = useState<string>("");

  // 3. Resultado da Tabela e Ações
  const [alunos, setAlunos] = useState<AlunoSelect[]>([]);
  const [menuAberto, setMenuAberto] = useState<number | null>(null);

  // 🔄 EFFECT PARA OUVIR DISPOSITIVOS E DADOS EM TEMPO REAL VIA SOCKET
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

    // Carrega estado inicial de dispositivos
    atualizarListaDispositivos(getDispositivos());

    // Subscrição em tempo real
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

  // 🏛️ Carrega Avaliações e Escolas na inicialização
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
        if (isMounted) setCarregandoOpcoes(false);
      }
    }

    carregarDadosIniciais();
    return () => {
      isMounted = false;
    };
  }, []);

  // 🏫 Carrega Turmas ao selecionar/alterar a Escola
  useEffect(() => {
    let isMounted = true;

    async function carregarTurmasPorEscola() {
      setTurma("");
      setAlunos([]);
      setDispositivosAtribuidos({});
      setStatusAlunos({});

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
        if (isMounted) setTurmasOpcoes([]);
      } finally {
        if (isMounted) setCarregandoTurmas(false);
      }
    }

    carregarTurmasPorEscola();
    return () => {
      isMounted = false;
    };
  }, [escola]);

  // 👨‍🎓 Busca Alunos AUTOMATICAMENTE ao selecionar a Turma
  // 📚 Junto com os alunos, busca as disciplinas aplicadas da avaliação selecionada
  useEffect(() => {
    let isMounted = true;

    async function carregarAlunosAutomaticamente() {
      if (!escola || !turma) {
        setAlunos([]);
        setDispositivosAtribuidos({});
        setStatusAlunos({});
        return;
      }

      try {
        setCarregandoAlunos(true);

        // Busca os alunos da escola/turma
        const dadosAlunos = await listarAlunoEscolaTurma(escola, turma);

        if (!isMounted) return;

        const listaAlunos = Array.isArray(dadosAlunos) ? dadosAlunos : [];

        // Se houver uma avaliação selecionada,
        // busca as disciplinas aplicadas dessa avaliação.
        let disciplinasAplicadas: DisciplinaAplicada[] = [];

        if (avaliacao) {
          disciplinasAplicadas = await obterDisciplinaAplicada(
            String(avaliacao),
          );
        }

        if (!isMounted) return;

        // Adiciona as disciplinas em cada aluno
        const alunosComDisciplinas = listaAlunos.map((aluno) => ({
          ...aluno,
          disciplinasAplicadas,
        }));

        setAlunos(alunosComDisciplinas);
      } catch (error) {
        console.error("Erro ao listar alunos e disciplinas:", error);

        if (isMounted) {
          setAlunos([]);
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

  // 📱 Atribuir dispositivo a um aluno
  function atribuirDispositivo(alunoId: number, dispositivoId: string) {
    setDispositivosAtribuidos((prev) => ({
      ...prev,
      [alunoId]: dispositivoId,
    }));
  }

  // 📊 Status dinâmico do aluno
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
  }

  function toggleMenu(id: number) {
    setMenuAberto((prev) => (prev === id ? null : id));
  }

  // 🔋 Consultar bateria de um dispositivo
  async function obterBateriaDispositivo(
    dispositivoId: string,
  ): Promise<number | null> {
    if (!dispositivoId) return null;
    return await verificarBateriaDispositivo(dispositivoId);
  }

  // 📚 Consultar disciplinas aplicadas de uma avaliação/dispositivo
  async function obterDisciplinaAplicada(
    avaliacaoOuDispositivoId: string,
  ): Promise<DisciplinaAplicada[]> {
    if (!avaliacaoOuDispositivoId) return [];
    return await buscarDisciplinasAplicadas(avaliacaoOuDispositivoId);
  }

  // 🚀 Iniciar avaliação para o aluno
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

      setStatusAlunos((prev) => ({ ...prev, [idAluno]: "Iniciado" }));
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

  // 🚀 Iniciar avaliação para TODOS os alunos válidos da lista
  async function handleIniciarTodos() {
    if (!avaliacao) {
      Alert.alert(
        "Aviso",
        "Por favor, selecione uma Avaliação no filtro antes de iniciar para todos.",
      );
      return;
    }

    // Filtra apenas alunos que têm um dispositivo associado e que ainda não concluíram
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
      { cancelable: true },
    );
  }

  // ⏸️ Pausar ou Retomar a prova do aluno
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

  // 🔄 Reiniciar Prova do Aluno
  function handleReiniciar(id: number) {
    console.log("Reiniciando estado do aluno ID:", id);
    setStatusAlunos((prev) => ({ ...prev, [id]: "Não iniciado" }));
    setMenuAberto(null);
  }

  // 📡 Iniciar servidor de Sockets
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
    // 🟢 Funções expostas para uso no componente de tela
    obterBateriaDispositivo,
    obterDisciplinaAplicada,
  };
}
