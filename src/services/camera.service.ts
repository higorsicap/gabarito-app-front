import * as ImageManipulator from 'expo-image-manipulator';

export async function processarImagem(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      // 🔹 reduz tamanho (melhora performance)
      { resize: { width: 1200 } },
    ],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: false,
    }
  );

  return result.uri;
}