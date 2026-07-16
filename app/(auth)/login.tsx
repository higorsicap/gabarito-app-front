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

import { Ionicons } from "@expo/vector-icons";

export default function Login() {
  const router = useRouter();
  const { login: signIn } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const [showTipoModal, setShowTipoModal] = useState(false);
  const [modalSyncVisible, setModalSyncVisible] = useState(false);

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

  function sincronizarDados() {
    Alert.alert("Sync", "Aqui você vai rodar sua sincronização");
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Acesse sua conta</Text>
        <Text style={styles.subtitle}>Digite seu CPF e senha</Text>

        {/* SELECT TIPO */}
        <TouchableOpacity
          style={styles.selectContainer}
          onPress={() => setShowTipoModal(true)}
        >
          <Text
            style={[
              styles.selectText,
              !tipoAcesso && styles.placeholderText,
            ]}
          >
            {tipoAcesso === "professor"
              ? "Professor"
              : tipoAcesso === "aplicador"
              ? "Aplicador"
              : "Selecione o acesso..."}
          </Text>
        </TouchableOpacity>

        {/* INPUTS */}
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

        {/* MODAL TIPO ACESSO */}
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

        {/* LOGIN */}
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Acessar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* BOTÃO SYNC FLUTUANTE (ÍCONE) */}
      <TouchableOpacity
        style={styles.fabSync}
        onPress={() => setModalSyncVisible(true)}
      >
        <Ionicons name="sync" size={26} color="#fff" />
      </TouchableOpacity>

      {/* MODAL SYNC */}
      <Modal
        visible={modalSyncVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalSyncVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalSync}>
            <Text style={styles.titulo}>Sincronização</Text>

            <Text style={styles.texto}>
              Deseja iniciar a sincronização dos dados?
            </Text>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalSyncVisible(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnConfirmar}
                onPress={() => {
                  setModalSyncVisible(false);
                  sincronizarDados();
                }}
              >
                <Text style={{ color: "#fff" }}>Sincronizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },

  selectContainer: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 15,
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  selectText: {
    fontSize: 16,
  },

  placeholderText: {
    color: "#666",
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
  },

  /* FAB SYNC */
  fabSync: {
    position: "absolute",
    bottom: 25,
    left: 20,
    backgroundColor: "#4CAF50",
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  /* MODAL SYNC */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalSync: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
  },

  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  texto: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  btnCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },

  btnConfirmar: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
});