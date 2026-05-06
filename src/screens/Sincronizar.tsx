import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    StyleSheet,
    Text,
    View
} from 'react-native';

import { enviarRespostas } from '../services/socketiClient';

export default function Sincronizar() {

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Aguardando envio');

    async function handleSync() {
        try {
            setLoading(true);
            setStatus('Enviando...');

            // 🔥 MOCK (trocar pelo seu estado real depois)
            const respostas = [
                {
                    id: 1,
                    device_id: 'tablet_01',
                    aluno: 'João',
                    respostas: ['A', 'B', 'C'],
                    updated_at: new Date().toISOString()
                }
            ];

            if (!respostas.length) {
                Alert.alert('Atenção', 'Nenhuma resposta para enviar');
                setLoading(false);
                return;
            }

            const res: any = await enviarRespostas(respostas);

            setStatus(`Enviado (${res.recebidos})`);

            Alert.alert(
                'Sucesso',
                `Dados enviados com sucesso!\n\nRegistros: ${res.recebidos}`
            );

        } catch (e: any) {
            setStatus('Erro ao enviar');

            Alert.alert(
                'Erro',
                'Não foi possível conectar ao sincronizador.\n\nVerifique:\n- Wi-Fi conectado\n- Hotspot do pai ativo'
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.center}>

                <Text style={{ marginBottom: 10 }}>
                    Scanner de Prova OMR
                </Text>

                <Text style={{ marginBottom: 20 }}>
                    Status: {status}
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" />
                ) : (
                    <Button
                        title={'Sincronizar'}
                        onPress={handleSync}
                    />
                )}

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    preview: {
        flex: 1,
        resizeMode: 'contain',
    },

    actions: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 10
    },
});