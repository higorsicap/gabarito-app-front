import BottomNav from "@/src/components/BottomNav";
import { StatusAluno, useConsulta } from "@/src/ts/useAplicarProva";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useCallback, useEffect, useMemo } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ConsultaScreen() {
    const {
        avaliacoesOpcoes,
        escolasOpcoes,
        turmasOpcoes,
        dispositivosOpcoes,
        dispositivosAtribuidos,
        atribuirDispositivo,
        obterStatusAluno,
        carregandoOpcoes,
        carregandoTurmas,
        carregandoAlunos,
        filtros,
        menuAberto,
        alunos,
        limparFiltros,
        toggleMenu,
        handleIniciar,
        handlePausar,
        handleReiniciar,
        handleIniciarServidor,
    } = useConsulta();

    const avaliacaoSelecionada = useMemo(() => {
        return avaliacoesOpcoes.find(
            (item) => String(item.id_avaliacao_saed_mob) === String(filtros.avaliacao)
        );
    }, [filtros.avaliacao, avaliacoesOpcoes]);

    useEffect(() => {
        if (avaliacaoSelecionada) {
            if (avaliacaoSelecionada.id_anoletivo) {
                filtros.setAno(String(avaliacaoSelecionada.id_anoletivo));
            }

            if (avaliacaoSelecionada.data_inicio_avaliacao) {
                const data = new Date(avaliacaoSelecionada.data_inicio_avaliacao);
                const horas = String(data.getHours()).padStart(2, "0");
                const minutos = String(data.getMinutes()).padStart(2, "0");
                filtros.setHorarioInicio(`${horas}:${minutos}`);
            }
        } else {
            filtros.setAno("");
            filtros.setHorarioInicio("");
        }
    }, [avaliacaoSelecionada]);

    // Função para aplicar estilos de acordo com o Status
    const renderBadgeStatus = (status: StatusAluno) => {
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
    };

    const renderHeader = useCallback(
        () => (
            <>
                {/* CARD DE FILTROS */}
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
                            <Picker.Item label="Selecione uma avaliação" value="" color="#6B7280" />
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
                            <Picker.Item label="Selecione uma escola" value="" color="#6B7280" />
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
                            enabled={!carregandoOpcoes && !carregandoTurmas && Boolean(filtros.escola)}
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

                    {/* ANO */}
                    <Text style={styles.label}>Ano</Text>
                    <View style={styles.inputReadonly}>
                        <Text style={styles.txtReadonly}>
                            {filtros.ano || "Definido pela avaliação"}
                        </Text>
                    </View>

                    {/* HORÁRIO - INÍCIO */}
                    <Text style={styles.label}>Horário - Início</Text>
                    <View style={styles.inputReadonly}>
                        <Text style={styles.txtReadonly}>
                            {filtros.horarioInicio || "Definido pela avaliação"}
                        </Text>
                    </View>

                    {/* BOTÕES DE AÇÃO */}
                    <View style={styles.botoes}>
                        <TouchableOpacity style={styles.btnLimpar} onPress={limparFiltros} activeOpacity={0.6}>
                            <Ionicons name="refresh-outline" size={16} color="#4B5563" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnIniciar} onPress={handleIniciarServidor} activeOpacity={0.7}>
                            <Ionicons name="play" size={20} color="#000" />
                            <Text style={styles.txtBtnIniciar}>Iniciar servidor</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* TABELA - CABEÇALHO */}
                <View style={styles.tableContainerHeader}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, { flex: 2.5, textAlign: "left" }]}>Nome</Text>
                        <Text style={[styles.headerCell, { flex: 2.5 }]}>Dispositivo</Text>
                        <Text style={[styles.headerCell, { flex: 2 }]}>Status</Text>
                        <Text style={[styles.headerCell, { flex: 1 }]}>Ação</Text>
                    </View>
                </View>
            </>
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
        ]
    );

    const renderItem = useCallback(
        ({ item, index }: { item: any; index: number }) => {
            const isMenuAberto = menuAberto === item.id;
            const ehUltimosItens = index >= alunos.length - 2 && alunos.length > 2;
            const dispositivoSelecionado = dispositivosAtribuidos[item.id] || "";
            const statusAtual = obterStatusAluno(item.id, item.status);

            const executarAcao = (acao: (id: any) => void) => {
                acao(item.id);
                toggleMenu(item.id);
            };

            return (
                <View style={[styles.tableContainerRow, isMenuAberto && { zIndex: 9999, elevation: 9999 }]}>
                    <View style={styles.tableRow}>
                        {/* NOME DO ALUNO */}
                        <Text
                            style={[
                                styles.cellText,
                                { flex: 2.5, textAlign: "left", color: "#1F2937", fontWeight: "500" },
                            ]}
                            numberOfLines={1}
                        >
                            {item.nome}
                        </Text>

                        {/* SELECT DE DISPOSITIVO */}
                        <View style={[styles.selectCell, { flex: 2.5 }]}>
                            <Picker
                                selectedValue={dispositivoSelecionado}
                                onValueChange={(val) => atribuirDispositivo(item.id, val)}
                                style={styles.pickerTableCell}
                                dropdownIconColor="#1F2937"
                            >
                                <Picker.Item label="Selecione" value="" color="#9CA3AF" style={{ fontSize: 12 }} />
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

                        {/* STATUS DINÂMICO */}
                        <View style={[styles.cellContainer, { flex: 2 }]}>
                            {renderBadgeStatus(statusAtual)}
                        </View>

                        {/* AÇÕES */}
                        <View style={styles.actionCell}>
                            <TouchableOpacity
                                style={styles.btnIconAction}
                                onPress={() => toggleMenu(item.id)}
                                activeOpacity={0.4}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="ellipsis-vertical" size={20} color="#4dabf7" />
                            </TouchableOpacity>

                            {/* DROPDOWN MENU */}
                            {isMenuAberto && (
                                <View
                                    style={[
                                        styles.menuAcoes,
                                        ehUltimosItens ? styles.menuAcoesCima : styles.menuAcoesBaixo,
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={styles.itemMenu}
                                        onPress={() => executarAcao(handleIniciar)}
                                        activeOpacity={0.6}
                                    >
                                        <Ionicons name="play-outline" size={16} color="#4B5563" />
                                        <Text style={styles.txtItemMenu}>Iniciar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.itemMenu}
                                        onPress={() => executarAcao(handlePausar)}
                                        activeOpacity={0.6}
                                    >
                                        <Ionicons name="pause-outline" size={16} color="#4B5563" />
                                        <Text style={styles.txtItemMenu}>Pausar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.itemMenu, { borderBottomWidth: 0 }]}
                                        onPress={() => executarAcao(handleReiniciar)}
                                        activeOpacity={0.6}
                                    >
                                        <Ionicons name="reload-outline" size={16} color="#4B5563" />
                                        <Text style={styles.txtItemMenu}>Reiniciar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            );
        },
        [
            menuAberto,
            alunos.length,
            dispositivosOpcoes,
            dispositivosAtribuidos,
            atribuirDispositivo,
            obterStatusAluno,
            toggleMenu,
            handleIniciar,
            handlePausar,
            handleReiniciar,
        ]
    );

    return (
        <View style={styles.container}>
            <BottomNav />

            {/* Overlay em Pressable para capturar o toque fora do menu */}
            {menuAberto !== null && (
                <Pressable
                    style={styles.overlayFora}
                    onPress={() => toggleMenu(null)}
                />
            )}

            <FlatList
                data={alunos}
                keyExtractor={(item) => String(item.id)}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.scrollContainer}
                CellRendererComponent={({ children, style, index, ...props }) => {
                    const item = alunos[index];
                    const isMenuAberto = item && menuAberto === item.id;
                    return (
                        <View
                            {...props}
                            style={[
                                style,
                                {
                                    zIndex: isMenuAberto ? 9999 : 1,
                                    elevation: isMenuAberto ? 9999 : 2,
                                },
                            ]}
                        >
                            {children}
                        </View>
                    );
                }}
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
    overlayFora: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9998,
        backgroundColor: "transparent",
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
    inputReadonly: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 12,
        paddingVertical: 12,
        justifyContent: "center",
    },
    txtReadonly: {
        fontSize: 14,
        color: "#374151",
    },
    botoes: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
        gap: 8,
    },
    btnLimpar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        justifyContent: "center",
    },
    btnIniciar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: "#16f15f",
        gap: 6,
    },
    txtBtnIniciar: {
        color: "#000",
        fontWeight: "600",
        fontSize: 14,
    },
    tableContainerHeader: {
        marginHorizontal: 16,
        backgroundColor: "#FFF",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    tableContainerRow: {
        marginHorizontal: 16,
        backgroundColor: "#FFF",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        overflow: "visible",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#4dabf7",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    headerCell: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 13,
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        paddingVertical: 8,
        paddingHorizontal: 8,
        position: "relative",
        overflow: "visible",
    },
    selectCell: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 6,
        backgroundColor: "#FAFAFA",
        justifyContent: "center",
        marginHorizontal: 4,
        height: 38,
    },
    pickerTableCell: {
        color: "#1F2937",
        height: 38,
    },
    cellContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    cellText: {
        textAlign: "center",
        fontSize: 13,
        color: "#6B7280",
    },
    badgeStatus: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeConcluido: {
        backgroundColor: "#DEF7EC",
    },
    badgeIniciado: {
        backgroundColor: "#D1E7DD",
    },
    badgeNaoIniciado: {
        backgroundColor: "#E2E8F0",
    },
    badgePausado: {
        backgroundColor: "#FEE2E2",
    },
    badgePendente: {
        backgroundColor: "#FEF3C7",
    },
    txtBadge: {
        fontSize: 10,
        fontWeight: "700",
    },
    txtConcluido: {
        color: "#03543F",
    },
    txtIniciado: {
        color: "#0F5132",
    },
    txtNaoIniciado: {
        color: "#475569",
    },
    txtPausado: {
        color: "#991B1B",
    },
    txtPendente: {
        color: "#92400E",
    },
    actionCell: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "visible",
    },
    btnIconAction: {
        padding: 8,
        borderRadius: 20,
    },
    menuAcoes: {
        position: "absolute",
        right: 0,
        backgroundColor: "#FFF",
        borderRadius: 8,
        minWidth: 120,
        elevation: 10,
        zIndex: 9999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    menuAcoesBaixo: {
        top: 30,
    },
    menuAcoesCima: {
        bottom: 30,
    },
    itemMenu: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        gap: 8,
    },
    txtItemMenu: {
        fontSize: 13,
        color: "#374151",
    },
    emptyContainer: {
        marginHorizontal: 16,
        backgroundColor: "#FFF",
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
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