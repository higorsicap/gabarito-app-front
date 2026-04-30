import { useAuth } from '@/src/contexts/AuthContext';
import { login } from '@/src/services/loginService';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function Login() {
    const router = useRouter();
    const { login: signIn } = useAuth(); // 🔥 contexto

    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!usuario || !senha) {
            Alert.alert('Atenção', 'Preencha todos os campos');
            return;
        }

        try {
            setLoading(true);

            const res = await login(usuario, senha);

            if (!res) {
                Alert.alert('Erro', 'Resposta inválida do servidor');
                return;
            }

            if (!res.sucesso) {
                Alert.alert('Erro', res.mensagem);
                return;
            }

            const userData = res.recurso;

            // 🔥 VALIDAÇÃO IMPORTANTE
            if (!userData?.id_aplicador) {
                Alert.alert('Erro', 'Usuário inválido (sem id_aplicador)');
                return;
            }

            // 🔥 SALVA NO CONTEXTO
            await signIn({
                id_aplicador: userData.id_aplicador,
                cpf_aplicador: userData.cpf_aplicador,
                token: userData.token?.aplicador_token
            });

            Alert.alert('Sucesso', 'Login realizado!');

            // 🔥 navegação correta (remove login da stack)
            router.replace('/home');

        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>

                <Text style={styles.title}>Acesse sua conta</Text>
                <Text style={styles.subtitle}>
                    Digite seu CPF e senha
                </Text>

                <TextInput
                    placeholder="CPF"
                    placeholderTextColor="#000000"
                    style={styles.input}
                    value={usuario}
                    onChangeText={setUsuario}
                    keyboardType="numeric"
                />

                <TextInput
                    placeholder="Senha"
                    placeholderTextColor="#000000"
                    secureTextEntry
                    style={styles.input}
                    value={senha}
                    onChangeText={setSenha}
                />

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
        color: '#000000',
    },

    input: {
        height: 45,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        color: '#000000',
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