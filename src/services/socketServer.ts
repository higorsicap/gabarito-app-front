import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';
import HTTPServer from 'react-native-http-bridge-refurbished';
// 💡 Opcional: Para precisão máxima no Android Hotspot, instale `react-native-network-info`:
// npm install react-native-network-info
import { NetworkInfo } from 'react-native-network-info';

let serverStarted = false;

// 🔥 Armazenamento temporário
let respostas: any[] = [];

// 🔐 Controle de duplicidade
const idsRecebidos = new Set<string>();

// 🔄 listeners (UI)
let listeners: Function[] = [];

// 📡 clientes conectados
let clientesConectados = 0;

// 📱 dispositivos conectados
let dispositivos: any[] = [];

// 🔍 Função para obter o IP real da interface Wi-Fi / Hotspot / Gateway
async function getRealIpAddress(): Promise<string> {
    try {
        // 1. Tenta obter IPv4 ou Gateway diretamente (ideal para modo Roteador/Hotspot no Android)
        if (NetworkInfo) {
            const ipv4 = await NetworkInfo.getIPV4Address();
            if (ipv4 && ipv4 !== '0.0.0.0' && ipv4 !== '127.0.0.1') {
                return ipv4;
            }

            const gatewayIp = await NetworkInfo.getGatewayIPAddress();
            if (gatewayIp && gatewayIp !== '0.0.0.0' && gatewayIp !== '127.0.0.1') {
                return gatewayIp;
            }
        }
    } catch (e) {
        // Ignora caso a lib react-native-network-info não esteja instalada
    }

    try {
        // 2. Tenta via NetInfo da comunidade
        const netState = await NetInfo.fetch();
        if (netState.details) {
            const details = netState.details as { ipAddress?: string };
            const ip = details.ipAddress;

            if (
                typeof ip === 'string' &&
                ip &&
                ip !== '0.0.0.0' &&
                ip !== '127.0.0.1'
            ) {
                return ip;
            }
        }

        // 3. Tenta via DeviceInfo
        const deviceIp = await DeviceInfo.getIpAddress();
        if (
            typeof deviceIp === 'string' &&
            deviceIp &&
            deviceIp !== '0.0.0.0' &&
            deviceIp !== '127.0.0.1'
        ) {
            return deviceIp;
        }

        // 4. Fallback: Se for Gateway dinâmico do Android ou Roteador padrão
        return '10.19.165.166'; 
    } catch (e) {
        console.log('⚠️ Erro ao capturar IP local:', e);
        return '10.19.165.166';
    }
}

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

// 🔥 PROCESSADOR CENTRAL
function processarPayload(mensagem: any) {
    // 🔹 envio de respostas
    if (mensagem.type === 'push') {
        const novas = mensagem.data || [];
        let inseridos = 0;

        // 🔥 DADOS DO DISPOSITIVO
        const device = mensagem.device || {};

        // 🔥 REGISTRA DISPOSITIVO
        if (device.id) {
            const existe = dispositivos.find(d => d.id === device.id);

            if (!existe) {
                dispositivos.push({
                    id: device.id,
                    nome: device.nome,
                    modelo: device.modelo,
                    marca: device.marca,
                    versao: device.versao,
                    ip: mensagem.ip || null,
                    conectado_em: new Date().toISOString()
                });

                console.log('📱 Novo dispositivo:', device.nome);
            }
        }

        novas.forEach((item: any) => {
            const uniqueId = `${device.id}-${item.id}`;

            if (!idsRecebidos.has(uniqueId)) {
                idsRecebidos.add(uniqueId);

                respostas.push({
                    ...item,
                    // 🔥 salva origem
                    device_id: device.id,
                    device_nome: device.nome,
                    device_modelo: device.modelo
                });

                inseridos++;
            }
        });

        console.log(`✅ Recebidos ${inseridos} novos registros`);
        console.log(`📊 Total acumulado: ${respostas.length}`);

        notify();

        return {
            status: 'ok',
            recebidos: inseridos
        };
    }

    return {
        status: 'erro',
        mensagem: 'tipo inválido'
    };
}

// 🚀 START SERVER
export async function startServer() {
    if (serverStarted) {
        console.log('⚠️ Servidor HTTP já iniciado');
        return;
    }

    // 🌐 Obtém o IP dinâmico/real da interface
    const ip = await getRealIpAddress();

    HTTPServer.start(
        8080,
        'ServidorGabarito',
        async (request: any) => {
            try {
                console.log(`🌐 ${request.type} ${request.url}`);

                // =====================================
                // 🛠️ TRATAMENTO DE REQUISIÇÕES OPTIONS (CORS Preflight)
                // =====================================
                if (request.type === 'OPTIONS') {
                    HTTPServer.respond(
                        request.requestId,
                        200,
                        'text/plain',
                        'OK'
                    );
                    return;
                }

                // =====================================
                // 🔥 POST /sync
                // =====================================
                if (
                    request.type === 'POST' &&
                    request.url === '/sync'
                ) {
                    clientesConectados++;

                    const body = request.postData
                        ? JSON.parse(request.postData)
                        : {};

                    console.log('📥 Payload recebido:', body);

                    const resposta = processarPayload(body);

                    HTTPServer.respond(
                        request.requestId,
                        200,
                        'application/json',
                        JSON.stringify(resposta)
                    );

                    return;
                }

                // =====================================
                // 🔥 GET /respostas
                // =====================================
                if (
                    request.type === 'GET' &&
                    request.url === '/respostas'
                ) {
                    HTTPServer.respond(
                        request.requestId,
                        200,
                        'application/json',
                        JSON.stringify(respostas)
                    );

                    return;
                }

                // =====================================
                // 🔥 GET /dispositivos
                // =====================================
                if (
                    request.type === 'GET' &&
                    request.url === '/dispositivos'
                ) {
                    HTTPServer.respond(
                        request.requestId,
                        200,
                        'application/json',
                        JSON.stringify(dispositivos)
                    );

                    return;
                }

                // =====================================
                // 🔥 GET /datahora
                // =====================================
                if (request.type === 'GET' && request.url === '/datahora') {
                    const agora = new Date().toLocaleTimeString('pt-BR');

                    HTTPServer.respond(
                        request.requestId,
                        200,
                        'application/json',
                        JSON.stringify({
                            horaRecebimento: agora,
                            timestamp: Date.now()
                        })
                    );
                    return;
                }

                // =====================================
                // 🔥 GET /status
                // =====================================
                if (
                    request.type === 'GET' &&
                    request.url === '/status'
                ) {
                    const serverInfo = {
                        id: await DeviceInfo.getUniqueId(),
                        nome: await DeviceInfo.getDeviceName(),
                        modelo: DeviceInfo.getModel(),
                        marca: DeviceInfo.getBrand(),
                        sistema: DeviceInfo.getSystemName(),
                        versao: DeviceInfo.getSystemVersion()
                    };

                    HTTPServer.respond(
                        request.requestId,
                        200,
                        'application/json',
                        JSON.stringify({
                            status: 'online',
                            respostas: respostas.length,
                            clientes: clientesConectados,
                            servidor: serverInfo
                        })
                    );

                    return;
                }

                // =====================================
                // 🔥 404
                // =====================================
                HTTPServer.respond(
                    request.requestId,
                    404,
                    'application/json',
                    JSON.stringify({
                        status: 'erro',
                        mensagem: 'rota não encontrada'
                    })
                );

            } catch (error: any) {
                console.log('❌ Erro HTTP:', error);

                HTTPServer.respond(
                    request.requestId,
                    500,
                    'application/json',
                    JSON.stringify({
                        status: 'erro',
                        mensagem: error?.message || 'erro interno'
                    })
                );
            }
        }
    );

    serverStarted = true;

    console.log('🔥 Servidor HTTP rodando');
    console.log(`🌐 Endereço do Servidor: http://${ip}:8080`);
    console.log('📡 Aguardando tablets...');
}

// 🛑 STOP SERVER
export function stopServer() {
    if (serverStarted) {
        HTTPServer.stop();
        serverStarted = false;
        clientesConectados = 0;
        dispositivos = [];

        console.log('🛑 Servidor HTTP parado');
    }
}

// 📊 GET DADOS
export function getRespostas() {
    return respostas;
}

// 📱 GET DISPOSITIVOS
export function getDispositivos() {
    return dispositivos;
}

// 🧹 RESET
export function resetRespostas() {
    respostas = [];
    idsRecebidos.clear();
    notify();
}

// 📡 quantidade de tablets conectados
export function getClientesConectados() {
    return clientesConectados;
}