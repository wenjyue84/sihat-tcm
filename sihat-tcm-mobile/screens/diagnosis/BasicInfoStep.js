import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Animated,
    ScrollView,
    Modal,
    FlatList,
    TouchableWithoutFeedback,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS } from '../../constants/themes';
import BMIExplanationModal from '../../components/BMIExplanationModal';
import QuickSelectChips from '../../components/QuickSelectChips';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const generateRange = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => String(start + i));

const AGE_OPTIONS = generateRange(1, 120);
const HEIGHT_OPTIONS = generateRange(50, 250);
const WEIGHT_OPTIONS = generateRange(20, 200);

// Quick select presets for progressive disclosure
const AGE_PRESETS = [18, 25, 35, 45, 55, 65];
const HEIGHT_PRESETS = [155, 160, 165, 170, 175, 180];
const WEIGHT_PRESETS = [50, 60, 70, 80, 90, 100];

const ITEM_HEIGHT = 60;

const SelectionModal = ({ visible, onClose, onSelect, title, options, theme, isDark, styles, initialValue }) => {
    const initialScrollIndex = useMemo(() => {
        if (!initialValue) return 0;
        const index = options.indexOf(String(initialValue));
        return index > 0 ? index : 0;
    }, [initialValue, options]);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={theme.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            getItemLayout={(data, index) => (
                                { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                            )}
                            initialScrollIndex={initialScrollIndex}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => {
                                        onSelect(item);
                                        onClose();
                                    }}
                                >
                                    <Text style={styles.optionText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </BlurView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const FloatingLabelInput = ({ label, value, onChangeText, icon, theme, isDark, styles, keyboardType = 'default', isSelector = false, onSelectorPress = null, suffix = null, onFieldFocus = null, fieldId = null }) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: isFocused || value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value]);

    const handleFocus = () => {
        setIsFocused(true);
        if (onFieldFocus && fieldId) {
            onFieldFocus(fieldId);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const labelStyle = {
        position: 'absolute',
        left: 48,
        top: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 6],
        }),
        fontSize: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.text.tertiary, theme.accent.secondary],
        }),
        fontWeight: isFocused ? '600' : '400',
    };

    const borderColor = isFocused ? theme.accent.secondary : 'transparent';
    const iconColor = isFocused ? theme.accent.secondary : theme.text.tertiary;

    return (
        <View style={[styles.inputContainer, { borderColor }]}>
            <Ionicons name={icon} size={20} color={iconColor} style={styles.inputIcon} />
            <Animated.Text style={labelStyle}>{label}</Animated.Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                keyboardType={keyboardType}
                placeholderTextColor="transparent"
            />
            {suffix && (
                <Text style={{
                    color: theme.text.tertiary,
                    fontSize: 14,
                    fontWeight: '600',
                    marginRight: isSelector ? 4 : 12,
                    alignSelf: 'center',
                }}>
                    {suffix}
                </Text>
            )}
            {isSelector && (
                <TouchableOpacity onPress={onSelectorPress} style={styles.selectorButton}>
                    <Ionicons name="chevron-down" size={20} color={theme.text.tertiary} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const GenderOption = ({ label, icon, selected, onSelect, theme, styles, isDark }) => (
    <TouchableOpacity
        style={[styles.genderOption, selected && styles.genderOptionSelected]}
        onPress={onSelect}
    >
        {selected ? (
            <LinearGradient
                colors={theme.gradients.primary}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        ) : (
            <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        )}
        <Ionicons
            name={icon}
            size={24}
            color={selected ? '#ffffff' : theme.text.tertiary}
        />
        <Text style={[styles.genderLabel, selected && styles.genderLabelSelected]}>
            {label}
        </Text>
    </TouchableOpacity>
);

export default function BasicInfoStep({ data, onUpdate, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const { t } = useLanguage();
    const { name = '', age = '', gender = '' } = data;
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', options: [], field: '', initialValue: '' });
    const [bmiModalVisible, setBmiModalVisible] = useState(false);
    const [activeField, setActiveField] = useState(null);

    useEffect(() => {
        if (!data.name) {
            onUpdate({ ...data, name: 'Anonymous' });
        }
    }, []);

    const handleFieldFocus = (fieldId) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveField(fieldId);
    };

    const openSelector = (title, options, field, defaultValue) => {
        setModalConfig({
            title,
            options,
            field,
            initialValue: data[field] || defaultValue
        });
        setModalVisible(true);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>{t.basicInfo.title || 'Tell Us About Yourself'}</Text>
                <TouchableOpacity onPress={() => onUpdate({
                    ...data,
                    name: 'John Doe',
                    age: '30',
                    height: '175',
                    weight: '70',
                    gender: 'male',
                    mainConcern: 'headache',
                    symptoms: ['insomnia', 'fatigue'],
                    symptomDetails: 'I have been feeling a persistent headache for the last few days.',
                    duration: 'few_days',
                    medicines: [{
                        id: 'test-med-1',
                        type: 'text',
                        content: 'Vitamin C',
                        name: 'Vitamin C'
                    }]
                })}>
                    <Ionicons name="flask-outline" size={16} color={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} />
                </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
                {t.basicInfo.subtitle || 'This information helps us provide personalized health insights.'}
            </Text>

            <View style={styles.formSection}>
                <FloatingLabelInput
                    label={t.basicInfo.name || "Full Name"}
                    value={name}
                    onChangeText={(text) => onUpdate({ ...data, name: text })}
                    icon="person-outline"
                    theme={theme}
                    isDark={isDark}
                    styles={styles}
                />

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <FloatingLabelInput
                            label={t.basicInfo.age || "Age"}
                            value={age}
                            onChangeText={(text) => onUpdate({ ...data, age: text })}
                            icon="calendar-outline"
                            isSelector={true}
                            onSelectorPress={() => openSelector(t.basicInfo.selectAge || 'Select Age', AGE_OPTIONS, 'age', '30')}
                            keyboardType="numeric"
                            theme={theme}
                            isDark={isDark}
                            styles={styles}
                            fieldId="age"
                            onFieldFocus={handleFieldFocus}
                        />
                        {activeField === 'age' && (
                            <QuickSelectChips
                                options={AGE_PRESETS}
                                value={data.age}
                                onSelect={(val) => onUpdate({ ...data, age: val })}
                                theme={theme}
                                isDark={isDark}
                            />
                        )}
                    </View>
                    <View style={styles.halfInput}>
                        <FloatingLabelInput
                            label={t.basicInfo.gender || "Gender"}
                            value={gender ? (gender === 'male' ? t.basicInfo.male || 'Male' : gender === 'female' ? t.basicInfo.female || 'Female' : t.basicInfo.other || 'Other') : ''}
                            onChangeText={() => { }}
                            icon="person-outline"
                            isSelector={true}
                            onSelectorPress={() => openSelector(t.basicInfo.selectGender || 'Select Gender', [t.basicInfo.male || 'Male', t.basicInfo.female || 'Female', t.basicInfo.other || 'Other'], 'gender', '')}
                            theme={theme}
                            isDark={isDark}
                            styles={styles}
                            fieldId="gender"
                            onFieldFocus={handleFieldFocus}
                        />
                    </View>
                </View>

                <View style={[styles.row, { marginTop: 12 }]}>
                    <View style={styles.halfInput}>
                        <FloatingLabelInput
                            label={t.basicInfo.height || 'Height'}
                            value={data.height}
                            onChangeText={(text) => onUpdate({ ...data, height: text })}
                            icon="resize-outline"
                            isSelector={true}
                            onSelectorPress={() => openSelector(t.basicInfo.selectHeight || 'Select Height', HEIGHT_OPTIONS, 'height', '170')}
                            keyboardType="numeric"
                            theme={theme}
                            isDark={isDark}
                            styles={styles}
                            suffix="cm"
                            fieldId="height"
                            onFieldFocus={handleFieldFocus}
                        />
                        {activeField === 'height' && (
                            <QuickSelectChips
                                options={HEIGHT_PRESETS}
                                value={data.height}
                                onSelect={(val) => onUpdate({ ...data, height: val })}
                                unit="cm"
                                theme={theme}
                                isDark={isDark}
                            />
                        )}
                    </View>
                    <View style={styles.halfInput}>
                        <FloatingLabelInput
                            label={t.basicInfo.weight || 'Weight'}
                            value={data.weight}
                            onChangeText={(text) => onUpdate({ ...data, weight: text })}
                            icon="barbell-outline"
                            isSelector={true}
                            onSelectorPress={() => openSelector(t.basicInfo.selectWeight || 'Select Weight', WEIGHT_OPTIONS, 'weight', '50')}
                            keyboardType="numeric"
                            theme={theme}
                            isDark={isDark}
                            styles={styles}
                            suffix="kg"
                            fieldId="weight"
                            onFieldFocus={handleFieldFocus}
                        />
                        {activeField === 'weight' && (
                            <QuickSelectChips
                                options={WEIGHT_PRESETS}
                                value={data.weight}
                                onSelect={(val) => onUpdate({ ...data, weight: val })}
                                unit="kg"
                                theme={theme}
                                isDark={isDark}
                            />
                        )}
                    </View>
                </View>

                {/* BMI Calculator Card - Tappable to show explanation modal */}
                {data.height && data.weight && (() => {
                    const h = parseFloat(data.height);
                    const w = parseFloat(data.weight);
                    if (h > 0 && w > 0) {
                        const bmi = w / ((h / 100) ** 2);
                        let category, color, bgColor, icon;
                        if (bmi < 18.5) {
                            category = t.basicInfo?.bmiCategories?.underweight || t.basicInfo?.underweight || 'Underweight';
                            color = '#3b82f6';
                            bgColor = '#eff6ff';
                            icon = 'arrow-down-outline';
                        } else if (bmi < 25) {
                            category = t.basicInfo?.bmiCategories?.normal || t.basicInfo?.normal || 'Normal';
                            color = '#10b981';
                            bgColor = '#ecfdf5';
                            icon = 'checkmark-circle-outline';
                        } else if (bmi < 30) {
                            category = t.basicInfo?.bmiCategories?.overweight || t.basicInfo?.overweight || 'Overweight';
                            color = '#f59e0b';
                            bgColor = '#fffbeb';
                            icon = 'warning-outline';
                        } else {
                            category = t.basicInfo?.bmiCategories?.obese || t.basicInfo?.obese || 'Obese';
                            color = '#ef4444';
                            bgColor = '#fef2f2';
                            icon = 'alert-circle-outline';
                        }
                        return (
                            <TouchableOpacity
                                style={styles.bmiCard}
                                onPress={() => setBmiModalVisible(true)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.bmiHeader}>
                                    <Ionicons name="fitness-outline" size={20} color={theme.accent.primary} />
                                    <Text style={styles.bmiTitle}>{t.basicInfo?.bmi || 'Body Mass Index'}</Text>
                                    <View style={{ flex: 1 }} />
                                    <Ionicons name="information-circle-outline" size={18} color={theme.text.tertiary} />
                                </View>
                                <View style={styles.bmiContent}>
                                    <View style={styles.bmiValueContainer}>
                                        <Text style={[styles.bmiValue, { color }]}>{bmi.toFixed(1)}</Text>
                                        <Text style={styles.bmiUnit}>kg/m²</Text>
                                    </View>
                                    <View style={[styles.bmiCategoryBadge, { backgroundColor: bgColor }]}>
                                        <Ionicons name={icon} size={16} color={color} />
                                        <Text style={[styles.bmiCategoryText, { color }]}>{category}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }
                    return null;
                })()}
            </View>

            <SelectionModal
                visible={modalVisible}
                title={modalConfig.title}
                options={modalConfig.options}
                onClose={() => setModalVisible(false)}
                onSelect={(val) => {
                    // For gender field, convert display text back to internal value
                    if (modalConfig.field === 'gender') {
                        const maleText = t.basicInfo.male || 'Male';
                        const femaleText = t.basicInfo.female || 'Female';
                        const otherText = t.basicInfo.other || 'Other';
                        let genderValue = 'other';
                        if (val === maleText) genderValue = 'male';
                        else if (val === femaleText) genderValue = 'female';
                        onUpdate({ ...data, gender: genderValue });
                    } else {
                        onUpdate({ ...data, [modalConfig.field]: val });
                    }
                }}
                theme={theme}
                isDark={isDark}
                styles={styles}
                initialValue={modalConfig.initialValue}
            />

            {/* BMI Explanation Modal */}
            {data.height && data.weight && parseFloat(data.height) > 0 && parseFloat(data.weight) > 0 && (
                <BMIExplanationModal
                    visible={bmiModalVisible}
                    onClose={() => setBmiModalVisible(false)}
                    bmi={parseFloat(data.weight) / ((parseFloat(data.height) / 100) ** 2)}
                    height={parseFloat(data.height)}
                    weight={parseFloat(data.weight)}
                    theme={theme}
                    isDark={isDark}
                />
            )}
        </ScrollView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24 },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 24, marginBottom: 8,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.text.primary },
    subtitle: { fontSize: 15, color: theme.text.secondary, marginBottom: 32, lineHeight: 22 },
    formSection: { marginBottom: 24 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', height: 60,
        backgroundColor: theme.input.background, borderRadius: 18,
        marginBottom: 16, borderWidth: 1, paddingHorizontal: 16,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: '100%', color: theme.text.primary, fontSize: 16, paddingTop: 18 },
    sectionLabel: { fontSize: 16, fontWeight: 'bold', color: theme.text.primary, marginTop: 12, marginBottom: 16 },
    genderContainer: { flexDirection: 'row', gap: 12 },
    genderRow: {
        flexDirection: 'row',
        gap: 8,
        height: 60,
        alignItems: 'center',
    },
    genderOptionCompact: {
        flex: 1,
        backgroundColor: theme.input.background,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    genderOptionActive: {
        backgroundColor: `${theme.accent.primary}20`,
        borderColor: theme.accent.primary,
    },
    genderTextCompact: {
        fontSize: 13,
        color: theme.text.tertiary,
        fontWeight: '500',
    },
    genderTextActive: {
        color: theme.accent.primary,
        fontWeight: 'bold',
    },
    formRowLabel: {
        position: 'absolute',
        left: 0,
        top: -10,
        fontSize: 12,
        color: theme.accent.secondary,
        fontWeight: '600',
        zIndex: 1,
    },
    genderOption: {
        flex: 1, alignItems: 'center', padding: 20,
        borderRadius: 20, borderWidth: 1, borderColor: theme.border.default,
        overflow: 'hidden',
    },
    genderOptionSelected: { borderColor: 'transparent' },
    genderLabel: { marginTop: 8, fontSize: 14, color: theme.text.secondary, fontWeight: '600' },
    genderLabelSelected: { color: '#ffffff' },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: theme.background.overlay, justifyContent: 'flex-end' },
    modalContent: {
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        height: '55%', padding: 24, overflow: 'hidden',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text.primary },
    optionItem: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        borderBottomWidth: 1, borderBottomColor: theme.border.subtle,
        alignItems: 'center'
    },
    optionText: { fontSize: 18, color: theme.text.primary, fontWeight: '500' },
    selectorButton: { padding: 8, marginRight: -8 },
    // BMI Calculator Styles
    bmiCard: {
        backgroundColor: theme.surface.elevated,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    bmiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    bmiTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    bmiContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bmiValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    bmiValue: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    bmiUnit: {
        fontSize: 14,
        color: theme.text.tertiary,
    },
    bmiCategoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    bmiCategoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
