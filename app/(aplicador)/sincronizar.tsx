import BottomNav from '@/src/components/BottomNav';

import { useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import {
    salvarRespostasOffline
} from '@/src/database/services/respostaRepository';

export default function Sincronizar() {

    const [loading, setLoading] =
        useState(false);

    const [status, setStatus] =
        useState('Aguardando envio');

    async function handleSync() {

        try {

            setLoading(true);

            setStatus(
                'Salvando no SQLite...'
            );

            // 🔥 MOCK (tablet filho)
            const respostas = [

                {
                    nome_aluno: 'João',
                    id_prova: 1,

                    respostas: [
                        {
                            numero_questao: 1,
                            alternativa: 'A'
                        },
                        {
                            numero_questao: 2,
                            alternativa: 'B'
                        },
                        {
                            numero_questao: 3,
                            alternativa: 'C'
                        },
                        {
                            numero_questao: 4,
                            alternativa: 'D'
                        }
                    ]
                },

                {
                    nome_aluno: 'Maria',
                    id_prova: 1,

                    respostas: [
                        {
                            numero_questao: 1,
                            alternativa: 'B'
                        },
                        {
                            numero_questao: 2,
                            alternativa: 'C'
                        },
                        {
                            numero_questao: 3,
                            alternativa: 'A'
                        },
                        {
                            numero_questao: 4,
                            alternativa: 'D'
                        }
                    ]
                }

            ];

            console.log(
                '📤 RESPOSTAS:',
                JSON.stringify(
                    respostas,
                    null,
                    2
                )
            );

            if (!respostas.length) {

                Alert.alert(
                    'Atenção',
                    'Nenhuma resposta encontrada.'
                );

                return;

            }

            // 🔥 SALVA SQLITE
            await salvarRespostasOffline(
                respostas
            );

            console.log(
                '✅ Dados salvos no SQLite'
            );

            setStatus(
                '✅ Salvo no SQLite com sucesso'
            );

            Alert.alert(
                'Sucesso',
                'Respostas armazenadas no SQLite!'
            );

        } catch (e: any) {

            console.log(
                '❌ erro sync:',
                e
            );

            setStatus(
                '❌ Erro ao sincronizar'
            );

            Alert.alert(
                'Erro',
                e?.message ||
                'Falha ao salvar'
            );

        } finally {

            setLoading(false);

        }

    }

    return (

        <View style={styles.container}>

            <BottomNav />

            <View style={styles.center}>

                <Text style={styles.title}>
                    Sincronização de Respostas
                </Text>

                <Text style={styles.status}>
                    {status}
                </Text>

                {
                    loading ? (

                        <ActivityIndicator
                            size="large"
                            color="#2563eb"
                        />

                    ) : (

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleSync}
                        >

                            <Text style={styles.buttonText}>
                                Sincronizar
                            </Text>

                        </TouchableOpacity>

                    )
                }

            </View>

        </View>

    );

}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
    },

    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 20
    },

    status: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2563eb',
        marginTop: 10,
        marginBottom: 30,
        textAlign: 'center'
    },

    button: {
        backgroundColor: '#2563eb',
        height: 52,
        width: 220,
        borderRadius: 14,

        justifyContent: 'center',
        alignItems: 'center',

        elevation: 4
    },

    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700'
    }

});