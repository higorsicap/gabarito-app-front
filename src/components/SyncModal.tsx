import AntDesign from '@expo/vector-icons/AntDesign';
import Checkbox from 'expo-checkbox';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, DataTable, Text } from 'react-native-paper';

import { useSyncModal } from '@/src/ts/useSyncModal';

export function SyncModal() {
    const {
        modalVisible,
        setModalVisible,
        selecionados,
        page,
        setPage,
        dados,
        loading,
        baixando,
        itemsPerPage,
        registros,
        alterarSelecao,
        handleBaixarProvas,
        formatarDataBR,
    } = useSyncModal();

    return (
        <>
            {/* BOTÃO SYNC FLUTUANTE */}
            <TouchableOpacity
                style={styles.fabSync}
                onPress={() => setModalVisible(true)}
            >
                <AntDesign name="cloud-sync" size={24} color="#fff" />
            </TouchableOpacity>

            {/* MODAL DE SINCRONIZAÇÃO */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        {/* CABEÇALHO DO MODAL */}
                        <View style={styles.headerModal}>
                            <Text style={styles.titulo}>Sincronizar Provas</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <AntDesign name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4dabf7" />
                                <Text style={{ marginTop: 12, color: '#666' }}>
                                    Buscando provas disponíveis...
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* LISTA DE CARDS */}
                                <ScrollView style={styles.scrollList}>
                                    {registros.length === 0 ? (
                                        <Text style={styles.emptyText}>Nenhuma prova disponível para sincronização.</Text>
                                    ) : (
                                        registros.map((item) => {
                                            const idString = String(item.id_avaliacao_saed);
                                            const isSelected = selecionados.includes(idString);

                                            return (
                                                <TouchableOpacity
                                                    key={idString}
                                                    activeOpacity={0.8}
                                                    style={[styles.card, isSelected && styles.cardSelected]}
                                                    onPress={() => alterarSelecao(idString)}
                                                >
                                                    <View style={styles.cardHeader}>
                                                        <Text style={styles.cardTitle}>
                                                            {item.descricao_avaliacao}
                                                        </Text>
                                                        <Checkbox
                                                            value={isSelected}
                                                            onValueChange={() => alterarSelecao(idString)}
                                                            color={isSelected ? '#4dabf7' : undefined}
                                                        />
                                                    </View>

                                                    <View style={styles.cardDivider} />

                                                    <View style={styles.cardBody}>
                                                        <Text style={styles.cardInfoText}>
                                                            <Text style={styles.label}>Município: </Text>
                                                            {item.nome_cliente || '-'}
                                                        </Text>

                                                        <View style={styles.datesContainer}>
                                                            <Text style={styles.cardInfoText}>
                                                                <Text style={styles.label}>Início: </Text>
                                                                {formatarDataBR(item.data_inicio_avaliacao)}
                                                            </Text>
                                                            <Text style={styles.cardInfoText}>
                                                                <Text style={styles.label}>Fim: </Text>
                                                                {formatarDataBR(item.data_fim_avaliacao)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </ScrollView>

                                {/* PAGINAÇÃO DA REPO PAPER */}
                                <DataTable.Pagination
                                    page={page}
                                    numberOfPages={Math.max(1, Math.ceil(dados.length / itemsPerPage))}
                                    onPageChange={setPage}
                                    showFastPaginationControls
                                    label={`${page * itemsPerPage + 1}-${Math.min(
                                        (page + 1) * itemsPerPage,
                                        dados.length
                                    )} de ${dados.length}`}
                                />

                                <Button
                                    mode="contained"
                                    icon="download"
                                    style={styles.button}
                                    onPress={handleBaixarProvas}
                                    loading={baixando}
                                    disabled={baixando || selecionados.length === 0}
                                >
                                    {baixando ? 'Salvando Provas...' : `Baixar (${selecionados.length}) selecionadas`}
                                </Button>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    fabSync: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        backgroundColor: '#4CAF50',
        width: 55,
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        zIndex: 999,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
    modalContent: {
        width: '100%',
        maxHeight: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 10,
    },
    headerModal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    titulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    loadingContainer: {
        paddingVertical: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollList: {
        maxHeight: 400,
        marginVertical: 5,
    },
    emptyText: {
        textAlign: 'center',
        color: '#777',
        marginVertical: 20,
    },
    /* CARD STYLES */
    card: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: '#e9ecef',
        elevation: 1,
    },
    cardSelected: {
        backgroundColor: '#e7f5ff',
        borderColor: '#4dabf7',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#212529',
        flex: 1,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#dee2e6',
        marginVertical: 8,
    },
    cardBody: {
        gap: 4,
    },
    cardInfoText: {
        fontSize: 13,
        color: '#495057',
    },
    label: {
        fontWeight: 'bold',
        color: '#343a40',
    },
    datesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    button: {
        marginTop: 10,
        backgroundColor: '#2e7d32',
        borderRadius: 8,
    },
});