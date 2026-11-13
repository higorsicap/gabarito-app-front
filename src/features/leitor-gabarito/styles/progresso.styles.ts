import { StyleSheet } from "react-native";

const COR_PRIMARIA = "#2563EB";

export const progressoStyles = StyleSheet.create({
  barraFundo: { height: 3, backgroundColor: "#E2E8F0", overflow: "hidden" },
  barraPreenchimento: { height: 3, backgroundColor: COR_PRIMARIA },
  lista: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardFeito: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  dotFeito: { backgroundColor: "#22C55E" },
  dotPendente: { backgroundColor: "#CBD5E1" },
  textoFeito: { flex: 1, fontSize: 14, fontWeight: "600", color: "#15803D" },
  check: { fontSize: 16, color: "#22C55E", fontWeight: "700" },
  cardAtivo: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: COR_PRIMARIA,
    shadowColor: COR_PRIMARIA,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  textoAtivo: { fontSize: 14, fontWeight: "700", color: "#1D4ED8" },
  subAtivo: { fontSize: 11, color: "#3B82F6", marginTop: 2 },
  cardPendente: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textoPendente: { flex: 1, fontSize: 14, fontWeight: "500", color: "#94A3B8" },
  thumb: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    flexShrink: 0,
  },
  ativoTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
});
