import type { AvaliacaoGabarito } from "@/src/database/services/corrigirProvaRepository";

export interface RespostaIdentificada {
  id_disciplina: number;
  id_questao: number;
  id_pergunta_alternativa: number | null;
}

export interface QuestaoCorrigida {
  id_disciplina: number;
  id_questao: number;
  id_alternativa_correta: number | null;
  id_alternativa_marcada: number | null;
  situacao: "acertou" | "errou" | "em_branco" | "inconsistente";
}

export function compararRespostas(
  avaliacao: AvaliacaoGabarito,
  respostasIA: RespostaIdentificada[],
): QuestaoCorrigida[] {
  const resultado: QuestaoCorrigida[] = [];

  const disciplinas = [...avaliacao.disciplina].sort(
    (a, b) => a.id_disciplina - b.id_disciplina,
  );

  for (const disciplina of disciplinas) {
    const questoes = [...disciplina.questoes].sort(
      (a, b) => a.id_questao - b.id_questao,
    );

    for (const questao of questoes) {
      const alternativas = [...questao.alternativas].sort(
        (a, b) => a.id_pergunta_alternativa - b.id_pergunta_alternativa,
      );

      const corretas = alternativas.filter((a) => Number(a.esta_correto) === 1);

      const respostaIA = respostasIA.find(
        (r) =>
          Number(r.id_disciplina) === disciplina.id_disciplina &&
          Number(r.id_questao) === questao.id_questao,
      );

      const marcada = respostaIA?.id_pergunta_alternativa ?? null;

      const correta =
        corretas.length === 1 ? corretas[0].id_pergunta_alternativa : null;

      let situacao: QuestaoCorrigida["situacao"];

      if (corretas.length !== 1) {
        situacao = "inconsistente";
      } else if (marcada === null) {
        situacao = "em_branco";
      } else if (
        !alternativas.some((a) => a.id_pergunta_alternativa === marcada)
      ) {
        situacao = "inconsistente";
      } else if (marcada === correta) {
        situacao = "acertou";
      } else {
        situacao = "errou";
      }

      resultado.push({
        id_disciplina: disciplina.id_disciplina,
        id_questao: questao.id_questao,
        id_alternativa_correta: correta,
        id_alternativa_marcada: marcada,
        situacao,
      });
    }
  }

  return resultado;
}
