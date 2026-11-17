import { db } from "../database";

import type { AvaliacaoSQLite } from "@/src/features/leitor-gabarito/services/compararGabarito";

// Reutiliza a estrutura oficial da avaliação.
export type AvaliacaoGabarito = AvaliacaoSQLite;

interface ResultadoSQL {
  resultado: string;
}

interface ResultadoJSON {
  avaliacao: AvaliacaoGabarito[];
}

export async function obterGabaritoAvaliacao(
  idAvaliacao: number,
): Promise<AvaliacaoGabarito | null> {
  try {
    // ─── Validar ID da avaliação ───────────────────────

    if (!Number.isSafeInteger(idAvaliacao) || idAvaliacao <= 0) {
      console.warn("ID local da avaliação inválido:", idAvaliacao);

      return null;
    }

    console.log("========== BUSCANDO GABARITO SQLITE ==========");
    console.log("ID da avaliação:", idAvaliacao);

    // ─── Consultar gabarito no SQLite ─────────────────

    const resultado = await db.getFirstAsync<ResultadoSQL>(
      `
      SELECT json_object(
          'avaliacao',
          json_group_array(
              json_object(
                  'id_avaliacao_saed_mob',
                  avaliacao.id_avaliacao_saed_mob,

                  'id_avaliacao_saed',
                  avaliacao.id_avaliacao_saed,

                  'descricao_avaliacao',
                  avaliacao.descricao_avaliacao,

                  'disciplina', json((
                      SELECT json_group_array(
                          json_object(
                              'id_disciplina',
                              disciplina.id_disciplina,

                              'desc_disciplina',
                              disciplina.desc_disciplina,

                              'questoes', json((
                                  SELECT json_group_array(
                                      json_object(
                                          'id_questao',
                                          questao.id_questao,

                                          'alternativas', json((
                                              SELECT json_group_array(
                                                  json_object(
                                                      'id_pergunta_alternativa',
                                                      alternativa.id_pergunta_alternativa,

                                                      'esta_correto',
                                                      alternativa.esta_correto
                                                  )
                                              )
                                              FROM (
                                                  SELECT
                                                      id_pergunta_alternativa,
                                                      esta_correto
                                                  FROM ava_questoes_saed_mob
                                                  WHERE
                                                      id_avaliacao_saed_mob =
                                                          avaliacao.id_avaliacao_saed_mob

                                                      AND id_disciplina =
                                                          disciplina.id_disciplina

                                                      AND id_questao =
                                                          questao.id_questao
                                                  ORDER BY
                                                      id_pergunta_alternativa ASC
                                              ) alternativa
                                          ))
                                      )
                                  )
                                  FROM (
                                      SELECT DISTINCT
                                          id_questao
                                      FROM ava_questoes_saed_mob
                                      WHERE
                                          id_avaliacao_saed_mob =
                                              avaliacao.id_avaliacao_saed_mob

                                          AND id_disciplina =
                                              disciplina.id_disciplina
                                      ORDER BY
                                          id_questao ASC
                                  ) questao
                              ))
                          )
                      )
                      FROM (
                          SELECT DISTINCT
                              id_disciplina,
                              desc_disciplina
                          FROM ava_questoes_saed_mob
                          WHERE
                              id_avaliacao_saed_mob =
                                  avaliacao.id_avaliacao_saed_mob
                          ORDER BY
                              id_disciplina ASC
                      ) disciplina
                  ))
              )
          )
      ) AS resultado
      FROM avaliacao_saed_mob avaliacao
      WHERE avaliacao.id_avaliacao_saed = ?;
      `,
      idAvaliacao,
    );

    // ─── Validar retorno do SQLite ────────────────────

    if (!resultado?.resultado) {
      console.warn(
        "Nenhum resultado retornado pelo SQLite para a avaliação:",
        idAvaliacao,
      );

      return null;
    }

    // ─── Converter JSON ───────────────────────────────

    const json = JSON.parse(resultado.resultado) as ResultadoJSON;

    console.log(
      "========== JSON COMPLETO DO SQLITE ==========\n",
      JSON.stringify(json, null, 2),
      "\n=============================================",
    );

    // A SQL retorna um array dentro de "avaliacao".
    // Como buscamos apenas um ID, utilizamos o primeiro objeto.

    const avaliacao: AvaliacaoGabarito | null = json.avaliacao?.[0] ?? null;

    if (!avaliacao) {
      console.warn("Avaliação não encontrada no JSON:", idAvaliacao);

      return null;
    }

    // ─── Resumo da avaliação ──────────────────────────

    console.log("========== RESUMO DA AVALIAÇÃO ==========");

    console.log("ID local:", avaliacao.id_avaliacao_saed_mob);

    console.log("ID original:", avaliacao.id_avaliacao_saed);

    console.log("Descrição:", avaliacao.descricao_avaliacao);

    console.log("Total de disciplinas:", avaliacao.disciplina.length);

    avaliacao.disciplina.forEach((disciplina) => {
      console.log(
        "Disciplina:",
        disciplina.id_disciplina,
        "-",
        disciplina.desc_disciplina,
      );

      console.log("Quantidade de questões:", disciplina.questoes.length);
    });

    console.log("========================================");

    return avaliacao;
  } catch (error) {
    console.error("Erro ao buscar gabarito da avaliação:", error);

    throw error;
  }
}
