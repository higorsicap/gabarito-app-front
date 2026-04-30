import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function BottomNav() {
    return (
        <View style={styles.navbar}>

            <TouchableOpacity onPress={() => router.push('/home')}>
                <Ionicons name="home" size={24} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/scanner')}>
                <Ionicons name="scan" size={24} color="#333" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    navbar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,

        height: 70,
        backgroundColor: '#4dabf7',

        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',

        borderTopWidth: 1,
        borderColor: '#eee',

        elevation: 10, // Android
    }
});