import { useAuth } from "@/src/contexts/AuthContext";
import { login } from "@/src/services/loginService";

import { useRouter } from "expo-router";
import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const router = useRouter();

  const { login: signIn } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const [showTipoModal, setShowTipoModal] = useState(false);

  const [tipoAcesso, setTipoAcesso] = useState<
    "professor" | "aplicador" | null
  >(null);

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

      if (!res) {
        Alert.alert("Erro", "Resposta inválida do servidor");
        return;
      }

      if (!res.sucesso) {
        Alert.alert("Erro", res.mensagem);
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

      if (tipoAcesso === "professor") {
        router.replace("/(professor)/home");
      } else {
        router.replace("/(aplicador)/home");
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Acesse sua conta</Text>

        <Text style={styles.subtitle}>Digite seu CPF e senha</Text>

        <TextInput
          placeholder="CPF"
          placeholderTextColor="#666"
          style={styles.input}
          value={usuario}
          onChangeText={setUsuario}
          keyboardType="numeric"
        />

        <TextInput
          placeholder="Senha"
          placeholderTextColor="#666"
          secureTextEntry
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity
          style={styles.selectContainer}
          onPress={() => setShowTipoModal(true)}
        >
          <Text
            style={[styles.selectText, !tipoAcesso && styles.placeholderText]}
          >
            {tipoAcesso === "professor"
              ? "Professor"
              : tipoAcesso === "aplicador"
                ? "Aplicador"
                : "Selecione o acesso..."}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showTipoModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTipoModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowTipoModal(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setTipoAcesso("professor");
                  setShowTipoModal(false);
                }}
              >
                <Text style={styles.optionText}>Professor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setTipoAcesso("aplicador");
                  setShowTipoModal(false);
                }}
              >
                <Text style={styles.optionText}>Aplicador</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Acessar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6fa4e8",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#eaeaea",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: "#000",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#000",
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: "#000",
  },

  selectContainer: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 15,
    paddingHorizontal: 12,
    justifyContent: "center",
  },

  selectText: {
    fontSize: 16,
    color: "#000",
  },

  placeholderText: {
    color: "#666",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },

  option: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  optionText: {
    fontSize: 16,
    color: "#000",
  },

  button: {
    backgroundColor: "#5d8fd6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
