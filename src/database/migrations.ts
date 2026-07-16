import { db } from "./database";

export function iniciarDb() {

    db.execSync(`
        CREATE TABLE 
            IF NOT EXISTS avaliacao_saed_mob (
            id_avaliacao_saed_mob INTEGER PRIMARY KEY AUTOINCREMENT,
            id_avaliacao_saed INTEGER,
            id_anoletivo INTEGER,
            id_cliente INTEGER,
            id_serie INTEGER,
            ordem INTEGER,
            descricao_avaliacao TEXT,
            data_inicio_avaliacao TEXT,
            data_fim_avaliacao TEXT,
            tempo_prova TEXT,
            is_sincronizado INTEGER DEFAULT 0
        );
    `);

    db.execSync(`
        CREATE TABLE
            IF NOT EXISTS ava_questoes_saed_mob (
                id_ava_questoes_saed_mob INTEGER PRIMARY KEY AUTOINCREMENT,
                id_avaliacao_saed_mob INTEGER NOT NULL,
                id_questao INTEGER,
                conteudo TEXT,
                id_pergunta_alternativa INTEGER,
                descricao_alternativa TEXT,
                esta_correto INTEGER,
                FOREIGN KEY (id_avaliacao_saed_mob) REFERENCES avaliacao_saed_mob (id_avaliacao_saed_mob) ON DELETE CASCADE
            );
    `);

    db.execAsync(`
        CREATE TABLE
            IF NOT EXISTS 'aluno_respostas_prova_saed' (
                id_aluno_respostas_prova_saed INTEGER PRIMARY KEY AUTOINCREMENT,
                id_avaliacao_saed_mob INTEGER NOT NULL,
                id_aluno INTEGER,
                id_questao INTEGER,
                id_pergunta_alternativa INTEGER,
                descricao_alternativa TEXT, 
                FOREIGN KEY (id_avaliacao_saed_mob) REFERENCES avaliacao_saed_mob (id_avaliacao_saed_mob)
            );
    `);

    db.execAsync(`
        CREATE TABLE
            IF NOT EXISTS 'prova_sync_saed' (
                id_prova_sync INTEGER PRIMARY KEY AUTOINCREMENT,
                id_ava_questoes_saed_mob INTEGER,
                qr_code TEXT,
                arq_prova TEXT,
                sincronizado INTEGER NOT NULL DEFAULT 0,
                data_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_ava_questoes_saed_mob) REFERENCES ava_questoes_saed_mob (id_ava_questoes_saed_mob)
            ); 
    `);
}