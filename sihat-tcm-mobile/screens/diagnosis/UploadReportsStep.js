import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
    UIManager,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { COLORS } from '../../constants/themes';
import { API_CONFIG, MEDICAL_REPORT_PROMPT } from '../../lib/apiConfig';
import { getSystemPrompt } from '../../lib/supabase';

const genAI = new GoogleGenerativeAI(API_CONFIG.GOOGLE_API_KEY);
import { useTheme } from '../../contexts/ThemeContext';

export default function UploadReportsStep({ data, onUpdate, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const [files, setFiles] = useState(data.files || []);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(null);
    const [reviewText, setReviewText] = useState('');
    const scanAnim = useRef(new Animated.Value(0)).current;

    // Enable LayoutAnimation for Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted' || galleryStatus !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Camera and Gallery permissions are needed to upload medical reports.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    const takePhoto = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                processImage(result.assets[0]);
            }
        } catch (err) {
            console.error('Camera error:', err);
            Alert.alert('Error', 'Failed to open camera.');
        }
    };

    const pickFromGallery = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                processImage(result.assets[0]);
            }
        } catch (err) {
            console.error('Gallery error:', err);
            Alert.alert('Error', 'Failed to open gallery.');
        }
    };

    const processImage = async (asset) => {
        setIsAnalyzing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Start scanning animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
                Animated.timing(scanAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
            ])
        ).start();

        try {
            // Fetch prompt from Admin Dashboard (Supabase)
            const basePrompt = await getSystemPrompt('medical_report', MEDICAL_REPORT_PROMPT);

            const model = genAI.getGenerativeModel({ model: API_CONFIG.DEFAULT_MODEL });

            const result = await model.generateContent([
                basePrompt,
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: asset.base64,
                    },
                },
            ]);

            const responseText = result.response.text();
            let extractedText = '';

            try {
                const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
                const analysis = JSON.parse(cleanJson);
                extractedText = analysis.text;
            } catch (err) {
                extractedText = responseText;
            }

            const newFile = {
                id: Date.now().toString(),
                uri: asset.uri,
                name: `Report_${files.length + 1}.jpg`,
                type: 'image/jpeg',
                extractedText: extractedText
            };

            const updatedFiles = [...files, newFile];
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setFiles(updatedFiles);
            onUpdate({ ...data, files: updatedFiles });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Auto open review for the new file
            openReview(updatedFiles.length - 1, updatedFiles);

        } catch (err) {
            console.error('Analysis error:', err);
            Alert.alert('Error', 'Failed to analyze report. You can still add it and edit text manually.');

            const newFile = {
                id: Date.now().toString(),
                uri: asset.uri,
                name: `Report_${files.length + 1}.jpg`,
                type: 'image/jpeg',
                extractedText: ''
            };
            const updatedFiles = [...files, newFile];
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setFiles(updatedFiles);
            onUpdate({ ...data, files: updatedFiles });
            openReview(updatedFiles.length - 1, updatedFiles);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const removeFile = (index) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const updatedFiles = files.filter((_, i) => i !== index);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFiles(updatedFiles);
        onUpdate({ ...data, files: updatedFiles });
    };

    const openReview = (index, currentFiles = files) => {
        setCurrentReviewIndex(index);
        setReviewText(currentFiles[index].extractedText);
        setReviewModalVisible(true);
    };

    const saveReview = () => {
        const updatedFiles = [...files];
        updatedFiles[currentReviewIndex].extractedText = reviewText;
        setFiles(updatedFiles);
        onUpdate({ ...data, files: updatedFiles });
        setReviewModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' }]}>
                        <Ionicons name="document-text" size={32} color={theme.accent.primary} />
                    </View>
                    <Text style={styles.title}>Medical Reports</Text>
                    <Text style={styles.subtitle}>
                        Upload blood tests, prescriptions, or other documents
                    </Text>
                </View>

                {/* Upload Options */}
                <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.glassContainer}>
                    <View style={styles.uploadOptions}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                            <LinearGradient
                                colors={theme.gradients.accent}
                                style={styles.btnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="camera" size={24} color="#ffffff" />
                                <Text style={styles.btnText}>Take Photo</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.uploadBtnOutline} onPress={pickFromGallery}>
                            <Ionicons name="images" size={20} color={theme.accent.secondary} />
                            <Text style={styles.btnTextOutline}>Upload Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>

                {isAnalyzing && (
                    <View style={styles.analyzingContainer}>
                        <Animated.View style={{ opacity: scanAnim }}>
                            <Ionicons name="scan-outline" size={24} color={theme.accent.secondary} />
                        </Animated.View>
                        <Text style={styles.analyzingText}>AI extracting information...</Text>
                    </View>
                )}

                {/* File List */}
                {files.length > 0 && (
                    <View style={styles.fileListSection}>
                        <Text style={styles.sectionTitle}>Uploaded Documents ({files.length})</Text>
                        {files.map((file, index) => (
                            <BlurView key={file.id} intensity={15} tint={isDark ? 'dark' : 'light'} style={styles.fileGlassItem}>
                                <View style={styles.fileIcon}>
                                    <Ionicons name="image" size={20} color={theme.accent.primary} />
                                </View>
                                <View style={styles.fileInfo}>
                                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                                    <Text style={styles.fileSnippet} numberOfLines={1}>
                                        {file.extractedText ? file.extractedText.substring(0, 40) + '...' : 'No text extracted'}
                                    </Text>
                                </View>
                                <View style={styles.fileActions}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => openReview(index)}>
                                        <Ionicons name="eye" size={20} color={theme.accent.secondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => removeFile(index)}>
                                        <Ionicons name="trash" size={20} color={theme.semantic.error} />
                                    </TouchableOpacity>
                                </View>
                            </BlurView>
                        ))}
                    </View>
                )}

                {!files.length && !isAnalyzing && (
                    <View style={styles.emptyState}>
                        <Ionicons name="cloud-upload-outline" size={64} color={theme.border.default} />
                        <Text style={styles.emptyText}>No reports uploaded yet</Text>
                        <Text style={styles.emptySubtext}>Medical documents help our AI provide better diagnosis</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Review Modal */}
            <Modal
                visible={reviewModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Review Information</Text>
                            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>
                            Verify correctly extracted text for our AI analysis
                        </Text>

                        <TextInput
                            style={styles.reviewInput}
                            multiline
                            value={reviewText}
                            onChangeText={setReviewText}
                            placeholder="Extracted information will appear here..."
                            placeholderTextColor={theme.text.tertiary}
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={saveReview}>
                            <LinearGradient
                                colors={theme.gradients.accent}
                                style={styles.btnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.btnText}>Save & Confirm</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 24, paddingVertical: 10 },
    iconContainer: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        borderWidth: 1, borderColor: theme.accent.primary + '30',
    },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.text.primary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: theme.text.secondary, textAlign: 'center' },

    glassContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border.subtle,
        marginBottom: 24,
        padding: 16,
    },
    uploadOptions: { flexDirection: 'row', gap: 12 },
    uploadBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    uploadBtnOutline: {
        flex: 1, borderRadius: 12, borderWidth: 1, borderColor: theme.accent.secondary,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50,
        backgroundColor: 'transparent',
    },
    btnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, height: 50
    },
    btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
    btnTextOutline: { color: theme.accent.secondary, fontWeight: 'bold', fontSize: 16 },

    analyzingContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
        backgroundColor: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.05)',
        padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.semantic.warning,
    },
    analyzingText: { color: theme.semantic.warning, fontSize: 15, fontWeight: '600' },

    fileListSection: { marginBottom: 24 },
    sectionTitle: { color: theme.text.tertiary, fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    fileGlassItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border.subtle,
        overflow: 'hidden',
    },
    fileIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    fileInfo: { flex: 1 },
    fileName: { color: theme.text.primary, fontWeight: '600', fontSize: 15, marginBottom: 2 },
    fileSnippet: { color: theme.text.secondary, fontSize: 12 },
    fileActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8, backgroundColor: theme.surface.elevated, borderRadius: 8 },

    emptyState: { alignItems: 'center', paddingVertical: 40, opacity: 0.8 },
    emptyText: { color: theme.text.primary, fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptySubtext: { color: theme.text.secondary, fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: theme.background.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, maxHeight: '90%', borderWidth: 1, borderTopColor: theme.border.default,
        shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 12
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text.primary },
    modalSubtitle: { color: theme.text.secondary, fontSize: 13, marginBottom: 20 },
    reviewInput: {
        backgroundColor: theme.input.background, borderRadius: 16, color: theme.text.primary,
        padding: 16, fontSize: 15, minHeight: 200, maxHeight: 400, textAlignVertical: 'top',
        borderWidth: 1, borderColor: theme.border.default, marginBottom: 20
    },
    saveBtn: { borderRadius: 12, overflow: 'hidden' },
});
