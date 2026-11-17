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

    console.log("========== ENVIANDO PROVA ==========");
    console.log("ID da prova:", idProva);
    console.log("Imagem:", imagemUri);

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

    console.log("========== RESPOSTA DA API ==========");
    console.log("Status HTTP:", resposta.status);

    if (!resposta.ok) {
      console.error("Erro retornado pela API:", texto);

      throw new Error(`Erro HTTP ${resposta.status}: ${texto}`);
    }

    try {
      const dados = JSON.parse(texto) as RespostaAPI;

      console.log(
        "========== JSON COMPLETO DA IA ==========\n",
        JSON.stringify(dados, null, 2),
        "\n=====================================",
      );

      return dados;
    } catch {
      console.error("Resposta inválida da API:", texto);

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
