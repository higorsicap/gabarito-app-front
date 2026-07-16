import BottomNav from "@/src/components/BottomNav";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ConsultaScreen() {
    const [processo, setProcesso] = useState("");
    const [tribunal, setTribunal] = useState("");
    const [status, setStatus] = useState("");
    const [menuAberto, setMenuAberto] = useState<number | null>(null);

    function limparFiltros() {
        setProcesso("");
        setTribunal("");
        setStatus("");
    }

    function buscarDados() {
        console.log({
            processo,
            tribunal,
            status,
        });
    }

    const [alunos, setAlunos] = useState([
        {
            id: 1,
            nome: "João Silva",
            status: "Pendente"
        },
        {
            id: 2,
            nome: "Maria Souza",
            status: "Concluído"
        }
    ]);


    return (
        <View style={styles.container}>

            <BottomNav />

            <View style={styles.cardFiltro}>
                <Text style={styles.tituloFiltro}>Filtros</Text>

                {/* PROCESSO */}
                <Text style={styles.label}>Escola</Text>
                <View style={styles.select}>
                    <Picker
                        selectedValue={processo}
                        onValueChange={(itemValue) => setProcesso(itemValue)}
                    >
                        <Picker.Item label="Selecione um processo" value="" />
                        <Picker.Item label="Processo 001" value="1" />
                        <Picker.Item label="Processo 002" value="2" />
                        <Picker.Item label="Processo 003" value="3" />
                    </Picker>
                </View>

                {/* TRIBUNAL */}
                <Text style={styles.label}>Turma</Text>
                <View style={styles.select}>
                    <Picker
                        selectedValue={tribunal}
                        onValueChange={(itemValue) => setTribunal(itemValue)}
                    >
                        <Picker.Item label="Selecione um tribunal" value="" />
                        <Picker.Item label="TJPE" value="TJPE" />
                        <Picker.Item label="TRF5" value="TRF5" />
                        <Picker.Item label="STJ" value="STJ" />
                    </Picker>
                </View>

                {/* STATUS */}
                <Text style={styles.label}>Ano</Text>
                <View style={styles.select}>
                    <Picker
                        selectedValue={status}
                        onValueChange={(itemValue) => setStatus(itemValue)}
                    >
                        <Picker.Item label="Selecione um status" value="" />
                        <Picker.Item label="Aberto" value="A" />
                        <Picker.Item label="Em andamento" value="E" />
                        <Picker.Item label="Finalizado" value="F" />
                    </Picker>
                </View>

                {/* STATUS */}
                <Text style={styles.label}>Horario - inicio</Text>
                <View style={styles.select}>
                    <Picker
                        selectedValue={status}
                        onValueChange={(itemValue) => setStatus(itemValue)}
                    >
                        <Picker.Item label="Selecione um status" value="" />
                        <Picker.Item label="Aberto" value="A" />
                        <Picker.Item label="Em andamento" value="E" />
                        <Picker.Item label="Finalizado" value="F" />
                    </Picker>
                </View>

                <View style={styles.botoes}>
                    <TouchableOpacity
                        style={styles.btnLimpar}
                        onPress={limparFiltros}
                    >
                        <Text>Limpar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btnPesquisar}
                        onPress={buscarDados}
                    >
                        <Text style={styles.txtBtnPesquisar}>
                            Pesquisar
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.tableContainer}>
                {/* Cabeçalho */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { flex: 0.5 }]}>ID</Text>
                    <Text style={[styles.headerCell, { flex: 2 }]}>Nome</Text>
                    <Text style={[styles.headerCell, { flex: 1.5 }]}>Status</Text>
                    <Text style={[styles.headerCell, { flex: 1 }]}>Ação</Text>
                </View>

                <FlatList
                    data={alunos}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.tableRow}>
                            <Text style={[styles.cell, { flex: 0.5 }]}>{item.id}</Text>
                            <Text style={[styles.cell, { flex: 2 }]}>{item.nome}</Text>
                            <Text style={[styles.cell, { flex: 1.5 }]}>{item.status}</Text>

                            <View
                                style={{
                                    flex: 1,
                                    alignItems: "center",
                                    position: "relative",
                                    zIndex: 9999,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() =>
                                        setMenuAberto(
                                            menuAberto === item.id ? null : item.id
                                        )
                                    }
                                >
                                    <Ionicons
                                        name="ellipsis-vertical"
                                        size={22}
                                        color="#4dabf7"
                                    />
                                </TouchableOpacity>
                                {menuAberto === item.id && (
                                    <View style={styles.menuAcoes}>
                                        <TouchableOpacity
                                            style={styles.itemMenu}
                                            onPress={() => {
                                                console.log("Pausar", item.id);
                                                setMenuAberto(null);
                                            }}
                                        >
                                            <Text>Pausar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.itemMenu}
                                            onPress={() => {
                                                console.log("Reiniciar", item.id);
                                                setMenuAberto(null);
                                            }}
                                        >
                                            <Text>Reiniciar</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
    },

    cardFiltro: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        marginTop: 80,
        padding: 25,
        margin: 16,
        elevation: 3,
    },

    tituloFiltro: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 5,
        marginTop: 10,
    },

    select: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 8,
        backgroundColor: "#FFF",
        overflow: "hidden",
    },

    botoes: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
    },

    btnLimpar: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        marginRight: 10,
    },

    btnPesquisar: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: "#4dabf7",
    },

    txtBtnPesquisar: {
        color: "#FFF",
        fontWeight: "600",
    },

    tableContainer: {
        marginHorizontal: 16,
        backgroundColor: "#FFF",
        borderRadius: 12,
        overflow: "hidden", // <- ISSO ESTÁ CORTANDO O MENU
        elevation: 3,
    },

    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#4dabf7",
        paddingVertical: 12,
    },

    headerCell: {
        color: "#FFF",
        fontWeight: "bold",
        textAlign: "center",
    },

    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
        paddingVertical: 12,
        overflow: "visible",
        zIndex: 1,
    },

    cell: {
        textAlign: "center",
        fontSize: 13,
    },

    btnAcao: {
        flex: 1,
        marginHorizontal: 5,
        backgroundColor: "#4dabf7",
        paddingVertical: 6,
        borderRadius: 6,
    },

    txtAcao: {
        color: "#FFF",
        textAlign: "center",
        fontWeight: "600",
    },

    menuAcoes: {
        position: "absolute",
        top: 25,
        right: 10,

        backgroundColor: "#FFF",

        borderRadius: 8,
        minWidth: 140,

        elevation: 20,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,

        zIndex: 99999,
    },

    itemMenu: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
    },
});