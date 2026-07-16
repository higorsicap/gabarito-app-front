import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import BottomNav from '@/src/components/BottomNav';

export default function ExampleFour() {

    const dados = [
        {
            id: '1',
            head1: '1',
            head2: '2',
            head3: '3',
        },
        {
            id: '2',
            head1: 'a',
            head2: 'b',
            head3: 'c',
        },
        {
            id: '3',
            head1: '10',
            head2: '20',
            head3: '30',
        },
        {
            id: '4',
            head1: 'x',
            head2: 'y',
            head3: 'z',
        },
    ];

    function abrir(id: string) {
        Alert.alert(`Linha ${id}`);
    }

    return (
        <View style={styles.container}>

            <BottomNav />

            {/* Cabeçalho */}
            <View style={[styles.row, styles.header]}>
                <Text style={[styles.cell, styles.headerText]}>Head</Text>
                <Text style={[styles.cell, styles.headerText]}>Head2</Text>
                <Text style={[styles.cell, styles.headerText]}>Head3</Text>
                <Text style={[styles.actionCell, styles.headerText]}>
                    Ação
                </Text>
            </View>

            <FlatList
                data={dados}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <View
                        style={[
                            styles.row,
                            index % 2 === 0
                                ? styles.evenRow
                                : styles.oddRow,
                        ]}
                    >
                        <Text style={styles.cell}>{item.head1}</Text>

                        <Text style={styles.cell}>{item.head2}</Text>

                        <Text style={styles.cell}>{item.head3}</Text>

                        <View style={styles.actionCell}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => abrir(item.id)}
                            >
                                <Text style={styles.buttonText}>
                                    Abrir
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 16,
        paddingTop: 30,
    },

    header: {
        backgroundColor: '#3B82F6',
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },

    evenRow: {
        backgroundColor: '#FFFFFF',
    },

    oddRow: {
        backgroundColor: '#F8FAFC',
    },

    cell: {
        flex: 1,
        textAlign: 'center',
        paddingVertical: 12,
        color: '#111827',
    },

    actionCell: {
        flex: 1,
        alignItems: 'center',
    },

    headerText: {
        color: '#FFF',
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
        paddingVertical: 14,
    },

    button: {
        backgroundColor: '#10B981',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
    },

    buttonText: {
        color: '#FFF',
        fontWeight: '600',
    },

});