import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import {
    BackHandler,
    Platform,
    StyleSheet,
    TouchableOpacity
} from 'react-native';

export default function BtnVoltar() {
    const lastPress = useRef(0);

    const handleBack = () => {
        if (Platform.OS !== 'android') return;

        const now = Date.now();

        if (now - lastPress.current < 2000) {
            BackHandler.exitApp();
            return;
        }

        lastPress.current = now;
    };

    return (
        <TouchableOpacity style={styles.btn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: {
        position: 'absolute',

        top: 25,     // 🔥 ajusta conforme header do menu
        right: 20,   // 🔥 AGORA sim fica na direita

        zIndex: 50,

        backgroundColor: '#4dabf7',
        padding: 10,
        borderRadius: 8,
    },
});