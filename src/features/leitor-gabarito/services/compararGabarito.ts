export type Alternativa = {
  id_pergunta_alternativa: number;
  esta_correto: number;
};

export type QuestaoSQLite = {
  id_questao: number;
  alternativas: Alternativa[];
};

export type DisciplinaSQLite = {
  id_disciplina: number;
  desc_disciplina: string;
  questoes: QuestaoSQLite[];
};

export type AvaliacaoSQLite = {
  id_avaliacao_saed_mob: number;
  id_avaliacao_saed: number;
  descricao_avaliacao: string;
  disciplina: DisciplinaSQLite[];
};

export type QuestaoIA = {
  questao: string;
  resposta: string | null;
};

export type DisciplinaIA = {
  identificador: string;
  disciplina: string;
  questoes: QuestaoIA[];
};

export type ResultadoQuestao = {
  numero_questao: number;
  id_questao: number;
  resposta_aluno: string | null;
  resposta_correta: string | null;
  acertou: boolean;
  situacao: "acertou" | "errou" | "em_branco" | "inconsistente";
};

export type ResultadoDisciplina = {
  id_disciplina: number;
  desc_disciplina: string;
  situacao: "corrigida" | "disciplina_nao_encontrada";
  total_questoes: number;
  acertos: number;
  erros: number;
  em_branco: number;
  inconsistentes: number;
  questoes: ResultadoQuestao[];
};

export type ResultadoCorrecao = {
  id_avaliacao_saed_mob: number;
  id_avaliacao_saed: number;
  total_questoes: number;
  total_acertos: number;
  total_erros: number;
  total_em_branco: number;
  total_inconsistentes: number;
  percentual_acertos: number | null;
  disciplinas: ResultadoDisciplina[];
};

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Normaliza nomes para comparar disciplinas.
function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

// Corrige as questões de uma disciplina.
export function compararGabarito(
  disciplinaSQLite: DisciplinaSQLite,
  disciplinaIA: DisciplinaIA,
): ResultadoQuestao[] {
  const questoesSQLite = [...disciplinaSQLite.questoes].sort(
    (a, b) => a.id_questao - b.id_questao,
  );

  const respostasIA = new Map<number, string>();

  for (const questao of disciplinaIA.questoes) {
    const numero = Number(questao.questao);

    if (Number.isInteger(numero) && numero > 0) {
      respostasIA.set(
        numero,
        String(questao.resposta ?? "")
          .trim()
          .toUpperCase(),
      );
    }
  }

  return questoesSQLite.map((questao, indice) => {
    const numeroQuestao = indice + 1;

    const alternativas = [...questao.alternativas].sort(
      (a, b) => a.id_pergunta_alternativa - b.id_pergunta_alternativa,
    );

    const alternativasComLetras = alternativas.map(
      (alternativa, indiceAlternativa) => ({
        ...alternativa,
        letra: LETRAS[indiceAlternativa],
      }),
    );

    const alternativasCorretas = alternativasComLetras.filter(
      (alternativa) => Number(alternativa.esta_correto) === 1,
    );

    const respostaCorreta =
      alternativasCorretas.length === 1 ? alternativasCorretas[0].letra : null;

    const respostaAluno = respostasIA.get(numeroQuestao) ?? null;

    let situacao: ResultadoQuestao["situacao"];

    if (
      respostaCorreta === null ||
      (respostaAluno !== null &&
        respostaAluno !== "" &&
        !alternativasComLetras.some(
          (alternativa) => alternativa.letra === respostaAluno,
        ))
    ) {
      situacao = "inconsistente";
    } else if (!respostaAluno) {
      situacao = "em_branco";
    } else if (respostaAluno === respostaCorreta) {
      situacao = "acertou";
    } else {
      situacao = "errou";
    }

    return {
      numero_questao: numeroQuestao,
      id_questao: questao.id_questao,
      resposta_aluno: respostaAluno || null,
      resposta_correta: respostaCorreta,
      acertou: situacao === "acertou",
      situacao,
    };
  });
}

// Compara todas as disciplinas da avaliação.
export function compararTodasDisciplinas(
  avaliacaoSQLite: AvaliacaoSQLite,
  disciplinasIA: DisciplinaIA[],
): ResultadoCorrecao {
  const disciplinasSQLite = [...avaliacaoSQLite.disciplina].sort(
    (a, b) => a.id_disciplina - b.id_disciplina,
  );

  const disciplinas: ResultadoDisciplina[] = disciplinasSQLite.map(
    (disciplinaSQLite) => {
      const disciplinaIA = disciplinasIA.find(
        (item) =>
          normalizarNome(item.disciplina) ===
          normalizarNome(disciplinaSQLite.desc_disciplina),
      );

      if (!disciplinaIA) {
        return {
          id_disciplina: disciplinaSQLite.id_disciplina,
          desc_disciplina: disciplinaSQLite.desc_disciplina,
          situacao: "disciplina_nao_encontrada",
          total_questoes: disciplinaSQLite.questoes.length,
          acertos: 0,
          erros: 0,
          em_branco: 0,
          inconsistentes: 0,
          questoes: [],
        };
      }

      const questoes = compararGabarito(disciplinaSQLite, disciplinaIA);

      return {
        id_disciplina: disciplinaSQLite.id_disciplina,
        desc_disciplina: disciplinaSQLite.desc_disciplina,
        situacao: "corrigida",
        total_questoes: questoes.length,
        acertos: questoes.filter((q) => q.situacao === "acertou").length,
        erros: questoes.filter((q) => q.situacao === "errou").length,
        em_branco: questoes.filter((q) => q.situacao === "em_branco").length,
        inconsistentes: questoes.filter((q) => q.situacao === "inconsistente")
          .length,
        questoes,
      };
    },
  );

  const totalQuestoes = disciplinas.reduce(
    (total, d) => total + d.total_questoes,
    0,
  );

  const totalAcertos = disciplinas.reduce((total, d) => total + d.acertos, 0);

  const totalErros = disciplinas.reduce((total, d) => total + d.erros, 0);

  const totalEmBranco = disciplinas.reduce(
    (total, d) => total + d.em_branco,
    0,
  );

  const totalInconsistentes = disciplinas.reduce(
    (total, d) => total + d.inconsistentes,
    0,
  );

  const possuiDisciplinaNaoEncontrada = disciplinas.some(
    (d) => d.situacao === "disciplina_nao_encontrada",
  );

  const percentualAcertos =
    totalQuestoes > 0 && !possuiDisciplinaNaoEncontrada
      ? Number(((totalAcertos / totalQuestoes) * 100).toFixed(2))
      : null;

  return {
    id_avaliacao_saed_mob: avaliacaoSQLite.id_avaliacao_saed_mob,
    id_avaliacao_saed: avaliacaoSQLite.id_avaliacao_saed,
    total_questoes: totalQuestoes,
    total_acertos: totalAcertos,
    total_erros: totalErros,
    total_em_branco: totalEmBranco,
    total_inconsistentes: totalInconsistentes,
    percentual_acertos: percentualAcertos,
    disciplinas,
  };
}
