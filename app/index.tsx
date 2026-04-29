import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
    const router = useRouter();

    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');

    // 🔥 MOCK DE USUÁRIO
    const mockUser = {
        usuario: 'A',
        senha: 'A',
    };

    function handleLogin() {
        if (usuario === mockUser.usuario && senha === mockUser.senha) {
            Alert.alert('Sucesso', 'Login realizado!');

            // 👉 depois você troca por contexto/API
            router.push('/home');
        } else {
            Alert.alert('Erro', 'Usuário ou senha inválidos');
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>

                <Text style={styles.title}>Acesse sua conta</Text>
                <Text style={styles.subtitle}>
                    Digite o nome de usuário e a senha.
                </Text>

                <TextInput
                    placeholder="Usuário"
                    style={styles.input}
                    value={usuario}
                    onChangeText={setUsuario}
                />

                <TextInput
                    placeholder="Senha"
                    secureTextEntry
                    style={styles.input}
                    value={senha}
                    onChangeText={setSenha}
                />

                <Text style={styles.forgot}>Esqueceu sua senha</Text>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Acessar</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#6fa4e8',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    card: {
        width: '100%',
        backgroundColor: '#eaeaea',
        borderRadius: 15,
        padding: 20,
        elevation: 5,
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },

    subtitle: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },

    input: {
        height: 45,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },

    forgot: {
        textAlign: 'center',
        color: '#1e66f5',
        marginBottom: 20,
    },

    button: {
        backgroundColor: '#5d8fd6',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
    },

    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});