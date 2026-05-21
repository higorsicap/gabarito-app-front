import { useEffect, useMemo, useState } from 'react';

import {
    Alert,
    Button,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import BottomNav from '@/src/components/BottomNav';

import {
    startServer,
    subscribe
} from '@/src/services/socketServer';

import { Ionicons } from '@expo/vector-icons';

// 🔥 SQLITE
import {
    buscarGabaritoProva,
    listarRespostasAgrupadas
} from '@/src/database/services/respostaRepository';

// 🔥 CORREÇÃO
import {
    corrigirProva,
    montarGabarito
} from '@/src/services/correcaoGabarito';

type Questao = {
    numero_questao: string;
    alternativa: string;
};

export default function Sincronizador() {

    const [ativo, setAtivo] =
        useState(false);

    const [respostas, setRespostas] =
        useState<any[]>([]);

    const [loading, setLoading] =
        useState(false);

    function handleStartSync() {

        try {

            startServer();

            setAtivo(true);

            Alert.alert(
                'Sincronizador ativo',
                'Servidor iniciado com sucesso!'
            );

        } catch {

            Alert.alert(
                'Erro',
                'Não foi possível iniciar o servidor'
            );

        }

    }

    // =====================================================
    // 🔥 SOCKET
    // =====================================================

    useEffect(() => {

        const unsubscribe =
            subscribe((dados: any[]) => {

                setRespostas(dados);

            });

        return unsubscribe;

    }, []);

    // =====================================================
    // 🔥 SQLITE
    // =====================================================

    async function carregarSQLite() {

        try {

            setLoading(true);

            const data =
                await listarRespostasAgrupadas();

            console.log(
                '📦 SQLITE:',
                data
            );

            setRespostas(data || []);

        } catch (e) {

            console.log(
                '❌ Erro SQLite:',
                e
            );

        } finally {

            setLoading(false);

        }

    }

    useEffect(() => {

        carregarSQLite();

    }, []);

    // =====================================================
    // 🔥 AGRUPA POR CADERNO + ALUNO
    // =====================================================

    const provasAgrupadas =
        useMemo(() => {

            const mapa =
                new Map<string, any>();

            respostas.forEach((item) => {

                // 🔥 CHAVE ÚNICA
                const chave =
                    `${item.id_caderno_de_prova_disciplina}_${item.nome_aluno}`;

                if (!mapa.has(chave)) {

                    mapa.set(chave, {

                        id_caderno_de_prova_disciplina:
                            item.id_caderno_de_prova_disciplina,

                        id_prova:
                            item.id_prova,

                        nome_prova:
                            item.nome_prova ||
                            `Prova ${item.id_prova}`,

                        nome_aluno:
                            item.nome_aluno,

                        respostas: [],

                        questoes: 0

                    });

                }

                mapa.get(chave)
                    .respostas
                    .push(item);

            });

            // 🔥 TOTAL QUESTÕES
            mapa.forEach((value) => {

                const totalQuestoes =
                    new Set(
                        value.respostas.map(
                            (x: any) =>
                                x.numero_questao
                        )
                    );

                value.questoes =
                    totalQuestoes.size;

            });

            return Array.from(
                mapa.values()
            );

        }, [respostas]);

    // =====================================================
    // 🔥 CORRIGIR
    // =====================================================

    async function handleCorrigir(
        prova: any
    ) {

        try {

            // 🔥 BUSCA GABARITO
            const questoes =
                await buscarGabaritoProva(
                    prova.id_prova
                ) as Questao[];

            // 🔥 MONTA GABARITO
            const gabarito =
                montarGabarito(
                    questoes
                );

            // 🔥 RESPOSTAS DO ALUNO
            const respostasAluno:
                Record<string, string> = {};

            prova.respostas.forEach(
                (item: any) => {

                    respostasAluno[
                        String(
                            item.numero_questao
                        )
                    ] =
                        item.resposta_aluno;

                }
            );

            // 🔥 CORRIGE
            const resultado =
                corrigirProva(
                    gabarito,
                    respostasAluno
                );

            console.log(
                '📊 RESULTADO:',
                resultado
            );

            Alert.alert(
                `Resultado - ${prova.nome_aluno}`,

                `📄 Caderno: ${prova.id_caderno_de_prova_disciplina}\n\n` +

                `✅ Acertos: ${resultado.acertos}\n` +

                `❌ Erros: ${resultado.erros}\n` +

                `📊 Percentual: ${resultado.percentual}%`
            );

        } catch (e) {

            console.log(
                '❌ Erro ao corrigir:',
                e
            );

            Alert.alert(
                'Erro',
                'Não foi possível corrigir a prova'
            );

        }

    }

    // =====================================================
    // 🔥 RENDER
    // =====================================================

    return (

        <View style={styles.container}>

            <BottomNav />

            {/* HEADER */}
            <View style={styles.header}>

                <Text style={styles.title}>
                    Sincronizador OMR
                </Text>

                <Text style={styles.status}>
                    Status:
                    {
                        ativo
                            ? ' 🟢 Ativo'
                            : ' 🔴 Parado'
                    }
                </Text>

                <Text style={styles.status}>
                    Registros:
                    {' '}
                    {respostas.length}
                </Text>

                {
                    loading && (

                        <Text
                            style={{
                                marginTop: 10
                            }}
                        >
                            Carregando SQLite...
                        </Text>

                    )
                }

                <Button
                    title="Iniciar sincronizador"
                    onPress={
                        handleStartSync
                    }
                />

            </View>

            {/* LISTA */}
            <FlatList
                data={provasAgrupadas}
                keyExtractor={(item) =>
                    `${item.id_caderno_de_prova_disciplina}_${item.nome_aluno}`
                }

                contentContainerStyle={{
                    padding: 15,
                    paddingBottom: 120
                }}

                ListEmptyComponent={() => (

                    <View
                        style={{
                            marginTop: 50,
                            alignItems: 'center'
                        }}
                    >

                        <Text>
                            Nenhuma resposta encontrada
                        </Text>

                    </View>

                )}

                renderItem={({ item }) => (

                    <View style={styles.card}>

                        {/* INFO */}
                        <View style={{ flex: 1 }}>

                            <Text style={styles.cardTitle}>
                                📄 Caderno de prova {item.id_caderno_de_prova_disciplina}
                            </Text>

                            <Text style={styles.cardSub}>
                                📝 {item.nome_prova}
                            </Text>

                            <Text style={styles.cardSub}>
                                👤 Aluno: {item.nome_aluno}
                            </Text>

                            <Text style={styles.cardSub}>
                                ❓ Respostas: {item.questoes}
                            </Text>

                        </View>

                        {/* BTN */}
                        <TouchableOpacity
                            style={styles.btn}
                            activeOpacity={0.8}
                            onPress={() =>
                                handleCorrigir(
                                    item
                                )
                            }
                        >

                            <Ionicons
                                name="checkmark-done"
                                size={24}
                                color="#fff"
                            />

                            <Text
                                style={
                                    styles.btnText
                                }
                            >
                                Corrigir
                            </Text>

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
        paddingTop: 40
    },

    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        marginBottom: 10
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10
    },

    status: {
        fontSize: 14,
        marginBottom: 6
    },

    card: {

        flexDirection: 'row',
        alignItems: 'center',

        backgroundColor: '#fff',

        padding: 16,

        borderRadius: 16,

        marginBottom: 14,

        elevation: 3
    },

    cardTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 8
    },

    cardSub: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4
    },

    btn: {

        backgroundColor: '#2563eb',

        paddingVertical: 12,
        paddingHorizontal: 14,

        borderRadius: 12,

        alignItems: 'center',
        justifyContent: 'center'
    },

    btnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4
    }

});