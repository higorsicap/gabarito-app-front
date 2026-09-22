const BASE_URL =
  "https://sicapteste.com.br/higor/backTeste/frontController.php";

// 🔥 helper padrão
function toFormBody(data: Record<string, any>) {
  return Object.keys(data)
    .map((key) => {
      const val = data[key];
      // Se for null ou undefined, envia string vazia "" para manter a chave no POST
      const formattedVal = val === null || val === undefined ? "" : val;
      return encodeURIComponent(key) + "=" + encodeURIComponent(formattedVal);
    })
    .join("&");
}

// 🔥 helper de request (centraliza tudo)
async function postForm(data: Record<string, any>) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toFormBody(data),
  });

  const text = await response.text();

  // 🔥 DEBUG (importantíssimo no seu cenário)
  if (!response.ok) {
    console.log("Erro HTTP:", text);
    throw new Error("Erro na requisição");
  }

  // 🔥 evita crash de JSON (se tiver var_dump, echo, etc)
  try {
    return JSON.parse(text);
  } catch {
    console.log("⚠️ Resposta não é JSON:", text);
    return [];
  }
}

export async function listarAnoletivo() {
  return postForm({
    s: 1,
  });
}

export async function listarClientes() {
  return postForm({
    s: 2,
  });
}

export async function listarProvas(params?: { id_aplicador?: number }) {
  return postForm({
    s: 3,
    id_aplicador: params?.id_aplicador ?? -1, // 🔥 IMPORTANTE
  });
}

export async function baixarProva(params: {
  id_avaliacao: number;
  id_anoletivo: number;
  id_serie: number;
  id_escola: number;
  descricao_turma: string;
  id_caderno_prova_disciplina: number;
}) {
  return postForm({
    s: 5,
    id_avaliacao: params.id_avaliacao,
    id_anoletivo: params.id_anoletivo,
    id_serie: params.id_serie,
    id_escola: params.id_escola,
    descricao_turma: params.descricao_turma,
    id_caderno_prova_disciplina: params.id_caderno_prova_disciplina,
  });
}

export async function listarEscolas(params?: { id_avaliacao_saed?: number }) {
  return postForm({
    s: 6,
    id_avaliacao_saed: params?.id_avaliacao_saed ?? -1,
  });
}

export async function provasDisponiveis() {
  return postForm({
    s: 7,
  });
}

export async function listaAlunos(params?: { id_avaliacao_saed?: number }) {
  return postForm({
    s: 8,
    id_avaliacao_saed: params?.id_avaliacao_saed ?? -1,
  });
}

export async function listaTurmas(params?: { id_avaliacao_saed?: number }) {
  return postForm({
    s: 9,
    id_avaliacao_saed: params?.id_avaliacao_saed ?? -1,
  });
}

export interface InserirRespostaParams {
  id_avaliacao_saed?: number;
  id_anoletivo?: number;
  id_cliente?: number;
  id_serie?: number;
  id_estudante_origem?: number;
  id_disciplina?: number;
  id_questao?: number;
  id_marcada?: number;
  id_correta?: number;
  data_sincronizacao?: string;
}

export async function inserirRespostasAunos(params?: InserirRespostaParams) {
  return postForm({
    s: 10,
    id_avaliacao_saed: params?.id_avaliacao_saed ?? "",
    id_anoletivo: params?.id_anoletivo ?? "",
    id_cliente: params?.id_cliente ?? "",
    id_serie: params?.id_serie ?? "",
    id_estudante_origem: params?.id_estudante_origem ?? "",
    id_disciplina: params?.id_disciplina ?? "",
    id_questao: params?.id_questao ?? "",
    id_marcada: params?.id_marcada ?? "",
    id_correta: params?.id_correta ?? "",
    data_sincronizacao: params?.data_sincronizacao ?? new Date().toISOString(),
  });
}
