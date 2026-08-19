import BottomNav from "@/src/components/BottomNav";
import { StatusAluno, useConsulta } from "@/src/ts/useAplicarProva";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useCallback, useEffect, useMemo } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ConsultaScreen() {
  const {
    avaliacoesOpcoes = [],
    escolasOpcoes = [],
    turmasOpcoes = [],
    dispositivosOpcoes = [],
    dispositivosAtribuidos = {},
    atribuirDispositivo,
    obterStatusAluno,
    carregandoOpcoes,
    carregandoTurmas,
    carregandoAlunos,
    filtros,
    alunos = [],
    limparFiltros,
    handlePausar,
    handleIniciarServidor,
    handleTransferir,
    handleIniciarTodos,
  } = useConsulta();

  const avaliacaoSelecionada = useMemo(() => {
    return avaliacoesOpcoes.find(
      (item) =>
        String(item.id_avaliacao_saed_mob) === String(filtros.avaliacao),
    );
  }, [filtros.avaliacao, avaliacoesOpcoes]);

  // Sincroniza ano e horário com base na avaliação selecionada
  useEffect(() => {
    if (avaliacaoSelecionada) {
      if (avaliacaoSelecionada.id_anoletivo) {
        filtros.setAno?.(String(avaliacaoSelecionada.id_anoletivo));
      }

      if (avaliacaoSelecionada.data_inicio_avaliacao) {
        const data = new Date(avaliacaoSelecionada.data_inicio_avaliacao);
        const horas = String(data.getHours()).padStart(2, "0");
        const minutos = String(data.getMinutes()).padStart(2, "0");
        filtros.setHorarioInicio?.(`${horas}:${minutos}`);
      }
    } else {
      filtros.setAno?.("");
      filtros.setHorarioInicio?.("");
    }
  }, [avaliacaoSelecionada]);

  // Renderizador visual do badge do Status do aluno
  const renderBadgeStatus = useCallback((status: StatusAluno) => {
    let badgeStyle = styles.badgePendente;
    let textStyle = styles.txtPendente;

    switch (status) {
      case "Concluído":
        badgeStyle = styles.badgeConcluido;
        textStyle = styles.txtConcluido;
        break;
      case "Iniciado":
        badgeStyle = styles.badgeIniciado;
        textStyle = styles.txtIniciado;
        break;
      case "Não iniciado":
        badgeStyle = styles.badgeNaoIniciado;
        textStyle = styles.txtNaoIniciado;
        break;
      case "Pausado":
        badgeStyle = styles.badgePausado;
        textStyle = styles.txtPausado;
        break;
      case "Pendente":
      default:
        badgeStyle = styles.badgePendente;
        textStyle = styles.txtPendente;
        break;
    }

    return (
      <View style={[styles.badgeStatus, badgeStyle]}>
        <Text style={[styles.txtBadge, textStyle]}>{status}</Text>
      </View>
    );
  }, []);

  // Header da lista com o formulário de filtros
  const renderHeader = useCallback(
    () => (
      <View style={styles.cardFiltro}>
        <Text style={styles.tituloFiltro}>Filtros de Pesquisa</Text>

        {/* AVALIAÇÃO */}
        <Text style={styles.label}>Avaliação</Text>
        <View style={styles.select}>
          <Picker
            selectedValue={filtros.avaliacao}
            onValueChange={(itemValue) => filtros.setAvaliacao(itemValue)}
            enabled={!carregandoOpcoes}
            style={{ color: "#1F2937" }}
            dropdownIconColor="#1F2937"
          >
            <Picker.Item
              label="Selecione uma avaliação"
              value=""
              color="#6B7280"
            />
            {avaliacoesOpcoes.map((item) => (
              <Picker.Item
                key={item.id_avaliacao_saed_mob}
                label={item.descricao_avaliacao}
                value={String(item.id_avaliacao_saed_mob)}
                color="#1F2937"
              />
            ))}
          </Picker>
        </View>

        {/* ESCOLA */}
        <Text style={styles.label}>Escola</Text>
        <View style={styles.select}>
          <Picker
            selectedValue={filtros.escola}
            onValueChange={(itemValue) => filtros.setEscola(itemValue)}
            enabled={!carregandoOpcoes}
            style={{ color: "#1F2937" }}
            dropdownIconColor="#1F2937"
          >
            <Picker.Item
              label="Selecione uma escola"
              value=""
              color="#6B7280"
            />
            {escolasOpcoes.map((item) => (
              <Picker.Item
                key={item.id_escola}
                label={item.nome_escola}
                value={String(item.id_escola)}
                color="#1F2937"
              />
            ))}
          </Picker>
        </View>

        {/* TURMA */}
        <Text style={styles.label}>Turma</Text>
        <View style={styles.select}>
          <Picker
            selectedValue={filtros.turma}
            onValueChange={(itemValue) => filtros.setTurma(itemValue)}
            enabled={
              !carregandoOpcoes && !carregandoTurmas && Boolean(filtros.escola)
            }
            style={{ color: "#1F2937" }}
            dropdownIconColor="#1F2937"
          >
            <Picker.Item
              label={
                carregandoTurmas
                  ? "Carregando turmas..."
                  : filtros.escola
                    ? "Selecione uma turma"
                    : "Selecione primeiro uma escola"
              }
              value=""
              color="#6B7280"
            />
            {turmasOpcoes.map((item) => (
              <Picker.Item
                key={item.id_turma}
                label={item.descricao_turma}
                value={String(item.id_turma)}
                color="#1F2937"
              />
            ))}
          </Picker>
        </View>

        {/* BOTÕES DE AÇÃO DOS FILTROS */}
        <View style={styles.botoes}>
          <TouchableOpacity
            style={styles.btnLimpar}
            onPress={limparFiltros}
            activeOpacity={0.6}
          >
            <Ionicons name="refresh-outline" size={16} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnIniciar}
            onPress={handleIniciarServidor}
            activeOpacity={0.7}
          >
            <Ionicons name="play" size={18} color="#000" />
            <Text style={styles.txtBtnIniciar}>Iniciar servidor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGeral}
            onPress={() => handleIniciarTodos?.()}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={18} color="#FFF" />
            <Text style={styles.txtBtnGeral}>Iniciar Avaliação</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      filtros,
      carregandoOpcoes,
      carregandoTurmas,
      avaliacoesOpcoes,
      escolasOpcoes,
      turmasOpcoes,
      limparFiltros,
      handleIniciarServidor,
      handleIniciarTodos,
    ],
  );

  // Item individual da lista de alunos
  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const dispositivoSelecionado = dispositivosAtribuidos[item.id] || "";
      const statusAtual = obterStatusAluno
        ? obterStatusAluno(item.id, item.status)
        : item.status;

      const percentualConclusao = item.percentualConclusao ?? 0;
      const percentualBateria = item.percentualBateria ?? 0;
      const disciplinasAplicadas: any[] =
        item.disciplina_aplicada || item.disciplinasAplicadas || [];

      return (
        <View style={styles.cardAluno}>
          {/* CABEÇALHO DO CARD: Nome e Status */}
          <View style={styles.cardHeader}>
            <Text style={styles.nomeAluno} numberOfLines={2}>
              {item.nome}
            </Text>
            {renderBadgeStatus(statusAtual)}
          </View>

          {/* CORPO DO CARD */}
          <View style={styles.cardBody}>
            {/* LINHA SUPERIOR: Nome da Prova + % Conclusão + % Bateria */}
            <View style={styles.provaHeaderRow}>
              <View style={styles.provaTitleContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color="#6B7280"
                />
                <Text style={styles.infoLabel}>Prova:</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {item.provaNome ||
                    avaliacaoSelecionada?.descricao_avaliacao ||
                    "Não informada"}
                </Text>
              </View>

              <View style={styles.provaMetricsRight}>
                <View style={styles.metricBadge}>
                  <Text style={styles.metricBadgeText}>
                    {percentualConclusao}%
                  </Text>
                  <Text style={styles.metricBadgeLabel}>Conclusão</Text>
                </View>

                <View style={styles.bateriaBadge}>
                  <Ionicons
                    name={
                      percentualBateria <= 20
                        ? "battery-dead-outline"
                        : "battery-charging-outline"
                    }
                    size={14}
                    color={percentualBateria <= 20 ? "#EF4444" : "#10B981"}
                  />
                  <Text
                    style={[
                      styles.bateriaText,
                      {
                        color: percentualBateria <= 20 ? "#EF4444" : "#10B981",
                      },
                    ]}
                  >
                    {percentualBateria}%
                  </Text>
                </View>
              </View>
            </View>

            {/* LISTA DE DISCIPLINAS APLICADAS */}
            <View style={styles.disciplinasSection}>
              <Text style={styles.disciplinasSectionTitle}>
                Disciplinas Aplicadas
              </Text>

              {disciplinasAplicadas.length > 0 ? (
                disciplinasAplicadas.map((disc: any, index: number) => {
                  const resp = disc.respondidas ?? 0;
                  const tot = disc.total ?? 0;

                  return (
                    <View
                      key={disc.id || disc.id_disciplina || index}
                      style={styles.disciplinaCard}
                    >
                      <Text style={styles.disciplinaNome} numberOfLines={1}>
                        {disc.nome ||
                          disc.descricao_disciplina ||
                          disc.disciplina ||
                          `Disciplina ${index + 1}`}
                      </Text>
                      <View style={styles.disciplinaMetricas}>
                        <View style={styles.metricMini}>
                          <Text style={styles.metricMiniVal}>{resp}</Text>
                          <Text style={styles.metricMiniLab}>Respondidas</Text>
                        </View>
                        <Text style={styles.metricDivider}>/</Text>
                        <View style={styles.metricMini}>
                          <Text style={styles.metricMiniVal}>{tot}</Text>
                          <Text style={styles.metricMiniLab}>Total</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyDisciplinasText}>
                  Nenhuma disciplina vinculada.
                </Text>
              )}
            </View>
          </View>

          {/* BARRA DE AÇÕES INFERIOR */}
          <View style={styles.cardFooter}>
            {/* Seletor de Dispositivo */}
            <View style={styles.selectDispositivo}>
              <Picker
                selectedValue={dispositivoSelecionado}
                onValueChange={(val) => atribuirDispositivo?.(item.id, val)}
                style={styles.pickerTableCell}
                dropdownIconColor="#1F2937"
              >
                <Picker.Item
                  label="Selecione o dispositivo"
                  value=""
                  color="#9CA3AF"
                  style={{ fontSize: 12 }}
                />
                {dispositivosOpcoes.map((d) => (
                  <Picker.Item
                    key={d.id}
                    label={d.nome}
                    value={String(d.id)}
                    color="#1F2937"
                    style={{ fontSize: 12 }}
                  />
                ))}
              </Picker>
            </View>

            {/* Botões de Ação */}
            <View style={styles.footerBotoes}>
              <TouchableOpacity
                style={styles.btnActionPausar}
                onPress={() => handlePausar?.(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="pause" size={14} color="#DC2626" />
                <Text style={styles.txtBtnPausar}>Pausar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnActionTransferir}
                onPress={() => handleTransferir?.(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal" size={14} color="#2563EB" />
                <Text style={styles.txtBtnTransferir}>Transferir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [
      dispositivosOpcoes,
      dispositivosAtribuidos,
      atribuirDispositivo,
      obterStatusAluno,
      handlePausar,
      handleTransferir,
      avaliacaoSelecionada,
      renderBadgeStatus,
    ],
  );

  return (
    <View style={styles.container}>
      <BottomNav />

      <FlatList
        data={alunos}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scrollContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {carregandoAlunos ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4dabf7" />
                <Text style={styles.loadingText}>Buscando alunos...</Text>
              </View>
            ) : (
              <Text style={styles.loadingText}>
                {!filtros.escola || !filtros.turma
                  ? "Selecione uma escola e uma turma para listar os alunos."
                  : "Nenhum aluno encontrado para os filtros selecionados."}
              </Text>
            )}
          </View>
        }
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  cardFiltro: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginTop: 60,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tituloFiltro: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 4,
    marginTop: 10,
  },
  select: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
  },
  botoes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 8,
  },
  btnLimpar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
  },
  btnIniciar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#16f15f",
    gap: 6,
  },
  txtBtnIniciar: {
    color: "#000",
    fontWeight: "600",
    fontSize: 13,
  },
  btnGeral: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    gap: 6,
  },
  txtBtnGeral: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },

  /* CARDS DOS ALUNOS */
  cardAluno: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  nomeAluno: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  cardBody: {
    padding: 14,
    gap: 12,
  },

  /* Prova + Métricas */
  provaHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  provaTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  provaMetricsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricBadge: {
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metricBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  metricBadgeLabel: {
    fontSize: 9,
    color: "#3B82F6",
  },
  bateriaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 3,
  },
  bateriaText: {
    fontSize: 11,
    fontWeight: "700",
  },

  /* Disciplinas Aplicadas */
  disciplinasSection: {
    marginTop: 4,
    gap: 6,
  },
  disciplinasSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  disciplinaCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disciplinaNome: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  disciplinaMetricas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  metricMini: {
    alignItems: "center",
  },
  metricMiniVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  metricMiniLab: {
    fontSize: 8,
    color: "#6B7280",
  },
  metricDivider: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "300",
  },
  emptyDisciplinasText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  /* Ações do Card (Footer) */
  cardFooter: {
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    padding: 10,
    gap: 10,
  },
  selectDispositivo: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    backgroundColor: "#FFF",
    justifyContent: "center",
  },
  pickerTableCell: {
    color: "#1F2937",
  },
  footerBotoes: {
    flexDirection: "row",
    gap: 8,
  },
  btnActionPausar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  txtBtnPausar: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 12,
  },
  btnActionTransferir: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  txtBtnTransferir: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 12,
  },

  /* Badges Status */
  badgeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeConcluido: { backgroundColor: "#DEF7EC" },
  badgeIniciado: { backgroundColor: "#D1E7DD" },
  badgeNaoIniciado: { backgroundColor: "#E2E8F0" },
  badgePausado: { backgroundColor: "#FEE2E2" },
  badgePendente: { backgroundColor: "#FEF3C7" },
  txtBadge: { fontSize: 10, fontWeight: "700" },
  txtConcluido: { color: "#03543F" },
  txtIniciado: { color: "#0F5132" },
  txtNaoIniciado: { color: "#475569" },
  txtPausado: { color: "#991B1B" },
  txtPendente: { color: "#92400E" },

  /* Container Vazio / Carregando */
  emptyContainer: {
    marginHorizontal: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
});
