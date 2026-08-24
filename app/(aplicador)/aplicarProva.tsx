import BottomNav from "@/src/components/BottomNav";
import { liberarProvaNoBanco } from "@/src/database/services/provaRepository";
import { styles } from "@/src/styles/aplicaProva.styles";
import { StatusAluno, useConsulta } from "@/src/ts/useAplicarProva";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
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
                onValueChange={async (val) => {
                  // Atualiza a atribuição visual no estado local
                  atribuirDispositivo?.(item.id, val);

                  // Grava no banco SQLite se houver um dispositivo e uma avaliação selecionada
                  if (val && avaliacaoSelecionada?.id_avaliacao_saed_mob) {
                    try {
                      await liberarProvaNoBanco(
                        val,
                        avaliacaoSelecionada.id_avaliacao_saed_mob,
                        {
                          id: item.id, // Passa o id_estudante_origem
                          nome: item.nome,
                        },
                      );
                    } catch (err) {
                      console.error("Erro ao liberar prova no banco:", err);
                    }
                  }
                }}
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
