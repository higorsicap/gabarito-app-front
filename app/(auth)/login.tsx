import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SyncModal } from "@/src/components/SyncModal";
import { useLogin } from "@/src/ts/useLogin";

export default function Login() {
  const {
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
  } = useLogin();

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

      {/* MODAL DE SYNC ISOLADO */}
      <SyncModal />
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
});