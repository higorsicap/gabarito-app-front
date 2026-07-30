import { listarProvasOffline } from "@/src/database/services/provaRepository";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ItemFiltro = {
    id: number;
    nome: string;
};

export function useHome() {
    const [provas, setProvas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filtros
    const [anoSelecionado, setAnoSelecionado] = useState<ItemFiltro | null>(null);
    const [clienteSelecionado, setClienteSelecionado] = useState<ItemFiltro | null>(null);
    const [escolaSelecionada, setEscolaSelecionada] = useState<ItemFiltro | null>(null);

    // Carrega apenas do SQLite local
    const carregarProvasLocais = useCallback(async () => {
        try {
            setLoading(true);

            const provasSalvas = await listarProvasOffline();

            // Mapeia o resultado do SQLite para a estrutura esperada pela FlatList da tela
            const listaMapeada = provasSalvas.map((item: any, index: number) => ({
                id: `${item.id_avaliacao_saed_mob}-${index}`,
                id_prova: item.id_avaliacao_saed_mob,
                id_cliente: item.id_cliente,
                id_escola: item.id_escola || 0,
                id_anoletivo: item.id_anoletivo,
                id_caderno_prova_disciplina: item.id_caderno_prova_disciplina || 0,
                materia: item.materia || "Sem disciplina",
                cliente: item.nome_cliente,
                escola: item.escola || "Local",
                prova: item.descricao_avaliacao,
                ano: item.id_anoletivo,
                serie: item.id_serie,
                turma: item.turma || "-",
            }));

            setProvas(listaMapeada);
        } catch (error) {
            console.error("Erro ao carregar provas do SQLite:", error);
            setProvas([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarProvasLocais();
    }, [carregarProvasLocais]);

    // Aplicação dos Filtros
    const provasFiltradas = useMemo(() => {
        return provas.filter((item) => {
            if (
                anoSelecionado &&
                Number(item.id_anoletivo) !== Number(anoSelecionado.id)
            ) {
                return false;
            }

            if (
                clienteSelecionado &&
                Number(item.id_cliente) !== Number(clienteSelecionado.id)
            ) {
                return false;
            }

            if (
                escolaSelecionada &&
                Number(item.id_escola) !== Number(escolaSelecionada.id)
            ) {
                return false;
            }

            return true;
        });
    }, [provas, anoSelecionado, clienteSelecionado, escolaSelecionada]);

    return {
        loading,
        provasFiltradas,
        anoSelecionado,
        setAnoSelecionado,
        clienteSelecionado,
        setClienteSelecionado,
        escolaSelecionada,
        setEscolaSelecionada,
        recarregarProvas: carregarProvasLocais, // Para atualizar a lista após alguma ação
    };
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  