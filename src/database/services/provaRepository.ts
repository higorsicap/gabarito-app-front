import { db } from "../database";

export async function salvarProvaOffline(
    dados: any[]
) {

    for (const prova of dados) {

        // 🔥 INSERT PROVA
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

        // 🔥 QUESTÕES
        for (const questao of prova.questoes) {

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
                    Number(questao.id_avaliacao_saed_mob),
                    Number(questao.id_questao),
                    questao.conteudo,
                    Number(questao.id_pergunta_alternativa),
                    questao.descricao_alternativa,
                    Number(questao.esta_correto),
                ]
            );

        }

    }

}