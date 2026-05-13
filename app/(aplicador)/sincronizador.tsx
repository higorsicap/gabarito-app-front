import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    FlatList,
    StyleSheet,
    Text,
    View
} from 'react-native';

import BottomNav from '@/src/components/BottomNav';
import { startServer, subscribe } from '@/src/services/socketServer';

export default function Sincronizador() {

    const [ativo, setAtivo] = useState(false);
    const [respostas, setRespostas] = useState<any[]>([]);

    function handleStartSync() {
        try {
            startServer();
            setAtivo(true);

            Alert.alert(
                'Sincronizador ativo',
                'Servidor iniciado!\n\nLigue o hotspot e conecte os tablets.\n'
            );

        } catch  {
            Alert.alert('Erro', 'Não foi possível iniciar o servidor');
        }
    }

    // 🔥 escuta atualizações do servidor
    useEffect(() => {
        const unsubscribe = subscribe((dados: any[]) => {
            setRespostas([...dados]);
        });

        return unsubscribe;
    }, []);

    return (
        <View style={styles.container}>
            <BottomNav />

            <View style={styles.center}>
                <Text style={{ marginBottom: 10 }}>
                    Scanner de Prova OMR
                </Text>

                <Text style={{ marginBottom: 10 }}>
                    Status: {ativo ? '🟢 Ativo' : '🔴 Parado'}
                </Text>

                <Text style={{ marginBottom: 20 }}>
                    Recebidos: {respostas.length}
                </Text>

                <Button
                    title={'Iniciar sincronizador'}
                    onPress={handleStartSync}
                />
            </View>

            {/* 🔥 LISTA DE RESPOSTAS */}
            <FlatList
                data={respostas}
                keyExtractor={(item, index) => String(index)}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.text}>
                            📱 {item.device_id || 'tablet'}
                        </Text>

                        <Text style={styles.text}>
                            👤 {item.aluno || 'Aluno'}
                        </Text>

                        <Text style={styles.text}>
                            📝 {JSON.stringify(item.respostas)}
                        </Text>
                    </View>
                )}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    center: {
        paddingTop: 50,
        alignItems: 'center',
    },

    item: {
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#eee',
        borderRadius: 8,
    },

    text: {
        fontSize: 14,
    },
});