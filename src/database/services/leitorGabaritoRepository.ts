import { db } from "@/src/database/database";
import { Directory, File, Paths } from "expo-file-system";

export interface prova_sync_saed {
    id_prova_sync?: number;
    id_avaliacao_saed_mob: number;
    qr_code: string;
    arq_prova: string;
    data_sync: string;
    sincronizado: number; // 0 = pendente, 1 = sincronizado
}

// ─── Gerenciamento de arquivos ────────────────────────────────────────────────

function getDirGabaritos(): Directory {
    const dir = new Directory(Paths.document, 'gabaritos');
    if (!dir.exists) dir.create();
    return dir;
}

// Copia a imagem do cache para diretório permanente e retorna o novo caminho
export async function copiarImagemParaPermanente(uriOrigem: string): Promise<string> {
    const dir    = getDirGabaritos();
    const origem = new File(uriOrigem);
    const destino = new File(dir, `gabarito_${Date.now()}.jpg`);
    origem.copy(destino);
    return destino.uri;
}

// Apaga a imagem local após sincronização
async function apagarImagem(caminho: string): Promise<void> {
    try {
        const file = new File(caminho);
        if (file.exists) file.delete();
    } catch {
        // não crítico
    }
}

// ─── Banco de dados ───────────────────────────────────────────────────────────

// Salva uma ou mais provas pendentes de sincronização
export async function salvaGabarito(dados: prova_sync_saed[]): Promise<void> {
    for (const prova of dados) {
        await db.runAsync(
            `INSERT INTO prova_sync_saed (
                id_avaliacao_saed_mob,
                qr_code,
                arq_prova,
                data_sync,
                sincronizado
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                Number(prova.id_avaliacao_saed_mob),
                prova.qr_code,
                prova.arq_prova,
                new Date().toISOString(),
                0,
            ]
        );
    }
}

// Retorna todas as provas ainda não sincronizadas
export async function obterPendentes(): Promise<prova_sync_saed[]> {
    return await db.getAllAsync<prova_sync_saed>(
        `SELECT 
            * 
        FROM prova_sync_saed 
        WHERE sincronizado = 0 ORDER BY data_sync ASC`
    );
}

// Marca uma prova como sincronizada e apaga a imagem local
export async function marcarSincronizado(id_prova_sync: number, caminhoImagem: string): Promise<void> {
    await db.runAsync(
        `UPDATE prova_sync_saed 
            SET sincronizado = 1 
        WHERE id_prova_sync = ?`,
        [id_prova_sync]
    );
    await apagarImagem(caminhoImagem);
}

// Retorna contagem de pendentes (para o badge)
export async function contarPendentes(): Promise<number> {
    const result = await db.getFirstAsync<{ total: number }>(
        `SELECT 
            COUNT(*) as total 
        FROM prova_sync_saed 
        WHERE sincronizado = 0`
    );
    return result?.total ?? 0;
}

// Obtém prova por id_prova
export async function obterGabarito(id_prova_sync: number): Promise<prova_sync_saed[]> {
    return await db.getAllAsync<prova_sync_saed>(
        `SELECT 
            * 
        FROM prova_sync_saed 
        WHERE id_prova_sync = ?`,
        [Number(id_prova_sync)]
    );
}