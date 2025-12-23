import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Share,
    RefreshControl,
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Svg, Circle, G, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../constants/themes';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import ReportChatModal from '../../components/ReportChatModal';
import DoctorVerificationModal from '../../components/DoctorVerificationModal';
import InfographicModal from '../../components/InfographicModal';
import WesternDoctorChatModal from '../../components/WesternDoctorChatModal';
import { generateAndSharePdf } from '../../lib/pdfGenerator';

// Collapsible Section Component
const CollapsibleSection = ({ title, icon, accentColor, children, defaultOpen = false, theme, styles, index, animValue }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const animatedHeight = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

    const toggleSection = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const toValue = isOpen ? 0 : 1;
        Animated.timing(animatedHeight, {
            toValue,
            duration: 250,
            useNativeDriver: false,
        }).start();
        setIsOpen(!isOpen);
    };

    const heightInterpolate = animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1000], // Max height
    });

    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0],
    });

    return (
        <Animated.View style={[
            styles.sectionCardContainer,
            { opacity: animValue, transform: [{ translateY }] }
        ]}>
            <BlurView intensity={30} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={styles.glassBlur}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.glassGradient}
                >
                    <TouchableOpacity
                        style={[styles.sectionHeader, { borderLeftColor: accentColor, borderLeftWidth: 4 }]}
                        onPress={toggleSection}
                        activeOpacity={0.7}
                    >
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: `${accentColor}20` }]}>
                                <Ionicons name={icon} size={20} color={accentColor} />
                            </View>
                            <Text style={styles.sectionTitle}>{title}</Text>
                        </View>
                        <Ionicons
                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.text.tertiary}
                        />
                    </TouchableOpacity>
                    <Animated.View style={[styles.sectionContent, { maxHeight: heightInterpolate, opacity: animatedHeight }]}>
                        {children}
                    </Animated.View>
                </LinearGradient>
            </BlurView>
        </Animated.View>
    );
};

// Result Card Component (non-collapsible)
const ResultCard = ({ title, icon, children, accentColor, highlight = false, theme, styles, index, animValue }) => {
    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0],
    });

    return (
        <Animated.View style={[
            styles.resultCardContainer,
            { opacity: animValue, transform: [{ translateY }] }
        ]}>
            <BlurView intensity={highlight ? 45 : 30} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={styles.glassBlur}>
                <LinearGradient
                    colors={highlight ?
                        [theme.mode === 'dark' ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)', 'rgba(5,150,105,0.05)'] :
                        ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
                    style={styles.glassGradient}
                >
                    <View style={[styles.resultCard, { borderLeftColor: accentColor, borderLeftWidth: 4 }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconContainer, { backgroundColor: `${accentColor}20` }]}>
                                <Ionicons name={icon} size={20} color={accentColor} />
                            </View>
                            <Text style={styles.cardTitle}>{title}</Text>
                        </View>
                        <View style={styles.cardContent}>{children}</View>
                    </View>
                </LinearGradient>
            </BlurView>
        </Animated.View>
    );
};

// List Item Component
const ListItem = ({ text, color, styles }) => (
    <View style={styles.listItem}>
        <View style={[styles.listDot, { backgroundColor: color }]} />
        <Text style={styles.listText}>{text}</Text>
    </View>
);

// Chi Balance Circle Component
const ChiBalanceCircle = ({ theme, styles, animValue }) => {
    const { t } = useLanguage();
    // Mock balance data (would be derived from reportData in reality)
    const elements = [
        { label: t.report?.chi?.qi || 'Qi (气)', value: 85, color: theme.accent.primary, icon: 'flash-outline' },
        { label: t.report?.chi?.blood || 'Blood (血)', value: 72, color: theme.semantic.error, icon: 'water-outline' },
        { label: t.report?.chi?.yin || 'Yin (阴)', value: 65, color: theme.accent.tertiary, icon: 'moon-outline' },
        { label: t.report?.chi?.yang || 'Yang (阳)', value: 78, color: theme.accent.secondary, icon: 'sunny-outline' },
    ];

    const size = 200;
    const strokeWidth = 12;
    const radius = (size - strokeWidth * 6) / 2;
    const center = size / 2;

    return (
        <View style={styles.chiContainer}>
            <View style={styles.svgWrapper}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {elements.map((el, i) => {
                        const r = radius + (i * (strokeWidth + 4));
                        const circum = 2 * Math.PI * r;
                        const progress = (el.value / 100) * circum;

                        return (
                            <G key={i} rotation="-90" origin={`${center}, ${center}`}>
                                <Circle
                                    cx={center}
                                    cy={center}
                                    r={r}
                                    stroke={el.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${progress}, ${circum}`}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    opacity={0.8}
                                />
                                <Circle
                                    cx={center}
                                    cy={center}
                                    r={r}
                                    stroke={el.color}
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    opacity={0.1}
                                />
                            </G>
                        );
                    })}
                </Svg>
                <View style={[styles.chiCenterBox, { borderColor: theme.accent.primary }]}>
                    <Text style={styles.chiCenterPercent}>75%</Text>
                    <Text style={styles.chiCenterLabel}>{t.report?.chi?.balance || 'Balance'}</Text>
                </View>
            </View>
            <View style={styles.chiLegend}>
                {elements.map((el, i) => (
                    <View key={i} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: el.color }]} />
                        <Text style={styles.legendText}>{el.label}</Text>
                        <Text style={styles.legendValue}>{el.value}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// Herbal Formula Card Component
const HerbalFormulaCard = ({ formula, styles }) => {
    const { t } = useLanguage();
    return (
        <View style={styles.herbalCard}>
            <Text style={styles.herbalName}>{formula.name}</Text>
            {formula.purpose && (
                <Text style={styles.herbalDetail}>
                    <Text style={styles.herbalLabel}>{t.report?.formula?.purpose || 'Purpose'}: </Text>
                    {formula.purpose}
                </Text>
            )}
            {formula.ingredients && formula.ingredients.length > 0 && (
                <Text style={styles.herbalDetail}>
                    <Text style={styles.herbalLabel}>{t.report?.formula?.ingredients || 'Ingredients'}: </Text>
                    {formula.ingredients.join(', ')}
                </Text>
            )}
            {formula.dosage && (
                <Text style={styles.herbalDetail}>
                    <Text style={styles.herbalLabel}>{t.report?.formula?.dosage || 'Dosage'}: </Text>
                    {formula.dosage}
                </Text>
            )}
        </View>
    );
};

// Image Zoom Modal Component
const ImageZoomModal = ({ uri, visible, onClose, theme, isDark }) => {
    if (!uri) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <BlurView intensity={Platform.OS === 'ios' ? 90 : 100} tint="dark" style={StyleSheet.absoluteFill}>
                <TouchableOpacity style={styles.zoomCloseButton} onPress={onClose}>
                    <Ionicons name="close" size={32} color="#ffffff" />
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={styles.zoomScrollContent}
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    centerContent={true}
                >
                    <Image
                        source={{ uri }}
                        style={styles.zoomImage}
                        resizeMode="contain"
                    />
                </ScrollView>

                <View style={styles.zoomFooter}>
                    <Text style={styles.zoomHint}>
                        {Platform.OS === 'ios' ? 'Pinch to zoom' : 'Double tap if supported'} • Swipe to dismiss
                    </Text>
                </View>
            </BlurView>
        </Modal>
    );
};

// Helper to extract string from various data formats
const extractString = (val, fallback = '') => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        if (val.primary_pattern) return val.primary_pattern;
        if (val.type) return val.type;
        if (val.summary) return val.summary;
        return Object.entries(val)
            .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
            .join('\n');
    }
    return String(val);
};

// Generate comprehensive mock report based on constitution
const generateMockReport = (constitution) => {
    const reports = {
        'Yang Deficiency': {
            diagnosis: {
                primary_pattern: 'Yang Deficiency',
                secondary_patterns: ['Kidney Yang Deficiency', 'Spleen Yang Deficiency'],
                affected_organs: ['Kidney', 'Spleen'],
            },
            constitution: {
                type: 'Yang Deficiency',
                description: 'Your body tends to feel cold and lacks vital energy. You may experience fatigue, cold extremities, and low metabolism.',
            },
            analysis: {
                summary: 'Based on your symptoms and assessment, you present with classic signs of Yang Deficiency. This means your body\'s warming and active energy is insufficient.',
                key_findings: {
                    from_inquiry: 'Cold hands and feet, fatigue, preference for warmth',
                    from_visual: 'Pale tongue with white coating',
                    from_pulse: 'Deep and slow pulse',
                },
            },
            recommendations: {
                food: ['Ginger', 'Cinnamon', 'Lamb', 'Walnuts', 'Leeks', 'Fennel'],
                avoid: ['Cold drinks', 'Raw foods', 'Ice cream', 'Salads', 'Watermelon'],
                lifestyle: ['Keep warm, especially lower back and feet', 'Avoid cold environments', 'Get adequate sleep', 'Practice gentle warming exercises'],
                acupoints: ['KI3 (Taixi) - Inner ankle', 'CV4 (Guanyuan) - Lower abdomen', 'GV4 (Mingmen) - Lower back'],
                exercise: ['Tai Chi', 'Qigong', 'Gentle yoga', 'Walking in sunshine'],
                sleep_guidance: 'Sleep before 11 PM, keep feet warm at night',
                emotional_care: 'Avoid excessive fear and anxiety. Practice meditation.',
                herbal_formulas: [
                    { name: 'Jin Gui Shen Qi Wan', purpose: 'Warm Kidney Yang', ingredients: ['Rehmannia', 'Cinnamon Bark', 'Aconite'] },
                ],
            },
        },
        'Yin Deficiency': {
            diagnosis: {
                primary_pattern: 'Yin Deficiency',
                secondary_patterns: ['Liver Yin Deficiency', 'Heart Yin Deficiency'],
                affected_organs: ['Liver', 'Heart', 'Kidney'],
            },
            constitution: {
                type: 'Yin Deficiency',
                description: 'Your body tends to run hot with insufficient cooling and nourishing fluids. You may experience restlessness, night sweats, and dryness.',
            },
            analysis: {
                summary: 'Your assessment indicates Yin Deficiency patterns. This means your body\'s cooling, moistening, and calming energy is insufficient.',
                key_findings: {
                    from_inquiry: 'Night sweats, restlessness, insomnia, dry throat',
                    from_visual: 'Red tongue with little coating',
                    from_pulse: 'Rapid and thin pulse',
                },
            },
            recommendations: {
                food: ['Pears', 'Watermelon', 'Cucumber', 'Tofu', 'Eggs', 'Duck', 'Black sesame'],
                avoid: ['Spicy foods', 'Alcohol', 'Coffee', 'Deep-fried foods', 'Lamb'],
                lifestyle: ['Avoid staying up late', 'Practice calming activities', 'Stay hydrated', 'Avoid excessive sweating'],
                acupoints: ['KI6 (Zhaohai) - Inner ankle', 'SP6 (Sanyinjiao) - Lower leg', 'HT7 (Shenmen) - Wrist'],
                exercise: ['Swimming', 'Yin yoga', 'Meditation', 'Slow walks'],
                sleep_guidance: 'Keep bedroom cool and quiet, avoid screens before bed',
                emotional_care: 'Practice mindfulness, avoid overwork and stress.',
                herbal_formulas: [
                    { name: 'Liu Wei Di Huang Wan', purpose: 'Nourish Kidney Yin', ingredients: ['Rehmannia', 'Cornus', 'Dioscorea'] },
                ],
            },
        },
        'Spleen Qi Deficiency': {
            diagnosis: {
                primary_pattern: 'Spleen Qi Deficiency',
                secondary_patterns: ['Dampness Accumulation'],
                affected_organs: ['Spleen', 'Stomach'],
            },
            constitution: {
                type: 'Spleen Qi Deficiency',
                description: 'Your digestive system needs strengthening. You may experience bloating, fatigue after eating, and loose stools.',
            },
            analysis: {
                summary: 'Your symptoms indicate Spleen Qi Deficiency, which affects digestion and energy production.',
                key_findings: {
                    from_inquiry: 'Poor appetite, bloating, loose stools, fatigue',
                    from_visual: 'Pale tongue with teeth marks',
                    from_pulse: 'Weak and soft pulse',
                },
            },
            recommendations: {
                food: ['Ginger', 'Rice porridge', 'Sweet potato', 'Pumpkin', 'Dates', 'Chicken'],
                avoid: ['Dairy', 'Greasy foods', 'Cold foods', 'Raw vegetables', 'Excessive sugar'],
                lifestyle: ['Eat regular meals', 'Chew food thoroughly', 'Avoid eating when stressed', 'Rest after meals'],
                acupoints: ['ST36 (Zusanli) - Below knee', 'SP3 (Taibai) - Inner foot', 'CV12 (Zhongwan) - Upper abdomen'],
                exercise: ['Walking after meals', 'Gentle stretching', 'Abdominal massage'],
                sleep_guidance: 'Avoid eating late at night, sleep on a slightly elevated pillow',
                emotional_care: 'Avoid excessive worry and overthinking.',
                herbal_formulas: [
                    { name: 'Si Jun Zi Tang', purpose: 'Strengthen Spleen Qi', ingredients: ['Ginseng', 'Atractylodes', 'Poria', 'Licorice'] },
                ],
            },
        },
        'Balanced': {
            diagnosis: {
                primary_pattern: 'Generally Balanced Constitution',
                secondary_patterns: [],
                affected_organs: [],
            },
            constitution: {
                type: 'Balanced',
                description: 'Your constitution appears generally balanced. Continue maintaining healthy habits.',
            },
            analysis: {
                summary: 'Your assessment shows a relatively balanced constitution. Focus on preventive care and maintaining your current health.',
                key_findings: {
                    from_inquiry: 'No significant complaints',
                    from_visual: 'Normal tongue appearance',
                    from_pulse: 'Moderate and even pulse',
                },
            },
            recommendations: {
                food: ['Seasonal fruits', 'Vegetables', 'Whole grains', 'Lean proteins', 'Nuts and seeds'],
                avoid: ['Excessive processed foods', 'Too much sugar', 'Late night eating'],
                lifestyle: ['Maintain regular sleep schedule', 'Exercise regularly', 'Stay hydrated', 'Manage stress'],
                acupoints: ['LI4 (Hegu) - Hand', 'ST36 (Zusanli) - Leg', 'LR3 (Taichong) - Foot'],
                exercise: ['30 minutes daily activity', 'Mix cardio and strength', 'Include flexibility work'],
                sleep_guidance: 'Aim for 7-8 hours of quality sleep',
                emotional_care: 'Maintain work-life balance and social connections.',
                herbal_formulas: [],
            },
        },
    };

    return reports[constitution.type] || reports['Balanced'];
};

export default function ResultsStep({ data, onStartNew, onExit, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const { t } = useLanguage();
    const [refreshing, setRefreshing] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showWesternChat, setShowWesternChat] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [showInfographic, setShowInfographic] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Determine constitution type from symptoms
    const getConstitutionType = () => {
        const symptoms = data.symptoms || [];
        if (symptoms.includes('cold_hands') || symptoms.includes('fatigue')) {
            return { type: 'Yang Deficiency', description: 'Your body tends to feel cold and lacks energy.' };
        }
        if (symptoms.includes('stress') || symptoms.includes('insomnia')) {
            return { type: 'Yin Deficiency', description: 'You may experience restlessness and heat sensations.' };
        }
        if (symptoms.includes('digestion')) {
            return { type: 'Spleen Qi Deficiency', description: 'Your digestive system needs strengthening.' };
        }
        return { type: 'Balanced', description: 'Your constitution appears generally balanced.' };
    };

    const constitution = getConstitutionType();

    // Animations for cascading entry
    const cardAnims = useRef([...Array(12)].map(() => new Animated.Value(0))).current;

    // Initialize report data and trigger animations
    useEffect(() => {
        const report = generateMockReport(constitution);
        setReportData(report);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Staggered animation for cards
        const animations = cardAnims.map((anim, i) =>
            Animated.spring(anim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                delay: i * 80,
                useNativeDriver: true,
            })
        );
        Animated.parallel(animations).start();
    }, []);

    // Handle pull to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Simulate refresh
        setTimeout(() => {
            const report = generateMockReport(constitution);
            setReportData(report);
            setRefreshing(false);
        }, 1000);
    };

    // Share report
    const handleShare = async () => {
        setIsSharing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const diagnosis = reportData?.diagnosis?.primary_pattern || constitution.type;
            const foods = reportData?.recommendations?.food?.slice(0, 5).join(', ') || '';
            const avoid = reportData?.recommendations?.avoid?.slice(0, 3).join(', ') || '';

            const shareText = `📋 TCM Diagnosis Report
━━━━━━━━━━━━━━━━━
🏥 Diagnosis: ${diagnosis}
💪 Constitution: ${constitution.type}

${constitution.description}

🥗 Recommended Foods:
${foods}

🚫 Foods to Avoid:
${avoid}

━━━━━━━━━━━━━━━━━
🌿 Generated by Sihat TCM`;

            await Share.share({
                message: shareText,
                title: 'TCM Diagnosis Report',
            });
        } catch (error) {
            console.error('Share error:', error);
        } finally {
            setIsSharing(false);
        }
    };

    // Download PDF Report
    const handleDownloadPdf = async () => {
        if (isPdfGenerating) return;

        setIsPdfGenerating(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const patientData = {
                name: data.name,
                age: data.age,
                gender: data.gender,
                height: data.height,
                weight: data.weight,
            };

            // Get current language from context
            const langCode = t.langCode || 'en';

            const success = await generateAndSharePdf(
                reportData,
                patientData,
                constitution,
                langCode
            );

            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('PDF download error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsPdfGenerating(false);
        }
    };

    // Calculate BMI
    const calculateBMI = () => {
        if (!data.height || !data.weight) return null;
        const heightM = parseFloat(data.height) / 100;
        const weight = parseFloat(data.weight);
        if (heightM > 0 && weight > 0) {
            return (weight / (heightM * heightM)).toFixed(1);
        }
        return null;
    };

    if (!reportData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.accent.primary} />
                <Text style={styles.loadingText}>{t.report?.preparing || 'Preparing your report...'}</Text>
            </View>
        );
    }

    const diagnosisText = extractString(reportData.diagnosis, 'Pending');
    const analysisText = extractString(reportData.analysis, '');

    return (
        <View style={styles.rootContainer}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.accent.primary}
                        colors={[theme.accent.primary]}
                    />
                }
            >
                <View style={styles.successHeader}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={48} color={theme.accent.primary} />
                    </View>
                    <Text style={styles.successTitle}>{t.report?.assessmentComplete || 'Assessment Complete!'}</Text>
                    <Text style={styles.successSubtitle}>
                        {t.report?.assessmentSubtitle || "Here's your comprehensive TCM health report based on the Four Pillars diagnosis."}
                    </Text>
                </View>

                {/* Patient Summary */}
                {(data.name || data.age || data.gender) && (
                    <ResultCard
                        title={t.report?.patientSummary || 'Patient Summary'}
                        icon="person-outline"
                        accentColor={theme.accent.tertiary}
                        theme={theme}
                        styles={styles}
                        index={0}
                        animValue={cardAnims[0]}
                    >
                        <View style={styles.patientGrid}>
                            {data.name && (
                                <View style={styles.patientItem}>
                                    <Text style={styles.patientLabel}>{t.common.name || 'Name'}</Text>
                                    <Text style={styles.patientValue}>{data.name}</Text>
                                </View>
                            )}
                            {data.age && (
                                <View style={styles.patientItem}>
                                    <Text style={styles.patientLabel}>{t.common.age || 'Age'}</Text>
                                    <Text style={styles.patientValue}>{data.age} {t.common.years || 'years'}</Text>
                                </View>
                            )}
                            {data.gender && (
                                <View style={styles.patientItem}>
                                    <Text style={styles.patientLabel}>{t.common.gender || 'Gender'}</Text>
                                    <Text style={styles.patientValue}>{data.gender}</Text>
                                </View>
                            )}
                            {calculateBMI() && (
                                <View style={styles.patientItem}>
                                    <Text style={styles.patientLabel}>{t.common.bmi || 'BMI'}</Text>
                                    <Text style={styles.patientValue}>{calculateBMI()}</Text>
                                </View>
                            )}
                        </View>
                    </ResultCard>
                )}

                {/* Main Diagnosis Card */}
                <ResultCard
                    title={t.report?.diagnosisTitle || 'TCM Diagnosis (辨证)'}
                    icon="medical-outline"
                    accentColor={theme.accent.primary}
                    theme={theme}
                    styles={styles}
                    highlight
                    index={1}
                    animValue={cardAnims[1]}
                >
                    <Text style={styles.diagnosisText}>{diagnosisText}</Text>
                    {reportData.diagnosis?.secondary_patterns?.length > 0 && (
                        <View style={styles.secondaryPatterns}>
                            <Text style={styles.secondaryLabel}>{t.report?.secondaryPatterns || 'Secondary Patterns'}:</Text>
                            <Text style={styles.secondaryText}>
                                {reportData.diagnosis.secondary_patterns.join(', ')}
                            </Text>
                        </View>
                    )}
                    {reportData.diagnosis?.affected_organs?.length > 0 && (
                        <View style={styles.affectedOrgans}>
                            <Text style={styles.affectedLabel}>{t.report?.affectedOrgans || 'Affected Organs'}:</Text>
                            <View style={styles.organsRow}>
                                {reportData.diagnosis.affected_organs.map((organ, idx) => (
                                    <View key={idx} style={styles.organChip}>
                                        <Text style={styles.organChipText}>{organ}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </ResultCard>

                {/* Constitution Type and Chi Balance */}
                <ResultCard
                    title={t.report?.constitutionTitle || 'Constitution & Vitality'}
                    icon="body-outline"
                    accentColor={theme.accent.secondary}
                    theme={theme}
                    styles={styles}
                    index={2}
                    animValue={cardAnims[2]}
                >
                    <ChiBalanceCircle theme={theme} styles={styles} animValue={cardAnims[2]} />
                    <View style={styles.constitutionTextContainer}>
                        <Text style={styles.constitutionType}>
                            {reportData.constitution?.type || constitution.type}
                        </Text>
                        <Text style={styles.constitutionDesc}>
                            {reportData.constitution?.description || constitution.description}
                        </Text>
                    </View>
                </ResultCard>

                {/* Visual Evidence - If images exist */}
                {(data.tongueImage || data.faceImage) && (
                    <ResultCard
                        title={t.report?.visualEvidence || 'Visual Evidence'}
                        icon="camera-outline"
                        accentColor={theme.accent.primary}
                        theme={theme}
                        styles={styles}
                        index={10}
                        animValue={cardAnims[10]}
                    >
                        <View style={styles.evidenceGrid}>
                            {data.tongueImage && (
                                <TouchableOpacity style={styles.evidenceItem} onPress={() => setSelectedImage(data.tongueImage)}>
                                    <Image source={{ uri: data.tongueImage }} style={styles.evidenceImage} />
                                    <Text style={styles.evidenceLabel}>{t.report?.tonguePhoto || 'Tongue Photo'}</Text>
                                </TouchableOpacity>
                            )}
                            {data.faceImage && (
                                <TouchableOpacity style={styles.evidenceItem} onPress={() => setSelectedImage(data.faceImage)}>
                                    <Image source={{ uri: data.faceImage }} style={styles.evidenceImage} />
                                    <Text style={styles.evidenceLabel}>{t.report?.facePhoto || 'Face Photo'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ResultCard>
                )}

                {/* Detailed Analysis - Collapsible */}
                <CollapsibleSection
                    title={t.report?.analysisTitle || 'Detailed Analysis'}
                    icon="analytics-outline"
                    accentColor={theme.accent.tertiary}
                    defaultOpen={true}
                    theme={theme}
                    styles={styles}
                    index={3}
                    animValue={cardAnims[3]}
                >
                    <Text style={styles.analysisText}>{analysisText}</Text>
                    {reportData.analysis?.key_findings && (
                        <View style={styles.keyFindings}>
                            <Text style={styles.keyFindingsTitle}>{t.report?.keyFindings || 'Key Findings'}:</Text>
                            {reportData.analysis.key_findings.from_inquiry && (
                                <View style={styles.findingRow}>
                                    <Ionicons name="chatbubble-outline" size={14} color={theme.text.tertiary} />
                                    <Text style={styles.findingText}>
                                        <Text style={styles.findingLabel}>{t.report?.inquiry || 'Inquiry'}: </Text>
                                        {reportData.analysis.key_findings.from_inquiry}
                                    </Text>
                                </View>
                            )}
                            {reportData.analysis.key_findings.from_visual && (
                                <View style={styles.findingRow}>
                                    <Ionicons name="eye-outline" size={14} color={theme.text.tertiary} />
                                    <Text style={styles.findingText}>
                                        <Text style={styles.findingLabel}>{t.report?.visual || 'Visual'}: </Text>
                                        {reportData.analysis.key_findings.from_visual}
                                    </Text>
                                </View>
                            )}
                            {reportData.analysis.key_findings.from_pulse && (
                                <View style={styles.findingRow}>
                                    <Ionicons name="pulse-outline" size={14} color={theme.text.tertiary} />
                                    <Text style={styles.findingText}>
                                        <Text style={styles.findingLabel}>{t.report?.pulse || 'Pulse'}: </Text>
                                        {reportData.analysis.key_findings.from_pulse}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </CollapsibleSection>

                {/* Food Recommendations - Collapsible */}
                {(reportData.recommendations?.food?.length > 0 || reportData.recommendations?.avoid?.length > 0) && (
                    <CollapsibleSection
                        title={t.report?.dietTitle || 'Dietary Therapy (食疗)'}
                        icon="nutrition-outline"
                        accentColor={theme.semantic.warning}
                        theme={theme}
                        styles={styles}
                        index={4}
                        animValue={cardAnims[4]}
                    >
                        {reportData.recommendations?.food?.length > 0 && (
                            <View style={styles.foodSection}>
                                <View style={styles.foodSectionHeader}>
                                    <Ionicons name="leaf-outline" size={16} color={theme.accent.primary} />
                                    <Text style={styles.foodSectionTitle}>{t.report?.beneficial || 'Beneficial Foods'}</Text>
                                </View>
                                {reportData.recommendations.food.map((food, idx) => (
                                    <ListItem key={idx} text={food} color={theme.accent.primary} styles={styles} />
                                ))}
                            </View>
                        )}
                        {reportData.recommendations?.avoid?.length > 0 && (
                            <View style={[styles.foodSection, styles.avoidSection]}>
                                <View style={styles.foodSectionHeader}>
                                    <Ionicons name="close-circle-outline" size={16} color={theme.semantic.error} />
                                    <Text style={[styles.foodSectionTitle, { color: theme.semantic.error }]}>{t.report?.avoid || 'Foods to Avoid'}</Text>
                                </View>
                                {reportData.recommendations.avoid.map((food, idx) => (
                                    <ListItem key={idx} text={food} color={theme.semantic.error} styles={styles} />
                                ))}
                            </View>
                        )}
                    </CollapsibleSection>
                )}

                {/* Lifestyle - Collapsible */}
                {reportData.recommendations?.lifestyle?.length > 0 && (
                    <CollapsibleSection
                        title={t.report?.lifestyleTitle || 'Lifestyle (养生)'}
                        icon="leaf-outline"
                        accentColor={theme.semantic.success}
                        theme={theme}
                        styles={styles}
                        index={5}
                        animValue={cardAnims[5]}
                    >
                        {reportData.recommendations.lifestyle.map((tip, idx) => (
                            <ListItem key={idx} text={tip} color={theme.semantic.success} styles={styles} />
                        ))}
                    </CollapsibleSection>
                )}

                {/* Acupressure Points - Collapsible */}
                {reportData.recommendations?.acupoints?.length > 0 && (
                    <CollapsibleSection
                        title={t.report?.acupointsTitle || 'Acupressure Points (穴位)'}
                        icon="locate-outline"
                        accentColor={theme.accent.tertiary}
                        theme={theme}
                        styles={styles}
                        index={6}
                        animValue={cardAnims[6]}
                    >
                        {reportData.recommendations.acupoints.map((point, idx) => (
                            <ListItem key={idx} text={point} color={theme.accent.tertiary} styles={styles} />
                        ))}
                        <Text style={styles.acupointsTip}>
                            {t.report?.acupointsTip || '💡 Massage each point for 1-2 minutes, 2-3 times daily'}
                        </Text>
                    </CollapsibleSection>
                )}

                {/* Exercise - Collapsible */}
                {reportData.recommendations?.exercise?.length > 0 && (
                    <CollapsibleSection
                        title={t.report?.exerciseTitle || 'Exercise (运动)'}
                        icon="fitness-outline"
                        accentColor={theme.semantic.info}
                        theme={theme}
                        styles={styles}
                        index={7}
                        animValue={cardAnims[7]}
                    >
                        {reportData.recommendations.exercise.map((ex, idx) => (
                            <ListItem key={idx} text={ex} color={theme.semantic.info} styles={styles} />
                        ))}
                    </CollapsibleSection>
                )}

                {/* Sleep & Emotional Care - Collapsible */}
                {(reportData.recommendations?.sleep_guidance || reportData.recommendations?.emotional_care) && (
                    <CollapsibleSection
                        title="Rest & Wellness"
                        icon="moon-outline"
                        accentColor={theme.accent.tertiary}
                        theme={theme}
                        styles={styles}
                        index={8}
                        animValue={cardAnims[8]}
                    >
                        {reportData.recommendations.sleep_guidance && (
                            <View style={styles.wellnessItem}>
                                <View style={styles.wellnessHeader}>
                                    <Ionicons name="bed-outline" size={18} color={theme.accent.tertiary} />
                                    <Text style={[styles.wellnessTitle, { color: theme.accent.tertiary }]}>Sleep Guidance</Text>
                                </View>
                                <Text style={styles.wellnessText}>{reportData.recommendations.sleep_guidance}</Text>
                            </View>
                        )}
                        {reportData.recommendations.emotional_care && (
                            <View style={styles.wellnessItem}>
                                <View style={styles.wellnessHeader}>
                                    <Ionicons name="heart-outline" size={18} color="#EC4899" />
                                    <Text style={[styles.wellnessTitle, { color: '#EC4899' }]}>Emotional Care</Text>
                                </View>
                                <Text style={styles.wellnessText}>{reportData.recommendations.emotional_care}</Text>
                            </View>
                        )}
                    </CollapsibleSection>
                )}

                {/* Herbal Formulas - Collapsible */}
                {reportData.recommendations?.herbal_formulas?.length > 0 && (
                    <CollapsibleSection
                        title="Herbal Formulas (中药方剂)"
                        icon="flask-outline"
                        accentColor={theme.semantic.warning}
                        theme={theme}
                        styles={styles}
                        index={9}
                        animValue={cardAnims[9]}
                    >
                        {reportData.recommendations.herbal_formulas.map((formula, idx) => (
                            <HerbalFormulaCard key={idx} formula={formula} styles={styles} />
                        ))}
                        <View style={styles.herbalDisclaimer}>
                            <Ionicons name="warning-outline" size={14} color={theme.semantic.warning} />
                            <Text style={styles.herbalDisclaimerText}>
                                Consult a licensed TCM practitioner before taking herbal medicine.
                            </Text>
                        </View>
                    </CollapsibleSection>
                )}

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <Ionicons name="information-circle-outline" size={16} color={theme.text.tertiary} />
                    <Text style={styles.disclaimerText}>
                        This assessment is for informational purposes only and does not constitute medical advice.
                        Please consult a qualified TCM practitioner for professional diagnosis and treatment.
                    </Text>
                </View>
            </ScrollView>

            {/* Action Buttons in Floating Dock */}
            <View style={styles.floatingDockContainer}>
                <BlurView intensity={80} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={styles.dockBlur}>
                    <View style={styles.actionsContainer}>

                        {/* Row 1: Primary AI & Visual Tools */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.primaryActionButton}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowChat(true); }}
                            >
                                <Ionicons name="chatbubbles" size={22} color={theme.accent.primary} />
                                <Text style={styles.primaryActionText}>TCM Chat</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.primaryActionButton}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowWesternChat(true); }}
                            >
                                <Ionicons name="medkit" size={22} color="#0ea5e9" />
                                <Text style={styles.primaryActionText}>Western MD</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.primaryActionButton}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowInfographic(true); }}
                            >
                                <Ionicons name="image" size={22} color={theme.accent.secondary} />
                                <Text style={styles.primaryActionText}>Visual</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row 2: Secondary Utilities (PDF, Share, Verify) */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.secondaryActionButton}
                                onPress={handleDownloadPdf}
                                disabled={isPdfGenerating}
                            >
                                {isPdfGenerating ? (
                                    <ActivityIndicator size="small" color={theme.accent.secondary} />
                                ) : (
                                    <Ionicons name="document-text" size={20} color={theme.text.secondary} />
                                )}
                                <Text style={styles.secondaryActionText}>
                                    {isPdfGenerating ? '...' : 'PDF'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryActionButton}
                                onPress={handleShare}
                                disabled={isSharing}
                            >
                                <Ionicons name="share-social-outline" size={20} color={theme.text.secondary} />
                                <Text style={styles.secondaryActionText}>
                                    {isSharing ? '...' : 'Share'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryActionButton}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowVerification(true); }}
                            >
                                <Ionicons name="shield-checkmark-outline" size={20} color={theme.semantic.success} />
                                <Text style={[styles.secondaryActionText, { color: theme.semantic.success }]}>
                                    Verify
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row 3: Navigation */}
                        <View style={styles.navRow}>
                            <TouchableOpacity style={styles.resetButton} onPress={onStartNew}>
                                <LinearGradient
                                    colors={theme.gradients.accent}
                                    style={styles.gradientButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="refresh" size={20} color={theme.text.inverse} />
                                    <Text style={styles.resetButtonText}>Start New Assessment</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.homeButton} onPress={onExit}>
                                <Text style={styles.homeButtonText}>Return to Home</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </View>

            {/* Disclaimer */}
            <View style={styles.finalDisclaimer}>
                <Ionicons name="information-circle-outline" size={16} color={theme.text.tertiary} />
                <Text style={styles.disclaimerText}>
                    This assessment is for informational purposes only. Please consult a qualified TCM practitioner.
                </Text>
            </View>

            {/* Report Chat Modal */}
            <ReportChatModal
                visible={showChat}
                onClose={() => setShowChat(false)}
                reportData={reportData}
                theme={theme}
                isDark={isDark}
            />

            {/* Infographic Modal */}
            <InfographicModal
                visible={showInfographic}
                onClose={() => setShowInfographic(false)}
                reportData={reportData}
                patientData={{
                    name: data.name,
                    age: data.age,
                    gender: data.gender,
                    height: data.height,
                    weight: data.weight,
                }}
                constitution={constitution}
                theme={theme}
                isDark={isDark}
            />

            {/* Doctor Verification Modal */}
            <DoctorVerificationModal
                visible={showVerification}
                onClose={() => setShowVerification(false)}
                reportData={reportData}
                patientData={data}
                theme={theme}
                isDark={isDark}
            />

            {/* Western Doctor Chat Modal */}
            <WesternDoctorChatModal
                visible={showWesternChat}
                onClose={() => setShowWesternChat(false)}
                reportData={reportData}
                theme={theme}
                isDark={isDark}
            />

            {/* Image Zoom Modal */}
            <ImageZoomModal
                uri={selectedImage}
                visible={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                theme={theme}
                isDark={isDark}
            />
        </View>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: theme.background, // Ensure background is set
    },
    scrollContent: {
        paddingBottom: 340, // INCREASED: Accommodate taller 3-row dock
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        color: theme.text.secondary,
        fontSize: 14,
    },
    successHeader: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    successIcon: {
        marginBottom: 12,
        shadowColor: theme.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 14,
        color: theme.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    sectionCardContainer: {
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    resultCardContainer: {
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    glassBlur: {
        borderRadius: 20,
    },
    glassGradient: {
        padding: 1, // Border thickness effect
        borderRadius: 20,
    },
    resultCard: {
        padding: 16,
        borderRadius: 19,
        backgroundColor: 'transparent',
    },
    sectionCard: {
        borderRadius: 19,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text.primary,
    },
    sectionContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text.primary,
    },
    cardContent: {},
    patientGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    patientItem: {
        minWidth: '45%',
    },
    patientLabel: {
        fontSize: 12,
        color: theme.text.tertiary,
        marginBottom: 2,
    },
    patientValue: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text.primary,
    },
    diagnosisText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 8,
    },
    secondaryPatterns: {
        marginTop: 8,
    },
    secondaryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.text.secondary,
        marginBottom: 4,
    },
    secondaryText: {
        fontSize: 14,
        color: theme.text.secondary,
        lineHeight: 20,
    },
    affectedOrgans: {
        marginTop: 12,
    },
    affectedLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.text.secondary,
        marginBottom: 8,
    },
    organsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    organChip: {
        backgroundColor: theme.surface.default,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    organChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.text.primary,
    },
    constitutionType: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.accent.secondary,
        marginBottom: 8,
    },
    constitutionDesc: {
        fontSize: 14,
        color: theme.text.secondary,
        lineHeight: 20,
    },
    analysisText: {
        fontSize: 14,
        color: theme.text.secondary,
        lineHeight: 22,
        marginBottom: 16,
    },
    keyFindings: {
        marginTop: 8,
        padding: 12,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
    },
    keyFindingsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 12,
    },
    findingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    findingText: {
        fontSize: 13,
        color: theme.text.secondary,
        flex: 1,
    },
    findingLabel: {
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 10,
    },
    listDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
    },
    listText: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.text.secondary,
        flex: 1,
    },
    foodSection: {
        marginBottom: 16,
    },
    avoidSection: {
        marginTop: 8,
    },
    foodSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    foodSectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.accent.primary,
    },
    acupointsTip: {
        marginTop: 12,
        fontSize: 12,
        color: theme.text.tertiary,
        fontStyle: 'italic',
        backgroundColor: theme.surface.default,
        padding: 10,
        borderRadius: 8,
    },
    wellnessItem: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
    },
    wellnessHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    wellnessTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.accent.primary,
    },
    wellnessText: {
        fontSize: 13,
        color: theme.text.secondary,
        lineHeight: 18,
    },
    herbalCard: {
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    herbalName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 8,
    },
    herbalDetail: {
        fontSize: 13,
        color: theme.text.secondary,
        lineHeight: 18,
        marginBottom: 4,
    },
    herbalLabel: {
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    herbalDisclaimer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
        paddingHorizontal: 8,
    },
    herbalDisclaimerText: {
        fontSize: 11,
        color: theme.text.tertiary,
        flex: 1,
        fontStyle: 'italic',
    },
    // Chi Balance Styles
    chiContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        marginBottom: 20,
    },
    svgWrapper: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chiCenterBox: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    chiCenterPercent: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    chiCenterLabel: {
        fontSize: 10,
        color: theme.text.tertiary,
        textTransform: 'uppercase',
    },
    chiLegend: {
        flex: 1,
        marginLeft: 20,
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: theme.text.secondary,
        flex: 1,
    },
    legendValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    constitutionTextContainer: {
        marginTop: 10,
    },
    // Evidence Styles
    evidenceGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    evidenceItem: {
        flex: 1,
        alignItems: 'center',
    },
    evidenceImage: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    evidenceLabel: {
        fontSize: 11,
        color: theme.text.tertiary,
    },
    // --- FLOATING DOCK STYLES (REFACTORED) ---
    floatingDockContainer: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border.default,
        elevation: 100, // Increased for Android touch handling
        zIndex: 999,    // Explicit Z-Index for iOS
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
    },
    dockBlur: {
        padding: 16,
    },
    actionsContainer: {
        gap: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    navRow: {
        flexDirection: 'column', // Stack New Assessment over Return Home
        gap: 8,
        marginTop: 4,
    },

    // Primary Actions (Ask AI, Visual)
    primaryActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.surface.elevated,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border.subtle,
        gap: 8,
        height: 54, // Consistent height
    },
    primaryActionText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text.primary,
    },

    // Secondary Actions (PDF, Share, Verify)
    secondaryActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.surface.default,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 6,
        height: 48,
    },
    secondaryActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.text.secondary,
    },

    // Bottom Navigation Buttons
    resetButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        height: 52,
    },
    gradientButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    resetButtonText: {
        color: theme.text.inverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    homeButton: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    homeButtonText: {
        color: theme.text.tertiary,
        fontSize: 14,
        fontWeight: '600',
    },

    // Final Disclaimer outside the dock (visible when scrolled to very bottom)
    finalDisclaimer: {
        position: 'absolute',
        bottom: 270, // Positioned just above where the dock usually sits visually if content is short
        left: 20,
        right: 20,
        alignItems: 'center',
        opacity: 0, // Hidden by default, relies on scroll padding
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingHorizontal: 12,
        marginBottom: 10,
        marginTop: 10,
        justifyContent: 'center',
    },
    disclaimerText: {
        fontSize: 10, // Smaller text
        color: theme.text.tertiary,
        flex: 1,
        textAlign: 'center',
        lineHeight: 14,
    },

    // Zoom Modal Styles
    zoomCloseButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 100,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomScrollContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.8,
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
        fontWeight: '500',
    },
});
