import { StyleSheet } from "react-native";

const COR_PRIMARIA = "#4dabf7";
const COR_AVISO = "#D97706";

export const inicioStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  icone: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  iconeTexto: { fontSize: 36 },
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  botao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COR_PRIMARIA,
    borderRadius: 16,
    padding: 18,
    width: "100%",
    shadowColor: COR_PRIMARIA,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  botaoIcone: { fontSize: 24 },
  botaoTexto: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  botaoSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  botaoSeta: { color: "#FFF", fontSize: 24, fontWeight: "300" },
  botaoSinc: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderColor: COR_AVISO,
    shadowColor: COR_AVISO,
  },
  botaoSincDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    shadowOpacity: 0,
  },
  botaoSincTexto: { color: COR_AVISO },
  botaoSincSub: { color: "#92400E" },
  badgeOffline: {
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
});
