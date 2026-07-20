import { db } from "../database";

export async function salvarProvaOffline(
    dados: any[]
) {

    for (const prova of dados) {

        // 1. INSERE A PROVA
        const result = await db.runAsync(
            `
            INSERT INTO
                avaliacao_saed_mob (
                    id_avaliacao_saed,
                    id_anoletivo,
                    id_cliente,
                    id_serie,
                    ordem,
                    descricao_avaliacao,
                    data_inicio_avaliacao,
                    data_fim_avaliacao,
                    tempo_prova
                )
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(prova.id_avaliacao_saed),
                Number(prova.id_anoletivo),
                Number(prova.id_cliente),
                Number(prova.id_serie),
                Number(prova.ordem),
                prova.descricao_avaliacao,
                prova.data_inicio_avaliacao,
                prova.data_fim_avaliacao,
                prova.tempo_prova
            ]
        );

        const idProva = result.lastInsertRowId;

        // 2. CORREÇÃO DO "DOUBLE JSON":
        // Se 'questoes' for uma String (texto), nós fazemos o parse dela para virar um Array.
        // Se por acaso já vier como Array no futuro, o código continua funcionando perfeitamente.
        const listaQuestoes = typeof prova.questoes === 'string'
            ? JSON.parse(prova.questoes)
            : prova.questoes;

        // 3. SEU LOOP DE QUESTÕES
        for (const questao of listaQuestoes) {

            // Extrai as alternativas da questão (também fazendo o parse caso venha como string)
            const alternativas = typeof questao.alternativas === 'string'
                ? JSON.parse(questao.alternativas)
                : (questao.alternativas || []);

            // Loop interno para percorrer cada alternativa desta questão
            for (const alt of alternativas) {

                await db.runAsync(
                    `
            INSERT INTO
                ava_questoes_saed_mob (
                    id_avaliacao_saed_mob,
                    id_questao,
                    conteudo,
                    id_pergunta_alternativa,
                    descricao_alternativa,
                    esta_correto
                )
            VALUES
                (?, ?, ?, ?, ?, ?)
            `,
                    [
                        Number(idProva),
                        Number(questao.id_questao),
                        questao.conteudo,
                        Number(alt.id_pergunta_alternativa), // Agora acessamos de 'alt'
                        alt.descricao_alternativa,           // Agora acessamos de 'alt'
                        Number(alt.esta_correto),            // Agora acessamos de 'alt'
                    ]
                );
            }
        }

    }

}