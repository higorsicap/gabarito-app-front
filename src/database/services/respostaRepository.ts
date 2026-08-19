import { db } from "../database";

export async function salvarRespostasOffline(payload: any[]) {
  try {
    await db.withTransactionAsync(async () => {
      for (const item of payload) {
        const {
          id_avaliacao_saed_mob,
          id_aluno,
          id_questao,
          id_pergunta_alternativa,
          descricao_alternativa,
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
          ],
        );
      }
    });

    return true;
  } catch (error) {
    console.log("Erro salvar respostas:", error);

    throw error;
  }
}

// Interface para tipar cada resposta recebida no payload
export interface RespostaItemPayload {
  id_aluno_respostas_prova_saed?: number | string;
  id_avaliacao_saed_mob: number | string;
  id_ava_estudante_saed: number | string;
  id_questao: number | string;
  id_pergunta_alternativa: number | string;
  esta_marcada?: number; // 1 ou 0
  esta_correta?: number; // 1 ou 0
}

export async function inserirRespostasAluno(respostas: RespostaItemPayload[]) {
  if (!respostas || respostas.length === 0) {
    return true; // Nada para inserir
  }

  try {
    // Transação garante que ou TODAS as respostas são salvas, ou NENHUMA (rollback)
    await db.withTransactionAsync(async () => {
      for (const item of respostas) {
        await db.runAsync(
          `
            INSERT OR REPLACE INTO aluno_respostas_prova_saed (
                id_aluno_respostas_prova_saed,
                id_avaliacao_saed_mob,
                id_ava_estudante_saed,
                id_questao,
                id_pergunta_alternativa,
                esta_marcada,
                esta_correta
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
          `,
          [
            item.id_aluno_respostas_prova_saed || null,
            item.id_avaliacao_saed_mob,
            item.id_ava_estudante_saed,
            item.id_questao,
            item.id_pergunta_alternativa,
            item.esta_marcada ?? 1, // Padrão 1 se foi enviada
            item.esta_correta ?? 0, // Padrão 0 até ser corrigida
          ],
        );
      }
    });

    console.log(`✅ ${respostas.length} respostas salvas no SQLite!`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao inserir respostas do aluno no SQLite:", error);
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
        `,
  );

  return result;
}
