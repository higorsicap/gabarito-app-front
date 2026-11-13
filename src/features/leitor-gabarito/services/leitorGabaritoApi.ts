import { File } from "expo-file-system";
import type { RespostaAPI } from "../types/leitorGabarito.types";

const API_URL =
  "https://sicapteste.com.br/lucas/leitor-gabarito-ia/gabarito.php";

export async function enviarUmaProva(
  imagemUri: string,
  idProva: string,
): Promise<RespostaAPI> {
  try {
    const arquivo = new File(imagemUri);

    if (!arquivo.exists) {
      throw new Error(`Arquivo não encontrado: ${imagemUri}`);
    }

    const formData = new FormData();

    formData.append("s", idProva);
    formData.append("imagem", arquivo, "gabarito.jpg");

    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const texto = await resposta.text();

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}: ${texto}`);
    }

    try {
      return JSON.parse(texto) as RespostaAPI;
    } catch {
      return {
        sucesso: false,
        mensagem: texto || "Resposta inválida do servidor.",
      };
    }
  } catch (erro) {
    console.error("Erro ao enviar prova:", erro);
    throw erro;
  }
}
