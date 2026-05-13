import BottomNav from '@/src/components/BottomNav';

import { enviarRespostas } from '@/src/services/socketiClient';

import { useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function Sincronizar() {

    const [loading, setLoading] =
        useState(false);

    const [status, setStatus] =
        useState('Aguardando envio');

    async function handleSync() {

        try {

            setLoading(true);

            setStatus('Enviando respostas...');

            // 🔥 MOCK
            // depois trocar pelo banco SQLite
            const respostas = [

                {
                    id: 1,
                    aluno: 'João',
                    respostas: ['A', 'B', 'C'],
                    updated_at:
                        new Date().toISOString()
                },

                {
                    id: 2,
                    aluno: 'Maria',
                    respostas: ['D', 'A', 'B'],
                    updated_at:
                        new Date().toISOString()
                }

            ];

            // 🔥 validação
            if (!respostas.length) {

                Alert.alert(
                    'Atenção',
                    'Nenhuma resposta encontrada para sincronizar.'
                );

                return;

            }

            console.log(
                '📤 Iniciando sincronização...'
            );

            const res: any =
                await enviarRespostas(
                    respostas
                );

            console.log(
                '✅ Retorno servidor:',
                res
            );

            setStatus(
                `✅ Sincronizado (${res?.recebidos || 0})`
            );

            Alert.alert(
                'Sucesso',
                `Dados enviados com sucesso!\n\nRecebidos: ${
                    res?.recebidos || 0
                }`
            );

        } catch (e: any) {

            console.log(
                '❌ erro sincronização:',
                e
            );

            setStatus(
                '❌ Erro ao sincronizar'
            );

            Alert.alert(
                'Erro',
                e?.message ||
                'Não foi possível sincronizar.\n\nVerifique:\n- Hotspot do pai ativo\n- Ambos conectados na mesma rede\n- Servidor iniciado no tablet pai'
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
                    Scanner de Prova OMR
                </Text>

                <Text style={styles.subtitle}>
                    Status:
                </Text>

                <Text style={styles.status}>
                    {status}
                </Text>

                {
                    loading ? (

                        <ActivityIndicator
                            size="large"
                            color="#2563eb"
                            style={{
                                marginTop: 20
                            }}
                        />

                    ) : (

                        <TouchableOpacity
                            style={styles.button}
                            activeOpacity={0.8}
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

    subtitle: {
        fontSize: 16,
        color: '#6b7280'
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