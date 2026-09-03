import BottomNav from "@/src/components/BottomNav";

import {
  DisciplinaAplicada,
  liberarProvaNoBanco,
} from "@/src/database/services/provaRepository";

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
    servidorAtivo,
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
    handleEncerrarServidor,
    handleTransferir,
    handleIniciarTodos,

    // ============================================================
    // 📝 RESPOSTAS
    // ============================================================
    obterRespostasDisciplina,
    respostasAlunos = {},

    // ============================================================
    // ✅ CONCLUSÃO
    // ============================================================
    conclusoesAlunos = {},

    // ============================================================
    // 🔋 BATERIA
    // ============================================================
    bateriasAlunos = {},
    obterBateriaAluno,

    // ============================================================
    // 🕐 ÚLTIMA COMUNICAÇÃO POR ALUNO
    // ============================================================
    datasHoraAlunos = {},
    obterDataHoraAluno,
  } = useConsulta();

  // ============================================================
  // AVALIAÇÃO SELECIONADA
  // ============================================================
  const avaliacaoSelecionada = useMemo(() => {
    return avaliacoesOpcoes.find(
      (item) =>
        String(item.id_avaliacao_saed_mob) === String(filtros.avaliacao),
    );
  }, [filtros.avaliacao, avaliacoesOpcoes]);

  // ============================================================
  // SINCRONIZA ANO E HORÁRIO
  // ============================================================
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
  }, [avaliacaoSelecionada, filtros]);

  // ============================================================
  // STATUS
  // ============================================================
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

  // ============================================================
  // HEADER
  // ============================================================
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
            style={{
              color: "#1F2937",
            }}
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
            style={{
              color: "#1F2937",
            }}
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
            style={{
              color: "#1F2937",
            }}
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

        {/* BOTÕES */}
        <View style={styles.botoes}>
          <TouchableOpacity
            style={[styles.btnIniciar, servidorAtivo && styles.btnEncerrar]}
            onPress={
              servidorAtivo ? handleEncerrarServidor : handleIniciarServidor
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name={servidorAtivo ? "stop" : "play"}
              size={18}
              color={servidorAtivo ? "#FFF" : "#000"}
            />

            <Text
              style={[
                styles.txtBtnIniciar,
                servidorAtivo && styles.txtBtnEncerrar,
              ]}
            >
              {servidorAtivo ? "Encerrar servidor" : "Iniciar servidor"}
            </Text>
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
      handleEncerrarServidor,
      servidorAtivo,
    ],
  );

  // ============================================================
  // ITEM DO ALUNO
  // ============================================================
  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const dispositivoSelecionado = dispositivosAtribuidos[item.id] || "";

      // ========================================================
      // ✅ STATUS DO ALUNO
      // ========================================================
      const statusAtual = obterStatusAluno
        ? obterStatusAluno(item.id, item.status)
        : item.status;

      // ========================================================
      // 🔋 BATERIA
      // ========================================================
      const percentualBateria = obterBateriaAluno
        ? obterBateriaAluno(item.id)
        : 0;

      // ========================================================
      // 🕐 ÚLTIMA COMUNICAÇÃO
      // ========================================================
      const atualizadoEm = obterDataHoraAluno
        ? obterDataHoraAluno(item.id)
        : (datasHoraAlunos[item.id] ?? null);

      const disciplinasAplicadas: DisciplinaAplicada[] =
        item.disciplinasAplicadas || [];

      return (
        <View style={styles.cardAluno}>
          {/* ==================================================
              CABEÇALHO
          ================================================== */}
          <View style={styles.cardHeader}>
            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={styles.nomeAluno} numberOfLines={2}>
                {item.nome}
              </Text>

              {/* 🕐 Atualizado em */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 3,
                }}
              >
                <Ionicons name="time-outline" size={12} color="#6B7280" />

                <Text
                  style={{
                    marginLeft: 4,
                    fontSize: 11,
                    color: "#6B7280",
                  }}
                >
                  Atualizado em:{" "}
                  {atualizadoEm ? formatarDataHora(atualizadoEm) : "--:--:--"}
                </Text>
              </View>
            </View>

            {renderBadgeStatus(statusAtual)}
          </View>

          {/* ==================================================
              CORPO
          ================================================== */}
          <View style={styles.cardBody}>
            {/* PROVA + BATERIA */}
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
                {/* 🔋 BATERIA */}
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

            {/* DISCIPLINAS */}
            <View style={styles.disciplinasSection}>
              <Text style={styles.disciplinasSectionTitle}>
                Disciplinas Aplicadas
              </Text>

              {disciplinasAplicadas.length > 0 ? (
                disciplinasAplicadas.map((disc, index) => {
                  const respondidas = obterRespostasDisciplina(
                    item.id,
                    disc.id_disciplina,
                  );

                  return (
                    <View
                      key={`${disc.id_disciplina}-${index}`}
                      style={styles.disciplinaCard}
                    >
                      <Text style={styles.disciplinaNome} numberOfLines={1}>
                        {disc.nome}
                      </Text>

                      <View style={styles.disciplinaMetricas}>
                        <View style={styles.metricMini}>
                          <Text style={styles.metricMiniVal}>
                            {respondidas}/{disc.total}
                          </Text>

                          <Text style={styles.metricMiniLab}>Respondidas</Text>
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

          {/* ==================================================
              RODAPÉ
          ================================================== */}
          <View style={styles.cardFooter}>
            {/* DISPOSITIVO */}
            <View style={styles.selectDispositivo}>
              <Picker
                selectedValue={dispositivoSelecionado}
                onValueChange={async (val) => {
                  atribuirDispositivo?.(item.id, val);

                  if (val && avaliacaoSelecionada?.id_avaliacao_saed_mob) {
                    try {
                      await liberarProvaNoBanco(
                        val,
                        avaliacaoSelecionada.id_avaliacao_saed_mob,
                        {
                          id: item.id,
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
                  style={{
                    fontSize: 12,
                  }}
                />

                {dispositivosOpcoes
                  .filter((dispositivo) => {
                    const idDispositivo = String(dispositivo.id);

                    return !Object.entries(dispositivosAtribuidos).some(
                      ([idAluno, dispositivoAtribuido]) =>
                        String(dispositivoAtribuido) === idDispositivo &&
                        Number(idAluno) !== item.id,
                    );
                  })
                  .map((d) => (
                    <Picker.Item
                      key={d.id}
                      label={d.nome}
                      value={String(d.id)}
                      color="#1F2937"
                      style={{
                        fontSize: 12,
                      }}
                    />
                  ))}
              </Picker>
            </View>

            {/* BOTÕES */}
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
      obterRespostasDisciplina,
      obterBateriaAluno,
      datasHoraAlunos,
      obterDataHoraAluno,
      handlePausar,
      handleTransferir,
      avaliacaoSelecionada,
      renderBadgeStatus,
    ],
  );

  // ============================================================
  // TELA
  // ============================================================
  return (
    <View style={styles.container}>
      <BottomNav />

      <FlatList
        data={alunos}
        // 🔄 Atualiza quando respostas,
        // conclusão, bateria ou data/hora mudarem
        extraData={{
          respostasAlunos,
          conclusoesAlunos,
          bateriasAlunos,
          datasHoraAlunos,
        }}
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

// ============================================================
// 🕐 FORMATA DATA/HORA
// ============================================================
function formatarDataHora(valor: string): string {
  if (!valor) {
    return "--:--:--";
  }

  // Trata o formato do SQLite:
  // YYYY-MM-DD HH:mm:ss
  const partes = valor.trim().split(" ");

  if (partes.length >= 2) {
    const data = partes[0];
    const hora = partes[1];

    const dataPartes = data.split("-");

    if (dataPartes.length === 3) {
      const ano = dataPartes[0];
      const mes = dataPartes[1];
      const dia = dataPartes[2];

      return `${dia}/${mes}/${ano} ${hora}`;
    }
  }

  // Caso o banco já esteja retornando outro formato.
  return valor;
}
