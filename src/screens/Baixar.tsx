import { useCallback, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import BottomNav from '@/src/components/BottomNav';

import { Ionicons } from '@expo/vector-icons';

import {
    useFocusEffect
} from 'expo-router';

import { db } from '@/src/database/database';

type Prova = {
    id_prova: number;
    nome_escola: string;
    id_anoletivo: number;
    id_serie: number;
    id_avaliacao: number;
    descricao_turma: string;
    id_caderno_de_prova_disciplina: number;
    total_questoes: number;
};

export default function Download() {

    const [loading, setLoading] =
        useState(false);

    const [refreshing, setRefreshing] =
        useState(false);

    const [provas, setProvas] =
        useState<Prova[]>([]);

    async function carregarProvas() {

        try {

            setLoading(true);

            const result = await db.getAllAsync(`
                SELECT
                    p.*,

                    (
                        SELECT COUNT(*)
                        FROM prova_questionario pq
                        WHERE pq.id_prova = p.id_prova
                    ) AS total_questoes

                FROM provas p

                ORDER BY p.id_prova DESC
            `);

            setProvas(result as Prova[]);

        } catch (error) {

            console.log(
                '❌ Erro ao carregar provas',
                error
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }

    }

    async function atualizar() {

        setRefreshing(true);

        await carregarProvas();

    }

    async function excluirProva(
        id_prova: number
    ) {

        try {

            // 🔥 REMOVE QUESTÕES
            await db.runAsync(
                `
                DELETE FROM prova_questionario
                WHERE id_prova = ?
                `,
                [id_prova]
            );

            // 🔥 REMOVE PROVA
            await db.runAsync(
                `
                DELETE FROM provas
                WHERE id_prova = ?
                `,
                [id_prova]
            );

            setProvas((old) =>
                old.filter(
                    (item) =>
                        item.id_prova !== id_prova
                )
            );

            Alert.alert(
                'Sucesso',
                'Prova removida com sucesso'
            );

        } catch (error) {

            console.log(
                '❌ Erro ao excluir prova',
                error
            );

            Alert.alert(
                'Erro',
                'Erro ao excluir prova'
            );

        }

    }

    function confirmarExclusao(
        id_prova: number
    ) {

        Alert.alert(
            'Excluir prova',
            'Deseja realmente excluir esta prova?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () =>
                        excluirProva(id_prova)
                }
            ]
        );

    }

    useFocusEffect(

        useCallback(() => {

            carregarProvas();

        }, [])

    );

    function renderItem({
        item
    }: {
        item: Prova
    }) {

        return (

            <View style={styles.card}>

                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.escola}>
                            {item.nome_escola}
                        </Text>
                        <Text style={styles.turma}>
                            {item.descricao_turma}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => confirmarExclusao( item.id_prova ) }>
                        <Ionicons name="trash" size={20} color="#fff"/>
                    </TouchableOpacity>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.info}>Caderno:{' '}{item.id_caderno_de_prova_disciplina}</Text>
                    <Text style={styles.info}>Questões: {item.total_questoes}</Text>

                </View>

            </View>

        );

    }

    return (

        <View style={styles.container}>

            <BottomNav />

            {
                loading ? (

                    <View
                        style={
                            styles.loadingContainer
                        }
                    >

                        <ActivityIndicator
                            size="large"
                            color="#2563eb"
                        />

                    </View>

                ) : (

                    <FlatList
                        data={provas}
                        keyExtractor={(item) =>
                            `${item.id_prova}`
                        }
                        renderItem={renderItem}
                        contentContainerStyle={
                            styles.list
                        }
                        refreshControl={
                            <RefreshControl
                                refreshing={
                                    refreshing
                                }
                                onRefresh={
                                    atualizar
                                }
                            />
                        }
                        ListEmptyComponent={

                            <View
                                style={
                                    styles.emptyContainer
                                }
                            >

                                <Ionicons
                                    name="cloud-download-outline"
                                    size={70}
                                    color="#999"
                                />

                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    Nenhuma prova baixada
                                </Text>

                            </View>

                        }
                    />

                )
            }

        </View>

    );

}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    list: {
        padding: 16,
        paddingBottom: 40,
        paddingTop: 90
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        elevation: 3
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },

    escola: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827'
    },

    turma: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4
    },

    infoContainer: {
        gap: 6
    },

    info: {
        fontSize: 14,
        color: '#374151'
    },

    deleteButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center'
    },

    emptyContainer: {
        alignItems: 'center',
        marginTop: 120
    },

    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666'
    }

});