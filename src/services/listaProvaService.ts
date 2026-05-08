const BASE_URL = 'https://sicapteste.com.br/higor/backTeste/frontController.php';

// 🔥 helper padrão
function toFormBody(data: Record<string, any>) {
    return Object.keys(data)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&');
}

// 🔥 helper de request (centraliza tudo)
async function postForm(data: Record<string, any>) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: toFormBody(data),
    });

    const text = await response.text();

    // 🔥 DEBUG (importantíssimo no seu cenário)
    if (!response.ok) {
        console.log('Erro HTTP:', text);
        throw new Error('Erro na requisição');
    }

    // 🔥 evita crash de JSON (se tiver var_dump, echo, etc)
    try {
        return JSON.parse(text);
    } catch {
        console.log('⚠️ Resposta não é JSON:', text);
        return [];
    }
}

export async function listarAnoletivo() {
    return postForm({
        s: 1
    });
}

export async function listarClientes() {
    return postForm({
        s: 2
    });
}

export async function listarProvas(params?: {
    id_aplicador?: number;
}) {
    return postForm({
        s: 3,
        id_aplicador: params?.id_aplicador ?? -1 // 🔥 IMPORTANTE
    });
}

export async function baixarProva(params: {
    id_avaliacao: number;
    id_anoletivo: number;
    id_serie: number;
    id_escola: number;
}) {
    return postForm({
        s: 5,
        id_avaliacao: params.id_avaliacao,
        id_anoletivo: params.id_anoletivo,
        id_serie: params.id_serie,
        id_escola: params.id_escola
    });
}

export async function listarEscolas(params?: {
    id_anoletivo?: number;
}) {
    return postForm({
        s: 6,
        id_anoletivo: params?.id_anoletivo ?? -1 // 🔥 IMPORTANTE
    });
}