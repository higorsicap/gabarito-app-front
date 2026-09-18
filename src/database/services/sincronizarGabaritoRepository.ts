import { inserirRespostasAunos } from "@/src/services/listaProvaService";
import { db } from "../database";

// Interfaces para tipagem no TypeScript
export interface DisciplinaAgrupada {
  id_disciplina: number;
  qtd_questoes: number;
  desc_disciplina: string;
  qtd_respondida: number;
}

export interface ProvaAgrupadaAluno {
  id_estudante_origem: number;
  nome_estudante: string;
  disciplinas: DisciplinaAgrupada[];
}

export async function listaRespostasPorAluno(): Promise<ProvaAgrupadaAluno[]> {
  const result = await db.getAllAsync<{
    id_estudante_origem: number;
    nome_estudante: string;
    disciplinas: string; // Vem como string do SQLite (json_group_array)
  }>(`
    SELECT
        arps.id_estudante_origem,
        aes.nome_estudante,
        json_group_array(
            json_object(
                'id_disciplina', arps.id_disciplina,
                'desc_disciplina', disc.desc_disciplina,
                'qtd_questoes', arps.qtd_questoes,
                'qtd_respondida', arps.qtd_respondida
            )
        ) AS disciplinas
    FROM (
        SELECT
            id_estudante_origem,
            id_disciplina,
            COUNT(id_questao) AS qtd_questoes,
            COUNT(is_marcada) AS qtd_respondida
        FROM aluno_respostas_prova_saed
        GROUP BY id_estudante_origem, id_disciplina
    ) arps
    JOIN ava_estudante_saed aes ON aes.id_estudante_origem = arps.id_estudante_origem
    LEFT JOIN (
        SELECT DISTINCT id_disciplina, desc_disciplina 
        FROM ava_questoes_saed_mob
    ) disc ON disc.id_disciplina = arps.id_disciplina
    GROUP BY
        arps.id_estudante_origem,
        aes.nome_estudante;
  `);

  return result.map((item) => {
    let disciplinasParsed: DisciplinaAgrupada[] = [];

    if (typeof item.disciplinas === "string") {
      try {
        disciplinasParsed = JSON.parse(item.disciplinas);
      } catch (e) {
        console.error("Erro ao converter disciplinas de JSON:", e);
        disciplinasParsed = [];
      }
    } else if (Array.isArray(item.disciplinas)) {
      disciplinasParsed = item.disciplinas;
    }

    return {
      id_estudante_origem: Number(item.id_estudante_origem),
      nome_estudante: String(item.nome_estudante ?? ""),
      disciplinas: disciplinasParsed,
    };
  });
}

// 1. Envia os dados mantendo a alteração do card para verde em tempo real
export async function sincronizarDadosComServidor(
  onItemSuccess?: (item: any) => void,
) {
  // 1. Usamos DISTINCT para impedir duplicatas
  // 2. Usamos LEFT JOIN para garantir que dados sem turmas/relacionamento não fiquem de fora
  // 3. Adicionamos ORDER BY para garantir que siga a ordem exata dos alunos/questões
  const dadosParaSincronizar = await db.getAllAsync<any>(`
    SELECT DISTINCT
      asm.id_avaliacao_saed,
      asm.id_anoletivo,
      asm.id_cliente,
      ats.id_serie,
      arps.id_estudante_origem,
      arps.id_disciplina,
      arps.id_questao,
      arps.is_marcada AS id_marcada,
      arps.is_correta AS id_correta
    FROM avaliacao_saed_mob asm 
    INNER JOIN aluno_respostas_prova_saed arps 
      ON arps.id_avaliacao_saed_mob = asm.id_avaliacao_saed_mob  
    LEFT JOIN ava_turmas_saed ats 
      ON ats.id_ava_turmas_saed = asm.id_cliente
    ORDER BY arps.id_estudante_origem ASC, arps.id_questao ASC
  `);

  if (!dadosParaSincronizar || dadosParaSincronizar.length === 0) {
    return { success: false, message: "Nenhum dado para enviar." };
  }

  const dataAtual = new Date().toISOString();
  let enviadosComSucesso = 0;

  for (const item of dadosParaSincronizar) {
    try {
      await inserirRespostasAunos({
        id_avaliacao_saed: item.id_avaliacao_saed,
        id_anoletivo: item.id_anoletivo,
        id_cliente: item.id_cliente,
        id_serie: item.id_serie,
        id_estudante_origem: item.id_estudante_origem,
        id_disciplina: item.id_disciplina,
        id_questao: item.id_questao,
        // Envia null quando for null ou undefined
        id_marcada: item.id_marcada ?? null,
        id_correta: item.id_correta ?? null,
        data_sincronizacao: dataAtual,
      });

      enviadosComSucesso++;

      if (onItemSuccess) {
        onItemSuccess(item);
      }
    } catch (err) {
      console.error("Erro ao enviar item:", err);
    }
  }

  return {
    success: enviadosComSucesso > 0,
    totalEnviados: enviadosComSucesso,
    message: `${enviadosComSucesso} de ${dadosParaSincronizar.length} respostas sincronizadas.`,
  };
}
// 2. Função responsável por deletar os registros da tabela do SQLite
export async function limparRespostasLocais() {
  await db.runAsync(`DELETE FROM aluno_respostas_prova_saed`);
}
