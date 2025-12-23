import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    FlatList,
    TextInput,
    Animated,
    RefreshControl,
    Modal,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../constants/themes';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Doctor-specific color palette (blue/indigo theme)
const DOCTOR_COLORS = {
    primary: '#3B82F6',
    primaryDark: '#1D4ED8',
    primaryLight: '#60A5FA',
    secondary: '#6366F1',
    secondaryDark: '#4338CA',
    background: '#0F172A',
    backgroundLight: '#1E293B',
    card: 'rgba(255, 255, 255, 0.08)',
    cardHover: 'rgba(255, 255, 255, 0.12)',
    accent: '#F59E0B',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
};

// Mock data for demonstration
const MOCK_INQUIRIES = [
    {
        id: 'mock-1',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: 'Persistent headache, fatigue, and dizziness for the past week. Difficulty concentrating at work.',
        diagnosis_report: {
            summary: 'Qi Deficiency with Blood Stasis',
            tcmPattern: '气虚血瘀证',
            recommendations: ['Rest adequately', 'Acupuncture for Zusanli (ST36)', 'Herbal formula: Bu Zhong Yi Qi Tang'],
            tongueObservation: 'Pale tongue with thin white coating',
            pulseObservation: 'Weak and thready pulse',
        },
        profiles: { full_name: 'Ahmad bin Hassan', age: 45, gender: 'Male' },
    },
    {
        id: 'mock-2',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: 'Insomnia, heart palpitations, anxiety, and night sweats. Feeling restless especially at night.',
        diagnosis_report: {
            summary: 'Heart Yin Deficiency with Empty Heat',
            tcmPattern: '心阴虚证',
            recommendations: ['Avoid spicy foods', 'Meditation and relaxation', 'Herbal formula: Tian Wang Bu Xin Dan'],
            tongueObservation: 'Red tongue tip with little coating',
            pulseObservation: 'Rapid and thin pulse',
        },
        profiles: { full_name: 'Siti Nurhaliza', age: 38, gender: 'Female' },
    },
    {
        id: 'mock-3',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: 'Lower back pain, knee weakness, frequent urination especially at night. Cold extremities.',
        diagnosis_report: {
            summary: 'Kidney Yang Deficiency',
            tcmPattern: '肾阳虚证',
            recommendations: ['Avoid cold foods', 'Keep lower back warm', 'Herbal formula: Jin Gui Shen Qi Wan'],
            tongueObservation: 'Pale, puffy tongue with tooth marks',
            pulseObservation: 'Deep and slow pulse',
        },
        profiles: { full_name: 'Tan Wei Ming', age: 52, gender: 'Male' },
    },
    {
        id: 'mock-4',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: 'Digestive issues, bloating after meals, loose stools, lack of appetite, and general weakness.',
        diagnosis_report: {
            summary: 'Spleen Qi Deficiency with Dampness',
            tcmPattern: '脾气虚湿困证',
            recommendations: ['Eat warm, cooked foods', 'Avoid dairy and raw foods', 'Herbal formula: Shen Ling Bai Zhu San'],
            tongueObservation: 'Swollen tongue with thick greasy coating',
            pulseObservation: 'Soggy and slippery pulse',
        },
        profiles: { full_name: 'Priya Devi', age: 29, gender: 'Female' },
    },
    {
        id: 'mock-5',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: 'Chronic cough with white phlegm, shortness of breath, catches cold easily, spontaneous sweating.',
        diagnosis_report: {
            summary: 'Lung Qi Deficiency',
            tcmPattern: '肺气虚证',
            recommendations: ['Deep breathing exercises', 'Avoid cold and windy weather', 'Herbal formula: Yu Ping Feng San'],
            tongueObservation: 'Pale tongue with white coating',
            pulseObservation: 'Weak and floating pulse',
        },
        profiles: { full_name: 'Lee Mei Ling', age: 62, gender: 'Female' },
    },
    {
        id: 'mock-6',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: 'Irritability, red eyes, headache on the sides, bitter taste in mouth, anger outbursts.',
        diagnosis_report: {
            summary: 'Liver Fire Rising',
            tcmPattern: '肝火上炎证',
            recommendations: ['Stress management', 'Avoid alcohol and spicy foods', 'Herbal formula: Long Dan Xie Gan Tang'],
            tongueObservation: 'Red tongue with yellow coating on sides',
            pulseObservation: 'Wiry and rapid pulse',
        },
        profiles: { full_name: 'Raj Kumar', age: 41, gender: 'Male' },
    },
    {
        id: 'mock-7',
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: 'Menstrual irregularities, breast tenderness before period, mood swings, sighing frequently.',
        diagnosis_report: {
            summary: 'Liver Qi Stagnation',
            tcmPattern: '肝气郁结证',
            recommendations: ['Regular exercise', 'Emotional expression', 'Herbal formula: Xiao Yao San'],
            tongueObservation: 'Normal color with thin coating',
            pulseObservation: 'Wiry pulse especially on left side',
        },
        profiles: { full_name: 'Fatimah binti Abdullah', age: 34, gender: 'Female' },
    },
    {
        id: 'mock-8',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        symptoms: 'Joint pain worse in cold and damp weather, stiffness in the morning, heavy limbs.',
        diagnosis_report: {
            summary: 'Wind-Cold-Damp Bi Syndrome',
            tcmPattern: '风寒湿痹证',
            recommendations: ['Keep joints warm', 'Gentle movement exercises', 'Herbal formula: Du Huo Ji Sheng Tang'],
            tongueObservation: 'Pale tongue with white greasy coating',
            pulseObservation: 'Tight and slippery pulse',
        },
        profiles: { full_name: 'Lim Ah Kow', age: 68, gender: 'Male' },
    },
];

// Symptom filter tags
const SYMPTOM_TAGS = ['Headache', 'Fatigue', 'Insomnia', 'Pain', 'Digestive', 'Cough', 'Anxiety'];

// Date filter options
const DATE_FILTERS = [
    { id: 'all', label: 'All Time' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: '90days', label: 'Last 3 Months' },
];

// ==========================================
// STAT CARD COMPONENT
// ==========================================
const StatCard = ({ icon, value, label, color, styles }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ==========================================
// FILTER CHIPS COMPONENT
// ==========================================
const FilterChips = ({ options, selected, onSelect, style, styles }) => (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.chipsContainer, style]}
        contentContainerStyle={styles.chipsContent}
    >
        {options.map((option) => {
            const isSelected = selected === option;
            return (
                <TouchableOpacity
                    key={option}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                        Haptics.selectionAsync();
                        onSelect(isSelected ? '' : option);
                    }}
                >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {option}
                    </Text>
                </TouchableOpacity>
            );
        })}
    </ScrollView>
);

// ==========================================
// PATIENT CARD COMPONENT
// ==========================================
const PatientCard = ({ inquiry, onViewReport, styles }) => {
    const profile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
    const reportProfile = inquiry.diagnosis_report?.patient_profile;
    const patientName = reportProfile?.name || profile?.full_name || 'Anonymous Patient';
    const patientAge = reportProfile?.age || profile?.age;
    const patientGender = reportProfile?.gender || profile?.gender;
    const diagnosis = inquiry.diagnosis_report;

    const date = new Date(inquiry.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <View style={styles.patientCard}>
            {/* Header */}
            <View style={styles.patientHeader}>
                <View style={styles.patientAvatar}>
                    <LinearGradient
                        colors={[DOCTOR_COLORS.primary, DOCTOR_COLORS.secondary]}
                        style={styles.avatarGradient}
                    >
                        <Text style={styles.avatarText}>
                            {patientName.charAt(0).toUpperCase()}
                        </Text>
                    </LinearGradient>
                </View>
                <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patientName}</Text>
                    <Text style={styles.patientDetails}>
                        {patientGender}, {patientAge} years old
                    </Text>
                </View>
                <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                    <Text style={styles.timeText}>{formattedTime}</Text>
                </View>
            </View>

            {/* Chief Complaints */}
            <View style={styles.complaintsSection}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="medical-outline" size={16} color={DOCTOR_COLORS.primary} />
                    <Text style={styles.sectionTitle}>Chief Complaints</Text>
                </View>
                <Text style={styles.complaintsText} numberOfLines={2}>
                    {inquiry.symptoms || 'No symptoms recorded'}
                </Text>
            </View>

            {/* Diagnosis Summary */}
            {diagnosis && (
                <View style={styles.diagnosisSection}>
                    <View style={styles.diagnosisBadge}>
                        <Ionicons name="leaf-outline" size={14} color={DOCTOR_COLORS.success} />
                        <Text style={styles.diagnosisText}>
                            {diagnosis.summary || diagnosis.tcmPattern || 'Analysis Complete'}
                        </Text>
                    </View>
                    {diagnosis.tcmPattern && diagnosis.summary && (
                        <Text style={styles.tcmPatternText}>{diagnosis.tcmPattern}</Text>
                    )}
                </View>
            )}

            {/* View Report Button */}
            <TouchableOpacity
                style={styles.viewReportButton}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onViewReport(inquiry);
                }}
            >
                <Text style={styles.viewReportText}>View Full Report</Text>
                <Ionicons name="chevron-forward" size={16} color={DOCTOR_COLORS.primary} />
            </TouchableOpacity>
        </View>
    );
};

// ==========================================
// FULL REPORT MODAL
// ==========================================
const ReportModal = ({ visible, inquiry, onClose, styles, theme, isDark }) => {
    if (!inquiry) return null;

    const profile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
    const reportProfile = inquiry.diagnosis_report?.patient_profile;
    const patientName = reportProfile?.name || profile?.full_name || 'Anonymous Patient';
    const patientAge = reportProfile?.age || profile?.age;
    const patientGender = reportProfile?.gender || profile?.gender;
    const diagnosis = inquiry.diagnosis_report || {};

    const date = new Date(inquiry.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <LinearGradient
                    colors={isDark ? [DOCTOR_COLORS.background, DOCTOR_COLORS.backgroundLight] : [theme.background.primary, theme.background.secondary]}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Diagnosis Report</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.modalContent}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Patient Info Card */}
                    <View style={styles.reportSection}>
                        <View style={styles.reportSectionHeader}>
                            <Ionicons name="person-outline" size={18} color={DOCTOR_COLORS.primary} />
                            <Text style={styles.reportSectionTitle}>Patient Information</Text>
                        </View>
                        <View style={styles.reportCard}>
                            <View style={styles.reportRow}>
                                <Text style={styles.reportLabel}>Name</Text>
                                <Text style={styles.reportValue}>{patientName}</Text>
                            </View>
                            <View style={styles.reportRow}>
                                <Text style={styles.reportLabel}>Age</Text>
                                <Text style={styles.reportValue}>{patientAge} years</Text>
                            </View>
                            <View style={styles.reportRow}>
                                <Text style={styles.reportLabel}>Gender</Text>
                                <Text style={styles.reportValue}>{patientGender}</Text>
                            </View>
                            <View style={[styles.reportRow, { borderBottomWidth: 0 }]}>
                                <Text style={styles.reportLabel}>Date</Text>
                                <Text style={styles.reportValue}>{formattedDate}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Chief Complaints */}
                    <View style={styles.reportSection}>
                        <View style={styles.reportSectionHeader}>
                            <Ionicons name="medical-outline" size={18} color={DOCTOR_COLORS.primary} />
                            <Text style={styles.reportSectionTitle}>Chief Complaints</Text>
                        </View>
                        <View style={[styles.reportCard, styles.complaintCard]}>
                            <Text style={styles.complaintText}>{inquiry.symptoms || 'No symptoms recorded'}</Text>
                        </View>
                    </View>

                    {/* TCM Diagnosis */}
                    {diagnosis.summary && (
                        <View style={styles.reportSection}>
                            <View style={styles.reportSectionHeader}>
                                <Ionicons name="leaf-outline" size={18} color={DOCTOR_COLORS.success} />
                                <Text style={styles.reportSectionTitle}>TCM Pattern Diagnosis</Text>
                            </View>
                            <View style={[styles.reportCard, styles.diagnosisCard]}>
                                <Text style={styles.diagnosisSummary}>{diagnosis.summary}</Text>
                                {diagnosis.tcmPattern && (
                                    <Text style={styles.diagnosisPattern}>{diagnosis.tcmPattern}</Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Observations */}
                    {(diagnosis.tongueObservation || diagnosis.pulseObservation) && (
                        <View style={styles.reportSection}>
                            <View style={styles.reportSectionHeader}>
                                <Ionicons name="eye-outline" size={18} color={DOCTOR_COLORS.secondary} />
                                <Text style={styles.reportSectionTitle}>Observations</Text>
                            </View>
                            <View style={styles.observationsGrid}>
                                {diagnosis.tongueObservation && (
                                    <View style={[styles.observationCard, { backgroundColor: '#FDF2F8' }]}>
                                        <Text style={[styles.observationLabel, { color: '#BE185D' }]}>
                                            Tongue
                                        </Text>
                                        <Text style={styles.observationText}>
                                            {diagnosis.tongueObservation}
                                        </Text>
                                    </View>
                                )}
                                {diagnosis.pulseObservation && (
                                    <View style={[styles.observationCard, { backgroundColor: '#F3E8FF' }]}>
                                        <Text style={[styles.observationLabel, { color: '#7C3AED' }]}>
                                            Pulse
                                        </Text>
                                        <Text style={styles.observationText}>
                                            {diagnosis.pulseObservation}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Recommendations */}
                    {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                        <View style={styles.reportSection}>
                            <View style={styles.reportSectionHeader}>
                                <Ionicons name="clipboard-outline" size={18} color={DOCTOR_COLORS.accent} />
                                <Text style={styles.reportSectionTitle}>Recommendations</Text>
                            </View>
                            <View style={[styles.reportCard, styles.recommendationsCard]}>
                                {diagnosis.recommendations.map((rec, index) => (
                                    <View key={index} style={styles.recommendationItem}>
                                        <View style={styles.recommendationBullet}>
                                            <Text style={styles.recommendationNumber}>{index + 1}</Text>
                                        </View>
                                        <Text style={styles.recommendationText}>{rec}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// ==========================================
// MAIN DOCTOR DASHBOARD SCREEN
// ==========================================
export default function DoctorDashboardScreen({ user, profile, onLogout }) {
    const { theme, isDark, toggleTheme } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [useMockData, setUseMockData] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [symptomFilter, setSymptomFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [reportModalVisible, setReportModalVisible] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const { data, error } = await supabase
                .from('inquiries')
                .select(`
                    id,
                    created_at,
                    symptoms,
                    diagnosis_report,
                    profiles (
                        full_name,
                        age,
                        gender
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                setUseMockData(true);
                setInquiries(MOCK_INQUIRIES);
            } else {
                setInquiries(data);
            }
        } catch (error) {
            console.error('Error fetching inquiries:', error);
            setUseMockData(true);
            setInquiries(MOCK_INQUIRIES);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fetchInquiries();
    };

    // Filter logic
    const filteredInquiries = useMemo(() => {
        return inquiries.filter((inquiry) => {
            const profile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
            const reportProfile = inquiry.diagnosis_report?.patient_profile;
            const patientName = (reportProfile?.name || profile?.full_name || '').toLowerCase();
            const symptoms = (inquiry.symptoms || '').toLowerCase();
            const diagnosisText = JSON.stringify(inquiry.diagnosis_report || {}).toLowerCase();
            const searchLower = searchQuery.toLowerCase();

            // Keyword search
            if (searchQuery) {
                const matchesSearch =
                    patientName.includes(searchLower) ||
                    symptoms.includes(searchLower) ||
                    diagnosisText.includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Date filter
            if (dateFilter !== 'all') {
                const inquiryDate = new Date(inquiry.created_at);
                const now = new Date();
                let daysAgo = 0;

                if (dateFilter === '7days') daysAgo = 7;
                else if (dateFilter === '30days') daysAgo = 30;
                else if (dateFilter === '90days') daysAgo = 90;

                const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
                if (inquiryDate < cutoffDate) return false;
            }

            // Symptom filter
            if (symptomFilter) {
                if (!symptoms.includes(symptomFilter.toLowerCase())) return false;
            }

            return true;
        });
    }, [inquiries, searchQuery, dateFilter, symptomFilter]);

    // Statistics
    const stats = useMemo(() => {
        const today = new Date();
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentCount = inquiries.filter((i) => new Date(i.created_at) >= last7Days).length;
        const uniquePatients = new Set(
            inquiries.map((i) => {
                const p = Array.isArray(i.profiles) ? i.profiles[0] : i.profiles;
                const reportProfile = i.diagnosis_report?.patient_profile;
                return reportProfile?.name || p?.full_name;
            })
        ).size;

        return {
            total: inquiries.length,
            recent: recentCount,
            uniquePatients,
        };
    }, [inquiries]);

    const hasActiveFilters = searchQuery || symptomFilter || dateFilter !== 'all';

    const clearFilters = () => {
        setSearchQuery('');
        setSymptomFilter('');
        setDateFilter('all');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleViewReport = (inquiry) => {
        setSelectedInquiry(inquiry);
        setReportModalVisible(true);
    };

    const handleLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLogout();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={isDark ? [DOCTOR_COLORS.background, DOCTOR_COLORS.backgroundLight] : [theme.background.primary, theme.background.secondary]}
                    style={StyleSheet.absoluteFillObject}
                />
                <ActivityIndicator size="large" color={DOCTOR_COLORS.primary} />
                <Text style={styles.loadingText}>Loading patient records...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <LinearGradient
                colors={isDark ? [DOCTOR_COLORS.background, DOCTOR_COLORS.backgroundLight, '#000'] : [theme.background.primary, theme.background.secondary, theme.background.tertiary]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Doctor Dashboard</Text>
                    <Text style={styles.headerSubtitle}>Patient History & Records</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: theme.surface.elevated }]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            toggleTheme();
                        }}
                    >
                        <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={DOCTOR_COLORS.primary} />
                        <Text style={{ fontSize: 13, color: DOCTOR_COLORS.primary, fontWeight: '600' }}>
                            {isDark ? 'Dark' : 'Light'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: theme.surface.elevated }]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={22} color={DOCTOR_COLORS.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Demo Mode Banner */}
            {useMockData && (
                <View style={styles.demoBanner}>
                    <Ionicons name="information-circle-outline" size={20} color={DOCTOR_COLORS.accent} />
                    <View style={styles.demoBannerText}>
                        <Text style={styles.demoBannerTitle}>Demo Mode</Text>
                        <Text style={styles.demoBannerSubtitle}>
                            Showing sample patient records
                        </Text>
                    </View>
                </View>
            )}

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <StatCard
                    icon="people-outline"
                    value={stats.uniquePatients}
                    label="Patients"
                    color={DOCTOR_COLORS.primary}
                    styles={styles}
                />
                <StatCard
                    icon="document-text-outline"
                    value={stats.total}
                    label="Inquiries"
                    color={DOCTOR_COLORS.success}
                    styles={styles}
                />
                <StatCard
                    icon="time-outline"
                    value={stats.recent}
                    label="Last 7 Days"
                    color={DOCTOR_COLORS.secondary}
                    styles={styles}
                />
            </View>

            {/* Search and Filter */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search patients, symptoms, diagnosis..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                    onPress={() => {
                        Haptics.selectionAsync();
                        setShowFilters(!showFilters);
                    }}
                >
                    <Ionicons
                        name="options-outline"
                        size={20}
                        color={showFilters ? COLORS.white : DOCTOR_COLORS.primary}
                    />
                    {hasActiveFilters && <View style={styles.filterBadge} />}
                </TouchableOpacity>
            </View>

            {/* Expanded Filters */}
            {showFilters && (
                <View style={styles.filtersExpanded}>
                    {/* Date Filter */}
                    <Text style={styles.filterLabel}>Date Range</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.dateFiltersScroll}
                    >
                        {DATE_FILTERS.map((filter) => (
                            <TouchableOpacity
                                key={filter.id}
                                style={[
                                    styles.dateFilterChip,
                                    dateFilter === filter.id && styles.dateFilterChipActive,
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setDateFilter(filter.id);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.dateFilterText,
                                        dateFilter === filter.id && styles.dateFilterTextActive,
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Symptom Filter */}
                    <Text style={[styles.filterLabel, { marginTop: 12 }]}>Quick Filter by Symptom</Text>
                    <FilterChips
                        options={SYMPTOM_TAGS}
                        selected={symptomFilter}
                        onSelect={setSymptomFilter}
                        styles={styles}
                    />

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                            <Ionicons name="close-circle-outline" size={16} color={DOCTOR_COLORS.danger} />
                            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Results Count */}
            <View style={styles.resultsCount}>
                <Text style={styles.resultsText}>
                    Showing {filteredInquiries.length} of {inquiries.length} records
                    {hasActiveFilters && ' (filtered)'}
                </Text>
            </View>

            {/* Patient List */}
            <FlatList
                data={filteredInquiries}
                renderItem={({ item }) => (
                    <PatientCard inquiry={item} onViewReport={handleViewReport} styles={styles} />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={DOCTOR_COLORS.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>No patient records found</Text>
                        {hasActiveFilters && (
                            <TouchableOpacity onPress={clearFilters}>
                                <Text style={styles.emptyLink}>Clear filters to see all records</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            {/* Full Report Modal */}
            <ReportModal
                visible={reportModalVisible}
                inquiry={selectedInquiry}
                onClose={() => setReportModalVisible(false)}
                styles={styles}
                theme={theme}
                isDark={isDark}
            />
        </SafeAreaView>
    );
}

// ==========================================
// STYLES
// ==========================================
const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DOCTOR_COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: theme.text.secondary,
        fontSize: 14,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.text.secondary,
        marginTop: 2,
    },
    logoutButton: {
        padding: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: 12,
    },

    // Demo Banner
    demoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: DOCTOR_COLORS.accent,
    },
    demoBannerText: {
        marginLeft: 12,
    },
    demoBannerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: DOCTOR_COLORS.accent,
    },
    demoBannerSubtitle: {
        fontSize: 12,
        color: theme.text.secondary,
        marginTop: 2,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.surface.default,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    statLabel: {
        fontSize: 11,
        color: theme.text.secondary,
        marginTop: 2,
    },

    // Search
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: theme.text.primary,
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: theme.surface.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: DOCTOR_COLORS.primary,
    },
    filterBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: DOCTOR_COLORS.accent,
    },

    // Expanded Filters
    filtersExpanded: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    filterLabel: {
        fontSize: 13,
        color: theme.text.secondary,
        marginBottom: 8,
    },
    dateFiltersScroll: {
        marginBottom: 4,
    },
    dateFilterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: theme.surface.default,
        borderRadius: 20,
        marginRight: 8,
    },
    dateFilterChipActive: {
        backgroundColor: DOCTOR_COLORS.primary,
    },
    dateFilterText: {
        fontSize: 13,
        color: theme.text.secondary,
    },
    dateFilterTextActive: {
        color: theme.text.primary,
        fontWeight: '600',
    },
    clearFiltersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: 16,
    },
    clearFiltersText: {
        marginLeft: 6,
        fontSize: 13,
        color: DOCTOR_COLORS.danger,
    },

    // Chips
    chipsContainer: {
        marginBottom: 4,
    },
    chipsContent: {
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: theme.surface.default,
        borderRadius: 20,
        marginRight: 8,
    },
    chipSelected: {
        backgroundColor: DOCTOR_COLORS.secondary,
    },
    chipText: {
        fontSize: 13,
        color: theme.text.secondary,
    },
    chipTextSelected: {
        color: theme.text.primary,
        fontWeight: '600',
    },

    // Results Count
    resultsCount: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    resultsText: {
        fontSize: 13,
        color: theme.text.secondary,
    },

    // List
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    // Patient Card
    patientCard: {
        backgroundColor: theme.surface.default,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    patientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    patientAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    avatarGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    patientInfo: {
        flex: 1,
        marginLeft: 12,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.primary,
    },
    patientDetails: {
        fontSize: 13,
        color: theme.text.secondary,
        marginTop: 2,
    },
    dateContainer: {
        alignItems: 'flex-end',
    },
    dateText: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.text.primary,
    },
    timeText: {
        fontSize: 11,
        color: theme.text.secondary,
        marginTop: 2,
    },
    complaintsSection: {
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: DOCTOR_COLORS.primary,
        marginLeft: 6,
    },
    complaintsText: {
        fontSize: 14,
        color: theme.text.secondary,
        lineHeight: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 12,
        borderRadius: 10,
    },
    diagnosisSection: {
        marginBottom: 12,
    },
    diagnosisBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    diagnosisText: {
        fontSize: 14,
        fontWeight: '600',
        color: DOCTOR_COLORS.success,
        marginLeft: 8,
        flex: 1,
    },
    tcmPatternText: {
        fontSize: 12,
        color: theme.text.secondary,
        marginTop: 6,
        marginLeft: 4,
    },
    viewReportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 4,
    },
    viewReportText: {
        fontSize: 14,
        fontWeight: '600',
        color: DOCTOR_COLORS.primary,
        marginRight: 4,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 16,
        color: theme.text.secondary,
        marginTop: 16,
    },
    emptyLink: {
        fontSize: 14,
        color: DOCTOR_COLORS.primary,
        marginTop: 8,
    },

    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: theme.background.primary,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border.default,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text.primary,
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },

    // Report Sections
    reportSection: {
        marginBottom: 20,
    },
    reportSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    reportSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text.primary,
        marginLeft: 8,
    },
    reportCard: {
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        padding: 16,
    },
    reportRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    reportLabel: {
        fontSize: 14,
        color: theme.text.secondary,
    },
    reportValue: {
        fontSize: 14,
        color: theme.text.primary,
        fontWeight: '500',
    },
    complaintCard: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    complaintText: {
        fontSize: 14,
        color: theme.text.primary,
        lineHeight: 22,
    },
    diagnosisCard: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    diagnosisSummary: {
        fontSize: 18,
        fontWeight: 'bold',
        color: DOCTOR_COLORS.success,
    },
    diagnosisPattern: {
        fontSize: 14,
        color: theme.text.secondary,
        marginTop: 6,
    },
    observationsGrid: {
        gap: 12,
    },
    observationCard: {
        padding: 14,
        borderRadius: 12,
    },
    observationLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    observationText: {
        fontSize: 14,
        color: '#1F2937',
        lineHeight: 20,
    },
    recommendationsCard: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    recommendationBullet: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: DOCTOR_COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    recommendationNumber: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    recommendationText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.white,
        lineHeight: 20,
    },
});
