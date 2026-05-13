import axios from 'axios';

import DeviceInfo from 'react-native-device-info';

import {
    NetworkInfo
} from 'react-native-network-info';

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

// 🔥 pega identificação do dispositivo
async function getDeviceInfo() {

    // 🔥 ANDROID_ID
    let androidId = '';

    try {

        androidId =
            await DeviceInfo.getAndroidId();

    } catch (e) {

        console.log(
            '❌ erro androidId',
            e
        );

    }

    // 🔥 UNIQUE ID
    let uniqueId = '';

    try {

        uniqueId =
            await DeviceInfo.getUniqueId();

    } catch (e) {

        console.log(
            '❌ erro uniqueId',
            e
        );

    }

    // 🔥 MAC ADDRESS
    let macAddress = '';

    try {

        macAddress =
            await DeviceInfo.getMacAddress();

    } catch (e) {

        console.log(
            '❌ erro macAddress',
            e
        );

    }

    // 🔥 SERIAL / IMEI (Android moderno geralmente bloqueia)
    let serialNumber = '';

    try {

        serialNumber =
            await DeviceInfo.getSerialNumber();

    } catch (e) {

        console.log(
            '❌ erro serialNumber',
            e
        );

    }

    const brand =
        DeviceInfo.getBrand();

    const model =
        DeviceInfo.getModel();

    const systemName =
        DeviceInfo.getSystemName();

    const systemVersion =
        DeviceInfo.getSystemVersion();

    const deviceName =
        await DeviceInfo.getDeviceName();

    return {

        androidId,
        uniqueId,
        macAddress,
        serialNumber,

        brand,
        model,

        systemName,
        systemVersion,

        deviceName

    };

}

// 🔥 ENVIO DE RESPOSTAS VIA HTTP
export async function enviarRespostas(
    data: any[]
) {

    try {

        const HOST =
            await getHost();

        console.log(
            '🌐 HOST automático:',
            HOST
        );

        // 🔥 DADOS DO DEVICE
        const device =
            await getDeviceInfo();

        console.log(
            '📱 DEVICE:',
            device
        );

        // 🔥 ID PRINCIPAL
        // prioridade:
        // MAC -> SERIAL -> ANDROID_ID -> UNIQUE_ID

        const deviceId =
            device.macAddress ||
            device.serialNumber ||
            device.androidId ||
            device.uniqueId;

        // 🔥 PAYLOAD
        const payload = {

            type: 'push',

            device: {

                device_id:
                    deviceId,

                android_id:
                    device.androidId,

                unique_id:
                    device.uniqueId,

                mac_address:
                    device.macAddress,

                serial_number:
                    device.serialNumber,

                brand:
                    device.brand,

                model:
                    device.model,

                device_name:
                    device.deviceName,

                system_name:
                    device.systemName,

                system_version:
                    device.systemVersion

            },

            data: data.map(
                (item) => ({

                    ...item,

                    device_id:
                        deviceId,

                    android_id:
                        device.androidId,

                    unique_id:
                        device.uniqueId,

                    mac_address:
                        device.macAddress,

                    serial_number:
                        device.serialNumber,

                    device_name:
                        device.deviceName,

                    device_model:
                        device.model

                })
            )

        };

        console.log(
            '📤 Enviando payload:',
            JSON.stringify(
                payload,
                null,
                2
            )
        );

        // 🔥 REQUEST HTTP
        const response =
            await axios.post(
                `http://${HOST}:${PORT}/sync`,
                payload,
                {
                    timeout:
                        TIMEOUT,

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