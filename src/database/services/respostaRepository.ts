import { db } from '../database';

export async function salvarRespostasOffline(payload: any[]) {

    try {

        await db.withTransactionAsync(async () => {

            for (const item of payload) {

                const {
                    id_avaliacao_saed_mob,
                    id_aluno,
                    id_questao,
                    id_pergunta_alternativa,
                    descricao_alternativa
                } = item;

                // 🔥 ALUNO
                await db.runAsync(
                    `
                    INSERT INTO
                        aluno_respostas_prova_saed (
                            id_avaliacao_saed_mob,
                            id_aluno,
                            id_questao,
                            id_pergunta_alternativa,
                            descricao_alternativa
                        )
                    VALUES
                        (?, ?, ?, ?, ?)
                    `,
                    [
                        Number(id_avaliacao_saed_mob),
                        Number(id_aluno),
                        Number(id_questao),
                        Number(id_pergunta_alternativa),
                        descricao_alternativa,
                    ]
                );

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
            arps.id_aluno,
            arps.id_questao,
            arps.id_pergunta_alternativa,
            arps.id_avaliacao_saed_mob 
        FROM aluno_respostas_prova_saed arps 
        `
    );

    return result;

}
