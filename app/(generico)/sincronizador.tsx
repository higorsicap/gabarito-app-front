import { styles } from "@/src/styles/sincronizador.style";
import {
  ActivityIndicator,
  Button,
  FlatList,
  ListRenderItemInfo,
  Text,
  View,
} from "react-native";

import BottomNav from "@/src/components/BottomNav";
import {
  DisciplinaAgrupada,
  ProvaAgrupadaAluno,
} from "@/src/database/services/sincronizarGabaritoRepository";
import { useSincronizador } from "@/src/ts/useSincronizador";

export default function Sincronizador() {
  const {
    loading,
    provasAgrupadas = [],
    syncedCardIds, // Recebe o Set com os IDs já enviados
    handleStartSync,
  } = useSincronizador();

  const renderAlunoItem = ({
    item,
  }: ListRenderItemInfo<ProvaAgrupadaAluno>) => {
    if (!item) return null;

    // Checa se este card específico já foi sincronizado com sucesso
    const isSincronizado = syncedCardIds?.has(item.id_estudante_origem);

    // DEFESA ABSOLUTA: Se disciplinas ainda vier como string JSON do SQLite, parseia na hora
    let disciplinasList: DisciplinaAgrupada[] = [];
    if (typeof item.disciplinas === "string") {
      try {
        disciplinasList = JSON.parse(item.disciplinas);
      } catch {
        disciplinasList = [];
      }
    } else if (Array.isArray(item.disciplinas)) {
      disciplinasList = item.disciplinas;
    }

    // Cálculo dos totalizantes
    const totalQuestoesAluno = disciplinasList.reduce(
      (acc, disc) => acc + (Number(disc?.qtd_questoes) || 0),
      0,
    );

    const totalRespondidasAluno = disciplinasList.reduce(
      (acc, disc) => acc + (Number(disc?.qtd_respondida) || 0),
      0,
    );

    return (
      <View
        style={[
          styles.card,
          // Aplica borda e fundo verde suave quando o card for sincronizado
          isSincronizado && {
            backgroundColor: "#d1fae5",
            borderColor: "#10b981",
            borderWidth: 1.5,
          },
        ]}
      >
        {/* CABEÇALHO DO CARD */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.cardTitle, isSincronizado && { color: "#065f46" }]}
            >
              👤 {item.nome_estudante ? item.nome_estudante : "Sem nome"}
              {isSincronizado ? " ✓" : ""}
            </Text>
            <Text
              style={[styles.cardSub, isSincronizado && { color: "#047857" }]}
            >
              ID: {String(item.id_estudante_origem ?? "")}
              {isSincronizado ? " • Enviado" : ""}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "bold",
                color: isSincronizado ? "#047857" : "#2563eb",
              }}
            >
              Total: {totalRespondidasAluno} / {totalQuestoesAluno}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: isSincronizado ? "#065f46" : "#64748b",
              }}
            >
              respondidas
            </Text>
          </View>
        </View>

        {/* LISTAGEM DAS DISCIPLINAS */}
        {disciplinasList.map((disc: DisciplinaAgrupada, idx: number) => {
          if (!disc) return null;

          const nomeDisciplina = disc.desc_disciplina
            ? disc.desc_disciplina
            : `Disciplina #${disc.id_disciplina ?? idx}`;

          return (
            <View
              key={
                disc.id_disciplina ? String(disc.id_disciplina) : String(idx)
              }
              style={[
                styles.disciplinaRow,
                isSincronizado && { borderTopColor: "#a7f3d0" },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.disciplinaTitle,
                    isSincronizado && { color: "#065f46" },
                  ]}
                >
                  📚 {nomeDisciplina}
                </Text>

                <Text
                  style={[
                    styles.disciplinaSub,
                    isSincronizado && { color: "#047857" },
                  ]}
                >
                  Respondidas: {Number(disc.qtd_respondida) || 0} /{" "}
                  {Number(disc.qtd_questoes) || 0}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={{ marginTop: 50, alignItems: "center" }}>
      <Text>
        {loading
          ? "Buscando dados no SQLite..."
          : "Nenhuma resposta pendente para sincronizar"}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { flex: 1 }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Sincronizador</Text>

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#0000ff"
            style={{ marginVertical: 10 }}
          />
        ) : null}

        <Button
          title={loading ? "Enviando..." : "Enviar todas as provas"}
          onPress={handleStartSync}
          disabled={Boolean(
            loading ||
            !provasAgrupadas ||
            (Array.isArray(provasAgrupadas) && provasAgrupadas.length === 0),
          )}
        />
      </View>

      {/* LISTA */}
      <FlatList
        data={Array.isArray(provasAgrupadas) ? provasAgrupadas : []}
        keyExtractor={(item, index) =>
          item?.id_estudante_origem
            ? String(item.id_estudante_origem)
            : String(index)
        }
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{
          padding: 15,
          paddingBottom: 120,
        }}
        ListEmptyComponent={renderEmptyComponent}
        renderItem={renderAlunoItem}
      />

      <BottomNav />
    </View>
  );
}
