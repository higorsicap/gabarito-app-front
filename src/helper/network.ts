import { NetworkInfo } from 'react-native-network-info';

export async function getHostAutomatico() {
    const gateway = await NetworkInfo.getGatewayIPAddress();
    return gateway;
}