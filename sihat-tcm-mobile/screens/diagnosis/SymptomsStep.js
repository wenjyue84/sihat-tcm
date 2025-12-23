import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
    UIManager,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../../contexts/LanguageContext';

// Enable LayoutAnimation
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width } = Dimensions.get('window');

export default function SymptomsStep({ data, onUpdate, theme, isDark }) {
    const { t } = useLanguage();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    // Data from props
    // mainConcern: String (Text)
    // symptoms: String (comma separated)
    const { mainConcern = '', symptoms = '', symptomDetails = '', symptomDuration = '' } = data;

    // Safety accessor: Ensure symptoms is always a string context
    const safeSymptoms = useMemo(() => {
        if (Array.isArray(symptoms)) return symptoms.join(', ');
        if (typeof symptoms === 'string') return symptoms;
        return '';
    }, [symptoms]);

    // Local state for UI
    const [categoryMode, setCategoryMode] = useState('simple'); // simple, western, tcm
    const [activeCategory, setActiveCategory] = useState('common');
    const [activeInput, setActiveInput] = useState('main'); // 'main' or 'other'

    // Define categories structure (mimicking Web)
    const categories = useMemo(() => ({
        simple: [
            { id: 'common', label: 'Common Symptoms', symptoms: ['fever', 'cough', 'headache', 'fatigue', 'soreThroat', 'stomachPain'] },
            { id: 'chronic', label: 'Chronic / Critical', symptoms: ['highBloodPressure', 'diabetes', 'heartDisease', 'shortnessOfBreath', 'stroke', 'cancer', 'pneumonia'] }
        ],
        western: [
            { id: 'respiratory', label: 'Respiratory', symptoms: ['cough', 'shortnessOfBreath', 'soreThroat', 'pneumonia'] },
            { id: 'digestive', label: 'Digestive', symptoms: ['stomachPain'] },
            { id: 'neurological', label: 'Neurological', symptoms: ['headache', 'stroke', 'fatigue'] },
            { id: 'cardiovascular', label: 'Cardiovascular', symptoms: ['highBloodPressure', 'heartDisease'] },
            { id: 'general', label: 'General', symptoms: ['fever', 'diabetes', 'cancer'] }
        ],
        tcm: [
            { id: 'wood', label: 'Wood (Liver)', symptoms: ['headache', 'stroke', 'highBloodPressure'] },
            { id: 'fire', label: 'Fire (Heart)', symptoms: ['heartDisease', 'fever'] },
            { id: 'earth', label: 'Earth (Spleen)', symptoms: ['stomachPain', 'fatigue', 'diabetes'] },
            { id: 'metal', label: 'Metal (Lung)', symptoms: ['cough', 'shortnessOfBreath', 'soreThroat', 'pneumonia'] },
            { id: 'water', label: 'Water (Kidney)', symptoms: ['cancer'] }
        ]
    }), []);

    // Translation map for standard symptoms (using keys from BasicInfo or Symptoms)
    // We try to map keys to t.basicInfo.symptoms if available, else standard English
    const getSymptomLabel = (key) => {
        if (t.basicInfo.symptoms && t.basicInfo.symptoms[key]) {
            return t.basicInfo.symptoms[key];
        }
        // Fallback or capitalized key
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    // Reset active category when mode changes
    useEffect(() => {
        if (categories[categoryMode]?.length > 0) {
            setActiveCategory(categories[categoryMode][0].id);
        }
    }, [categoryMode]);

    // Simple Helper to manipulate comma lists in strings
    const updateSymptomString = (currentStr, symptomToAdd, action) => {
        let items = currentStr.split(',').map(s => s.trim()).filter(Boolean);
        const lowerSymptom = symptomToAdd.toLowerCase();

        if (action === 'add') {
            // Avoid duplicates (imperfect check for now)
            if (!items.some(i => i.toLowerCase() === lowerSymptom)) {
                items.push(symptomToAdd);
            }
        } else if (action === 'remove') {
            items = items.filter(i => i.toLowerCase() !== lowerSymptom);
        }

        return items.join(', ');
    };

    // Handle Symptom Chip Click
    const handleSymptomClick = (symptomKey) => {
        Haptics.selectionAsync();
        const symptomLabel = getSymptomLabel(symptomKey);

        if (activeInput === 'main') {
            // For Main Concern: Replace text
            if (mainConcern === symptomLabel) {
                onUpdate({ ...data, mainConcern: '' });
            } else {
                onUpdate({ ...data, mainConcern: symptomLabel });
            }
        } else {
            // For Other Symptoms: Append to String
            const isSelected = isSymptomSelected(symptomKey);
            const newText = updateSymptomString(
                safeSymptoms,
                symptomLabel,
                isSelected ? 'remove' : 'add'
            );
            onUpdate({ ...data, symptoms: newText });
        }
    };

    // Helper to check if selected inside the string
    const isSymptomSelected = (symptomKey) => {
        const label = getSymptomLabel(symptomKey).toLowerCase();
        if (activeInput === 'main') {
            return mainConcern.toLowerCase() === label;
        } else {
            // Simple includes check, but mindful of substrings
            // Splitting is safer
            const items = safeSymptoms.split(',').map(s => s.trim().toLowerCase());
            return items.includes(label);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' }]}>
                    <Ionicons name="thermometer" size={36} color={theme.accent.primary} />
                </View>
                <Text style={styles.title}>{t.symptoms.title || 'How are you feeling?'}</Text>
                <Text style={styles.subtitle}>
                    {t.symptoms.subtitle || 'Select your symptoms or type them below.'}
                </Text>
            </View>

            {/* Inputs Section */}
            <View style={styles.inputsSection}>
                {/* Main Concern Input */}
                <View style={[styles.inputWrapper, activeInput === 'main' && styles.activeInputWrapper]}>
                    <Text style={styles.inputLabel}>
                        {t.basicInfo.mainConcern || "Main Complaint"} <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setActiveInput('main')}
                        style={styles.textInputContainer}
                    >
                        <Ionicons name="alert-circle-outline" size={20} color={activeInput === 'main' ? theme.accent.primary : theme.text.tertiary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.textInput}
                            value={mainConcern}
                            onChangeText={(text) => onUpdate({ ...data, mainConcern: text })}
                            onFocus={() => setActiveInput('main')}
                            placeholder={t.basicInfo.mainConcernPlaceholder || "e.g. Severe Headache"}
                            placeholderTextColor={theme.text.tertiary}
                        />
                        {mainConcern.length > 0 && activeInput === 'main' && (
                            <TouchableOpacity onPress={() => onUpdate({ ...data, mainConcern: '' })}>
                                <Ionicons name="close-circle" size={16} color={theme.text.tertiary} />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Other Symptoms Input */}
                <View style={[styles.inputWrapper, activeInput === 'other' && styles.activeInputWrapper]}>
                    <Text style={styles.inputLabel}>
                        {t.basicInfo.otherSymptoms || "Other Symptoms"}
                    </Text>
                    <View style={styles.textInputContainer}>
                        <Ionicons name="list-outline" size={20} color={activeInput === 'other' ? theme.accent.primary : theme.text.tertiary} style={styles.inputIcon} />

                        {/* Direct Binding to String - pointerEvents allows TextInput to receive touches */}
                        <TextInput
                            style={styles.textInput}
                            value={safeSymptoms}
                            onChangeText={(text) => onUpdate({ ...data, symptoms: text })}
                            onFocus={() => setActiveInput('other')}
                            placeholder={t.basicInfo.otherSymptomsPlaceholder || "e.g. Cough, Fever"}
                            placeholderTextColor={theme.text.tertiary}
                            editable={true}
                            autoCorrect={false}
                        />
                        {safeSymptoms.length > 0 && activeInput === 'other' && (
                            <TouchableOpacity onPress={() => onUpdate({ ...data, symptoms: '' })}>
                                <Ionicons name="close-circle" size={16} color={theme.text.tertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.helperText}>
                        {activeInput === 'main'
                            ? "Select a symptom below to as Main Complaint"
                            : "Select symptoms below to add to list"}
                    </Text>
                </View>
            </View>

            {/* Configurable Categories Section */}
            <View style={styles.categoriesSection}>
                {/* 1. Category Mode Tabs (Simple / Western / TCM) */}
                <View style={styles.modeTabs}>
                    {['simple', 'western', 'tcm'].map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setCategoryMode(mode);
                            }}
                            style={[
                                styles.modeTab,
                                categoryMode === mode && styles.modeTabActive
                            ]}
                        >
                            <Text style={[
                                styles.modeTabText,
                                categoryMode === mode && styles.modeTabTextActive
                            ]}>
                                {mode.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 2. Sub-Categories (Horizontal Scroll) */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.subCategoriesScroll}
                >
                    {categories[categoryMode].map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setActiveCategory(cat.id);
                            }}
                            style={[
                                styles.subCatChip,
                                activeCategory === cat.id && styles.subCatChipActive
                            ]}
                        >
                            <Text style={[
                                styles.subCatText,
                                activeCategory === cat.id && styles.subCatTextActive
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* 3. Symptoms Grid (Chips) */}
                <View style={styles.symptomsGrid}>
                    {categories[categoryMode]
                        .find(c => c.id === activeCategory)
                        ?.symptoms?.map((symptomKey) => {
                            const isSelected = isSymptomSelected(symptomKey);
                            return (
                                <TouchableOpacity
                                    key={symptomKey}
                                    onPress={() => handleSymptomClick(symptomKey)}
                                    style={[
                                        styles.symptomChip,
                                        isSelected && styles.symptomChipSelected
                                    ]}
                                >
                                    {isSelected && <Ionicons name="checkmark" size={14} color={theme.accent.primary} style={{ marginRight: 4 }} />}
                                    <Text style={[
                                        styles.symptomText,
                                        isSelected && styles.symptomTextSelected
                                    ]}>
                                        {getSymptomLabel(symptomKey)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                </View>
            </View>

            {/* Duration Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.basicInfo.duration || 'DURATION'}</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.durationScroll}
                >
                    {[
                        { id: 'few_days', label: 'Few days' },
                        { id: '1_2_weeks', label: '1-2 weeks' },
                        { id: '1_3_months', label: '1-3 months' },
                        { id: 'chronic', label: 'Chronic' },
                    ].map((opt) => {
                        const isSelected = symptomDuration === opt.id;
                        return (
                            <TouchableOpacity
                                key={opt.id}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    onUpdate({ ...data, symptomDuration: opt.id });
                                }}
                            >
                                <BlurView
                                    intensity={isSelected ? 30 : 10}
                                    tint={isDark ? 'dark' : 'light'}
                                    style={[
                                        styles.durationChip,
                                        isSelected && styles.durationChipSelected
                                    ]}
                                >
                                    <Text style={[
                                        styles.durationText,
                                        isSelected && styles.durationTextSelected
                                    ]}>{opt.label}</Text>
                                </BlurView>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 24 },
    iconContainer: {
        width: 70, height: 70, borderRadius: 35,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        borderWidth: 1, borderColor: theme.border.subtle,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.text.primary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: theme.text.secondary, textAlign: 'center', lineHeight: 20 },

    inputsSection: { marginBottom: 24, gap: 16 },
    inputWrapper: { gap: 8, opacity: 0.7 },
    activeInputWrapper: { opacity: 1 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: theme.text.secondary },
    required: { color: theme.semantic.error },
    textInputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.surface.elevated,
        borderWidth: 1, borderColor: theme.border.default,
        borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4,
        minHeight: 50,
    },
    activeInputContainer: {
        borderColor: theme.accent.primary,
        backgroundColor: isDark ? 'rgba(16,185,129,0.05)' : '#fff',
    },
    inputIcon: { marginRight: 8 },
    textInput: {
        flex: 1, height: '100%',
        color: theme.text.primary,
        fontSize: 16, paddingVertical: 12,
    },
    helperText: { fontSize: 12, color: theme.text.tertiary, fontStyle: 'italic', marginTop: 4 },

    categoriesSection: { marginBottom: 32 },
    modeTabs: {
        flexDirection: 'row',
        backgroundColor: theme.surface.elevated,
        padding: 4, borderRadius: 12, marginBottom: 16,
        borderWidth: 1, borderColor: theme.border.subtle,
    },
    modeTab: {
        flex: 1, paddingVertical: 8, alignItems: 'center',
        borderRadius: 8,
    },
    modeTabActive: {
        backgroundColor: theme.background.primary,
        shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { height: 1, width: 0 },
    },
    modeTabText: { fontSize: 12, fontWeight: '600', color: theme.text.tertiary },
    modeTabTextActive: { color: theme.accent.primary },

    subCategoriesScroll: { gap: 8, paddingBottom: 16 },
    subCatChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: theme.border.default,
        backgroundColor: theme.surface.default,
    },
    subCatChipActive: {
        backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)',
        borderColor: theme.accent.primary,
    },
    subCatText: { fontSize: 13, color: theme.text.secondary, fontWeight: '500' },
    subCatTextActive: { color: theme.accent.primary, fontWeight: '600' },

    symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    symptomChip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
        borderWidth: 1, borderColor: theme.border.default,
        backgroundColor: theme.surface.elevated,
    },
    symptomChipSelected: {
        borderColor: theme.accent.primary,
        backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
    },
    symptomText: { fontSize: 14, color: theme.text.secondary },
    symptomTextSelected: { color: theme.accent.primary, fontWeight: '600' },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: theme.text.tertiary, letterSpacing: 1, marginBottom: 12 },
    durationScroll: { gap: 10 },
    durationChip: {
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16,
        borderWidth: 1, borderColor: theme.border.default,
        backgroundColor: theme.surface.elevated, minWidth: 100, alignItems: 'center',
    },
    durationChipSelected: { borderColor: theme.accent.secondary, borderWidth: 1.5 },
    durationText: { fontSize: 13, color: theme.text.primary, fontWeight: '500' },
    durationTextSelected: { color: theme.accent.secondary, fontWeight: '700' },
});
