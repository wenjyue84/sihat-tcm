import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Platform,
    Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Image Zoom Modal Component
 * A fullscreen modal for viewing and zooming images
 */
export default function ImageZoomModal({ uri, visible, onClose, theme, isDark }) {
    if (!uri) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <BlurView intensity={Platform.OS === 'ios' ? 90 : 100} tint="dark" style={StyleSheet.absoluteFill}>
                <TouchableOpacity style={localStyles.zoomCloseButton} onPress={onClose}>
                    <Ionicons name="close" size={32} color="#ffffff" />
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={localStyles.zoomScrollContent}
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    centerContent={true}
                >
                    <Image
                        source={{ uri }}
                        style={localStyles.zoomImage}
                        resizeMode="contain"
                    />
                </ScrollView>

                <View style={localStyles.zoomFooter}>
                    <Text style={localStyles.zoomHint}>
                        {Platform.OS === 'ios' ? 'Pinch to zoom' : 'Double tap if supported'} • Swipe to dismiss
                    </Text>
                </View>
            </BlurView>
        </Modal>
    );
}

const localStyles = StyleSheet.create({
    zoomCloseButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    zoomScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    zoomImage: {
        width: SCREEN_WIDTH - 40,
        height: SCREEN_HEIGHT * 0.6,
    },
    zoomFooter: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    zoomHint: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },
});
