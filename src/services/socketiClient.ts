import { NetworkInfo } from 'react-native-network-info';
import TcpSocket from 'react-native-tcp-socket';

const PORT = 3000;
const TIMEOUT = 8000;

// 🔥 pega HOST automaticamente (gateway do hotspot)
async function getHost(): Promise<string> {

    for (let i = 0; i < 3; i++) {
        const gateway = await NetworkInfo.getGatewayIPAddress();

        if (gateway) {
            console.log('🌐 gateway OK:', gateway);
            return gateway.trim();
        }

        await new Promise(r => setTimeout(r, 500));
    }

    throw new Error('Gateway não encontrado após retry');
}

// 🔥 ENVIO DE RESPOSTAS
export async function enviarRespostas(data: any[]) {

    const HOST = await getHost();

    console.log('🌐 HOST automático:', HOST);

    return new Promise((resolve, reject) => {

        let finalizado = false;
        let client: any = null;

        const finalizar = (fn: Function, value?: any) => {
            if (finalizado) return;

            finalizado = true;

            try {
                client?.destroy();
            } catch {}

            fn(value);
        };

        // ⏱ timeout seguro
        const timer = setTimeout(() => {
            console.log('⏱ timeout');
            finalizar(reject, new Error('Timeout ao conectar ao pai'));
        }, TIMEOUT);

        client = TcpSocket.createConnection(
            { port: PORT, host: HOST },
            () => {

                console.log('📡 Conectado ao pai');

                const payload = {
                    type: 'push',
                    data
                };

                try {
                    client.write(JSON.stringify(payload));
                } catch (e) {
                    console.log('❌ erro ao enviar payload', e);
                    finalizar(reject, e);
                }
            }
        );

        // 📥 resposta do servidor
        client.on('data', (res: Buffer) => {
            try {
                const json = JSON.parse(res.toString());

                console.log('✅ ACK recebido:', json);

                clearTimeout(timer);
                finalizar(resolve, json);

            } catch (e) {
                console.log('❌ erro parse resposta', e);
            }
        });

        client.on('error', (err: any) => {
            console.log('❌ erro conexão:', err);

            clearTimeout(timer);
            finalizar(reject, new Error('Erro de conexão com o sincronizador'));
        });

        client.on('close', () => {
            console.log('🔌 conexão fechada');
        });

    });
}