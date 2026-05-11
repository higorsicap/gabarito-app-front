import { db } from "./database";

export function iniciarDb() {

    db.execSync(`
        CREATE TABLE IF NOT EXISTS provas (
            id_prova INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_escola TEXT,
            id_anoletivo INTEGER,
            id_serie INTEGER,
            id_avaliacao INTEGER,
            id_escola INTEGER,
            id_municipio INTEGER,
            descricao_turma TEXT,
            id_caderno_de_prova_disciplina INTEGER
        );
    `);

    db.execSync(`
        CREATE TABLE IF NOT EXISTS prova_questionario (
            id_prova_questionario INTEGER PRIMARY KEY AUTOINCREMENT,
            id_prova INTEGER NOT NULL,
            numero_questao INTEGER,
            alternativa TEXT,
            FOREIGN KEY (id_prova)
                REFERENCES provas(id_prova)
                ON DELETE CASCADE
        );
    `);

    db.execAsync(`
        CREATE TABLE IF NOT EXISTS 'aluno' (
            id_aluno INTEGER PRIMARY KEY AUTOINCREMENT,
            id_turma INTEGER,
            nome_aluno TEXT,
            cpf_aluno TEXT,
            id_prova INTEGER,
            FOREIGN KEY (id_prova) REFERENCES prova (id_prova)
        );
    `);

    db.execAsync(`
        CREATE TABLE IF NOT EXISTS 'reposta_prova' (
            id_resposta_prova INTEGER PRIMARY KEY AUTOINCREMENT,
            id_aluno INTEGER,
            id_prova INTEGER,
            numero_questao INTEGER,
            alternativa TEXT,
            FOREIGN KEY (id_aluno) REFERENCES aluno (id_aluno),
            FOREIGN KEY (id_prova) REFERENCES prova (id_prova)
        );
    `);
}