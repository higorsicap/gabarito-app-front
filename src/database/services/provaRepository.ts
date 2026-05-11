import { db } from "../database";

export async function salvarProvaOffline(
    dados: any[]
) {

    for (const prova of dados) {

        // 🔥 INSERT PROVA
        const result = await db.runAsync(
            `
            INSERT INTO provas (
                nome_escola,
                id_anoletivo,
                id_serie,
                id_avaliacao,
                descricao_turma,
                id_caderno_de_prova_disciplina
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                prova.nome_escola,
                Number(prova.id_anoletivo),
                Number(prova.id_serie),
                Number(prova.id_avaliacao),
                prova.descricao_turma,

                // 🔥 AJUSTE AQUI
                Number(prova.id_caderno_prova_disciplina)
            ]
        );

        const idProva = result.lastInsertRowId;

        // 🔥 QUESTÕES
        for (const questao of prova.questoes) {

            await db.runAsync(
                `
                INSERT INTO prova_questionario (
                    id_prova,
                    numero_questao,
                    alternativa
                )
                VALUES (?, ?, ?)
                `,
                [
                    Number(idProva),
                    Number(questao.numero_questao),
                    questao.alternativa
                ]
            );

        }

    }

}