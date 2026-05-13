import { useAuth } from '@/src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function BottomNavProf() {
    const { logout } = useAuth();

    const [open, setOpen] = useState(false);
    const translateX = useState(new Animated.Value(-width))[0]; // 🔥 largura total

    const toggleMenu = () => {
        Animated.timing(translateX, {
            toValue: open ? -width : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        setOpen(!open);
    };

    const handleLogout = async () => {
        toggleMenu();

        setTimeout(async () => {
            await logout();
            router.replace('/');
        }, 200);
    };

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
        <>
            {/* 🔥 HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={toggleMenu}>
                    <Ionicons name="menu" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* 🔥 OVERLAY FULL */}
            {open && (
                <View style={styles.overlayContainer}>
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={toggleMenu}
                    />
                </View>
            )}

            {/* 🔥 MENU FULLSCREEN */}
            <Animated.View
                style={[
                    styles.menu,
                    { transform: [{ translateX }] }
                ]}
            >
                <TouchableOpacity
                    style={styles.item}
                    onPress={() => {
                        toggleMenu();
                        setTimeout(() => router.push('/home'), 200);
                    }}
                >
                    <Ionicons name="home" size={22} color="#333" />
                    <Text style={styles.text}>Incio</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => router.push('/scanner')
                    }
                >
                    <Ionicons name="scan" size={22} color="#333" />
                    <Text style={styles.text}>Corrigir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => router.push('/baixar')
                    }
                >
                    <Ionicons name="scan" size={22} color="#333" />
                    <Text style={styles.text}>Avaliações</Text>
                </TouchableOpacity>

                {/* 🔥 LOGOUT */}
                <TouchableOpacity
                    style={[styles.item, { marginTop: 40 }]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={24} color="red" />
                    <Text style={[styles.text, { color: 'red' }]}>
                        Sair
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.btn} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,

        height: 70,
        backgroundColor: '#4dabf7',

        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 20,

        zIndex: 30,
    },

    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10
    },

    // 🔥 MENU AGORA OCUPA TUDO
    menu: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 250,
        height: '100%',
        backgroundColor: '#fff',
        paddingTop: 100,
        paddingHorizontal: 20,
        zIndex: 20,
        elevation: 10,
    },

    item: {
        marginBottom: 25,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },

    text: {
        fontSize: 18,
        fontWeight: '500'
    },

    // 🔥 OVERLAY REAL FULLSCREEN
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: '100%',
        zIndex: 15,
    },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },

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