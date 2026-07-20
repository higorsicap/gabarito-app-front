import Checkbox from 'expo-checkbox';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import {
    Button,
    DataTable,
    Surface,
    Text,
} from 'react-native-paper';

import BottomNav from '@/src/components/BottomNav';

// 1. Importações dos seus Serviços
import { salvarProvaOffline } from '@/src/database/services/provaRepository'; // Ajuste o caminho de onde está a função de salvar no SQLite
import { provasDisponiveis } from '@/src/services/listaProvaService'; // Ajuste o caminho do seu service PHP (s: 7)

export default function ExampleFour() {

    const [selecionados, setSelecionados] = useState<string[]>([]);
    const [page, setPage] = useState(0);
    const [dados, setDados] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [baixando, setBaixando] = useState(false); // Estado de loading para o botão de download

    const itemsPerPage = 10;

    // Busca os dados do PHP assim que o componente monta
    useEffect(() => {
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
                console.error("Erro ao carregar provas do PHP:", error);
                Alert.alert("Erro", "Não foi possível carregar as provas disponíveis.");
            } finally {
                setLoading(false);
            }
        }

        carregarProvas();
    }, []);

    // Alterna a seleção de uma prova na tabela
    function alterarSelecao(id: string) {
        setSelecionados((old) =>
            old.includes(id)
                ? old.filter(x => x !== id)
                : [...old, id]
        );
    }

    // 🔥 FUNÇÃO PRINCIPAL: Processa o download e salva no SQLite
    async function handleBaixarProvas() {
        if (selecionados.length === 0) {
            Alert.alert("Atenção", "Por favor, selecione pelo menos uma prova para baixar.");
            return;
        }

        try {
            setBaixando(true);

            // 1. Filtramos a lista completa de "dados" buscando apenas os objetos que o usuário selecionou na tabela
            const provasParaSalvar = dados.filter(item => 
                selecionados.includes(String(item.id_avaliacao_saed))
            );

            // 2. Chamamos a sua função de gravação que criamos para o SQLite
            await salvarProvaOffline(provasParaSalvar);

            // 3. Sucesso!
            Alert.alert(
                "Download Concluído", 
                `${provasParaSalvar.length} prova(s) baixada(s) e salva(s) com sucesso para uso offline!`
            );
            
            // Limpa os checkboxes marcados após o sucesso
            setSelecionados([]);

        } catch (error) {
            console.error("Erro ao salvar provas offline:", error);
            Alert.alert("Erro no download", "Houve uma falha ao tentar salvar os dados no dispositivo local.");
        } finally {
            setBaixando(false);
        }
    }

    const registros = useMemo(() => {
        const from = page * itemsPerPage;
        const to = from + itemsPerPage;
        return dados.slice(from, to);
    }, [page, dados]);

    // Formatador simples para exibir a data vinda do banco como DD/MM/YYYY
    function formatarDataBR(dataString: string) {
        if (!dataString) return '-';
        const apenasData = dataString.split(' ')[0];
        const partes = apenasData.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dataString;
    }

    return (
        <Surface style={styles.container}>
            <BottomNav />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4dabf7" />
                    <Text style={{ marginTop: 12, color: '#666' }}>Buscando provas disponíveis...</Text>
                </View>
            ) : (
                <>
                    <ScrollView 
                        horizontal 
                        style={styles.scrollViewHorizontal}
                        contentContainerStyle={{ flexGrow: 0 }}
                    >
                        <DataTable style={styles.table}>
                            <DataTable.Header style={styles.header}>
                                <DataTable.Title style={styles.colDescricao}>
                                    <Text style={styles.headerText}>Descrição</Text>
                                </DataTable.Title>
                                <DataTable.Title style={styles.colPequena}>
                                    <Text style={styles.headerText}>Município</Text>
                                </DataTable.Title>
                                <DataTable.Title style={styles.colPequena}>
                                    <Text style={styles.headerText}>Início</Text>
                                </DataTable.Title>
                                <DataTable.Title style={styles.colPequena}>
                                    <Text style={styles.headerText}>Fim</Text>
                                </DataTable.Title>
                                <DataTable.Title numeric={false} style={styles.colSelecionar}>
                                    <Text style={styles.headerText}>Selecionar</Text>
                                </DataTable.Title>
                            </DataTable.Header>

                            {registros.map((item, index) => {
                                const isEven = index % 2 === 0;
                                // Convertemos para String para evitar conflitos de tipos no checkbox
                                const idString = String(item.id_avaliacao_saed);

                                return (
                                    <DataTable.Row 
                                        key={idString} 
                                        style={[
                                            styles.row, 
                                            !isEven && styles.rowOdd
                                        ]}
                                    >
                                        <DataTable.Cell style={styles.colDescricao}>
                                            {item.descricao_avaliacao}
                                        </DataTable.Cell>
                                        <DataTable.Cell style={styles.colPequena}>
                                            {item.nome_cliente}
                                        </DataTable.Cell>
                                        <DataTable.Cell style={styles.colPequena}>
                                            {formatarDataBR(item.data_inicio_avaliacao)}
                                        </DataTable.Cell>
                                        <DataTable.Cell style={styles.colPequena}>
                                            {formatarDataBR(item.data_fim_avaliacao)}
                                        </DataTable.Cell>
                                        <DataTable.Cell numeric={false} style={styles.colSelecionar}>
                                            <Checkbox
                                                value={selecionados.includes(idString)}
                                                onValueChange={() => alterarSelecao(idString)}
                                            />
                                        </DataTable.Cell>
                                    </DataTable.Row>
                                );
                            })}

                            <DataTable.Pagination
                                page={page}
                                numberOfPages={Math.max(1, Math.ceil(dados.length / itemsPerPage))}
                                onPageChange={setPage}
                                showFastPaginationControls
                                label={`${page * itemsPerPage + 1}-${Math.min((page + 1) * itemsPerPage, dados.length)} de ${dados.length}`}
                            />
                        </DataTable>
                    </ScrollView>

                    {/* Botão de ação disparando o processo */}
                    <Button
                        mode="contained"
                        icon="download"
                        style={styles.button}
                        onPress={handleBaixarProvas}
                        loading={baixando}
                        disabled={baixando}
                    >
                        {baixando ? 'Salvando Provas...' : 'Baixar provas selecionadas'}
                    </Button>
                </>
            )}
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 85,
        paddingHorizontal: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollViewHorizontal: {
        flexGrow: 0,
        alignSelf: 'flex-start', 
        width: '100%',
    },
    table: {
        minWidth: 1000,
        borderWidth: 1,
        borderColor: '#d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#4dabf7',
    },
    row: {
        borderBottomWidth: 1,
        borderBottomColor: '#ececec',
        backgroundColor: '#fff',
    },
    rowOdd: {
        backgroundColor: '#f8f9fa', 
    },
    headerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    colDescricao: {
        width: 70,
        paddingHorizontal: 12,
    },
    colPequena: {
        width: 125,
        justifyContent: 'center',
    },
    colSelecionar: {
        width: 125,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: '#2e7d32',
    },
});