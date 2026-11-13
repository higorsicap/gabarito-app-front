export type Etapa =
  | "inicio"
  | "qrcode"
  | "preview"
  | "enviando"
  | "sucesso"
  | "sincronizando";

// QR Code
export interface DadosQR {
  raw: string;
  id?: string;
  titulo?: string;
  descricao?: string;
}

// Fila de provas
export interface ProvaFila {
  id: number;
  dadosQR: DadosQR;
  imagemUri: string;
}

// Questões
export interface Questao {
  questao: string;
  resposta: string;
}

// Gabaritos
export interface Gabarito {
  identificador: string;
  disciplina: string;
  questoes: Questao[];
}

// Cartão de respostas
export interface CartaoRespostas {
  estudante?: string;
  turma?: string;
  gabaritos: Gabarito[];
}

// Retorno da API
export interface RespostaAPI {
  sucesso: boolean;
  dados?: {
    cartao_respostas: CartaoRespostas;
  };
  mensagem?: string;
}

// Resultado processado
export interface ResultadoProcessado {
  id: number;
  dadosQR: DadosQR;
  retorno: RespostaAPI;
}

// Progresso do processamento
export interface ProgressoProcessamento {
  atual: number;
  total: number;
  itemAtual: string;
  imagemAtual: string;
}
