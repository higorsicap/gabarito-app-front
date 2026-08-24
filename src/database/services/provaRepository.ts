import { db } from "../database";
// 📌 Adicione no topo do provaRepository.ts
import { DispositivoConectado } from "@/src/services/socketServer"; // 👈 Ajuste o caminho relativo até o seu servidor.ts

export async function listarProvasOffline() {
  try {
    const result = await db.getAllAsync<any>(
      `
            SELECT 
                asm.id_avaliacao_saed_mob,
                asm.id_cliente,
                asm.id_serie,
                asm.id_anoletivo,
                asm.nome_cliente,
                asm.descricao_avaliacao,
                asm.data_inicio_avaliacao,
                asm.data_fim_avaliacao,
                asm.tempo_prova
            FROM avaliacao_saed_mob asm 
            ORDER BY asm.id_avaliacao_saed_mob ASC;
            `,
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar provas offline:", error);
    return [];
  }
}

export async function enviarProvaSelecionada(
  idAvaliacaoSaedMob: number | string,
) {
  try {
    const result = await db.getAllAsync<any>(
      `
            SELECT 
                asm.id_avaliacao_saed_mob,
                asm.id_avaliacao_saed,
                asm.nome_cliente,
                asm.descricao_avaliacao,
                asm.tempo_prova,
                json_group_array(
                    json_object(
                        'id_disciplina', disc_agrupada.id_disciplina,
                        'desc_disciplina', disc_agrupada.desc_disciplina,
                        'questoes', json(disc_agrupada.questoes)
                    )
                ) AS disciplinas
            FROM avaliacao_saed_mob asm
            LEFT JOIN (
                -- STEP 4: Agrupa as questões de cada disciplina
                SELECT 
                    id_avaliacao_saed_mob,
                    id_disciplina,
                    desc_disciplina,
                    json_group_array(
                        json_object(
                            'id_questao', id_questao,
                            'conteudo', conteudo,
                            'alternativas', json(alternativas)
                        )
                    ) AS questoes
                FROM (
                    -- STEP 3: Transforma a lista de alternativas em JSON por questão e disciplina
                    SELECT 
                        id_avaliacao_saed_mob,
                        id_disciplina,
                        desc_disciplina,
                        id_questao,
                        conteudo,
                        json_group_array(
                            json_object(
                                'id_alternativa', id_pergunta_alternativa,
                                'letra', letra,
                                'texto', descricao_alternativa,
                                'esta_correta', esta_correto
                            )
                        ) AS alternativas
                    FROM (
                        -- STEP 2: Gera a letra (A, B, C, D)
                        SELECT 
                            id_avaliacao_saed_mob,
                            id_disciplina,
                            desc_disciplina,
                            id_questao,
                            conteudo,
                            id_pergunta_alternativa,
                            descricao_alternativa,
                            esta_correto,
                            CHAR(64 + ROW_NUMBER() OVER (
                                PARTITION BY id_avaliacao_saed_mob, id_disciplina, id_questao 
                                ORDER BY id_pergunta_alternativa ASC
                            )) AS letra
                        FROM (
                            -- STEP 1: Garante unicidade das alternativas
                            SELECT 
                                aqsm.id_avaliacao_saed_mob,
                                aqsm.id_disciplina,
                                aqsm.desc_disciplina,
                                aqsm.id_questao,
                                aqsm.conteudo,
                                aqsm.id_pergunta_alternativa,
                                aqsm.descricao_alternativa,
                                aqsm.esta_correto 
                            FROM ava_questoes_saed_mob aqsm
                            WHERE aqsm.id_avaliacao_saed_mob = $idAvaliacaoSaedMob
                            GROUP BY 
                                aqsm.id_avaliacao_saed_mob, 
                                aqsm.id_disciplina,
                                aqsm.id_questao, 
                                aqsm.id_pergunta_alternativa
                        ) sub_unicas
                    ) sub_ordenada
                    GROUP BY id_avaliacao_saed_mob, id_disciplina, id_questao
                ) sub_questoes
                GROUP BY id_avaliacao_saed_mob, id_disciplina
            ) AS disc_agrupada ON disc_agrupada.id_avaliacao_saed_mob = asm.id_avaliacao_saed_mob
            WHERE asm.id_avaliacao_saed_mob = $idAvaliacaoSaedMob
            GROUP BY asm.id_avaliacao_saed_mob;
            `,
      { $idAvaliacaoSaedMob: idAvaliacaoSaedMob }, // Separado por vírgula da string SQL
    );

    // ✅ Tratamento seguro para evitar crash no JSON.parse
    const resultadoFormatado = result.map((row) => {
      let disciplinasArray = [];

      if (row.disciplinas) {
        try {
          disciplinasArray =
            typeof row.disciplinas === "string"
              ? JSON.parse(row.disciplinas)
              : row.disciplinas;
        } catch (parseError) {
          console.error(
            "⚠️ Erro ao converter JSON de disciplinas:",
            parseError,
          );
          disciplinasArray = [];
        }
      }

      return {
        ...row,
        disciplinas: disciplinasArray,
      };
    });

    return resultadoFormatado[0] || null; // Retorna o objeto da prova diretamente se houver
  } catch (error) {
    console.error("🚨 Erro na busca do SQLite:", error);
    throw error;
  }
}

export interface AvaliacaoSelect {
  id_avaliacao_saed_mob: number;
  descricao_avaliacao: string;
  data_inicio_avaliacao: number;
  id_anoletivo: number;
}

export async function preencherSelectAvaliacao(): Promise<AvaliacaoSelect[]> {
  try {
    const result = await db.getAllAsync<AvaliacaoSelect>(
      `
        SELECT 
            asm.id_avaliacao_saed_mob,
            asm.descricao_avaliacao,
            asm.data_inicio_avaliacao,
            asm.id_anoletivo
        FROM avaliacao_saed_mob asm 
        ORDER BY asm.descricao_avaliacao ASC;
        `,
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar provas offline:", error);
    return [];
  }
}
export interface EscolaSelect {
  id_escola: number;
  nome_escola: string;
}

export async function preencherSelectEscola(): Promise<EscolaSelect[]> {
  try {
    const result = await db.getAllAsync<EscolaSelect>(
      `
            SELECT 
                aes.id_escola,
                aes.nome_escola 
            FROM ava_escolas_saed aes 
            ORDER BY aes.nome_escola ASC
            `,
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar provas offline:", error);
    return [];
  }
}

export interface TurmaSelect {
  id_turma: number;
  descricao_turma: string;
}

export async function preencherSelectTurma(
  idEscola: string | number,
): Promise<TurmaSelect[]> {
  try {
    // Se não houver idEscola selecionado, retorna lista vazia imediatamente
    if (!idEscola) return [];

    const result = await db.getAllAsync<TurmaSelect>(
      `
            SELECT 
                ats.id_turma,
                ats.descricao_turma 
            FROM ava_turmas_saed ats 
            WHERE ats.id_escola = $idEscola
            ORDER BY ats.descricao_turma ASC
            `,
      { $idEscola: idEscola }, // Passa o parâmetro para a consulta do SQLite
    );

    return result;
  } catch (error) {
    console.error("Erro ao buscar turmas offline:", error);
    return [];
  }
}

export interface AlunoSelect {
  id: number;
  nome: string;
  status: string; // Ex: "Pendente", "Concluído"
}

export async function listarAlunoEscolaTurma(
  idEscola: string | number,
  idTurma: string | number,
): Promise<AlunoSelect[]> {
  try {
    // Se falta escola ou turma, não executa a busca
    if (!idEscola || !idTurma) return [];

    const result = await db.getAllAsync<{
      id_estudante_origem: number;
      nome_estudante: string;
    }>(
      `
            SELECT 
                aes.id_estudante_origem,
                aes.nome_estudante 
            FROM ava_estudante_saed aes 
            WHERE aes.id_escola = $idEscola
                AND aes.id_turma = $idTurma
            ORDER BY aes.nome_estudante ASC
            `,
      {
        $idEscola: idEscola,
        $idTurma: idTurma,
      },
    );

    // Mapeia os dados para o formato consumido pelo componente
    return result.map((item) => ({
      id: item.id_estudante_origem,
      nome: item.nome_estudante,
      status: "Pendente", // Valor padrão ou vindo de outra tabela se houver
    }));
  } catch (error) {
    console.error("Erro ao buscar alunos offline:", error);
    return [];
  }
}

export async function salvarDispositivoOuAtualizar(
  disp: DispositivoConectado,
): Promise<void> {
  try {
    const query = `
            INSERT OR REPLACE INTO dispositivos (
                id, 
                nome, 
                modelo, 
                marca, 
                versao, 
                ip, 
                status, 
                conectado_em, 
                bateria
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.runAsync(query, [
      disp.id,
      disp.nome || "Tablet Aluno",
      disp.modelo || null,
      disp.marca || null,
      disp.versao || null,
      disp.ip || "",
      disp.status || "conectado",
      disp.conectado_em || new Date().toISOString(),
      disp.bateria || null,
    ]);

    console.log(`💾 Dispositivo ${disp.id} registrado/atualizado no SQLite.`);
  } catch (error) {
    console.error("❌ Erro ao salvar dispositivo no SQLite:", error);
    throw error;
  }
}

export async function liberarProvaNoBanco(
  dispositivoId: string,
  idAvaliacao: number | string,
  alunoInfo?: { nome: string; id?: string | number },
): Promise<void> {
  try {
    const dadosProva = await enviarProvaSelecionada(idAvaliacao);

    if (!dadosProva || dadosProva.length === 0) {
      throw new Error(
        `Prova de ID ${idAvaliacao} não encontrada no banco local.`,
      );
    }

    const query = `
      INSERT OR REPLACE INTO liberacoes_prova (
          dispositivo_id, 
          id_estudante_origem,
          nome_aluno, 
          prova_json, 
          liberada, 
          entregue, 
          data_liberacao
      ) VALUES (?, ?, ?, ?, 1, 0, ?);
    `;

    const nomeAluno = alunoInfo?.nome || null;
    const idEstudanteOrigem = alunoInfo?.id || null; // <- Pegando o ID do aluno aqui
    const provaJson = JSON.stringify(dadosProva[0] || dadosProva);
    const dataAtual = new Date().toISOString();

    await db.runAsync(query, [
      dispositivoId,
      idEstudanteOrigem, // <- Corrigido: antes estava idAvaliacao
      nomeAluno,
      provaJson,
      dataAtual,
    ]);

    console.log(`🔓 Prova liberada no SQLite para o tablet ${dispositivoId}`);
  } catch (error) {
    console.error("❌ Erro ao liberar prova no banco:", error);
    throw error;
  }
}

export async function buscarProvaLiberadaParaDispositivo(
  dispositivoId: string,
): Promise<any | null> {
  try {
    // Consulta considerando liberada = 1 e entregue = 0
    const query = `
            SELECT 
                * 
            FROM liberacoes_prova 
            WHERE dispositivo_id = ? 
                AND liberada = 1 
                AND entregue = 0 
            LIMIT 1;
    `;

    const registro = await db.getFirstAsync<{
      id: number;
      dispositivo_id: string;
      nome_aluno: string | null;
      prova_json: string;
      liberada: number;
      entregue: number;
      data_liberacao: string;
    }>(query, [dispositivoId]);

    // Se não encontrou ou a prova não foi liberada/já foi entregue
    if (!registro) {
      return null;
    }

    // Marca como entregue para o tablet não baixar novamente em futuros polls
    await db.runAsync(
      `UPDATE liberacoes_prova 
            SET entregue = 1 
            WHERE id = ?;`,
      [registro.id],
    );

    // Retorna a prova formatada
    return {
      aluno: registro.nome_aluno ? { nome: registro.nome_aluno } : null,
      ...JSON.parse(registro.prova_json),
    };
  } catch (error) {
    console.error("❌ Erro ao buscar prova liberada no SQLite:", error);
    return null;
  }
}

export async function verificarEAtualizarBateriaDispositivo(
  dispositivoId: string,
  bateria: number | null,
): Promise<void> {
  try {
    const query = `
            UPDATE dispositivos 
            SET bateria = ? 
            WHERE id = ?;
        `;
    await db.runAsync(query, [bateria, dispositivoId]);
  } catch (error) {
    console.error("❌ Erro ao atualizar bateria do dispositivo:", error);
    throw error;
  }
}

export async function atualizarPausaDispositivo(
  dispositivoId: string,
  statusPausa: boolean,
): Promise<void> {
  try {
    await db.runAsync(
      `
            UPDATE liberacoes_prova 
            SET pausada = ? 
            WHERE dispositivo_id     = ?;
            `,
      [statusPausa ? 1 : 0, dispositivoId],
    );
  } catch (error) {
    console.error("❌ Erro ao atualizar pausa do dispositivo:", error);
    throw error;
  }
}

export async function buscarPausaDispositivo(
  dispositivoId: string,
): Promise<boolean> {
  try {
    const registro = await db.getFirstAsync<{ pausada: number }>(
      `
            SELECT 
                pausada 
            FROM liberacoes_prova 
            WHERE dispositivo_id = ? 
            LIMIT 1;
            `,
      [dispositivoId],
    );
    // Verifica pausada (se for 1, retorna true)
    return Number(registro?.pausada) === 1;
  } catch (error) {
    console.error("❌ Erro ao buscar pausa do dispositivo:", error);
    return false;
  }
}

export interface DisciplinaAplicada {
  id_disciplina?: string | number;
  nome: string;
  total: number;
  respondidas?: number;
}

export async function buscarDisciplinasAplicadas(
  dispositivoId: string,
): Promise<DisciplinaAplicada[]> {
  try {
    // Usa getAllAsync para retornar um Array com TODAS as disciplinas (e não apenas a primeira)
    const registros = await db.getAllAsync<DisciplinaAplicada>(
      `
            SELECT 
                aqsm.id_disciplina,
                aqsm.desc_disciplina AS nome,
                COUNT(DISTINCT aqsm.id_questao) AS total
            FROM ava_questoes_saed_mob aqsm 
            WHERE aqsm.id_avaliacao_saed_mob = ?
            GROUP BY 
                aqsm.id_disciplina,
                aqsm.desc_disciplina;
            `,
      [dispositivoId],
    );

    return registros ?? [];
  } catch (error) {
    console.error(
      "❌ Erro ao buscar disciplinas aplicadas do dispositivo:",
      error,
    );
    return [];
  }
}

export async function verificarBateriaDispositivo(
  dispositivoId: string,
): Promise<number | null> {
  try {
    const registro = await db.getFirstAsync<{ bateria: number | null }>(
      `
            SELECT 
                d.id, 
                d.bateria
            FROM dispositivos d 
            JOIN liberacoes_prova lp ON lp.dispositivo_id = d.id 
            WHERE lp.dispositivo_id = ?
            `,
      [dispositivoId],
    );

    return registro?.bateria ?? null;
  } catch (error) {
    console.error("❌ Erro ao buscar bateria do dispositivo:", error);
    return null;
  }
}
