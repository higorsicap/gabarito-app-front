import { useAuth } from "@/src/contexts/AuthContext";

import {
    listarAnoletivo,
    listarClientes,
    listarEscolas
} from "@/src/services/listaProvaService";

import { Ionicons } from '@expo/vector-icons';

import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";

type Item = {
    id: number;
    nome: string;
};

type Props = {

    onSelectAno?: (item: Item) => void;
    selecionadoAno?: Item | null;

    onSelectCliente?: (item: Item) => void;
    selecionadoCliente?: Item | null;

    onSelectEscola?: (item: Item) => void;
    selecionadoEscola?: Item | null;

    mostrarAno?: boolean;
    mostrarCliente?: boolean;
    mostrarEscola?: boolean;
};

export default function FiltroProva({

    onSelectAno,
    selecionadoAno,

    onSelectCliente,
    selecionadoCliente,

    onSelectEscola,
    selecionadoEscola,

    mostrarAno = true,
    mostrarCliente = true,
    mostrarEscola = true

}: Props) {

    const { user } = useAuth();

    const [dadosAno, setDadosAno] = useState<Item[]>([]);
    const [dadosCliente, setDadosCliente] = useState<Item[]>([]);
    const [dadosEscola, setDadosEscola] = useState<Item[]>([]);

    const [modalFiltro, setModalFiltro] = useState(false);

    // 🔥 CARREGAR ESCOLAS
    const carregarEscolas = useCallback(async (
        id_anoletivo: number
    ) => {

        try {

            const resEscola = await listarEscolas({
                id_anoletivo,
                id_aplicador: Number(
                    user?.id_aplicador ?? -1
                )
            });

            const data = resEscola?.data || resEscola;

            const listaEscola: Item[] = Array.isArray(data)
                ? data.map((item: any) => ({
                    id: Number(item.id_escola),
                    nome: item.nome_escola
                }))
                : [];

            setDadosEscola(listaEscola);

        } catch (e: any) {

            console.log(
                'ERRO ESCOLAS:',
                e?.message || e
            );

            setDadosEscola([]);

        }

    }, [user]);

    // 🔥 CARREGAR DADOS
    const carregar = useCallback(async () => {

        try {

            // 🔥 ANO LETIVO
            const resAno = await listarAnoletivo();

            const dataAno = resAno?.data || resAno;

            const listaAno: Item[] = Array.isArray(dataAno)
                ? dataAno.map(
                    (item: any, index: number) => ({
                        id: Number(
                            item.id_anoletivo ?? index
                        ),
                        nome:
                            item.ds_anoletivo ??
                            'Sem nome'
                    })
                )
                : [];

            setDadosAno(listaAno);

            // 🔥 CLIENTES
            const resCliente = await listarClientes();

            const dataCliente =
                resCliente?.data || resCliente;

            const listaCliente: Item[] = Array.isArray(dataCliente)
                ? dataCliente.map(
                    (item: any, index: number) => ({
                        id: Number(
                            item.id_cliente ?? index
                        ),
                        nome:
                            item.nome_cliente ??
                            'Sem nome'
                    })
                )
                : [];

            setDadosCliente(listaCliente);

            // 🔥 CARREGA TODAS AS ESCOLAS
            await carregarEscolas(-1);

        } catch (e: any) {

            console.log(
                'ERRO FILTROS:',
                e?.message || e
            );

        }

    }, [carregarEscolas]);

    useEffect(() => {

        if (!user?.id_aplicador) return;

        carregar();

    }, [carregar, user]);

    return (

        <View style={styles.wrapper}>

            {/* 🔥 BOTÃO FILTRAR */}
            <TouchableOpacity
                style={styles.botaoFiltrar}
                activeOpacity={0.8}
                onPress={() => setModalFiltro(true)}
            >
                <Ionicons
                    name="options-outline"
                    size={22}
                    color="#fff"
                />

                <Text style={styles.textoBotao}>
                    Filtrar
                </Text>
            </TouchableOpacity>

            {/* 🔥 MODAL */}
            <Modal
                visible={modalFiltro}
                transparent
                animationType="slide"
                onRequestClose={() => setModalFiltro(false)}
            >
                <TouchableWithoutFeedback
                    onPress={() => setModalFiltro(false)}
                >
                    <View style={styles.overlay}>

                        <TouchableWithoutFeedback>
                            <View style={styles.modalContainer}>

                                {/* HEADER */}
                                <View style={styles.header}>

                                    <Text style={styles.titulo}>
                                        Filtros
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() =>
                                            setModalFiltro(false)
                                        }
                                    >
                                        <Ionicons
                                            name="close"
                                            size={26}
                                            color="#333"
                                        />
                                    </TouchableOpacity>

                                </View>

                                {/* 🔥 ANO LETIVO */}
                                {mostrarAno && (
                                    <View style={styles.cardFiltro}>

                                        <Text style={styles.label}>
                                            Ano Letivo
                                        </Text>

                                        <FlatList
                                            data={dadosAno}
                                            keyExtractor={(item) =>
                                                item.id.toString()
                                            }
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={{
                                                gap: 10
                                            }}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.chip,
                                                        selecionadoAno?.id === item.id &&
                                                        styles.chipSelecionado
                                                    ]}
                                                    onPress={async () => {

                                                        onSelectAno?.(item);

                                                        // 🔥 LIMPA ESCOLA
                                                        onSelectEscola?.(
                                                            null as any
                                                        );

                                                        // 🔥 FILTRA ESCOLAS
                                                        await carregarEscolas(
                                                            item.id
                                                        );

                                                    }}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.chipTexto,
                                                            selecionadoAno?.id === item.id &&
                                                            styles.chipTextoSelecionado
                                                        ]}
                                                    >
                                                        {item.nome}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        />

                                    </View>
                                )}

                                {/* 🔥 CLIENTE */}
                                {/* {mostrarCliente && (
                                    <View style={styles.cardFiltro}>

                                        <Text style={styles.label}>
                                            Cliente
                                        </Text>

                                        <FlatList
                                            data={dadosCliente}
                                            keyExtractor={(item) =>
                                                item.id.toString()
                                            }
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={{
                                                gap: 10
                                            }}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.chip,
                                                        selecionadoCliente?.id === item.id &&
                                                        styles.chipSelecionado
                                                    ]}
                                                    onPress={() =>
                                                        onSelectCliente?.(item)
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.chipTexto,
                                                            selecionadoCliente?.id === item.id &&
                                                            styles.chipTextoSelecionado
                                                        ]}
                                                    >
                                                        {item.nome}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        />

                                    </View>
                                )} */}

                                {/* 🔥 ESCOLAS */}
                                {mostrarEscola && (
                                    <View style={styles.cardFiltro}>

                                        <Text style={styles.label}>
                                            Escola
                                        </Text>

                                        <FlatList
                                            data={dadosEscola}
                                            keyExtractor={(item) =>
                                                item.id.toString()
                                            }
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={{
                                                gap: 10
                                            }}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.chip,
                                                        selecionadoEscola?.id === item.id &&
                                                        styles.chipSelecionado
                                                    ]}
                                                    onPress={() =>
                                                        onSelectEscola?.(item)
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.chipTexto,
                                                            selecionadoEscola?.id === item.id &&
                                                            styles.chipTextoSelecionado
                                                        ]}
                                                    >
                                                        {item.nome}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            ListEmptyComponent={() => (
                                                <Text style={{
                                                    color: '#6b7280',
                                                    marginTop: 5
                                                }}>
                                                    Nenhuma escola encontrada
                                                </Text>
                                            )}
                                        />

                                    </View>
                                )}

                                {/* BOTÃO FECHAR */}
                                <TouchableOpacity
                                    style={styles.botaoAplicar}
                                    onPress={() =>
                                        setModalFiltro(false)
                                    }
                                >
                                    <Text style={styles.textoAplicar}>
                                        Aplicar Filtros
                                    </Text>
                                </TouchableOpacity>

                            </View>
                        </TouchableWithoutFeedback>

                    </View>
                </TouchableWithoutFeedback>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({

    wrapper: {
        width: '100%',
        paddingRight: 5,
        alignItems: 'flex-end',
        top: -25
    },

    botaoFiltrar: {
        backgroundColor: '#4dabf7',
        height: 30,
        width: 100,
        borderRadius: 10,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,

        elevation: 4
    },

    textoBotao: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700'
    },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end'
    },

    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 20,
        minHeight: '30%'
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    titulo: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827'
    },

    cardFiltro: {
        marginBottom: 10
    },

    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 14,
        color: '#374151'
    },

    chip: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 15,

        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },

    chipSelecionado: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb'
    },

    chipTexto: {
        color: '#374151',
        fontWeight: '600'
    },

    chipTextoSelecionado: {
        color: '#fff'
    },

    botaoAplicar: {
        backgroundColor: '#4dabf7',
        height: 52,
        borderRadius: 16,

        alignItems: 'center',
        justifyContent: 'center',

        marginTop: 10
    },

    textoAplicar: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700'
    }
});