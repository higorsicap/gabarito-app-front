import TcpSocket from 'react-native-tcp-socket';

let server: any = null;

// 🔥 Armazenamento temporário
let respostas: any[] = [];

// 🔐 Controle de duplicidade
const idsRecebidos = new Set<string>();

// 🔄 listeners (UI)
let listeners: Function[] = [];

// 📡 clientes conectados
let clientes: any[] = [];

// 🔔 notificar tela
function notify() {
    listeners.forEach(fn => fn(respostas));
}

// 📥 subscribe
export function subscribe(fn: Function) {
    listeners.push(fn);

    return () => {
        listeners = listeners.filter(f => f !== fn);
    };
}

// 🚀 START SERVER
export function startServer() {
    if (server) {
        console.log('⚠️ Servidor já iniciado');
        return;
    }

    server = TcpSocket.createServer((socket) => {

        console.log('📡 Tablet conectado:', socket.address());
        clientes.push(socket);

        let buffer = '';

        socket.on('data', (data) => {
            try {
                buffer += data.toString();

                // 🔥 tenta processar enquanto tiver JSON válido
                while (buffer.length > 0) {

                    try {
                        const mensagem = JSON.parse(buffer);
                        buffer = '';

                        // 🔹 envio de respostas
                        if (mensagem.type === 'push') {

                            const novas = mensagem.data || [];
                            let inseridos = 0;

                            novas.forEach((item: any) => {

                                const uniqueId = `${item.device_id}-${item.id}`;

                                if (!idsRecebidos.has(uniqueId)) {
                                    idsRecebidos.add(uniqueId);
                                    respostas.push(item);
                                    inseridos++;
                                }

                            });

                            console.log(`✅ Recebidos ${inseridos} novos registros`);
                            console.log(`📊 Total acumulado: ${respostas.length}`);

                            notify();

                            socket.write(JSON.stringify({
                                status: 'ok',
                                recebidos: inseridos
                            }));
                        }

                        else {
                            socket.write(JSON.stringify({
                                status: 'erro',
                                mensagem: 'tipo inválido'
                            }));
                        }

                    } catch (e) {
                        // JSON incompleto → espera mais dados
                        break;
                    }
                }

            } catch (error) {
                console.log('❌ Erro geral:', error);

                buffer = '';

                socket.write(JSON.stringify({
                    status: 'erro',
                    mensagem: 'falha no processamento'
                }));
            }
        });

        socket.on('error', (error) => {
            console.log('❌ Erro no socket:', error);
        });

        socket.on('close', () => {
            console.log('🔌 Conexão encerrada');

            clientes = clientes.filter(c => c !== socket);

            console.log(`📡 Conectados: ${clientes.length}`);
        });

    });

    server.listen({ port: 3000, host: '0.0.0.0' }, () => {
        console.log('🔥 Servidor TCP rodando');
        console.log('🌐 Aguardando tablets...');
    });
}

// 🛑 STOP SERVER
export function stopServer() {
    if (server) {
        server.close();
        server = null;
        clientes = [];
        console.log('🛑 Servidor parado');
    }
}

// 📊 GET DADOS
export function getRespostas() {
    return respostas;
}

// 🧹 RESET
export function resetRespostas() {
    respostas = [];
    idsRecebidos.clear();
    notify();
}

// 📡 quantidade de tablets conectados
export function getClientesConectados() {
    return clientes.length;
}