import { listarRespostasAgrupadas } from '@/src/database/services/respostaRepository';
import { corrigirProva, montarGabarito } from '@/src/services/correcaoGabarito';
import { startServer, subscribe } from '@/src/services/socketServer';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

type Questao = {
    numero_questao: string;
    alternativa: string;
};

export function useSincronizador() {
    const [ativo, setAtivo] = useState(false);
    const [respostas, setRespostas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // --- Iniciar Servidor Socket ---
    function handleStartSync() {
        try {
            startServer();
            setAtivo(true);
            Alert.alert('Sincronizador ativo', 'Servidor iniciado com sucesso!');
        } catch {
            Alert.alert('Erro', 'Não foi possível iniciar o servidor');
        }
    }

    // --- Inscrição no Socket ---
    useEffect(() => {
        const unsubscribe = subscribe((dados: any[]) => {
            setRespostas(dados);
        });
        return unsubscribe;
    }, []);

    // --- Leitura do SQLite ---
    async function carregarSQLite() {
        try {
            setLoading(true);
            const data = await listarRespostasAgrupadas();
            console.log('📦 SQLITE:', data);
            setRespostas(data || []);
        } catch (e) {
            console.log('❌ Erro SQLite:', e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarSQLite();
    }, []);

    // --- Agrupamento de Respostas por Caderno + Aluno ---
    const provasAgrupadas = useMemo(() => {
        const mapa = new Map<string, any>();

        respostas.forEach((item) => {
            const chave = `${item.id_caderno_de_prova_disciplina}_${item.nome_aluno}`;

            if (!mapa.has(chave)) {
                mapa.set(chave, {
                    id_caderno_de_prova_disciplina: item.id_caderno_de_prova_disciplina,
                    id_prova: item.id_prova,
                    nome_prova: item.nome_prova || `Prova ${item.id_prova}`,
                    nome_aluno: item.nome_aluno,
                    respostas: [],
                    questoes: 0,
                });
            }

            mapa.get(chave).respostas.push(item);
        });

        mapa.forEach((value) => {
            const totalQuestoes = new Set(
                value.respostas.map((x: any) => x.numero_questao)
            );
            value.questoes = totalQuestoes.size;
        });

        return Array.from(mapa.values());
    }, [respostas]);

    // --- Correção da Prova ---
    async function handleCorrigir(prova: any) {
        try {
            const questoes = (await buscarGabaritoProva(prova.id_prova)) as Questao[];
            const gabarito = montarGabarito(questoes);

            const respostasAluno: Record<string, string> = {};
            prova.respostas.forEach((item: any) => {
                respostasAluno[String(item.numero_questao)] = item.resposta_aluno;
            });

            const resultado = corrigirProva(gabarito, respostasAluno);
            console.log('📊 RESULTADO:', resultado);

            Alert.alert(
                `Resultado - ${prova.nome_aluno}`,
                `📄 Caderno: ${prova.id_caderno_de_prova_disciplina}\n\n` +
                `✅ Acertos: ${resultado.acertos}\n` +
                `❌ Erros: ${resultado.erros}\n` +
                `📊 Percentual: ${resultado.percentual}%`
            );
        } catch (e) {
            console.log('❌ Erro ao corrigir:', e);
            Alert.alert('Erro', 'Não foi possível corrigir a prova');
        }
    }

    return {
        ativo,
        loading,
        respostasCount: respostas.length,
        provasAgrupadas,
        handleStartSync,
        handleCorrigir,
    };
}