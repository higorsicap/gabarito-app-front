import BottomNav from '@/src/components/BottomNav';
import FiltroProva from '@/src/components/FiltroProva';

import { useAuth } from '@/src/contexts/AuthContext';

import {
  baixarProva,
  listarProvas
} from '@/src/services/listaProvaService';

import { salvarProvaOffline } from '@/src/database/services/provaRepository';

import { Ionicons } from '@expo/vector-icons';


import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  SafeAreaProvider,
  SafeAreaView
} from 'react-native-safe-area-context';

type ItemFiltro = {
  id: number;
  nome: string;
};

export default function Home() {

  const { user, loading: authLoading } = useAuth();

  const [provas, setProvas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔥 FILTROS
  const [anoSelecionado, setAnoSelecionado] =
    useState<ItemFiltro | null>(null);

  const [clienteSelecionado, setClienteSelecionado] =
    useState<ItemFiltro | null>(null);

  const [escolaSelecionada, setEscolaSelecionada] =
    useState<ItemFiltro | null>(null);

  // 🔥 DOWNLOAD
  const handleDownload = async (item: any) => {

    try {

      console.log('ITEM DOWNLOAD:', item);

      const response = await baixarProva({
        id_avaliacao: Number(item.id_prova ?? -1),
        id_anoletivo: Number(item.id_anoletivo ?? -1),
        id_serie: Number(item.serie ?? -1),
        id_escola: Number(item.id_escola ?? -1),
        descricao_turma: item.turma,
        id_caderno_prova_disciplina: Number(
          item.id_caderno_prova_disciplina ?? -1
        )
      });

      console.log('✅ Prova baixada:', response);

      // 🔥 CONVERTE JSON
      const provas =
        typeof response?.dados === 'string'
          ? JSON.parse(response.dados)
          : response?.dados;

      // 🔥 VALIDA
      if (
        !Array.isArray(provas) ||
        provas.length === 0
      ) {

        Alert.alert(
          'Aviso',
          'Nenhuma prova encontrada'
        );

        return;

      }

      // 🔥 SALVA SQLITE
      await salvarProvaOffline(provas);

      console.log('💾 Prova salva offline');

      Alert.alert(
        'Sucesso',
        'Prova salva offline com sucesso'
      );

    } catch (error: any) {

      console.log(
        '❌ Erro ao baixar prova:',
        error?.message
      );

      Alert.alert(
        'Erro',
        'Erro ao baixar prova'
      );

    }

  };

  const carregarProvas = useCallback(async () => {

    try {

      if (authLoading) return;

      if (!user?.id_aplicador) {

        setProvas([]);
        return;

      }

      setLoading(true);

      const res = await listarProvas({
        id_aplicador: user.id_aplicador
      });

      const data = res?.data || res;

      if (!Array.isArray(data)) {

        setProvas([]);
        return;

      }

      const lista = data.map((item: any, index: number) => ({
        id: `${item.id_avaliacao}-${item.id_serie}-${index}`,
        id_prova: item.id_avaliacao,
        id_cliente: item.id_cliente,
        id_escola: item.id_escola,
        id_anoletivo: item.id_anoletivo,
        id_caderno_prova_disciplina: item.id_caderno_prova_disciplina,
        materia: item.descricao_caderno_prova_disciplina,
        cliente: item.nome_cliente,
        escola: item.nome_escola,
        prova: item.descricao_avaliacao,
        ano: item.id_anoletivo,
        serie: item.id_serie,
        turma: item.descricao_turma
      }));

      setProvas(lista);

    } catch (e: any) {

      console.log(
        'Erro ao carregar provas:',
        e.message
      );

      setProvas([]);

    } finally {

      setLoading(false);

    }

  }, [user, authLoading]);

  useEffect(() => {
    carregarProvas();
  }, [carregarProvas]);

  // 🔥 FILTROS FUNCIONANDO
  const provasFiltradas = useMemo(() => {

    return provas.filter((item) => {

      // 🔥 FILTRO ANO
      if (
        anoSelecionado &&
        Number(item.id_anoletivo) !==
        Number(anoSelecionado.id)
      ) {
        return false;
      }

      // 🔥 FILTRO CLIENTE
      if (
        clienteSelecionado &&
        Number(item.id_cliente) !==
        Number(clienteSelecionado.id)
      ) {
        return false;
      }

      // 🔥 FILTRO ESCOLA
      if (
        escolaSelecionada &&
        Number(item.id_escola) !==
        Number(escolaSelecionada.id)
      ) {
        return false;
      }

      return true;

    });

  }, [
    provas,
    anoSelecionado,
    clienteSelecionado,
    escolaSelecionada
  ]);

  return (

    <SafeAreaProvider
      style={{
        flex: 1,
        backgroundColor: '#ffffff00'
      }}
    >

      <SafeAreaView
        style={styles.container}
        edges={[]}
      >

        {/* 🔥 HEADER */}
        <BottomNav />

        {/* 🔥 CONTEÚDO */}
        <View style={styles.content}>
          <Text style={styles.title}>
            Lista de provas disponíveis:
          </Text>

          {/* 🔥 FILTROS */}
          <FiltroProva
            selecionadoAno={anoSelecionado}
            onSelectAno={(item) => {
              setAnoSelecionado(item);
              setEscolaSelecionada(null);
            }}

            selecionadoCliente={clienteSelecionado}

            onSelectCliente={(item) => {
              setClienteSelecionado(item);
            }}

            selecionadoEscola={escolaSelecionada}

            onSelectEscola={(item) => {
              setEscolaSelecionada(item);
            }}
          />

        </View>

        <View style={{ flex: 1 }}>
          {(loading || authLoading) && (
            <ActivityIndicator
              size="large"
              style={{ marginTop: 20 }}
            />
          )}

          <FlatList
            data={provasFiltradas}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 10,
              paddingBottom: 20
            }}

            ListEmptyComponent={() => {

              if (loading || authLoading)
                return null;

              if (!user) {

                return (
                  <Text style={{
                    marginTop: 20,
                    textAlign: 'center'
                  }}>
                    Usuário não autenticado
                  </Text>
                );

              }

              return (
                <Text style={{
                  marginTop: 20,
                  textAlign: 'center'
                }}>
                  Nenhuma prova encontrada
                </Text>
              );

            }}

            renderItem={({ item }) => (
              <View style={styles.card}>

                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>
                    {item.prova}
                  </Text>

                  <Text style={styles.data}>
                    Escola: {item.escola}
                  </Text>

                  <Text style={styles.data}>
                    Turma: {item.turma}
                  </Text>

                  <Text style={styles.data}>
                    Disciplina: {item.materia}
                  </Text>

                  <Text style={styles.data}>
                    Ano: {item.ano}
                  </Text>
                </View>

                <View style={styles.actions}>

                  <TouchableOpacity
                    style={styles.btnDownload}
                    onPress={() =>
                      handleDownload(item)
                    }
                  >
                    <Ionicons
                      name="download"
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>

                </View>

              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#efefef',
  },

  content: {
    paddingHorizontal: 10,
    paddingTop: 80,
    marginBottom: 10
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  card: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,

    flexDirection: 'row',
    alignItems: 'center',

    elevation: 2
  },

  nome: {
    fontSize: 16,
    fontWeight: 'bold'
  },

  data: {
    fontSize: 12,
    color: '#777',
    marginTop: 4
  },

  actions: {
    flexDirection: 'row',
    gap: 10
  },

  btnCamera: {
    backgroundColor: '#4dabf7',
    padding: 10,
    borderRadius: 8
  },

  btnDownload: {
    backgroundColor: '#51cf66',
    padding: 10,
    borderRadius: 8
  }
});