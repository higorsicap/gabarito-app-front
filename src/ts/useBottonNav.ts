import { useAuth } from "@/src/contexts/AuthContext";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export function useBottomNav() {
    const { logout } = useAuth();
    const [open, setOpen] = useState(false);

    const translateX = useRef(new Animated.Value(-width)).current;

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

    return {
        open,
        translateX,
        toggleMenu,
        navigateTo,
        handleLogout,
    };
}