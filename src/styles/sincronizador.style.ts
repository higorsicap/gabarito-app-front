import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    paddingTop: 50,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    marginBottom: 6,
  },
  // CARD PRINCIPAL DO ALUNO (Seta direção vertical para empilhar conteúdo)
  card: {
    flexDirection: "column",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: "#64748b",
  },
  // LINHA INDIVIDUAL DA DISCIPLINA (Layout em linha para texto + botão)
  disciplinaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  disciplinaTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  disciplinaSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  btn: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
