import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function BottomNav() {
    const { logout } = useAuth();

    const [open, setOpen] = useState(false);

    const translateX = useRef(
        new Animated.Value(-width)
    ).current;

    const toggleMenu = () => {
        Animated.timing(translateX, {
            toValue: open ? -width : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        setOpen(!open);
    };

    const navigateTo = (route: any) => {
        toggleMenu();

        setTimeout(() => {
            router.push(route);
        }, 250);
    };

    const handleLogout = async () => {
        toggleMenu();

        setTimeout(async () => {
            await logout();
            router.replace("/");
        }, 250);
    };

    return (
        <>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={toggleMenu}>
                    <Ionicons name="menu" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* OVERLAY */}
            {open && (
                <View style={styles.overlayContainer}>
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={toggleMenu}
                    />
                </View>
            )}

            {/* MENU */}
            <Animated.View
                style={[
                    styles.menu,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <View>
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigateTo("/home")}
                    >
                        <Ionicons name="home" size={22} color="#333" />
                        <Text style={styles.text}>Início</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigateTo("/saed")}
                    >
                        <Ionicons name="scan" size={22} color="#333" />
                        <Text style={styles.text}>Aplicação SAED</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigateTo("/baixar")}
                    >
                        <Ionicons name="business" size={22} color="#333" />
                        <Text style={styles.text}>Aplicação Interna</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigateTo("/sincronizador")}
                    >
                        <Ionicons name="business" size={22} color="#333" />
                        <Text style={styles.text}>Sincronizador</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigateTo("/aplicarProva")}
                    >
                        <Ionicons
                            name="sync-circle-outline"
                            size={22}
                            color="#333"
                        />
                        <Text style={styles.text}>
                            Sincronizar Resultados
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* LOGOUT */}
                <TouchableOpacity
                    style={styles.logoutItem}
                    onPress={handleLogout}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={24}
                        color="red"
                    />
                    <Text style={styles.logoutText}>Sair</Text>
                </TouchableOpacity>
            </Animated.View>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,

        height: 70,
        backgroundColor: "#4dabf7",

        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingTop: 20,

        zIndex: 30,
    },

    menu: {
        position: "absolute",
        top: 0,
        left: 0,

        width: 260,
        height: height,

        backgroundColor: "#fff",

        paddingTop: 100,
        paddingHorizontal: 20,

        zIndex: 20,
        elevation: 10,

        justifyContent: "space-between",
        paddingBottom: 40,
    },

    item: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 25,
    },

    text: {
        fontSize: 18,
        fontWeight: "500",
        marginLeft: 15,
        color: "#333",
    },

    logoutItem: {
        flexDirection: "row",
        alignItems: "center",
    },

    logoutText: {
        fontSize: 18,
        fontWeight: "500",
        marginLeft: 15,
        color: "red",
    },

    overlayContainer: {
        position: "absolute",
        top: 0,
        left: 0,

        width,
        height,

        zIndex: 15,
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
});