import { db } from "../database";

export async function salvarProvaOffline(dados: any[]) {
    // Uso de transação para garantir integridade (ou salva tudo ou cancela tudo)
    await db.withTransactionAsync(async () => {
        for (const prova of dados) {
            // 1. INSERE A PROVA
            const result = await db.runAsync(
                `
                INSERT INTO avaliacao_saed_mob (
                    id_avaliacao_saed,
                    id_anoletivo,
                    id_cliente,
                    nome_cliente,
                    id_serie,
                    ordem,
                    descricao_avaliacao,
                    data_inicio_avaliacao,
                    data_fim_avaliacao,
                    tempo_prova
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    Number(prova.id_avaliacao_saed),
                    Number(prova.id_anoletivo),
                    Number(prova.id_cliente),
                    prova.nome_cliente,
                    Number(prova.id_serie),
                    Number(prova.ordem),
                    prova.descricao_avaliacao,
                    prova.data_inicio_avaliacao,
                    prova.data_fim_avaliacao,
                    prova.tempo_prova,
                ]
            );

            const idProva = result.lastInsertRowId;

            // 2. PARSE DE QUESTÕES
            const listaQuestoes =
                typeof prova.questoes === "string"
                    ? JSON.parse(prova.questoes)
                    : prova.questoes || [];

            // 3. INSERE QUESTÕES E ALTERNATIVAS
            for (const questao of listaQuestoes) {
                const alternativas =
                    typeof questao.alternativas === "string"
                        ? JSON.parse(questao.alternativas)
                        : questao.alternativas || [];

                for (const alt of alternativas) {
                    await db.runAsync(
                        `
                        INSERT INTO ava_questoes_saed_mob (
                            id_avaliacao_saed_mob,
                            id_questao,
                            conteudo,
                            id_pergunta_alternativa,
                            descricao_alternativa,
                            esta_correto
                        ) VALUES (?, ?, ?, ?, ?, ?)
                        `,
                        [
                            Number(idProva),
                            Number(questao.id_questao),
                            questao.conteudo,
                            Number(alt.id_pergunta_alternativa),
                            alt.descricao_alternativa,
                            Number(alt.esta_correto),
                        ]
                    );
                }
            }
        }
    });
}

export async function salvarEscolasOffline(dados: any[]) {
    try {
        await db.withTransactionAsync(async () => {
            for (const escola of dados) {
                await db.runAsync(
                    `
                    INSERT OR REPLACE INTO ava_escolas_saed (
                        id_escola,
                        id_cliente,
                        nome_escola
                    ) VALUES (?, ?, ?)
                    `,
                    [
                        Number(escola.id_escola),
                        Number(escola.id_cliente),
                        escola.nome_escola,
                    ]
                );
            }
        });
    } catch (error) {
        console.log('Erro ao salvar escola:', error);
        throw error;
    }
}

export async function salvarTurmasOffline(dados: any[]) {
    try {
        console.log(`Iniciando salvamento de ${dados?.length || 0} alunos...`);

        await db.withTransactionAsync(async () => {
            let salvos = 0;
            for (const aluno of dados) {
                await db.runAsync(
                    `
                    INSERT OR REPLACE INTO ava_turmas_saed (
                        id_escola,
                        id_serie,
                        id_turma,
                        descricao_turma
                    ) VALUES (?, ?, ?, ?)
                    `,
                    [
                        Number(aluno.id_escola),
                        Number(aluno.id_serie),
                        Number(aluno.id_turma),
                        aluno.descricao_turma,
                    ]
                );
                salvos++;
            }
            console.log(`✅ ${salvos} alunos inseridos com sucesso no SQLite!`);
        });
    } catch (error) {
        console.error('❌ Erro no banco SQLite ao salvar alunos:', error);
        throw error;
    }
}

export async function salvarAlunosOffline(dados: any[]) {
    try {
        console.log(`Iniciando salvamento de ${dados?.length || 0} alunos...`);

        await db.withTransactionAsync(async () => {
            let salvos = 0;
            for (const aluno of dados) {
                await db.runAsync(
                    `
                    INSERT OR REPLACE INTO ava_estudante_saed (
                        id_cliente,
                        id_escola,
                        id_serie,
                        id_turma,
                        id_estudante_origem,
                        nome_estudante
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        Number(aluno.id_cliente),
                        Number(aluno.id_escola),
                        Number(aluno.id_serie),
                        Number(aluno.id_turma),
                        Number(aluno.id_estudante_origem),
                        aluno.nome_estudante,
                    ]
                );
                salvos++;
            }
            console.log(`✅ ${salvos} alunos inseridos com sucesso no SQLite!`);
        });
    } catch (error) {
        console.error('❌ Erro no banco SQLite ao salvar alunos:', error);
        throw error;
    }
}