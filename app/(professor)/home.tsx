import BottomNavProf from '@/src/components/BottomNavProf';
import { useMemo } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeProfessor() {

    // 🔥 MOCK
    const provasAplicadas = useMemo(() => {

        return [
            {
                mes: 'JAN',
                total: 12
            },
            {
                mes: 'FEV',
                total: 18
            },
            {
                mes: 'MAR',
                total: 9
            },
            {
                mes: 'ABR',
                total: 24
            },
            {
                mes: 'MAI',
                total: 31
            }
        ];

    }, []);

    const chartData = {

        labels: provasAplicadas.map(
            item => item.mes
        ),

        datasets: [
            {
                data: provasAplicadas.map(
                    item => item.total
                )
            }
        ]

    };

    return (

        <SafeAreaView
            style={styles.container}
            edges={['top']}
        >

            {/* 🔥 NAV */}
            <BottomNavProf />

            {/* 🔥 CONTEÚDO */}
            <View style={styles.content}>

                <View style={styles.header}>
                    <Text style={styles.title}>
                        Dashboard do Professor:
                    </Text>
                </View>

                {/* 🔥 CARD */}
                <View style={styles.card}>

                    <Text style={styles.cardTitle}>
                        Provas Aplicadas
                    </Text>

                    <BarChart
                        data={chartData}
                        width={
                            Dimensions
                                .get('window')
                                .width - 50
                        }
                        height={260}
                        yAxisLabel=""
                        yAxisSuffix=""
                        fromZero
                        showValuesOnTopOfBars
                        chartConfig={{
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',

                            decimalPlaces: 0,

                            color: (opacity = 1) =>
                                `rgba(93, 143, 214, ${opacity})`,

                            labelColor: (opacity = 1) =>
                                `rgba(0, 0, 0, ${opacity})`,

                            propsForBackgroundLines: {
                                stroke: '#e5e5e5'
                            },

                            propsForLabels: {
                                fontSize: 12
                            },

                            barPercentage: 0.6
                        }}
                        style={styles.chart}
                    />

                </View>

                <View style={styles.content}>

                    <Text style={styles.title}>
                        Provas disponiveis
                    </Text>

                    <View style={styles.cardProva}>
                        <Text style={styles.cardTitle}>
                            Prova de Matemática - 10 questões
                        </Text>
                        <Text>teste</Text>
                    </View>

                </View>

            </View>

        </SafeAreaView>

    );

}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#efefef'
    },

    header: {
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingTop: 40,
        paddingHorizontal: 15,
    },

    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20
    },

    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 10,

        elevation: 3
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 0
    },

    chart: {
        borderRadius: 12
    },

    cardProva: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        elevation: 3
    }

});