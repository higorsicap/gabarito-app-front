import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';
import HTTPServer from 'react-native-http-bridge-refurbished';
import { NetworkInfo } from 'react-native-network-info';

import {
    buscarProvaLiberadaParaDispositivo,
    liberarProvaNoBanco,
    salvarDispositivoOuAtualizar,
} from '@/src/database/services/provaRepository';

// =====================================
// 📦 TIPAGEM E ESTADO GLOBAL
// =====================================
export interface DispositivoConectado {
    id: string;
    nome: string;
    modelo?: string;
    marca?: string;
    versao?: string;
    ip: string;
    status: 'conectado' | 'prova_enviada' | 'erro';
    conectado_em: string;
}

let serverStarted = false;
let respostas: any[] = [];
const idsRecebidos = new Set<string>();
let listeners: Function[] = [];
let clientesConectados = 0;
let dispositivos: DispositivoConectado[] = [];

const PORT = 8080;
const SERVER_NAME = 'ServidorGabarito';

// =====================================
// 🔍 CAPTURA DE IP DA INTERFACE REDE
// =====================================
async function getRealIpAddress(): Promise<string> {
    try {
        if (NetworkInfo) {
            const ipv4 = await NetworkInfo.getIPV4Address();
            if (ipv4 && ipv4 !== '0.0.0.0' && ipv4 !== '127.0.0.1') return ipv4;

            const gatewayIp = await NetworkInfo.getGatewayIPAddress();
            if (gatewayIp && gatewayIp !== '0.0.0.0' && gatewayIp !== '127.0.0.1') return gatewayIp;
        }
    } catch (e) { }

    try {
        const netState = await NetInfo.fetch();
        if (netState.details) {
            const details = netState.details as { ipAddress?: string };
            const ip = details.ipAddress;
            if (typeof ip === 'string' && ip && ip !== '0.0.0.0' && ip !== '127.0.0.1') {
                return ip;
            }
        }

        const deviceIp = await DeviceInfo.getIpAddress();
        if (typeof deviceIp === 'string' && deviceIp && deviceIp !== '0.0.0.0' && deviceIp !== '127.0.0.1') {
            return deviceIp;
        }

        return '10.19.165.166';
    } catch (e) {
        console.log('⚠️ Erro ao capturar IP local:', e);
        return '10.19.165.166';
    }
}

// =====================================
// 🔔 EVENT LISTENERS & OBSERVERS
// =====================================
function notify() {
    listeners.forEach((fn) => fn(respostas, dispositivos));
}

export function subscribe(fn: Function) {
    listeners.push(fn);
    return () => {
        listeners = listeners.filter((f) => f !== fn);
    };
}

// Helper interno para adicionar/atualizar dispositivo na memória e no SQLite
async function registrarOuAtualizarDispositivo(novoDisp: DispositivoConectado) {
    const index = dispositivos.findIndex((d) => d.id === novoDisp.id);
    if (index >= 0) {
        dispositivos[index] = { ...dispositivos[index], ...novoDisp };
    } else {
        dispositivos.push(novoDisp);
        console.log('📱 Novo dispositivo registrado na memória:', novoDisp.nome);
    }

    // 💾 Salva/Atualiza o dispositivo no SQLite do Aplicador
    try {
        await salvarDispositivoOuAtualizar(novoDisp);
    } catch (error) {
        console.error('❌ Erro ao salvar dispositivo no SQLite:', error);
    }

    notify();
}

// =====================================
// 🔥 PROCESSADOR CENTRAL DE RESPOSTAS
// =====================================
async function processarPayload(mensagem: any) {
    if (mensagem.type === 'push') {
        const novas = mensagem.data || [];
        let inseridos = 0;
        const device = mensagem.device || {};

        if (device.id) {
            await registrarOuAtualizarDispositivo({
                id: device.id,
                nome: device.nome || 'Dispositivo',
                modelo: device.modelo,
                marca: device.marca,
                versao: device.versao,
                ip: mensagem.ip || '',
                status: 'conectado',
                conectado_em: new Date().toISOString(),
            });
        }

        novas.forEach((item: any) => {
            const uniqueId = `${device.id}-${item.id}`;
            if (!idsRecebidos.has(uniqueId)) {
                idsRecebidos.add(uniqueId);
                respostas.push({
                    ...item,
                    device_id: device.id,
                    device_nome: device.nome,
                    device_modelo: device.modelo,
                });
                inseridos++;
            }
        });

        console.log(`✅ Recebidos ${inseridos} novos registros (Total: ${respostas.length})`);
        notify();

        return { status: 'ok', recebidos: inseridos };
    }

    return { status: 'erro', mensagem: 'tipo inválido' };
}

// =====================================
// 🚀 START SERVER
// =====================================
export async function startServer() {
    if (serverStarted) {
        console.log('⚠️ Servidor HTTP já iniciado');
        return;
    }

    const ip = await getRealIpAddress();

    HTTPServer.start(
        PORT,
        SERVER_NAME,
        async (request: any) => {
            try {
                console.log(`🌐 ${request.type} ${request.url}`);

                // 🛠️ CORS Preflight
                if (request.type === 'OPTIONS') {
                    HTTPServer.respond(request.requestId, 200, 'text/plain', 'OK');
                    return;
                }

                // =====================================
                // 📡 POST /conectar (Descoberta/Handshake Inicial)
                // =====================================
                if (request.type === 'POST' && request.url === '/conectar') {
                    const body = request.postData ? JSON.parse(request.postData) : {};
                    const { id, nome, modelo, marca, versao, ip: clienteIp } = body;

                    if (id) {
                        await registrarOuAtualizarDispositivo({
                            id,
                            nome: nome || 'Tablet Aluno',
                            modelo,
                            marca,
                            versao,
                            ip: clienteIp || request.ip || '',
                            status: 'conectado',
                            conectado_em: new Date().toISOString(),
                        });

                        HTTPServer.respond(
                            request.requestId,
                            200,
                            'application/json',
                            JSON.stringify({ status: 'ok', mensagem: 'Dispositivo registrado com sucesso' })
                        );
                        return;
                    }

                    HTTPServer.respond(
                        request.requestId,
                        400,
                        'application/json',
                        JSON.stringify({ status: 'erro', mensagem: 'ID do dispositivo obrigatório' })
                    );
                    return;
                }

                // =====================================
                // 🔥 POST /sync (Envio de respostas)
                // =====================================
                if (request.type === 'POST' && request.url === '/sync') {
                    clientesConectados++;
                    const body = request.postData ? JSON.parse(request.postData) : {};
                    const resposta = await processarPayload(body);

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
                if (request.type === 'GET' && request.url === '/respostas') {
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
                if (request.type === 'GET' && request.url === '/dispositivos') {
                    HTTPServer.respond(
                        request.requestId,
                        200,
                        'application/json',
                        JSON.stringify(dispositivos)
                    );
                    return;
                }

                // =====================================
                // 🔥 GET /datahora (Teste de Ping)
                // =====================================
                if (request.type === 'GET' && request.url === '/datahora') {
                    HTTPServer.respond(
                        request.requestId,
                        200,
                        'application/json',
                        JSON.stringify({
                            horaRecebimento: new Date().toLocaleTimeString('pt-BR'),
                            timestamp: Date.now(),
                        })
                    );
                    return;
                }

                // =====================================
                // 🔥 GET /prova-liberada/:id OU POST /prova-liberada
                // =====================================
                if (request.url.includes('/prova-liberada') || request.url.includes('/recebeprova')) {
                    try {
                        let dispositivoId: string | null = null;

                        // 1. EXTRAI SE VIER NO CAMINHO DA URL (ex: /prova-liberada/d73d3197c91ad660)
                        const urlParts = request.url.split('/');
                        if (urlParts.length > 2 && urlParts[2]) {
                            dispositivoId = urlParts[2].trim();
                        }

                        // 2. EXTRAI SE VIER VIA POST (body / postData)
                        if (!dispositivoId && request.postData) {
                            try {
                                const body = typeof request.postData === 'string'
                                    ? JSON.parse(request.postData)
                                    : request.postData;

                                dispositivoId = body.dispositivoId || body.idTablet || body.id || body.dispositivo;
                            } catch (e) {
                                // Se o postData for uma string simples com o ID
                                dispositivoId = String(request.postData).trim();
                            }
                        }

                        console.log(`🔎 Busca de prova solicitada para o dispositivo: "${dispositivoId || 'Desconhecido'}"`);

                        if (!dispositivoId || dispositivoId === 'undefined' || dispositivoId === 'null') {
                            console.log('⚠️ ID do dispositivo não foi encontrado na URL nem no Body');
                            HTTPServer.respond(
                                request.requestId,
                                400,
                                'application/json',
                                JSON.stringify({ liberada: false, erro: 'dispositivoId é obrigatório' })
                            );
                            return;
                        }

                        // 3. CONSULTA NO BANCO DE DADOS SE A PROVA FOI LIBERADA
                        const provaLiberada = await buscarProvaLiberadaParaDispositivo(dispositivoId);

                        if (provaLiberada) {
                            console.log(`🟢 Prova liberada encontrada! Retornando para o tablet: ${dispositivoId}`);

                            const respostaPayload = {
                                liberada: true,
                                ...(typeof provaLiberada === 'object' ? provaLiberada : {}),
                                prova: provaLiberada,
                            };

                            HTTPServer.respond(
                                request.requestId,
                                200,
                                'application/json',
                                JSON.stringify(respostaPayload)
                            );
                            return;
                        }

                        // 4. SE AINDA NÃO FOI LIBERADA
                        HTTPServer.respond(
                            request.requestId,
                            200,
                            'application/json',
                            JSON.stringify({
                                liberada: false,
                                mensagem: 'Prova ainda não liberada pelo aplicador',
                            })
                        );
                        return;

                    } catch (error: any) {
                        console.error('❌ Erro na rota /prova-liberada:', error);
                        HTTPServer.respond(
                            request.requestId,
                            500,
                            'application/json',
                            JSON.stringify({
                                liberada: false,
                                erro: 'Erro interno ao consultar liberação da prova',
                            })
                        );
                        return;
                    }
                }
                // =====================================
                // 🔥 GET /status
                // =====================================
                if (request.type === 'GET' && request.url === '/status') {
                    const serverInfo = {
                        id: await DeviceInfo.getUniqueId(),
                        nome: await DeviceInfo.getDeviceName(),
                        modelo: DeviceInfo.getModel(),
                        marca: DeviceInfo.getBrand(),
                        sistema: DeviceInfo.getSystemName(),
                        versao: DeviceInfo.getSystemVersion(),
                    };

                    HTTPServer.respond(
                        request.requestId,
                        200,
                        'application/json',
                        JSON.stringify({
                            status: 'online',
                            respostas: respostas.length,
                            clientes: clientesConectados,
                            servidor: serverInfo,
                        })
                    );
                    return;
                }

                // =====================================
                // 🔥 404 NOT FOUND
                // =====================================
                HTTPServer.respond(
                    request.requestId,
                    404,
                    'application/json',
                    JSON.stringify({ status: 'erro', mensagem: 'rota não encontrada' })
                );
            } catch (error: any) {
                console.log('❌ Erro HTTP:', error);
                HTTPServer.respond(
                    request.requestId,
                    500,
                    'application/json',
                    JSON.stringify({ status: 'erro', mensagem: error?.message || 'erro interno' })
                );
            }
        }
    );

    serverStarted = true;
    console.log(`🔥 Servidor HTTP rodando em http://${ip}:${PORT}`);
}

// =====================================
// 🔓 LIBERAR PROVA PARA O TABLET (Executado no clique do Aplicador)
// =====================================
export async function liberarProvaParaDispositivo(
    dispositivoId: string,
    idAvaliacaoSaedMob: number | string,
    alunoInfo?: { nome: string; id?: string | number }
) {
    const target = dispositivos.find((d) => d.id === dispositivoId);

    try {
        // Grava no SQLite que a prova está liberada para este tablet especificamente
        await liberarProvaNoBanco(dispositivoId, idAvaliacaoSaedMob, alunoInfo);

        if (target) {
            target.status = 'prova_enviada';
            notify();
        }

        console.log(`🔓 Prova liberada com sucesso no banco para o tablet ${dispositivoId}`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao liberar prova para ${dispositivoId}:`, error);
        if (target) {
            target.status = 'erro';
            notify();
        }
        throw error;
    }
}

// =====================================
// 🛑 STOP SERVER
// =====================================
export function stopServer() {
    if (serverStarted) {
        HTTPServer.stop();
        serverStarted = false;
        clientesConectados = 0;
        dispositivos = [];
        console.log('🛑 Servidor HTTP parado');
    }
}

// =====================================
// 📊 GETTERS E RESET
// =====================================
export function getRespostas() {
    return respostas;
}
export function getDispositivos() {
    return dispositivos;
}
export function getClientesConectados() {
    return clientesConectados;
}

export function resetRespostas() {
    respostas = [];
    idsRecebidos.clear();
    notify();
}