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

}