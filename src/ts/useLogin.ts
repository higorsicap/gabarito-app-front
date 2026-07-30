import { useAuth } from "@/src/contexts/AuthContext";
import { login } from "@/src/services/loginService";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

export type TipoAcesso = "professor" | "aplicador" | null;

export function useLogin() {
    const router = useRouter();
    const { login: signIn } = useAuth();

    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);
    const [showTipoModal, setShowTipoModal] = useState(false);
    const [tipoAcesso, setTipoAcesso] = useState<TipoAcesso>(null);

    async function handleLogin() {
        if (!usuario || !senha) {
            Alert.alert("Atenção", "Preencha todos os campos");
            return;
        }

        if (!tipoAcesso) {
            Alert.alert("Atenção", "Selecione o tipo de acesso");
            return;
        }

        try {
            setLoading(true);

            const res = await login(usuario, senha);

            if (!res?.sucesso) {
                Alert.alert("Erro", res?.mensagem || "Erro ao logar");
                return;
            }

            const userData = res.recurso;

            if (!userData?.id_aplicador) {
                Alert.alert("Erro", "Usuário inválido");
                return;
            }

            await signIn({
                id_aplicador: userData.id_aplicador,
                cpf_aplicador: userData.cpf_aplicador,
                token: userData.token?.aplicador_token,
                tipo_acesso: tipoAcesso,
            });

            Alert.alert("Sucesso", "Login realizado!");

            router.replace(
                tipoAcesso === "professor"
                    ? "/(professor)/home"
                    : "/(aplicador)/saed"
            );
        } catch (e: any) {
            Alert.alert("Erro", e?.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    }

    return {
        usuario,
        setUsuario,
        senha,
        setSenha,
        loading,
        tipoAcesso,
        setTipoAcesso,
        showTipoModal,
        setShowTipoModal,
        handleLogin,
    };
}