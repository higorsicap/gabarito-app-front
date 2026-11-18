import { db } from "../database";

interface AlternativaSQLite {
  id_pergunta_alternativa: number;
  esta_correto: number;
}

interface QuestaoSQLite {
  id_questao: number;
  alternativas: AlternativaSQLite[];
}

interface DisciplinaSQLite {
  id_disciplina: number;
  desc_disciplina: string;
  questoes: QuestaoSQLite[];
}

interface AvaliacaoSQLite {
  id_avaliacao_saed_mob: number;
  id_avaliacao_saed: number;
  disciplina: DisciplinaSQLite[];
}

interface QuestaoIA {
  questao: string;
  resposta: string | null;
}

interface DisciplinaIA {
  disciplina: string;
  questoes: QuestaoIA[];
}

interface SalvarRespostasParams {
  idEstudanteOrigem: number;
  idAvaliacaoSaed: number;
  avaliacaoSQLite: AvaliacaoSQLite;
  disciplinasIA: DisciplinaIA[];
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function obterIndiceAlternativa(resposta: string): number {
  const letra = resposta.trim().toUpperCase();

  return ["A", "B", "C", "D", "E"].indexOf(letra);
}

export async function salvarRespostasAluno({
  idEstudanteOrigem,
  idAvaliacaoSaed,
  avaliacaoSQLite,
  disciplinasIA,
}: SalvarRespostasParams): Promise<number> {
  if (!Number.isSafeInteger(idEstudanteOrigem) || idEstudanteOrigem <= 0) {
    throw new Error("ID do estudante inválido.");
  }

  if (Number(avaliacaoSQLite.id_avaliacao_saed) !== idAvaliacaoSaed) {
    throw new Error(
      "A avaliação do SQLite não corresponde à avaliação selecionada.",
    );
  }

  if (!Array.isArray(avaliacaoSQLite.disciplina)) {
    throw new Error("A avaliação não possui disciplinas válidas.");
  }

  let totalSalvo = 0;

  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const disciplina of avaliacaoSQLite.disciplina) {
      const disciplinaIA = disciplinasIA.find(
        (item) =>
          normalizarTexto(item.disciplina) ===
          normalizarTexto(disciplina.desc_disciplina),
      );

      if (!disciplinaIA) {
        throw new Error(
          `Disciplina ${disciplina.desc_disciplina} não encontrada na resposta da IA.`,
        );
      }

      for (
        let indiceQuestao = 0;
        indiceQuestao < disciplina.questoes.length;
        indiceQuestao++
      ) {
        const questao = disciplina.questoes[indiceQuestao];

        const numeroQuestao = indiceQuestao + 1;

        const respostaIA = disciplinaIA.questoes.find(
          (item) => Number(item.questao) === numeroQuestao,
        );

        if (!respostaIA) {
          throw new Error(
            `Questão ${numeroQuestao} não encontrada na resposta da IA.`,
          );
        }

        const indiceAlternativa = obterIndiceAlternativa(
          respostaIA.resposta ?? "",
        );

        const alternativaMarcada =
          indiceAlternativa >= 0
            ? questao.alternativas[indiceAlternativa]
            : undefined;

        const alternativasCorretas = questao.alternativas.filter(
          (alternativa) => Number(alternativa.esta_correto) === 1,
        );

        if (alternativasCorretas.length !== 1) {
          throw new Error(
            `Questão ${questao.id_questao} deve possuir exatamente uma alternativa correta.`,
          );
        }

        if (indiceAlternativa >= 0 && !alternativaMarcada) {
          throw new Error(
            `Alternativa ${respostaIA.resposta} não encontrada na questão ${questao.id_questao}.`,
          );
        }

        const idMarcada = alternativaMarcada?.id_pergunta_alternativa ?? null;

        const idCorreta = alternativasCorretas[0].id_pergunta_alternativa;

        await tx.runAsync(
          `
              INSERT INTO aluno_respostas_prova_saed (
                id_estudante_origem,
                id_avaliacao_saed_mob,
                id_disciplina,
                id_questao,
                is_marcada,
                is_correta
              )
              VALUES (?, ?, ?, ?, ?, ?)

              ON CONFLICT (
                id_estudante_origem,
                id_avaliacao_saed_mob,
                id_disciplina,
                id_questao
              )
              DO UPDATE SET
                is_marcada = excluded.is_marcada,
                is_correta = excluded.is_correta
            `,
          [
            idEstudanteOrigem,
            avaliacaoSQLite.id_avaliacao_saed_mob,
            disciplina.id_disciplina,
            questao.id_questao,
            idMarcada,
            idCorreta,
          ],
        );

        totalSalvo++;

        console.log(`Questão ${numeroQuestao}:`, {
          id_questao: questao.id_questao,
          is_marcada: idMarcada,
          is_correta: idCorreta,
          acertou: idMarcada !== null && idMarcada === idCorreta,
        });
      }
    }
  });

  console.log("========== RESPOSTAS SALVAS ==========");
  console.log("Estudante:", idEstudanteOrigem);
  console.log("Avaliação local:", avaliacaoSQLite.id_avaliacao_saed_mob);
  console.log("Total de respostas:", totalSalvo);
  console.log("======================================");

  return totalSalvo;
}
