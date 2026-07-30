import { salvarAlunosOffline, salvarEscolasOffline, salvarProvaOffline, salvarTurmasOffline } from '@/src/database/services/salvarAvaliacao';
import { listaAlunos, listarEscolas, listaTurmas, provasDisponiveis } from '@/src/services/listaProvaService';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

export function useSyncModal() {
    const [modalVisible, setModalVisible] = useState(false);
    const [selecionados, setSelecionados] = useState<string[]>([]);
    const [page, setPage] = useState(0);
    const [dados, setDados] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [baixando, setBaixando] = useState(false);

    const itemsPerPage = 10;

    useEffect(() => {
        if (modalVisible) {
            carregarProvas();
        }
    }, [modalVisible]);

    async function carregarProvas() {
        try {
            setLoading(true);
            const resposta = await provasDisponiveis();

            if (Array.isArray(resposta)) {
                setDados(resposta);
            } else {
                console.log('⚠️ Resposta do PHP não é um array válido:', resposta);
                setDados([]);
            }
        } catch (error) {
            console.error('Erro ao carregar provas do PHP:', error);
            Alert.alert('Erro', 'Não foi possível carregar as provas disponíveis.');
        } finally {
            setLoading(false);
        }
    }

    function alterarSelecao(id: string) {
        setSelecionados((old) =>
            old.includes(id) ? old.filter((x) => x !== id) : [...old, id]
        );
    }

    async function handleBaixarProvas() {
        if (selecionados.length === 0) {
            Alert.alert('Atenção', 'Por favor, selecione pelo menos uma prova para baixar.');
            return;
        }

        try {
            setBaixando(true);

            // 1. Filtra as provas selecionadas
            const provasParaSalvar = dados.filter((item) =>
                selecionados.includes(String(item.id_avaliacao_saed))
            );

            // 2. Extrai o id_cliente do primeiro item selecionado
            const idClienteAtual = provasParaSalvar[0]?.id_cliente;

            if (!idClienteAtual) {
                Alert.alert('Atenção', 'Não foi possível identificar o cliente da prova.');
                return;
            }

            // 3. Dispara as chamadas da API em paralelo com o id_cliente correto
            const [alunosRes, escolasRes, turmaRes] = await Promise.all([
                listaAlunos({ id_cliente: idClienteAtual }),
                listarEscolas({ id_cliente: idClienteAtual }),
                listaTurmas({id_cliente: idClienteAtual}),
            ]);

            // 🔍 1. INSspecione o retorno da API no seu console
            console.log('Qtd de Alunos recebidos da API:', Array.isArray(alunosRes) ? alunosRes.length : 0);
            console.log('Exemplo do primeiro aluno:', alunosRes?.[0]);

            // 4. Salva a prova, alunos e escolas no SQLite local
            await salvarProvaOffline(provasParaSalvar);
            await salvarEscolasOffline(escolasRes); // Sua função SQLite para escolas
            await salvarTurmasOffline(turmaRes);
            await salvarAlunosOffline(alunosRes);   // Sua função SQLite para alunos

            console.log('Processo de inserção offline concluído!');
            
            Alert.alert(
                'Download Concluído',
                `${provasParaSalvar.length} prova(s), alunos e escolas salvos com sucesso!`
            );

            setSelecionados([]);
            setModalVisible(false);
        } catch (error) {
            console.error('Erro ao salvar dados offline:', error);
            Alert.alert('Erro no download', 'Houve uma falha ao tentar salvar os dados no dispositivo local.');
        } finally {
            setBaixando(false);
        }
    }

    const registros = useMemo(() => {
        const from = page * itemsPerPage;
        const to = from + itemsPerPage;
        return dados.slice(from, to);
    }, [page, dados]);

    function formatarDataBR(dataString: string) {
        if (!dataString) return '-';
        const apenasData = dataString.split(' ')[0];
        const partes = apenasData.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dataString;
    }

    return {
        modalVisible,
        setModalVisible,
        selecionados,
        page,
        setPage,
        dados,
        loading,
        baixando,
        itemsPerPage,
        registros,
        alterarSelecao,
        handleBaixarProvas,
        formatarDataBR,
    };
}