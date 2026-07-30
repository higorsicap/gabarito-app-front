import {
    AlunoSelect,
    AvaliacaoSelect,
    EscolaSelect,
    TurmaSelect,
    listarAlunoEscolaTurma,
    preencherSelectAvaliacao,
    preencherSelectEscola,
    preencherSelectTurma,
} from "@/src/database/services/provaRepository";

// 📌 AJUSTADO: Importando liberarProvaParaDispositivo e apontando para o seu arquivo do servidor
import {
    DispositivoConectado,
    getDispositivos,
    liberarProvaParaDispositivo,
    startServer,
    subscribe,
} from "@/src/services/socketServer"; // 👈 Confirme se o caminho do seu servidor.ts é este
import { useEffect, useState } from "react";

export interface DispositivoOption {
    id: string | number;
    nome: string;
}

// Tipagem para os possíveis status do aluno
export type StatusAluno = "Pendente" | "Não iniciado" | "Iniciado" | "Pausado" | "Concluído";

export function useConsulta() {
    // 1. Listas para os Selects
    const [avaliacoesOpcoes, setAvaliacoesOpcoes] = useState<AvaliacaoSelect[]>([]);
    const [escolasOpcoes, setEscolasOpcoes] = useState<EscolaSelect[]>([]);
    const [turmasOpcoes, setTurmasOpcoes] = useState<TurmaSelect[]>([]);

    // Lista de Dispositivos recebidos via socket/polling
    const [dispositivosOpcoes, setDispositivosOpcoes] = useState<DispositivoOption[]>([]);

    // Mapeamento individual de Dispositivo por Aluno: { [idAluno]: idDispositivo }
    const [dispositivosAtribuidos, setDispositivosAtribuidos] = useState<Record<number, string>>({});

    // Mapeamento individual do Status de Ação do Aluno: { [idAluno]: StatusAluno }
    const [statusAlunos, setStatusAlunos] = useState<Record<number, StatusAluno>>({});

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

    // EFFECT PARA OUVIR OS DISPOSITIVOS EM TEMPO REAL
    useEffect(() => {
        const atualizarListaDispositivos = (listaServer: DispositivoConectado[]) => {
            const opcoesMapeadas: DispositivoOption[] = listaServer.map((d) => ({
                id: d.id,
                nome: `${d.nome} (${d.ip || "Sem IP"})`,
            }));
            setDispositivosOpcoes(opcoesMapeadas);
        };

        atualizarListaDispositivos(getDispositivos());

        const unsubscribe = subscribe((_respostas: any, novosDispositivos: DispositivoConectado[]) => {
            atualizarListaDispositivos(novosDispositivos);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Carrega Avaliações e Escolas na inicialização
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
                setAvaliacoesOpcoes(Array.isArray(dadosAvaliacoes) ? dadosAvaliacoes : []);
                setEscolasOpcoes(Array.isArray(dadosEscolas) ? dadosEscolas : []);
            } catch (error) {
                console.error("Erro ao carregar dados iniciais:", error);
            } finally {
                if (isMounted) setCarregandoOpcoes(false);
            }
        }
        carregarDadosIniciais();
        return () => { isMounted = false; };
    }, []);

    // Carrega Turmas ao selecionar/alterar a Escola
    useEffect(() => {
        let isMounted = true;
        async function carregarTurmasPorEscola() {
            setTurma("");
            setAlunos([]);

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
        return () => { isMounted = false; };
    }, [escola]);

    // Busca Alunos AUTOMATICAMENTE ao selecionar a Turma
    useEffect(() => {
        let isMounted = true;

        async function carregarAlunosAutomaticamente() {
            if (!escola || !turma) {
                setAlunos([]);
                return;
            }

            try {
                setCarregandoAlunos(true);
                const dadosAlunos = await listarAlunoEscolaTurma(escola, turma);

                if (!isMounted) return;
                setAlunos(Array.isArray(dadosAlunos) ? dadosAlunos : []);
            } catch (error) {
                console.error("Erro ao listar alunos:", error);
                if (isMounted) setAlunos([]);
            } finally {
                if (isMounted) setCarregandoAlunos(false);
            }
        }

        carregarAlunosAutomaticamente();

        return () => { isMounted = false; };
    }, [turma, escola]);

    // Função para vincular um dispositivo a um aluno
    function atribuirDispositivo(alunoId: number, dispositivoId: string) {
        setDispositivosAtribuidos((prev) => ({
            ...prev,
            [alunoId]: dispositivoId,
        }));
    }

    // Calcula dinamicamente o status atual de cada aluno
    function obterStatusAluno(alunoId: number, statusOriginal?: string): StatusAluno {
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

    // 🚀 INICIAR AVALIAÇÃO PARA O ALUNO
    async function handleIniciar(idAluno: number) {
        // 1. Valida se a Avaliação foi selecionada no filtro
        if (!avaliacao) {
            alert("Por favor, selecione uma Avaliação no filtro antes de iniciar.");
            return;
        }

        // 2. Busca o ID do dispositivo associado ao aluno
        const dispositivoId = dispositivosAtribuidos[idAluno];

        if (!dispositivoId) {
            alert("Selecione um dispositivo para este aluno antes de iniciar.");
            return;
        }

        // 3. Localiza o aluno na lista
        const aluno = alunos.find((a) => a.id === idAluno);

        try {
            setMenuAberto(null);

            // 📌 4. Grava a liberação no SQLite (liberacoes_prova) para o tablet buscar via /recebeprova
            await liberarProvaParaDispositivo(
                dispositivoId,
                avaliacao,
                {
                    id: idAluno,
                    nome: aluno?.nome || "Aluno Sem Nome",
                }
            );

            // 5. Atualiza o status local da tela para "Iniciado"
            setStatusAlunos((prev) => ({ ...prev, [idAluno]: "Iniciado" }));
            console.log(`✅ Prova gravada na tabela 'liberacoes_prova' para o aluno ${aluno?.nome} (Tablet: ${dispositivoId})`);

        } catch (error: any) {
            console.error("❌ Erro ao liberar prova no banco:", error);
            alert(error?.message || "Não foi possível liberar a prova para este dispositivo.");
        }
    }

    function handlePausar(id: number) {
        console.log("Pausar aluno ID:", id);
        setStatusAlunos((prev) => ({ ...prev, [id]: "Pausado" }));
        setMenuAberto(null);
    }

    function handleReiniciar(id: number) {
        console.log("Reiniciar aluno ID:", id);
        setStatusAlunos((prev) => ({ ...prev, [id]: "Não iniciado" }));
        setMenuAberto(null);
    }

    function handleIniciarServidor() {
        console.log("Servidor iniciado");
        startServer();
    }

    return {
        avaliacoesOpcoes,
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
        handlePausar,
        handleReiniciar,
        handleIniciarServidor,
    };
}