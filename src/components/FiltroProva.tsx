import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { listarAnoletivo, listarClientes } from "@/src/services/listaProvaService";

type Item = {
    id: number;
    nome: string;
};

type Props = {
    onSelectAno: (item: Item) => void;
    selecionadoAno?: Item | null;

    onSelectCliente: (item: Item) => void;
    selecionadoCliente?: Item | null;
};

export default function FiltroProva({
    onSelectAno,
    selecionadoAno,
    onSelectCliente,
    selecionadoCliente
}: Props) {

    const [dadosAno, setDadosAno] = useState<Item[]>([]);
    const [dadosCliente, setDadosCliente] = useState<Item[]>([]);

    const [abertoAno, setAbertoAno] = useState(false);
    const [abertoCliente, setAbertoCliente] = useState(false);

    useEffect(() => {
        carregar();
    }, []);

    const carregar = async () => {
        try {
            // 🔥 ANO LETIVO
            const resAno = await listarAnoletivo();
            const listaAno: Item[] = (resAno.data || resAno).map((item: any, index: number) => ({
                id: item.id_anoletivo ?? index,
                nome: item.ds_anoletivo ?? 'Sem nome'
            }));
            setDadosAno(listaAno);

            // 🔥 CLIENTES
            const resCliente = await listarClientes();
            const listaCliente: Item[] = (resCliente.data || resCliente).map((item: any, index: number) => ({
                id: item.id_cliente ?? index,
                nome: item.nome_cliente ?? 'Sem nome'
            }));
            setDadosCliente(listaCliente);

        } catch (e: any) {
            console.log(e.message);
        }
    };

    return (
        <View style={styles.wrapper}>

            {/* 🔥 SELECT ANO */}
            <TouchableOpacity
                style={styles.selectBox}
                onPress={() => {
                    setAbertoAno(!abertoAno);
                    setAbertoCliente(false);
                }}
            >
                <Text style={styles.selectText}>
                    {selecionadoAno ? selecionadoAno.nome : 'Selecione o ano letivo'}
                </Text>
            </TouchableOpacity>

            {abertoAno && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={dadosAno}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.item,
                                    selecionadoAno?.id === item.id && styles.itemSelecionado
                                ]}
                                onPress={() => {
                                    onSelectAno(item);
                                    setAbertoAno(false);
                                }}
                            >
                                <Text style={styles.itemText}>{item.nome}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* 🔥 SELECT CLIENTE */}
            <TouchableOpacity
                style={styles.selectBox}
                onPress={() => {
                    setAbertoCliente(!abertoCliente);
                    setAbertoAno(false);
                }}
            >
                <Text style={styles.selectText}>
                    {selecionadoCliente ? selecionadoCliente.nome : 'Selecione o cliente'}
                </Text>
            </TouchableOpacity>

            {abertoCliente && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={dadosCliente}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.item,
                                    selecionadoCliente?.id === item.id && styles.itemSelecionado
                                ]}
                                onPress={() => {
                                    onSelectCliente(item);
                                    setAbertoCliente(false);
                                }}
                            >
                                <Text style={styles.itemText}>{item.nome}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        marginBottom: 20
    },

    selectBox: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
        elevation: 2
    },

    selectText: {
        color: '#333'
    },

    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 3
    },

    item: {
        padding: 14,
        borderBottomWidth: 1,
        borderColor: '#eee'
    },

    itemSelecionado: {
        backgroundColor: '#d0ebff'
    },

    itemText: {
        fontSize: 15
    }
});