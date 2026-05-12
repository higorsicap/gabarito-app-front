import axios from 'axios';
import DeviceInfo from 'react-native-device-info';
import { NetworkInfo } from 'react-native-network-info';

const PORT = 8080;
const TIMEOUT = 8000;

// 🔥 pega HOST automaticamente (gateway/hotspot)
async function getHost(): Promise<string> {

    for (let i = 0; i < 3; i++) {

        const gateway =
            await NetworkInfo.getGatewayIPAddress();

        if (gateway) {

            console.log(
                '🌐 gateway OK:',
                gateway
            );

            return gateway.trim();

        }

        await new Promise(
            r => setTimeout(r, 500)
        );

    }

    throw new Error(
        'Gateway não encontrado após retry'
    );

}

// 🔥 ENVIO DE RESPOSTAS VIA HTTP
export async function enviarRespostas(
    data: any[]
) {

    try {

        const HOST = await getHost();

        console.log(
            '🌐 HOST automático:',
            HOST
        );

        // 🔥 IDENTIFICAÇÃO ÚNICA
        const uniqueId =
            await DeviceInfo.getUniqueId();

        const brand =
            DeviceInfo.getBrand();

        const model =
            DeviceInfo.getModel();

        const deviceName =
            await DeviceInfo.getDeviceName();

        // 🔥 PAYLOAD
        const payload = {

            type: 'push',

            device: {
                uniqueId,
                brand,
                model,
                deviceName
            },

            data: data.map((item) => ({

                ...item,

                device_id: uniqueId,

                device_name: deviceName,

                device_model: model

            }))

        };

        console.log(
            '📤 Enviando payload:',
            payload
        );

        // 🔥 REQUEST HTTP
        const response = await axios.post(
            `http://${HOST}:${PORT}/sync`,
            payload,
            {
                timeout: TIMEOUT,
                headers: {
                    'Content-Type':
                        'application/json'
                }
            }
        );

        console.log(
            '✅ Resposta servidor:',
            response.data
        );

        return response.data;

    } catch (error: any) {

        console.log(
            '❌ erro sincronização:',
            error?.message
        );

        if (error?.response) {

            console.log(
                '❌ response:',
                error.response.data
            );

        }

        throw new Error(
            error?.message ||
            'Falha ao sincronizar'
        );

    }

}