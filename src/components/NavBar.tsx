import { StyleSheet, Text, View } from "react-native";

export default function NavBar() {

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.icon}>↪</Text>
            </View>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
    },

    header: {
        height: 80,
        backgroundColor: '#6fa4e8',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        justifyContent: 'center',
        paddingHorizontal: 20,
        elevation: 5,
    },

    icon: {
        marginTop: 15,
        marginLeft: 280,
        fontSize: 40,
    },
})