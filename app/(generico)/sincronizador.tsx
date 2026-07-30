import { Ionicons } from '@expo/vector-icons';
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BottomNav from '@/src/components/BottomNav';
import { useSincronizador } from '@/src/ts/useSincronizador';

export default function Sincronizador() {
    const {
        ativo,
        loading,
        respostasCount,
        provasAgrupadas,
        handleStartSync,
        handleCorrigir,
    } = useSincronizador();

    return (
        <View style={styles.container}>
            <BottomNav />

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.title}>Sincronizador</Text>
                <Text style={styles.status}>
                    Status: {ativo ? ' 🟢 Ativo' : ' 🔴 Parado'}
                </Text>
                <Text style={styles.status}>
                    Registros: {respostasCount}
                </Text>

                {loading && (
                    <Text style={{ marginTop: 10 }}>Carregando SQLite...</Text>
                )}

                <Button title="Iniciar sincronizador" onPress={handleStartSync} />
            </View>

            {/* LISTA */}
            <FlatList
                data={provasAgrupadas}
                keyExtractor={(item) =>
                    `${item.id_caderno_de_prova_disciplina}_${item.nome_aluno}`
                }
                contentContainerStyle={{
                    padding: 15,
                    paddingBottom: 120,
                }}
                ListEmptyComponent={() => (
                    <View style={{ marginTop: 50, alignItems: 'center' }}>
                        <Text>Nenhuma resposta encontrada</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {/* INFO */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>
                                📄 Caderno de prova {item.id_caderno_de_prova_disciplina}
                            </Text>
                            <Text style={styles.cardSub}>📝 {item.nome_prova}</Text>
                            <Text style={styles.cardSub}>👤 Aluno: {item.nome_aluno}</Text>
                            <Text style={styles.cardSub}>❓ Respostas: {item.questoes}</Text>
                        </View>

                        {/* BTN */}
                        <TouchableOpacity
                            style={styles.btn}
                            activeOpacity={0.8}
                            onPress={() => handleCorrigir(item)}
                        >
                            <Ionicons name="checkmark-done" size={24} color="#fff" />
                            <Text style={styles.btnText}>Corrigir</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
        paddingTop: 40,
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    status: {
        fontSize: 14,
        marginBottom: 6,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 14,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardSub: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    btn: {
        backgroundColor: '#2563eb',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
});