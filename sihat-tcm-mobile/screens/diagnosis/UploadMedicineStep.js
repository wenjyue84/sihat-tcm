import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
    UIManager,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function UploadMedicineStep({ data, onUpdate, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const [manualInput, setManualInput] = useState('');
    const medicines = data.medicines || [];

    // Animation for upload button pulse
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow access to your photo library to upload medicine photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const newMedicine = {
                    id: Date.now().toString(),
                    type: 'image',
                    uri: asset.uri,
                    base64: asset.base64,
                    name: `Medicine Photo ${medicines.length + 1}`,
                };

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                onUpdate({ ...data, medicines: [...medicines, newMedicine] });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.log('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const addManualMedicine = () => {
        if (!manualInput.trim()) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newMedicine = {
            id: Date.now().toString(),
            type: 'text',
            content: manualInput.trim(),
            name: manualInput.trim(),
        };

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onUpdate({ ...data, medicines: [...medicines, newMedicine] });
        setManualInput('');
    };

    const removeMedicine = (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onUpdate({ ...data, medicines: medicines.filter(m => m.id !== id) });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' }]}>
                    <Ionicons name="medkit" size={36} color={theme.accent.primary} />
                </View>
                <Text style={styles.title}>Current Medication</Text>
                <Text style={styles.subtitle}>
                    Log your current Western or TCM medications to check for interactions.
                </Text>
            </View>

            {/* Upload Area */}
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.uploadCard}>
                    <LinearGradient
                        colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)']}
                        style={styles.uploadGradient}
                    >
                        <Animated.View style={[styles.uploadIconCircle, { transform: [{ scale: pulseAnim }] }]}>
                            <Ionicons name="camera" size={32} color={theme.accent.secondary} />
                        </Animated.View>
                        <Text style={styles.uploadText}>Scan Medicine / Prescription</Text>
                        <Text style={styles.uploadSubtext}>Take a photo of the packaging or label</Text>
                    </LinearGradient>
                </BlurView>
            </TouchableOpacity>

            {/* Manual Input Area */}
            <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>OR TYPE MANUALLY</Text>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={styles.inputRow}>
                        <BlurView intensity={15} tint={isDark ? 'dark' : 'light'} style={styles.inputBlur}>
                            <TextInput
                                style={styles.input}
                                value={manualInput}
                                onChangeText={setManualInput}
                                placeholder="e.g. Panadol, Metformin..."
                                placeholderTextColor={theme.text.tertiary}
                                onSubmitEditing={addManualMedicine}
                            />
                        </BlurView>
                        <TouchableOpacity
                            style={[
                                styles.addButton,
                                !manualInput.trim() && styles.addButtonDisabled,
                                { backgroundColor: theme.accent.primary }
                            ]}
                            onPress={addManualMedicine}
                            disabled={!manualInput.trim()}
                        >
                            <Ionicons name="add" size={24} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>

            {/* List of Medicines */}
            <View style={styles.listSection}>
                {medicines.length > 0 ? (
                    <>
                        <Text style={styles.sectionLabel}>ADDED MEDICATIONS ({medicines.length})</Text>
                        {medicines.map((item) => (
                            <BlurView key={item.id} intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.medicineItem}>
                                <View style={styles.medicineInfo}>
                                    <View style={[styles.medicineIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                        <Ionicons
                                            name={item.type === 'image' ? 'image' : 'fitness'}
                                            size={20}
                                            color={theme.accent.primary}
                                        />
                                    </View>
                                    <View style={styles.medicineDetails}>
                                        <Text style={styles.medicineName} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.medicineType}>
                                            {item.type === 'image' ? 'Photo Attachment' : 'Text Entry'}
                                        </Text>
                                    </View>
                                </View>
                                {item.type === 'image' && (
                                    <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                                )}
                                <TouchableOpacity
                                    onPress={() => removeMedicine(item.id)}
                                    style={styles.removeButton}
                                >
                                    <Ionicons name="close-circle" size={22} color={theme.text.tertiary} />
                                </TouchableOpacity>
                            </BlurView>
                        ))}
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="medical-outline" size={40} color={theme.text.tertiary} style={{ opacity: 0.5 }} />
                        <Text style={styles.emptyText}>No medications added yet</Text>
                    </View>
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 24, paddingVertical: 10 },
    iconContainer: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        borderWidth: 1, borderColor: theme.border.subtle,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.text.primary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: theme.text.secondary, textAlign: 'center', lineHeight: 20 },

    uploadCard: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.accent.secondary + '40',
        marginBottom: 32,
        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
    },
    uploadGradient: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIconCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: theme.background.primary,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
        shadowColor: theme.accent.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    uploadText: { fontSize: 18, fontWeight: 'bold', color: theme.text.primary, marginBottom: 4 },
    uploadSubtext: { fontSize: 13, color: theme.text.tertiary },

    inputSection: { marginBottom: 24 },
    sectionLabel: { fontSize: 12, fontWeight: 'bold', color: theme.text.tertiary, marginBottom: 12, letterSpacing: 1 },
    inputRow: { flexDirection: 'row', gap: 12 },
    inputBlur: {
        flex: 1, borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: theme.border.default,
    },
    input: {
        flex: 1, height: 50, paddingHorizontal: 16,
        color: theme.text.primary, fontSize: 16,
        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
    },
    addButton: {
        width: 50, height: 50, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: theme.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    addButtonDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },

    listSection: { minHeight: 200 },
    medicineItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: 12, borderRadius: 16, marginBottom: 10,
        borderWidth: 1, borderColor: theme.border.default,
        overflow: 'hidden',
    },
    medicineInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    medicineIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    medicineDetails: { flex: 1 },
    medicineName: { fontSize: 15, fontWeight: '600', color: theme.text.primary, marginBottom: 2 },
    medicineType: { fontSize: 11, color: theme.text.tertiary },
    thumbnail: { width: 40, height: 40, borderRadius: 8, marginHorizontal: 8 },
    removeButton: { padding: 4 },

    emptyState: {
        alignItems: 'center', justifyContent: 'center',
        padding: 32, borderRadius: 20,
        borderWidth: 1, borderColor: theme.border.subtle,
        borderStyle: 'dashed'
    },
    emptyText: { marginTop: 8, color: theme.text.tertiary, fontSize: 14 },
});
