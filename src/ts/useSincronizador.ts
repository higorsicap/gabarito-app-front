import {
  limparRespostasLocais,
  listaRespostasPorAluno,
  ProvaAgrupadaAluno,
  sincronizarDadosComServidor,
} from "@/src/database/services/sincronizarGabaritoRepository";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export function useSincronizador() {
  const [loading, setLoading] = useState<boolean>(true);
  const [provasAgrupadas, setProvasAgrupadas] = useState<ProvaAgrupadaAluno[]>(
    [],
  );
  const [syncedCardIds, setSyncedCardIds] = useState<Set<number | string>>(
    new Set(),
  );

  const carregarDados = useCallback(async () => {
    try {
      const dados = await listaRespostasPorAluno();
      setProvasAgrupadas(dados);
    } catch (error) {
      console.error("Erro ao carregar dados do SQLite:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleStartSync = useCallback(async () => {
    try {
      setLoading(true);

      // Sincroniza e vai marcando os cards como verdes à medida que são concluídos
      const resultado = await sincronizarDadosComServidor(
        (itemSincronizado) => {
          setSyncedCardIds((prev) => {
            const novoSet = new Set(prev);
            novoSet.add(itemSincronizado.id_estudante_origem);
            return novoSet;
          });
        },
      );

      if (resultado.success) {
        // Exibe o diálogo de confirmação após o término do envio
        Alert.alert(
          "Sincronização Concluída",
          `prova(s) enviada(s) com sucesso!\nDeseja apagar estes dados do aplicativo?`,
          [
            {
              text: "Manter dados",
              style: "cancel",
            },
            {
              text: "Sim, deletar",
              style: "destructive",
              onPress: async () => {
                try {
                  setLoading(true);
                  await limparRespostasLocais(); // Deleta do SQLite
                  setSyncedCardIds(new Set()); // Reseta os cards verdes
                  await carregarDados(); // Recarrega a lista (que ficará vazia)
                } catch (err) {
                  console.error("Erro ao limpar dados locais:", err);
                } finally {
                  setLoading(false);
                }
              },
            },
          ],
        );
      }
    } catch (error: any) {
      console.error("Erro na sincronização:", error);
    } finally {
      setLoading(false);
    }
  }, [carregarDados]);

  return {
    loading,
    provasAgrupadas,
    syncedCardIds,
    handleStartSync,
    carregarDados,
  };
}
