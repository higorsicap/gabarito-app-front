import { db } from "../database";

export interface AvaliacaoGabarito {
  id_avaliacao_saed_mob: number;
  id_avaliacao_saed: number;
  descricao_avaliacao: string;
  disciplina: {
    id_disciplina: number;
    questoes: {
      id_questao: number;
      alternativas: {
        id_pergunta_alternativa: number;
        esta_correto: number;
      }[];
    }[];
  }[];
}

interface ResultadoSQL {
  resultado: string;
}

export async function obterGabaritoAvaliacao(
  idAvaliacao: number,
): Promise<AvaliacaoGabarito | null> {
  try {
    const resultado = await db.getFirstAsync<ResultadoSQL>(
      `
      SELECT json_object(
        'avaliacao',
        json_group_array(
          json_object(
            'id_avaliacao_saed_mob', avaliacao.id_avaliacao_saed_mob,
            'id_avaliacao_saed', avaliacao.id_avaliacao_saed,
            'descricao_avaliacao', avaliacao.descricao_avaliacao,

            'disciplina', json((
              SELECT json_group_array(
                json_object(
                  'id_disciplina', disciplina.id_disciplina,

                  'questoes', json((
                    SELECT json_group_array(
                      json_object(
                        'id_questao', questao.id_questao,

                        'alternativas', json((
                          SELECT json_group_array(
                            json_object(
                              'id_pergunta_alternativa',
                              alternativa.id_pergunta_alternativa,

                              'esta_correto',
                              alternativa.esta_correto
                            )
                          )
                          FROM ava_questoes_saed_mob alternativa
                          WHERE alternativa.id_avaliacao_saed_mob =
                            avaliacao.id_avaliacao_saed_mob
                            AND alternativa.id_disciplina =
                              disciplina.id_disciplina
                            AND alternativa.id_questao =
                              questao.id_questao
                          ORDER BY alternativa.id_pergunta_alternativa ASC
                        ))
                      )
                    )
                    FROM (
                      SELECT DISTINCT id_questao
                      FROM ava_questoes_saed_mob
                      WHERE id_avaliacao_saed_mob =
                        avaliacao.id_avaliacao_saed_mob
                        AND id_disciplina = disciplina.id_disciplina
                    ) questao
                  ))
                )
              )
              FROM (
                SELECT DISTINCT id_disciplina
                FROM ava_questoes_saed_mob
                WHERE id_avaliacao_saed_mob =
                  avaliacao.id_avaliacao_saed_mob
              ) disciplina
            ))
          )
        )
      ) AS resultado
      FROM avaliacao_saed_mob avaliacao
      WHERE avaliacao.id_avaliacao_saed_mob = ?;
      `,
      idAvaliacao,
    );

    if (!resultado?.resultado) {
      return null;
    }

    const json = JSON.parse(resultado.resultado);

    return json.avaliacao?.[0] ?? null;
  } catch (error) {
    console.error("Erro ao buscar gabarito da avaliação:", error);
    throw error;
  }
}
