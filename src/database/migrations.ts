import { db } from "./database";

export function iniciarDb() {
  db.execSync(`
        CREATE TABLE 
            IF NOT EXISTS avaliacao_saed_mob (
            id_avaliacao_saed_mob INTEGER PRIMARY KEY AUTOINCREMENT,
            id_avaliacao_saed INTEGER,
            id_anoletivo INTEGER,
            id_cliente INTEGER,
            nome_cliente TEXT,
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
                id_disciplina INTEGER,
                desc_disciplina TEXT,
                conteudo TEXT,
                id_pergunta_alternativa INTEGER,
                descricao_alternativa TEXT,
                esta_correto INTEGER,
                FOREIGN KEY (id_avaliacao_saed_mob) REFERENCES avaliacao_saed_mob (id_avaliacao_saed_mob) ON DELETE CASCADE
            );
    `);

  db.execAsync(`
        CREATE TABLE 
            IF NOT EXISTS 'ava_estudante_saed'(
                id_ava_estudante_saed INTEGER PRIMARY KEY AUTOINCREMENT,
                id_cliente INTEGER,
                id_escola INTEGER,
                id_serie INTEGER,
                id_turma INTEGER,
                id_estudante_origem INTEGER,
                nome_estudante TEXT,
                FOREIGN KEY (id_escola) REFERENCES ava_escolas_saed (id_escola)
        );
    `);

  db.execAsync(`
        CREATE TABLE
            IF NOT EXISTS 'aluno_respostas_prova_saed' (
                id_aluno_respostas_prova_saed INTEGER PRIMARY KEY AUTOINCREMENT,
                id_estudante_origem INTEGER,
                id_avaliacao_saed_mob INTEGER NOT NULL,
                id_disciplina INTEGER,
                id_questao INTEGER,
                is_marcada INTEGER,
                is_correta INTEGER,
                FOREIGN KEY (id_avaliacao_saed_mob) REFERENCES avaliacao_saed_mob (id_avaliacao_saed_mob)
                FOREIGN KEY (id_estudante_origem) REFERENCES ava_estudante_saed(id_estudante_origem)

            );
    `);

  db.execAsync(`
        CREATE TABLE
            IF NOT EXISTS 'prova_sync_saed' (
                id_prova_sync INTEGER PRIMARY KEY AUTOINCREMENT,
                id_avaliacao_saed_mob INTEGER,
                qr_code TEXT,
                arq_prova TEXT,
                sincronizado INTEGER NOT NULL DEFAULT 0,
                data_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_avaliacao_saed_mob) REFERENCES avaliacao_saed_mob (id_avaliacao_saed_mob)
            ); 
    `);

  db.execAsync(`
        CREATE TABLE 
            IF NOT EXISTS 'ava_escolas_saed'(
                id_ava_escolas_saed INTEGER PRIMARY KEY AUTOINCREMENT,
                id_escola INTEGER,
                id_cliente INTEGER,
                nome_escola TEXT 
        );
    `);

  db.execAsync(`
        CREATE TABLE
            IF NOT EXISTS 'ava_turmas_saed'(
                id_ava_turmas_saed INTEGER PRIMARY KEY AUTOINCREMENT,
                id_escola INTEGER,
                id_serie INTEGER,
                id_turma INTEGER,
                descricao_turma TEXT,
                FOREIGN KEY (id_escola) REFERENCES ava_escolas_saed (id_escola)
        );
    `);

  db.execAsync(`
        CREATE TABLE 
            IF NOT EXISTS liberacoes_prova (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dispositivo_id TEXT UNIQUE NOT NULL,
                dispositivo_substituto_id TEXT,
                id_estudante_origem INTEGER,
                nome_aluno TEXT,
                prova_json TEXT NOT NULL,
                liberada INTEGER DEFAULT 0,
                pausada INTEGER DEFAULT 0,
                entregue INTEGER DEFAULT 0,
                data_liberacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dispositivo_id) REFERENCES dispositivos (id) ON DELETE CASCADE
        );
    `);

  db.execAsync(`
        CREATE TABLE 
            IF NOT EXISTS dispositivos (
                id TEXT PRIMARY KEY NOT NULL,
                nome TEXT,
                modelo TEXT,
                marca TEXT,
                versao TEXT,
                ip TEXT,
                bateria INTEGER,
                status TEXT DEFAULT 'CONECTADO',
                conectado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        );    
    `);
}
