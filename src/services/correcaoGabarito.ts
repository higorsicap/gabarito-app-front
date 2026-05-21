type Questao = {
    numero_questao: string;
    alternativa: string;
};

export function montarGabarito(
    questoes: Questao[]
) {

    const gabarito: Record<string, string> = {};

    questoes.forEach((q) => {

        gabarito[q.numero_questao] =
            q.alternativa;

    });

    return gabarito;

}

export function corrigirProva(
    gabarito: Record<string, string>,
    respostasAluno: Record<string, string>
) {

    let acertos = 0;

    const detalhes = [];

    for (const numero in gabarito) {

        const respostaCorreta =
            gabarito[numero];

        const respostaAluno =
            respostasAluno[numero] || null;

        const correta =
            respostaCorreta === respostaAluno;

        if (correta) {
            acertos++;
        }

        detalhes.push({

            numero,

            correta,

            resposta_correta:
                respostaCorreta,

            resposta_aluno:
                respostaAluno

        });

    }

    return {

        total:
            Object.keys(gabarito).length,

        acertos,

        erros:
            Object.keys(gabarito).length - acertos,

        percentual:
            (
                (acertos /
                    Object.keys(gabarito).length) * 100
            ).toFixed(2),

        detalhes

    };

}