/**
 * InfographicModal Component for Sihat TCM Mobile
 * 
 * Full-screen modal for generating and sharing visual infographics
 * from TCM diagnosis reports. Features style selection, content toggles,
 * SVG preview, and native sharing capabilities.
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Switch,
    ActivityIndicator,
    Alert,
    Platform,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, {
    Rect,
    Text as SvgText,
    Circle,
    Path,
    Line,
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop,
    G,
} from 'react-native-svg';

import { useLanguage } from '../contexts/LanguageContext';
import {
    INFOGRAPHIC_STYLES,
    CONTENT_OPTIONS,
    buildInfographicContent,
} from '../lib/infographicGenerator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Infographic translations
const modalTranslations = {
    en: {
        title: 'Create Infographic',
        subtitle: 'Transform your report into visual content',
        selectStyle: 'Select Style',
        selectContent: 'Select Content',
        generating: 'Generating...',
        generated: 'Infographic Ready!',
        save: 'Save to Photos',
        share: 'Share',
        close: 'Close',
        generate: 'Generate',
        tip: '💡 Infographics are great for sharing with family!',
        error: 'Generation failed. Please try again.',
        saved: 'Saved to Photos!',
        permissionDenied: 'Permission required to save photos',
        styles: {
            modern: 'Modern',
            modernDesc: 'Clean, professional',
            traditional: 'Traditional',
            traditionalDesc: 'Classic TCM aesthetic',
            minimal: 'Minimal',
            minimalDesc: 'Simple, elegant',
            colorful: 'Colorful',
            colorfulDesc: 'Vibrant, engaging',
        },
        content: {
            diagnosis: 'Diagnosis & Constitution',
            dietary: 'Dietary Advice',
            lifestyle: 'Lifestyle Tips',
            acupoints: 'Acupoints',
            exercise: 'Exercise',
            metrics: 'Health Metrics',
        },
    },
    zh: {
        title: '创建信息图',
        subtitle: '将报告转换为视觉内容',
        selectStyle: '选择风格',
        selectContent: '选择内容',
        generating: '生成中...',
        generated: '信息图已生成！',
        save: '保存到相册',
        share: '分享',
        close: '关闭',
        generate: '生成',
        tip: '💡 信息图非常适合与家人分享！',
        error: '生成失败，请重试。',
        saved: '已保存到相册！',
        permissionDenied: '需要权限才能保存照片',
        styles: {
            modern: '现代',
            modernDesc: '简洁专业',
            traditional: '传统',
            traditionalDesc: '经典中医风格',
            minimal: '极简',
            minimalDesc: '简单优雅',
            colorful: '彩色',
            colorfulDesc: '活力四射',
        },
        content: {
            diagnosis: '诊断与体质',
            dietary: '饮食建议',
            lifestyle: '生活方式',
            acupoints: '穴位按摩',
            exercise: '运动建议',
            metrics: '健康指标',
        },
    },
    ms: {
        title: 'Cipta Infografik',
        subtitle: 'Ubah laporan kepada kandungan visual',
        selectStyle: 'Pilih Gaya',
        selectContent: 'Pilih Kandungan',
        generating: 'Menjana...',
        generated: 'Infografik Siap!',
        save: 'Simpan ke Foto',
        share: 'Kongsi',
        close: 'Tutup',
        generate: 'Jana',
        tip: '💡 Infografik bagus untuk berkongsi dengan keluarga!',
        error: 'Gagal menjana. Sila cuba lagi.',
        saved: 'Disimpan ke Foto!',
        permissionDenied: 'Kebenaran diperlukan untuk menyimpan foto',
        styles: {
            modern: 'Moden',
            modernDesc: 'Bersih, profesional',
            traditional: 'Tradisional',
            traditionalDesc: 'Estetik TCM klasik',
            minimal: 'Minimal',
            minimalDesc: 'Ringkas, elegan',
            colorful: 'Berwarna',
            colorfulDesc: 'Meriah, menarik',
        },
        content: {
            diagnosis: 'Diagnosis & Perlembagaan',
            dietary: 'Nasihat Pemakanan',
            lifestyle: 'Tips Gaya Hidup',
            acupoints: 'Titik Akupresur',
            exercise: 'Senaman',
            metrics: 'Metrik Kesihatan',
        },
    },
};

// Style card component
const StyleCard = ({ style, selected, onSelect, t, styles: componentStyles }) => {
    const styleNames = {
        modern: t.styles.modern,
        traditional: t.styles.traditional,
        minimal: t.styles.minimal,
        colorful: t.styles.colorful,
    };
    const styleDescs = {
        modern: t.styles.modernDesc,
        traditional: t.styles.traditionalDesc,
        minimal: t.styles.minimalDesc,
        colorful: t.styles.colorfulDesc,
    };

    return (
        <TouchableOpacity
            style={[
                componentStyles.styleCard,
                selected && componentStyles.styleCardSelected,
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(style.id);
            }}
            activeOpacity={0.7}
        >
            {selected && (
                <View style={componentStyles.styleCardCheck}>
                    <Ionicons name="checkmark" size={12} color="#ffffff" />
                </View>
            )}
            <View style={componentStyles.colorSwatches}>
                {style.colors.map((color, idx) => (
                    <View
                        key={idx}
                        style={[componentStyles.colorSwatch, { backgroundColor: color }]}
                    />
                ))}
            </View>
            <Text style={componentStyles.styleCardName}>{styleNames[style.id]}</Text>
            <Text style={componentStyles.styleCardDesc}>{styleDescs[style.id]}</Text>
        </TouchableOpacity>
    );
};

// Content toggle component
const ContentToggle = ({ id, label, value, onToggle, icon, styles: componentStyles, theme }) => (
    <View style={componentStyles.contentToggle}>
        <View style={componentStyles.contentToggleLeft}>
            <View style={[componentStyles.contentToggleIcon, { backgroundColor: `${theme.accent.primary}20` }]}>
                <Ionicons name={icon} size={16} color={theme.accent.primary} />
            </View>
            <Text style={componentStyles.contentToggleLabel}>{label}</Text>
        </View>
        <Switch
            value={value}
            onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(id, val);
            }}
            trackColor={{ false: '#e2e8f0', true: `${theme.accent.primary}80` }}
            thumbColor={value ? theme.accent.primary : '#f1f5f9'}
        />
    </View>
);

// SVG Infographic Preview Component
const InfographicPreview = React.forwardRef(({ sections, style, theme }, ref) => {
    const width = 360;
    const padding = 16;
    let currentY = 30;
    const sectionGap = 16;

    // Calculate dynamic height
    let contentHeight = 120; // Header
    sections.forEach(section => {
        if (section.type === 'diagnosis') {
            contentHeight += 90;
        } else if (section.type === 'dietary') {
            contentHeight += 50 + (section.beneficial?.length || 0) * 26 + (section.avoid?.length || 0) * 26;
        } else {
            contentHeight += 40 + (section.items?.length || 0) * 26;
        }
        contentHeight += sectionGap;
    });
    contentHeight += 70; // Footer + yin-yang

    const height = Math.max(450, contentHeight);

    // Truncate helper
    const truncate = (str, max = 32) => {
        if (!str) return '';
        const s = String(str);
        return s.length > max ? s.substring(0, max) + '...' : s;
    };

    return (
        <View ref={ref} collapsable={false} style={{ backgroundColor: style.background }}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <Defs>
                    <SvgLinearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={style.primary} stopOpacity="1" />
                        <Stop offset="100%" stopColor={style.secondary} stopOpacity="1" />
                    </SvgLinearGradient>
                </Defs>

                {/* Background */}
                <Rect width={width} height={height} fill={style.background} />

                {/* Header */}
                <Rect x={padding} y={currentY} width={width - padding * 2} height={85} rx={14} fill="url(#headerGrad)" />
                <SvgText x={width / 2} y={currentY + 38} textAnchor="middle" fill="white" fontSize="17" fontWeight="bold" fontFamily="System">
                    🏥 Your TCM Summary
                </SvgText>
                <SvgText x={width / 2} y={currentY + 60} textAnchor="middle" fill="white" fontSize="11" opacity="0.9" fontFamily="System">
                    Traditional Chinese Medicine
                </SvgText>

                {(() => {
                    let y = currentY + 100;
                    const elements = [];

                    sections.forEach((section, sIdx) => {
                        if (section.type === 'diagnosis') {
                            elements.push(
                                <G key={`section-${sIdx}`}>
                                    <Rect x={padding} y={y} width={width - padding * 2} height={70} rx={10} fill="white" />
                                    <Rect x={padding} y={y} width={4} height={70} fill={style.accent} />
                                    <SvgText x={padding + 14} y={y + 20} fill={style.accent} fontSize="10" fontWeight="600" fontFamily="System">
                                        {section.title}
                                    </SvgText>
                                    <SvgText x={padding + 14} y={y + 40} fill={style.text} fontSize="13" fontWeight="bold" fontFamily="System">
                                        {truncate(section.primary, 35)}
                                    </SvgText>
                                    {section.secondary && (
                                        <SvgText x={padding + 14} y={y + 58} fill="#64748b" fontSize="10" fontFamily="System">
                                            {truncate(section.secondary, 40)}
                                        </SvgText>
                                    )}
                                </G>
                            );
                            y += 90;
                        } else if (section.type === 'dietary') {
                            elements.push(
                                <SvgText key={`title-${sIdx}`} x={padding + 6} y={y + 14} fill={style.accent} fontSize="11" fontWeight="600" fontFamily="System">
                                    {section.title}
                                </SvgText>
                            );
                            y += 26;

                            section.beneficial?.forEach((food, idx) => {
                                elements.push(
                                    <G key={`ben-${sIdx}-${idx}`}>
                                        <Rect x={padding} y={y} width={width - padding * 2} height={22} rx={5} fill="white" />
                                        <SvgText x={padding + 10} y={y + 15} fill="#22c55e" fontSize="11" fontFamily="System">✅</SvgText>
                                        <SvgText x={padding + 28} y={y + 15} fill={style.text} fontSize="10" fontFamily="System">
                                            {truncate(food, 32)}
                                        </SvgText>
                                    </G>
                                );
                                y += 26;
                            });

                            section.avoid?.forEach((food, idx) => {
                                elements.push(
                                    <G key={`avoid-${sIdx}-${idx}`}>
                                        <Rect x={padding} y={y} width={width - padding * 2} height={22} rx={5} fill="#fef2f2" />
                                        <SvgText x={padding + 10} y={y + 15} fill="#ef4444" fontSize="11" fontFamily="System">❌</SvgText>
                                        <SvgText x={padding + 28} y={y + 15} fill="#dc2626" fontSize="10" fontFamily="System">
                                            {truncate(food, 32)}
                                        </SvgText>
                                    </G>
                                );
                                y += 26;
                            });
                            y += sectionGap;
                        } else {
                            elements.push(
                                <SvgText key={`title-${sIdx}`} x={padding + 6} y={y + 14} fill={style.accent} fontSize="11" fontWeight="600" fontFamily="System">
                                    {section.title}
                                </SvgText>
                            );
                            y += 26;

                            section.items?.forEach((item, idx) => {
                                elements.push(
                                    <G key={`item-${sIdx}-${idx}`}>
                                        <Rect x={padding} y={y} width={width - padding * 2} height={22} rx={5} fill="white" />
                                        <SvgText x={padding + 10} y={y + 15} fill={style.accent} fontSize="10" fontFamily="System">
                                            {idx + 1}.
                                        </SvgText>
                                        <SvgText x={padding + 24} y={y + 15} fill={style.text} fontSize="10" fontFamily="System">
                                            {truncate(item, 34)}
                                        </SvgText>
                                    </G>
                                );
                                y += 26;
                            });
                            y += sectionGap;
                        }
                    });

                    // Yin-Yang
                    const yinYangX = width - 50;
                    const yinYangY = y + 5;
                    elements.push(
                        <G key="yinyang">
                            <Circle cx={yinYangX} cy={yinYangY} r={22} fill="white" />
                            <Circle cx={yinYangX} cy={yinYangY - 11} r={4} fill={style.text} />
                            <Circle cx={yinYangX} cy={yinYangY + 11} r={4} fill={style.primary} />
                        </G>
                    );

                    // Footer
                    const footerY = height - 40;
                    elements.push(
                        <G key="footer">
                            <Line x1={padding} y1={footerY - 8} x2={width - padding} y2={footerY - 8} stroke="#e2e8f0" strokeWidth="1" />
                            <SvgText x={width / 2} y={footerY + 8} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="System">
                                Generated by Sihat TCM | {new Date().toLocaleDateString()}
                            </SvgText>
                            <SvgText x={width / 2} y={footerY + 22} textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="System">
                                Consult a licensed practitioner for medical advice
                            </SvgText>
                        </G>
                    );

                    return elements;
                })()}
            </Svg>
        </View>
    );
});

// Main InfographicModal component
export default function InfographicModal({
    visible,
    onClose,
    reportData,
    patientData,
    constitution,
    theme,
    isDark,
}) {
    const { language } = useLanguage();
    const t = modalTranslations[language] || modalTranslations.en;
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const viewShotRef = useRef(null);

    const [selectedStyle, setSelectedStyle] = useState('modern');
    const [contentSelection, setContentSelection] = useState({
        diagnosis: true,
        dietary: true,
        lifestyle: true,
        acupoints: false,
        exercise: false,
        metrics: false,
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const styleConfig = INFOGRAPHIC_STYLES[selectedStyle];

    // Build content sections
    const sections = useMemo(() =>
        buildInfographicContent(reportData, patientData, constitution, contentSelection),
        [reportData, patientData, constitution, contentSelection]
    );

    const toggleContent = useCallback((id, value) => {
        setContentSelection(prev => ({ ...prev, [id]: value }));
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Simulate generation delay for UX
        await new Promise(resolve => setTimeout(resolve, 800));

        setIsGenerating(false);
        setIsGenerated(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleSave = async () => {
        if (!viewShotRef.current || isSaving) return;

        setIsSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Request permissions
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t.error, t.permissionDenied);
                return;
            }

            // Capture the view
            const uri = await viewShotRef.current.capture({
                format: 'png',
                quality: 1,
            });

            // Save to media library
            await MediaLibrary.saveToLibraryAsync(uri);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('✅', t.saved);
        } catch (error) {
            console.error('Save error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t.error, error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        if (!viewShotRef.current || isSharing) return;

        setIsSharing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Capture the view
            const uri = await viewShotRef.current.capture({
                format: 'png',
                quality: 1,
            });

            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert(t.error, 'Sharing is not available on this device');
                return;
            }

            // Share
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Share TCM Infographic',
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Share error:', error);
            if (error.message !== 'User did not share') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } finally {
            setIsSharing(false);
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsGenerated(false);
        onClose();
    };

    const contentLabels = {
        diagnosis: t.content.diagnosis,
        dietary: t.content.dietary,
        lifestyle: t.content.lifestyle,
        acupoints: t.content.acupoints,
        exercise: t.content.exercise,
        metrics: t.content.metrics,
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <LinearGradient
                    colors={['#8b5cf6', '#7c3aed']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="image-outline" size={24} color="#ffffff" />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.headerTitle}>{t.title}</Text>
                            <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Ionicons name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </LinearGradient>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {!isGenerated ? (
                        <>
                            {/* Style Selection */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="color-palette-outline" size={18} color={theme.accent.primary} />
                                    <Text style={styles.sectionTitle}>{t.selectStyle}</Text>
                                </View>
                                <View style={styles.styleGrid}>
                                    {Object.values(INFOGRAPHIC_STYLES).map(style => (
                                        <StyleCard
                                            key={style.id}
                                            style={style}
                                            selected={selectedStyle === style.id}
                                            onSelect={setSelectedStyle}
                                            t={t}
                                            styles={styles}
                                        />
                                    ))}
                                </View>
                            </View>

                            {/* Content Selection */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="document-text-outline" size={18} color={theme.accent.primary} />
                                    <Text style={styles.sectionTitle}>{t.selectContent}</Text>
                                </View>
                                <View style={styles.contentToggles}>
                                    {CONTENT_OPTIONS.map(option => (
                                        <ContentToggle
                                            key={option.id}
                                            id={option.id}
                                            label={contentLabels[option.id]}
                                            value={contentSelection[option.id]}
                                            onToggle={toggleContent}
                                            icon={option.icon}
                                            styles={styles}
                                            theme={theme}
                                        />
                                    ))}
                                </View>
                            </View>

                            {/* Preview Placeholder */}
                            <View style={styles.previewPlaceholder}>
                                <View style={styles.previewBox}>
                                    <Ionicons name="sparkles-outline" size={40} color={theme.text.tertiary} />
                                    <Text style={styles.previewText}>Preview will appear here</Text>
                                </View>
                            </View>

                            {/* Tip */}
                            <View style={styles.tipContainer}>
                                <Text style={styles.tipText}>{t.tip}</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Generated Infographic */}
                            <View style={styles.generatedContainer}>
                                <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                                    <InfographicPreview
                                        sections={sections}
                                        style={styleConfig}
                                        theme={theme}
                                    />
                                </ViewShot>
                            </View>

                            {/* Success Message */}
                            <View style={styles.successMessage}>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                                </View>
                                <Text style={styles.successText}>{t.generated}</Text>
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Footer Actions */}
                <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.footer}>
                    <View style={styles.footerContent}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
                            <Text style={styles.secondaryButtonText}>{t.close}</Text>
                        </TouchableOpacity>

                        {isGenerated ? (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.saveButton]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#8b5cf6" />
                                    ) : (
                                        <Ionicons name="download-outline" size={20} color="#8b5cf6" />
                                    )}
                                    <Text style={styles.saveButtonText}>{t.save}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.shareActionButton]}
                                    onPress={handleShare}
                                    disabled={isSharing}
                                >
                                    <LinearGradient
                                        colors={['#8b5cf6', '#7c3aed']}
                                        style={styles.gradientButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {isSharing ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Ionicons name="share-outline" size={20} color="#ffffff" />
                                        )}
                                        <Text style={styles.shareButtonText}>{t.share}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.generateButton}
                                onPress={handleGenerate}
                                disabled={isGenerating}
                            >
                                <LinearGradient
                                    colors={['#8b5cf6', '#7c3aed']}
                                    style={styles.gradientButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isGenerating ? (
                                        <>
                                            <ActivityIndicator size="small" color="#ffffff" />
                                            <Text style={styles.generateButtonText}>{t.generating}</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="sparkles" size={20} color="#ffffff" />
                                            <Text style={styles.generateButtonText}>{t.generate}</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </BlurView>
            </View>
        </Modal>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {},
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 120,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text.primary,
    },
    styleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    styleCard: {
        width: (SCREEN_WIDTH - 52) / 2,
        padding: 14,
        borderRadius: 14,
        backgroundColor: isDark ? theme.background.secondary : '#ffffff',
        borderWidth: 2,
        borderColor: isDark ? theme.background.tertiary : '#e2e8f0',
    },
    styleCardSelected: {
        borderColor: '#8b5cf6',
        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
    },
    styleCardCheck: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorSwatches: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 10,
    },
    colorSwatch: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    styleCardName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
    },
    styleCardDesc: {
        fontSize: 12,
        color: theme.text.tertiary,
        marginTop: 2,
    },
    contentToggles: {
        backgroundColor: isDark ? theme.background.secondary : '#ffffff',
        borderRadius: 14,
        overflow: 'hidden',
    },
    contentToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? theme.background.tertiary : '#f1f5f9',
    },
    contentToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    contentToggleIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentToggleLabel: {
        fontSize: 14,
        color: theme.text.primary,
    },
    previewPlaceholder: {
        backgroundColor: isDark ? theme.background.secondary : '#f1f5f9',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
    },
    previewBox: {
        aspectRatio: 3 / 4,
        backgroundColor: isDark ? theme.background.primary : '#ffffff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: isDark ? theme.background.tertiary : '#e2e8f0',
    },
    previewText: {
        fontSize: 14,
        color: theme.text.tertiary,
        marginTop: 12,
    },
    tipContainer: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    tipText: {
        fontSize: 13,
        color: '#8b5cf6',
        textAlign: 'center',
    },
    generatedContainer: {
        backgroundColor: isDark ? theme.background.secondary : '#f8fafc',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    successMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    successIcon: {},
    successText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#22c55e',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: isDark ? theme.background.tertiary : '#e2e8f0',
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    secondaryButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: isDark ? theme.background.secondary : '#f1f5f9',
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text.secondary,
    },
    generateButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    generateButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
        flex: 1,
    },
    actionButton: {
        flex: 1,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8b5cf6',
    },
    shareActionButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    shareButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
});
