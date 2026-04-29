const BASE_URL = 'https://sicapteste.com.br/higor/backTeste/frontController.php';

export async function listarAnoletivo() {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                s: 1
            }),
        });

        if (!response.ok) {
            throw new Error('Erro ao listar clientes');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

export async function listarClientes() {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                s: 2
            }),
        });

        if (!response.ok) {
            throw new Error('Erro ao listar provas');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

export async function listarProvas() {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                s: 3
            }),
        });

        if (!response.ok) {
            throw new Error('Erro ao listar provas');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}