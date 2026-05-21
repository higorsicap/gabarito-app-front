import { db } from '../database';

export async function salvarRespostasOffline(payload: any[]) {

    try {

        await db.withTransactionAsync(async () => {

            for (const item of payload) {

                const {
                    id_aluno,
                    nome_aluno,
                    id_prova,
                    respostas
                } = item;

                // 🔥 ALUNO
                await db.runAsync(
                    `
                    INSERT OR IGNORE INTO aluno (
                        id_aluno,
                        nome_aluno,
                        id_prova
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        Number(id_aluno),
                        nome_aluno,
                        Number(id_prova)
                    ]
                );

                // 🔥 RESPOSTAS
                for (const r of respostas) {

                    await db.runAsync(
                        `
                        INSERT INTO reposta_prova (
                            id_aluno,
                            id_prova,
                            numero_questao,
                            alternativa
                        )
                        VALUES (?, ?, ?, ?)
                        `,
                        [
                            Number(id_aluno),
                            Number(id_prova),
                            Number(r.numero_questao),
                            r.alternativa
                        ]
                    );

                }

            }

        });

        return true;

    } catch (error) {

        console.log(
            'Erro salvar respostas:',
            error
        );

        throw error;

    }

}

export async function listarRespostasAgrupadas() {

    const result = await db.getAllAsync(
        `
        SELECT DISTINCT
            a.id_aluno,
            a.nome_aluno,

            rp.numero_questao,
            rp.alternativa AS resposta_aluno,

            p.id_prova,
            p.id_caderno_de_prova_disciplina

        FROM aluno a

        JOIN reposta_prova rp
            ON rp.id_aluno = a.id_aluno

        JOIN provas p
            ON p.id_prova = a.id_prova

        ORDER BY
            p.id_prova,
            a.id_aluno,
            rp.numero_questao
        `
    );

    return result;

}

export async function buscarGabaritoProva(
    id_prova: number
) {

    const result = await db.getAllAsync(
        `
        SELECT
            numero_questao,
            alternativa
        FROM prova_questionario
        WHERE id_prova = ?
        ORDER BY numero_questao
        `,
        [id_prova]
    );

    return result;

}