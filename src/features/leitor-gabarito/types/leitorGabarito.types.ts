export type Etapa =
  | "inicio"
  | "qrcode"
  | "preview"
  | "enviando"
  | "sucesso"
  | "sincronizando";

// ─── QR Code ───────────────────────────────────────────

export interface DadosQR {
  raw: string;

  // Campos originais do QR Code
  id_avaliacao_saed?: number;
  id_turma?: number;
  id_serie?: number;
  id_estudante_origem?: number;
  nome_estudante?: string;

  // Campos auxiliares da interface
  id?: string;
  titulo?: string;
  descricao?: string;
}

// ─── Fila de provas ────────────────────────────────────

export interface ProvaFila {
  id: number;
  dadosQR: DadosQR;
  imagemUri: string;
}

// ─── Questões retornadas pela IA ───────────────────────

export interface Questao {
  questao: string;
  resposta: string | null;
}

// ─── Gabaritos retornados pela IA ──────────────────────

export interface Gabarito {
  identificador: string;
  disciplina: string;
  questoes: Questao[];
}

// ─── Identificação do estudante no retorno da API ─────

export interface QRCodeResposta {
  id_avaliacao_saed: number;
  id_turma: number;
  id_serie: number;
  id_estudante_origem: number;
  nome_estudante: string;
}

// ─── Cartão de respostas ───────────────────────────────

export interface CartaoRespostas {
  qrcode?: QRCodeResposta;
  nome_estudante?: string;
  turma?: string;
  gabaritos: Gabarito[];
}

// ─── Retorno da API ────────────────────────────────────

export interface RespostaAPI {
  sucesso: boolean;

  dados?: {
    cartao_respostas: CartaoRespostas;
  };

  mensagem?: string;
}

// ─── Resultado processado ──────────────────────────────

export interface ResultadoProcessado {
  id: number;
  dadosQR: DadosQR;
  retorno: RespostaAPI;
}

// ─── Progresso do processamento ────────────────────────

export interface ProgressoProcessamento {
  atual: number;
  total: number;
  itemAtual: string;
  imagemAtual: string;
}
