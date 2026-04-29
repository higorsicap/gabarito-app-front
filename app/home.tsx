import FiltroProva from '@/src/components/FiltroProva';
import NavBar from '@/src/components/NavBar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Home() {

  const [ano, setAno] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);

  return (
    <View style={styles.container}>
      <NavBar />

      <View style={styles.content}>
        <Text style={styles.title}>Filtro:</Text>
        <FiltroProva
          selecionadoAno={ano}
          onSelectAno={setAno}
          selecionadoCliente={cliente}
          onSelectCliente={setCliente}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efefef',
  },

  content: {
    flex: 1,
    padding: 20
  },

  title: {
    fontSize: 18
  }
});