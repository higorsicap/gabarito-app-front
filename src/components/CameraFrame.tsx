import { StyleSheet, View } from 'react-native';

export default function CameraFrame() {
    return (
        <View style={styles.container}>
            <View style={styles.overlayTop} />

            <View style={styles.middle}>
                <View style={styles.overlaySide} />

                <View style={styles.frame} />

                <View style={styles.overlaySide} />
            </View>

            <View style={styles.overlayBottom} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },

    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },

    overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },

    middle: {
        flexDirection: 'row',
        height: '70%',
    },

    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },

    frame: {
        width: '80%',
        borderWidth: 2,
        borderColor: '#00FFAA',
        borderRadius: 12,
    },
});