import { useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, View } from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';

export default function Scanner() {

    const [imagem, setImagem] = useState<string | null>(null);
    const [imagemBase64, setImagemBase64] = useState<string | null>(null);
    const [imagemCorrigida, setImagemCorrigida] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // 📄 SCANNER REAL
    const capturar = async () => {
        try {
            setLoading(true);

            const result = await DocumentScanner.scanDocument();

            if (!result?.scannedImages?.length) {
                Alert.alert('Erro', 'Nenhum documento detectado');
                setLoading(false); // 🔥 FIX IMPORTANTE
                return;
            }

            const imageUri = result.scannedImages[0];

            setImagem(imageUri);

            const base64 = await uriToBase64(imageUri);
            setImagemBase64(base64);

        } catch (error) {
            console.log(error);
            Alert.alert('Erro', 'Falha ao escanear documento');
        } finally {
            setLoading(false);
        }
    };

    // 🔥 URI → BASE64 (mais seguro)
    const uriToBase64 = async (uri: string): Promise<string> => {
        const response = await fetch(uri);
        const blob = await response.blob();

        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
                const result = reader.result;

                if (typeof result === 'string') {
                    const base64 = result.split(',')[1]; // 🔥 MAIS SEGURO
                    resolve(base64);
                } else {
                    reject('Erro ao converter imagem para base64');
                }
            };

            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // 🔥 SCAN
    const validarScan = async () => {
        if (!imagemBase64) return;

        try {
            setLoading(true);

            const res = await fetch('http://192.168.1.158:5000/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imagemBase64,
                    mode: 'omr'
                }),
            });

            const data = await res.json();

            if (data.error) {
                Alert.alert('Erro Scan', data.error);
                return;
            }

            await enviarGabarito();

        } catch (error) {
            console.log(error);
            Alert.alert('Erro', 'Falha ao validar folha');
        } finally {
            setLoading(false);
        }
    };

    // 🧠 GABARITO
    const enviarGabarito = async () => {
        if (!imagemBase64) return;

        try {
            const response = await fetch('http://192.168.1.158:5000/gabarito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imagemBase64,
                    strict: true
                }),
            });

            const data = await response.json();

            if (data.error) {
                Alert.alert('Erro', data.error);
                return;
            }

            if (data.image) {
                setImagemCorrigida(`data:image/jpeg;base64,${data.image}`);
            }

            console.log('Respostas:', data.respostas);

        } catch (error) {
            console.log(error);
            Alert.alert('Erro', 'Falha no gabarito');
        }
    };

    // 📷 RESULTADO FINAL
    if (imagemCorrigida) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: imagemCorrigida }} style={styles.preview} />

                <View style={styles.actions}>
                    <Button
                        title="Nova prova"
                        onPress={() => {
                            setImagem(null);
                            setImagemBase64(null);
                            setImagemCorrigida(null);
                        }}
                    />
                </View>
            </View>
        );
    }

    // 📷 PREVIEW
    if (imagem) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: imagem }} style={styles.preview} />

                <View style={styles.actions}>
                    <Button
                        title="Refazer"
                        onPress={() => {
                            setImagem(null);
                            setImagemBase64(null);
                        }}
                    />

                    <Button
                        title={loading ? 'Processando...' : 'Analisar prova'}
                        onPress={validarScan}
                        disabled={loading}
                    />
                </View>
            </View>
        );
    }

    // 📄 TELA INICIAL
    return (
        <View style={styles.container}>
            <View style={styles.center}>
                <Text style={{ marginBottom: 20 }}>
                    Scanner de Prova OMR
                </Text>

                <Button
                    title={loading ? 'Abrindo scanner...' : 'Escanear documento'}
                    onPress={capturar}
                    disabled={loading}
                />
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
    },
});