import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Leitor de Gabarito</Text>

      <Button
        title="Abrir Scanner"
        onPress={() => router.push('../scanner')}
      />
    </View>
  );
}