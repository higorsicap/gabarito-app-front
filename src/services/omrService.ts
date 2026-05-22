import { Buffer } from 'buffer';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { OMR_CONTAINER } from '../config/omrLayour';

type Alternativa = {
    letra: string;
    x: number;
    y: number;
    w: number;
    h: number;
};

type Questao = {
    numero: number;
    alternativas: Alternativa[];
};

const QUESTOES_PORTUGUES: Questao[] = [];
const QUESTOES_MATEMATICA: Questao[] = [];

for (let i = 0; i < 22; i++) {
    const y = 40 + (i * 36);
    QUESTOES_PORTUGUES.push({
        numero: i + 1,
        alternativas: [
            { letra: 'A', x: 40, y, w: 40, h: 40 },
            { letra: 'B', x: 105, y, w: 40, h: 40 },
            { letra: 'C', x: 170, y, w: 40, h: 40 },
            { letra: 'D', x: 235, y, w: 40, h: 40 }
        ]
    });
}

for (let i = 0; i < 27; i++) {
    const y = 40 + (i * 36);
    QUESTOES_MATEMATICA.push({
        numero: i + 1,
        alternativas: [
            { letra: 'A', x: 40, y, w: 40, h: 40 },
            { letra: 'B', x: 105, y, w: 40, h: 40 },
            { letra: 'C', x: 170, y, w: 40, h: 40 },
            { letra: 'D', x: 235, y, w: 40, h: 40 }
        ]
    });
}

async function processarContainer(
    data: Uint8Array,
    width: number,
    height: number,
    questoes: Questao[],
    offsetX: number,
    offsetY: number
) {

    const resultado = [];
    for (const questao of questoes) {
        const alternativasResultado = [];
        for (const alternativa of questao.alternativas) {
            let pixelsEscuros = 0;
            const startX = offsetX + alternativa.x;
            const startY = offsetY + alternativa.y;

            for (
                let y = startY;
                y < startY + alternativa.h;
                y++
            ) {
                for (
                    let x = startX;
                    x < startX + alternativa.w;
                    x++
                ) {
                    if (
                        x < 0 ||
                        y < 0 ||
                        x >= width ||
                        y >= height
                    ) continue;

                    const idx = (width * y + x) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    const media = (r + g + b) / 3;
                    if (media < 160) {
                        pixelsEscuros++;
                    }
                }
            }

            const totalArea = alternativa.w * alternativa.h;
            const percentual = Number(((pixelsEscuros / totalArea) * 100).toFixed(2));
            alternativasResultado.push({
                letra: alternativa.letra,
                pixels: pixelsEscuros,
                percentual
            });
        }

        const ordenadas =
            [...alternativasResultado]
                .sort(
                    (a, b) =>
                        b.percentual -
                        a.percentual
                );
        const primeira = ordenadas[0];
        const segunda =  ordenadas[1];
        const diferenca =
            Number(
                (
                    primeira.percentual -
                    segunda.percentual
                ).toFixed(2)
            );
        let marcada = 'INVÁLIDA';
        if (
            primeira.percentual > 18 && diferenca > 6
        ) {
            marcada = primeira.letra;
        }
        resultado.push({
            questao: questao.numero,
            marcada,
            percentual: primeira.percentual,
            diferenca,
            alternativas: alternativasResultado
        });
    }
    return resultado;
}

export async function processarOMR(
    imageUri: string
) {

    try {
        const manipulada =
            await ImageManipulator.manipulateAsync(
                imageUri,
                [],
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
        console.log( '📷 imagem:', manipulada.width, manipulada.height );

        const imageBuffer = Buffer.from( manipulada.base64, 'base64' );
        const rawImageData = jpeg.decode( imageBuffer, { useTArray: true });
        const { width, height, data } = rawImageData;
        console.log('✅ decode:', width, height );

        const portugues =
            await processarContainer(
                data,
                width,
                height,
                QUESTOES_PORTUGUES,
                OMR_CONTAINER.portugues.x,
                OMR_CONTAINER.portugues.y
            );

        const matematica =
            await processarContainer(
                data,
                width,
                height,
                QUESTOES_MATEMATICA,
                OMR_CONTAINER.matematica.x,
                OMR_CONTAINER.matematica.y
            );

        return {
            width,
            height,
            portugues,
            matematica
        };
    } catch (e) {
        console.log(
            '❌ erro OMR:',
            e
        );
        return null;
    }
}