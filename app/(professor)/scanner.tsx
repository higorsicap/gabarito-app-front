import { useState } from 'react';

import {
    Alert,
    Button,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';

import DocumentScanner from 'react-native-document-scanner-plugin';

// 🔥 FILESYSTEM LEGACY

import * as MediaLibrary from 'expo-media-library';

// 🔥 OMR
import { processarOMR } from '@/src/services/omrService';

export default function Scanner() {

    const [imagem, setImagem] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(false);

    // =====================================================
    // 📄 ESCANEAR DOCUMENTO
    // =====================================================

    const capturar = async () => {

        try {

            setLoading(true);

            const result =
                await DocumentScanner.scanDocument();

            if (
                !result?.scannedImages?.length
            ) {

                Alert.alert(
                    'Erro',
                    'Nenhum documento detectado'
                );

                return;

            }

            const imageUri =
                result.scannedImages[0];

            setImagem(imageUri);

        } catch (error) {

            console.log(error);

            Alert.alert(
                'Erro',
                'Falha ao escanear documento'
            );

        } finally {

            setLoading(false);

        }

    };

    // =====================================================
    // 💾 SALVAR IMAGEM
    // =====================================================

    const salvarImagem = async (
        uri: string
    ) => {

        try {

            const { status } =
                await MediaLibrary.requestPermissionsAsync();

            if (status !== 'granted') {

                Alert.alert(
                    'Permissão negada'
                );

                return;

            }

            const asset =
                await MediaLibrary.createAssetAsync(
                    uri
                );

            await MediaLibrary.createAlbumAsync(
                'Provas',
                asset,
                false
            );

            Alert.alert(
                'Sucesso',
                'Imagem salva na galeria!'
            );

        } catch (error) {

            console.log(error);

            Alert.alert(
                'Erro',
                'Falha ao salvar imagem'
            );

        }

    };

    // =====================================================
    // 🔥 ANALISAR OMR
    // =====================================================

    const validarScan = async () => {

        if (!imagem) {

            Alert.alert(
                'Erro',
                'Nenhuma imagem encontrada'
            );

            return;

        }

        try {

            setLoading(true);

            // 🔥 RESULTADO
            const resultado =
                await processarOMR(
                    imagem
                );

            console.log(
                '✅ RESULTADO OMR:',
                resultado
            );

            // 🔥 MOSTRA JSON
            Alert.alert(
                'Respostas capturadas',
                JSON.stringify(
                    resultado,
                    null,
                    2
                )
            );

        } catch (error) {

            console.log(error);

            Alert.alert(
                'Erro',
                'Falha ao processar OMR'
            );

        } finally {

            setLoading(false);

        }

    };

    // =====================================================
    // 📷 PREVIEW
    // =====================================================

    if (imagem) {

        return (

            <View style={styles.container}>

                <Image
                    source={{ uri: imagem }}
                    style={styles.preview}
                />

                <View style={styles.actions}>

                    <Button
                        title="Salvar imagem"
                        onPress={() =>
                            salvarImagem(imagem)
                        }
                    />

                    <Button
                        title="Refazer"
                        onPress={() => {

                            setImagem(null);

                        }}
                    />

                    <Button
                        title={
                            loading
                                ? 'Processando...'
                                : 'Analisar prova'
                        }
                        onPress={validarScan}
                        disabled={loading}
                    />

                </View>

            </View>

        );

    }

    // =====================================================
    // 📄 TELA INICIAL
    // =====================================================

    return (

        <View style={styles.container}>

            <View style={styles.center}>

                <Text style={styles.title}>
                    Scanner de Prova OMR
                </Text>

                <Button
                    title={
                        loading
                            ? 'Abrindo scanner...'
                            : 'Escanear documento'
                    }
                    onPress={capturar}
                    disabled={loading}
                />

            </View>

        </View>

    );

}

const styles = StyleSheet.create({

    container: {

        flex: 1,

        backgroundColor: '#fff'

    },

    center: {

        flex: 1,

        justifyContent: 'center',

        alignItems: 'center',

        paddingHorizontal: 20

    },

    title: {

        marginBottom: 20,

        fontSize: 18,

        fontWeight: '600'

    },

    preview: {

        flex: 1,

        resizeMode: 'contain',

        backgroundColor: '#000'

    },

    actions: {

        position: 'absolute',

        bottom: 40,

        width: '100%',

        flexDirection: 'row',

        justifyContent: 'space-around',

        paddingHorizontal: 10

    }

});