import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Animated,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/themes';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import EcgAnimation from '../../components/ui/EcgAnimation';

// Traditional 12 TCM Pulse Types (脉象类型)
const getTcmPulseTypes = (t) => [
    { id: 'hua', nameZh: '滑脉', nameEn: t.pulse?.pulseTypes?.hua?.name || 'Slippery', description: 'Smooth and flowing' },
    { id: 'se', nameZh: '涩脉', nameEn: t.pulse?.pulseTypes?.se?.name || 'Rough', description: 'Unsmooth and hesitant' },
    { id: 'xian', nameZh: '弦脉', nameEn: t.pulse?.pulseTypes?.xian?.name || 'Wiry', description: 'Taut like a bowstring' },
    { id: 'jin', nameZh: '紧脉', nameEn: t.pulse?.pulseTypes?.jin?.name || 'Tight', description: 'Tight and forceful' },
    { id: 'xi', nameZh: '细脉', nameEn: t.pulse?.pulseTypes?.xi?.name || 'Thin', description: 'Fine like a thread' },
    { id: 'hong', nameZh: '洪脉', nameEn: t.pulse?.pulseTypes?.hong?.name || 'Surging', description: 'Large and forceful' },
    { id: 'ruo', nameZh: '弱脉', nameEn: t.pulse?.pulseTypes?.ruo?.name || 'Weak', description: 'Soft and weak' },
    { id: 'chen', nameZh: '沉脉', nameEn: t.pulse?.pulseTypes?.chen?.name || 'Deep', description: 'Felt only with pressure' },
    { id: 'fu', nameZh: '浮脉', nameEn: t.pulse?.pulseTypes?.fu?.name || 'Floating', description: 'Superficial, light touch' },
    { id: 'chi', nameZh: '迟脉', nameEn: t.pulse?.pulseTypes?.chi?.name || 'Slow', description: 'Slow rate (<60)' },
    { id: 'shuo', nameZh: '数脉', nameEn: t.pulse?.pulseTypes?.shuo?.name || 'Rapid', description: 'Fast rate (>90)' },
    { id: 'normal', nameZh: '平脉', nameEn: t.pulse?.pulseTypes?.normal?.name || 'Normal', description: 'Balanced and regular' },
];

// Conflicting pulse pairs
const PULSE_CONFLICTS = {
    'xi': ['hong'], 'hong': ['xi', 'ruo'], 'ruo': ['hong'],
    'hua': ['se'], 'se': ['hua'],
    'fu': ['chen'], 'chen': ['fu'],
    'chi': ['shuo'], 'shuo': ['chi']
};

const getBpmRanges = (theme, t) => [
    { range: '< 60', label: t.pulse?.categories?.low || 'Low', icon: 'arrow-down', color: theme.semantic.info },
    { range: '60-100', label: t.pulse?.categories?.normal || 'Normal', icon: 'checkmark', color: theme.semantic.success },
    { range: '> 100', label: t.pulse?.categories?.high || 'High', icon: 'arrow-up', color: theme.semantic.warning },
];

export default function PulseStep({ data, onUpdate, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const { t } = useLanguage();
    const TCM_PULSE_TYPES = useMemo(() => getTcmPulseTypes(t), [t]);
    const BPM_RANGES = useMemo(() => getBpmRanges(theme, t), [theme, t]);
    const [bpm, setBpm] = useState(data.bpm || '');
    const [selectedQualities, setSelectedQualities] = useState(data.pulseQualities || []);
    const [showTcmModal, setShowTcmModal] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measureCount, setMeasureCount] = useState(0);
    const [conflictWarning, setConflictWarning] = useState(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const durationTimer = useRef(null);

    // Heartbeat animation synced to BPM
    useEffect(() => {
        if (bpm && parseInt(bpm) > 0) {
            const interval = 60000 / parseInt(bpm);
            const anim = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: Math.max(100, interval - 100), useNativeDriver: true }),
                ])
            );
            anim.start();
            return () => anim.stop();
        }
    }, [bpm]);

    const startMeasuring = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsMeasuring(true);
        setMeasureCount(0);

        // 15-second countdown
        durationTimer.current = setTimeout(() => {
            setIsMeasuring(false);
            const calculatedBpm = (measureCount * 4).toString();
            setBpm(calculatedBpm);
            onUpdate({ ...data, bpm: calculatedBpm });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 15000);
    };

    const recordBeat = () => {
        if (isMeasuring) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMeasureCount(prev => prev + 1);
        }
    };

    const stopMeasuring = () => {
        if (durationTimer.current) clearTimeout(durationTimer.current);
        setIsMeasuring(false);
        setMeasureCount(0);
    };

    const handleBpmChange = (text) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length <= 3) {
            setBpm(cleaned);
            onUpdate({ ...data, bpm: cleaned });
        }
    };

    const togglePulseQuality = (pulseType) => {
        setConflictWarning(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setSelectedQualities(prev => {
            const isSelected = prev.some(q => q.id === pulseType.id);

            if (isSelected) {
                const updated = prev.filter(q => q.id !== pulseType.id);
                onUpdate({ ...data, pulseQualities: updated });
                return updated;
            }

            // Check for conflicts
            const conflicts = PULSE_CONFLICTS[pulseType.id] || [];
            const conflictingId = conflicts.find(c => prev.some(q => q.id === c));

            if (conflictingId) {
                const conflictingPulse = TCM_PULSE_TYPES.find(p => p.id === conflictingId);
                setConflictWarning(t.pulse.conflictWarning?.replace('{0}', pulseType.nameEn).replace('{1}', conflictingPulse?.nameEn));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                return prev;
            }

            const updated = [...prev, { id: pulseType.id, nameZh: pulseType.nameZh, nameEn: pulseType.nameEn }];
            onUpdate({ ...data, pulseQualities: updated });
            return updated;
        });
    };

    const getBpmCategory = () => {
        const value = parseInt(bpm);
        if (!value) return null;
        if (value < 60) return BPM_RANGES[0];
        if (value <= 100) return BPM_RANGES[1];
        return BPM_RANGES[2];
    };

    const category = getBpmCategory();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }], backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' }]}>
                    <Ionicons name="heart" size={36} color={theme.accent.primary} />
                </Animated.View>
                <Text style={styles.title}>{t.pulse.title || 'Pulse Diagnosis'}</Text>
                <Text style={styles.subtitle}>{t.pulse.subtitle || '切诊 - TCM pulse examination'}</Text>
            </View>

            {/* BPM Input Section */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Heart Rate (BPM)</Text>
                <View style={styles.bpmInputRow}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.bpmInput}
                            placeholder="--"
                            placeholderTextColor={theme.text.tertiary}
                            keyboardType="numeric"
                            value={bpm}
                            onChangeText={handleBpmChange}
                            maxLength={3}
                        />
                        <Text style={styles.bpmUnit}>BPM</Text>
                    </View>
                    {category && (
                        <View style={[styles.categoryBadge, { backgroundColor: category.color + '30' }]}>
                            <Ionicons name={category.icon} size={16} color={category.color} />
                            <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
                        </View>
                    )}
                </View>

                {/* ECG Animation - 心电图 */}
                {bpm && parseInt(bpm) > 0 && (
                    <View style={styles.ecgContainer}>
                        <EcgAnimation
                            bpm={parseInt(bpm)}
                            isActive={true}
                            height={70}
                        />
                    </View>
                )}

                {/* Quick Measure Button */}
                {!isMeasuring ? (
                    <TouchableOpacity style={styles.measureButton} onPress={startMeasuring}>
                        <Ionicons name="timer-outline" size={20} color="#ffffff" />
                        <Text style={styles.measureButtonText}>{t.pulse.guidedMeasure || 'Guided 15-Second Count'}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.measuringSection}>
                        <Text style={styles.measuringHint}>{t.pulse.tapHeartbeat || 'Tap each heartbeat you feel'}</Text>
                        <TouchableOpacity style={styles.beatButton} onPress={recordBeat}>
                            <Ionicons name="heart" size={48} color="#ffffff" />
                            <View style={styles.beatCountBadge}>
                                <Text style={styles.beatCountText}>{measureCount}</Text>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.measuringTimer}>{t.pulse.counting || 'Counting for 15 seconds...'}</Text>
                        <TouchableOpacity onPress={stopMeasuring}>
                            <Text style={styles.cancelText}>{t.common.cancel || 'Cancel'}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* TCM Pulse Qualities Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionLabel}>TCM Pulse Qualities</Text>
                        <Text style={styles.sectionHint}>脉象 - Select what you feel</Text>
                    </View>
                    <TouchableOpacity style={styles.infoButton} onPress={() => setShowTcmModal(true)}>
                        <Ionicons name="information-circle" size={24} color={theme.accent.secondary} />
                    </TouchableOpacity>
                </View>

                {/* Conflict Warning */}
                {conflictWarning && (
                    <View style={styles.warningContainer}>
                        <Ionicons name="warning" size={16} color={theme.semantic.warning} />
                        <Text style={styles.warningText}>{conflictWarning}</Text>
                    </View>
                )}

                {/* Pulse Type Grid */}
                <View style={styles.pulseGrid}>
                    {TCM_PULSE_TYPES.map((pulse) => {
                        const isSelected = selectedQualities.some(q => q.id === pulse.id);
                        return (
                            <TouchableOpacity
                                key={pulse.id}
                                style={[styles.pulseChip, isSelected && styles.pulseChipSelected]}
                                onPress={() => togglePulseQuality(pulse)}
                            >
                                <View style={styles.pulseChipHeader}>
                                    <Text style={[styles.pulseNameZh, isSelected && styles.pulseTextSelected]}>
                                        {pulse.nameZh}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                                    )}
                                </View>
                                <Text style={[styles.pulseNameEn, isSelected && styles.pulseTextSelectedLight]}>
                                    {pulse.nameEn}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Selected Summary */}
                {selectedQualities.length > 0 && (
                    <View style={styles.selectedSummary}>
                        <Text style={styles.selectedLabel}>{t.common.selected || 'Selected'}: </Text>
                        <Text style={styles.selectedValue}>
                            {selectedQualities.map(q => q.nameZh).join('、')}
                        </Text>
                    </View>
                )}
            </View>

            {/* Help Button */}
            <TouchableOpacity style={styles.helpButton} onPress={() => setShowGuide(true)}>
                <Ionicons name="help-circle-outline" size={18} color={theme.accent.secondary} />
                <Text style={styles.helpText}>{t.pulse.helpButton || 'How to measure pulse?'}</Text>
            </TouchableOpacity>

            {/* TCM Info Modal */}
            <Modal visible={showTcmModal} transparent animationType="slide" onRequestClose={() => setShowTcmModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t.pulse.modalTitle || 'TCM Pulse Types 脉象'}</Text>
                            <TouchableOpacity onPress={() => setShowTcmModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>
                            {t.pulse.modalSubtitle || 'Traditional Chinese Medicine identifies various pulse qualities that indicate different body conditions.'}
                        </Text>
                        <ScrollView style={styles.pulseList}>
                            {TCM_PULSE_TYPES.map((pulse) => (
                                <View key={pulse.id} style={styles.pulseListItem}>
                                    <Text style={styles.pulseListNameZh}>{pulse.nameZh}</Text>
                                    <Text style={styles.pulseListNameEn}>{pulse.nameEn}</Text>
                                    <Text style={styles.pulseListDesc}>{pulse.description}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTcmModal(false)}>
                            <Text style={styles.modalCloseBtnText}>{t.common.gotIt || 'Got it!'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Guide Modal */}
            <Modal visible={showGuide} transparent animationType="fade" onRequestClose={() => setShowGuide(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t.pulse.helpTitle || 'Measuring Your Pulse'}</Text>
                            <TouchableOpacity onPress={() => setShowGuide(false)}>
                                <Ionicons name="close" size={24} color={theme.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.guideSteps}>
                            <View style={styles.guideStep}>
                                <View style={styles.stepNumber}><Text style={styles.stepNumText}>1</Text></View>
                                <Text style={styles.stepText}>{t.pulse.helpStep1 || 'Find pulse on wrist (radial artery) or neck (carotid)'}</Text>
                            </View>
                            <View style={styles.guideStep}>
                                <View style={styles.stepNumber}><Text style={styles.stepNumText}>2</Text></View>
                                <Text style={styles.stepText}>{t.pulse.helpStep2 || 'Use index and middle fingers (not thumb)'}</Text>
                            </View>
                            <View style={styles.guideStep}>
                                <View style={styles.stepNumber}><Text style={styles.stepNumText}>3</Text></View>
                                <Text style={styles.stepText}>{t.pulse.helpStep3 || 'Count beats for 15 seconds, multiply by 4'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowGuide(false)}>
                            <Text style={styles.modalCloseBtnText}>{t.common.gotIt || 'Got it!'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 28 },
    iconContainer: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.text.primary, marginBottom: 4 },
    subtitle: { fontSize: 14, color: theme.text.secondary },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    sectionLabel: { fontSize: 14, color: theme.text.tertiary, marginBottom: 4, fontWeight: 'bold', textTransform: 'uppercase' },
    sectionHint: { fontSize: 12, color: theme.text.tertiary, opacity: 0.7 },
    infoButton: { padding: 4 },
    bpmInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    inputWrapper: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.input.background, borderRadius: 16,
        paddingHorizontal: 20, height: 64,
        borderWidth: 1, borderColor: theme.border.default,
    },
    bpmInput: { flex: 1, fontSize: 28, fontWeight: 'bold', color: theme.text.primary },
    bpmUnit: { fontSize: 16, fontWeight: 'bold', color: theme.accent.primary },
    categoryBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    },
    categoryText: { fontSize: 14, fontWeight: 'bold' },
    ecgContainer: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    measureButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.accent.secondary, paddingVertical: 14, borderRadius: 14, marginTop: 16,
    },
    measureButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
    measuringSection: { alignItems: 'center', marginTop: 16 },
    measuringHint: { color: theme.text.primary, fontSize: 14, marginBottom: 16, fontWeight: '600' },
    beatButton: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: theme.semantic.error,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
        shadowColor: theme.semantic.error,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    beatCountBadge: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    beatCountText: { color: theme.semantic.error, fontWeight: 'bold', fontSize: 14 },
    measuringTimer: { color: theme.text.secondary, fontSize: 14, marginBottom: 8 },
    cancelText: { color: theme.semantic.error, fontSize: 14, fontWeight: 'bold' },
    warningContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)',
        padding: 12, borderRadius: 10, marginTop: 8,
        borderWidth: 1, borderColor: theme.semantic.warning,
    },
    warningText: { color: theme.semantic.warning, fontSize: 13, flex: 1, fontWeight: '500' },
    pulseGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12,
    },
    pulseChip: {
        width: '30%', backgroundColor: theme.surface.elevated,
        paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12,
        borderWidth: 1, borderColor: theme.border.default,
    },
    pulseChipSelected: {
        backgroundColor: theme.accent.secondary, borderColor: theme.accent.secondary,
    },
    pulseChipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pulseNameZh: { fontSize: 16, fontWeight: 'bold', color: theme.text.primary },
    pulseNameEn: { fontSize: 11, color: theme.text.secondary, marginTop: 2 },
    pulseTextSelected: { color: '#ffffff' },
    pulseTextSelectedLight: { color: 'rgba(255,255,255,0.9)' },
    selectedSummary: {
        flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
        backgroundColor: theme.surface.default, padding: 12, borderRadius: 10, marginTop: 12,
        borderWidth: 1, borderColor: theme.border.subtle,
    },
    selectedLabel: { color: theme.text.tertiary, fontSize: 13, fontWeight: '600' },
    selectedValue: { color: theme.accent.secondary, fontSize: 13, fontWeight: 'bold' },
    helpButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
    helpText: { color: theme.accent.secondary, fontSize: 14, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: theme.background.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.surface.elevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text.primary },
    modalSubtitle: { color: theme.text.secondary, fontSize: 14, marginBottom: 16, lineHeight: 20 },
    pulseList: { marginBottom: 16 },
    pulseListItem: { backgroundColor: theme.surface.default, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border.subtle },
    pulseListNameZh: { fontSize: 18, fontWeight: 'bold', color: theme.accent.secondary },
    pulseListNameEn: { fontSize: 14, color: theme.text.primary, marginTop: 2, fontWeight: '600' },
    pulseListDesc: { fontSize: 12, color: theme.text.secondary, marginTop: 4 },
    guideSteps: { marginBottom: 24 },
    guideStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    stepNumber: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: theme.accent.secondary,
        justifyContent: 'center', alignItems: 'center',
    },
    stepNumText: { color: '#ffffff', fontWeight: 'bold' },
    stepText: { flex: 1, color: theme.text.secondary, fontSize: 14, lineHeight: 22 },
    modalCloseBtn: { backgroundColor: theme.accent.secondary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalCloseBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
