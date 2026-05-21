import { Buffer } from 'buffer';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

import { OMR_QUESTOES } from '../config/omrLayour';

export async function processarOMR(
    imageUri: string
) {

    try {

        // =========================================
        // ⚓ REDIMENSIONAR
        // =========================================

        const manipulada =
            await ImageManipulator.manipulateAsync(
                imageUri,
                [
                    {
                        resize: {
                            width: 1000
                        }
                    }
                ],
                {
                    compress: 1,
                    format:
                        ImageManipulator.SaveFormat.JPEG,
                    base64: true
                }
            );

        if (!manipulada.base64) {

            throw new Error(
                'Base64 não gerado'
            );

        }

        // =========================================
        // ⚓ CONVERTER BASE64 -> BUFFER
        // =========================================

        const imageBuffer =
            Buffer.from(
                manipulada.base64,
                'base64'
            );

        // =========================================
        // ⚓ DECODIFICAR JPEG
        // =========================================

        const rawImageData =
            jpeg.decode(imageBuffer, {
                useTArray: true
            });

        const {
            width,
            height,
            data
        } = rawImageData;

        console.log(
            '✅ imagem carregada',
            width,
            height
        );

        // =========================================
        // ⚓ RESULTADO FINAL
        // =========================================

        const resultadoFinal = [];

        // =========================================
        // ⚓ LOOP QUESTÕES
        // =========================================

        for (const questao of OMR_QUESTOES) {

            const alternativasResultado = [];

            // =====================================
            // ⚓ LOOP ALTERNATIVAS
            // =====================================

            for (const [
                letra,
                area
            ] of Object.entries(
                questao.alternativas
            )) {

                let pixelsEscuros = 0;

                // =================================
                // ⚓ VARRER REGIÃO
                // =================================

                for (
                    let y = area.y;
                    y < area.y + area.h;
                    y++
                ) {

                    for (
                        let x = area.x;
                        x < area.x + area.w;
                        x++
                    ) {

                        const idx =
                            (width * y + x) * 4;

                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];

                        // =========================
                        // ⚓ GRAYSCALE
                        // =========================

                        const media =
                            (r + g + b) / 3;

                        // =========================
                        // ⚓ PIXEL ESCURO
                        // =========================

                        if (media < 120) {

                            pixelsEscuros++;

                        }

                    }

                }

                alternativasResultado.push({

                    letra,

                    pixels: pixelsEscuros,

                    x: area.x,
                    y: area.y,
                    w: area.w,
                    h: area.h

                });

            }

            // =====================================
            // ⚓ PEGAR MAIOR PIXEL
            // =====================================

            const marcada =
                alternativasResultado.reduce(
                    (anterior, atual) => {

                        return atual.pixels >
                            anterior.pixels
                            ? atual
                            : anterior;

                    }
                );

            resultadoFinal.push({

                questao: questao.numero,

                marcada: marcada.letra,

                pixels: marcada.pixels,

                alternativas:
                    alternativasResultado

            });

        }

        console.log(
            JSON.stringify(
                resultadoFinal,
                null,
                2
            )
        );

        return resultadoFinal;

    } catch (e) {

        console.log(
            '❌ erro OMR:',
            e
        );

        return null;

    }

}