const BASE_URL = 'https://sicapteste.com.br/higor/backTeste/frontController.php';

// 🔥 helper padrão (igual você já usa no outro service)
function toFormBody(data: Record<string, any>) {
    return Object.keys(data)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&');
}

export async function login(cpf: string, senha: string) {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: toFormBody({
                s: 4,
                cpf_aplicador: cpf,
                senha_aplicador: senha
            }),
        });

        const text = await response.text();

        // 🔥 DEBUG (MUITO IMPORTANTE)
        console.log('Resposta bruta login:', text);

        if (!response.ok) {
            throw new Error('Erro na requisição');
        }

        // 🔥 evita crash se vier lixo do PHP
        try {
            const json = JSON.parse(text);

            // 🔥 valida estrutura esperada
            if (typeof json !== 'object' || json === null) {
                return null;
            }

            return json;

        } catch {
            console.log('⚠️ Resposta não é JSON válida:', text);
            return null;
        }

    } catch (error: any) {
        console.log('Erro no login:', error.message);
        throw error;
    }
}