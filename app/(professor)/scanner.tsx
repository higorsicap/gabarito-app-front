import { OMR_QUESTOES } from '@/src/config/omrLayour';
import { processarOMR } from '@/src/services/omrService';

import * as MediaLibrary from 'expo-media-library';

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

type ResultadoAlternativa = {
    letra: string;
    pixels: number;
    x: number;
    y: number;
    w: number;
    h: number;
};

type ResultadoQuestao = {
    questao: number;
    marcada: string;
    pixels: number;
    alternativas: ResultadoAlternativa[];
};

export default function Scanner() {

    const [imagem, setImagem] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [resultadoOMR, setResultadoOMR] =
        useState<ResultadoQuestao[] | null>(null);

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

            setResultadoOMR(null);

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

            const resultado =
                await processarOMR(imagem);

            console.log(
                '✅ RESULTADO OMR:',
                resultado
            );

            if (!resultado) {

                Alert.alert(
                    'Erro',
                    'Nenhum resultado encontrado'
                );

                return;

            }

            setResultadoOMR(resultado);

            Alert.alert(
                'Resultado OMR',
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

                <View style={styles.imageContainer}>

                    <Image
                        source={{ uri: imagem }}
                        style={styles.preview}
                    />

                    {/* 🔥 OVERLAY DEBUG */}

                    {
                        OMR_QUESTOES.map((questao) => (

                            Object.entries(
                                questao.alternativas
                            ).map(([letra, area]) => {

                                const alternativaResultado =
                                    resultadoOMR
                                        ?.find(
                                            (q) =>
                                                q.questao ===
                                                questao.numero
                                        )
                                        ?.alternativas
                                        ?.find(
                                            (a) =>
                                                a.letra ===
                                                letra
                                        );

                                return (

                                    <View
                                        key={`${questao.numero}-${letra}`}
                                        style={{
                                            position: 'absolute',

                                            left: area.x,
                                            top: area.y,

                                            width: area.w,
                                            height: area.h,

                                            borderWidth: 2,
                                            borderColor: 'red',

                                            backgroundColor:
                                                'rgba(255,0,0,0.20)',

                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    >

                                        <Text
                                            style={{
                                                color: '#fff',
                                                fontSize: 10,
                                                fontWeight: 'bold',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {letra}

                                            {'\n'}

                                            {
                                                alternativaResultado?.pixels ??
                                                0
                                            }

                                        </Text>

                                    </View>

                                );

                            })

                        ))
                    }

                </View>

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

                            setResultadoOMR(null);

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

    imageContainer: {

        flex: 1,

        position: 'relative'

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

        width: '100%',

        height: '100%',

        resizeMode: 'stretch',

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