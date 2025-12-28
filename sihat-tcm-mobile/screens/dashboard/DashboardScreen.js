import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/themes';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ViewReportScreen from '../ViewReportScreen';

// Import extracted tab components
import { HomeTab, HistoryTab, ProfileTab, DocumentsTab } from '../../components/dashboard';

/**
 * DashboardScreen - Main dashboard container with bottom tab navigation.
 * 
 * This component manages:
 * - Tab navigation state and animations
 * - Inquiry data fetching and state
 * - Report viewing modal
 * 
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user object
 * @param {Object} props.profile - User's profile data
 * @param {Function} props.onStartDiagnosis - Callback when "Start Assessment" is pressed
 * @param {Function} props.onLogout - Logout callback
 */
export default function DashboardScreen({ user, profile, onStartDiagnosis, onLogout }) {
    const { theme, isDark, setThemeMode, preference } = useTheme();
    const { t } = useLanguage();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const [activeTab, setActiveTab] = useState('home');
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // Tab indicator animation
    const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchInquiries();
    }, []);

    useEffect(() => {
        const tabIndex = ['home', 'history', 'documents', 'profile'].indexOf(activeTab);
        Animated.spring(tabIndicatorPosition, {
            toValue: tabIndex,
            useNativeDriver: true,
            tension: 68,
            friction: 10,
        }).start();
    }, [activeTab]);

    const fetchInquiries = async () => {
        try {
            // Generate mock data for demo
            const mockInquiries = generateMockInquiries();

            if (user?.id) {
                const { data, error } = await supabase
                    .from('inquiries')
                    .select('id, symptoms, diagnosis_report, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching inquiries:', error);
                    setInquiries(mockInquiries);
                } else {
                    const combined = [...(data || []), ...mockInquiries];
                    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    setInquiries(combined);
                }
            } else {
                setInquiries(mockInquiries);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const generateMockInquiries = () => {
        const symptoms = [
            'Headache, dizziness, and fatigue',
            'Stomach pain and bloating',
            'Insomnia and anxiety',
            'Lower back pain and weakness',
            'Cold hands and feet',
        ];
        const diagnoses = [
            'Liver Fire Uprising',
            'Spleen Qi Deficiency',
            'Heart Yin Deficiency',
            'Kidney Yang Deficiency',
            'Spleen Yang Deficiency',
        ];

        return symptoms.map((symptom, i) => ({
            id: `mock-${i}`,
            symptoms: symptom,
            diagnosis_report: {
                tcmDiagnosis: diagnoses[i],
                mainComplaint: symptom,
            },
            created_at: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
        }));
    };

    const handleRefresh = () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fetchInquiries();
    };

    const switchTab = (tab) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveTab(tab);
    };

    // Handle viewing a report from history
    const handleViewReport = (inquiry) => {
        // Generate markdown content from the inquiry's diagnosis report
        const report = inquiry.diagnosis_report || {};
        const date = new Date(inquiry.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });

        // Build markdown content from the diagnosis report
        let markdownContent = `# TCM Diagnosis Report\n\n`;
        markdownContent += `**Date:** ${formattedDate}\n\n`;

        if (inquiry.symptoms) {
            markdownContent += `## Chief Complaint\n\n${inquiry.symptoms}\n\n`;
        }

        if (report.tcmDiagnosis) {
            markdownContent += `## TCM Diagnosis\n\n**${report.tcmDiagnosis}**\n\n`;
        }

        if (report.syndromePattern) {
            markdownContent += `### Syndrome Pattern\n\n${report.syndromePattern}\n\n`;
        }

        if (report.analysis) {
            markdownContent += `## Analysis\n\n${report.analysis}\n\n`;
        }

        if (report.recommendations) {
            markdownContent += `## Recommendations\n\n`;
            if (Array.isArray(report.recommendations)) {
                report.recommendations.forEach(rec => {
                    markdownContent += `- ${rec}\n`;
                });
            } else if (typeof report.recommendations === 'string') {
                markdownContent += `${report.recommendations}\n`;
            }
            markdownContent += '\n';
        }

        if (report.dietaryAdvice) {
            markdownContent += `## Dietary Advice\n\n${report.dietaryAdvice}\n\n`;
        }

        if (report.lifestyle) {
            markdownContent += `## Lifestyle Suggestions\n\n${report.lifestyle}\n\n`;
        }

        markdownContent += `---\n\n*This report was generated by Sihat TCM AI.*\n`;

        setSelectedReport({
            reportName: report.tcmDiagnosis || 'TCM Diagnosis Report',
            reportContent: markdownContent,
            createdAt: inquiry.created_at,
        });
    };

    // If viewing a specific report, show ViewReportScreen
    if (selectedReport) {
        return (
            <ViewReportScreen
                reportData={selectedReport}
                onBack={() => setSelectedReport(null)}
            />
        );
    }

    const tabWidth = 100 / 4;
    const indicatorTranslateX = tabIndicatorPosition.interpolate({
        inputRange: [0, 1, 2, 3],
        outputRange: ['0%', '100%', '200%', '300%'],
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
            <StatusBar style={isDark ? "light" : "dark"} />
            <LinearGradient
                colors={isDark ? [COLORS.emeraldDeep, COLORS.emeraldDark, '#000000'] : [theme.background.primary, theme.background.secondary, theme.background.tertiary]}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Tab Content */}
            {activeTab === 'home' && (
                <HomeTab
                    user={user}
                    profile={profile}
                    onStartDiagnosis={onStartDiagnosis}
                    recentInquiries={inquiries}
                    styles={styles}
                    theme={theme}
                />
            )}
            {activeTab === 'history' && (
                <HistoryTab
                    inquiries={inquiries}
                    loading={loading}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    styles={styles}
                    theme={theme}
                    onViewReport={handleViewReport}
                />
            )}
            {activeTab === 'documents' && (
                <DocumentsTab
                    user={user}
                    styles={styles}
                    theme={theme}
                />
            )}
            {activeTab === 'profile' && (
                <ProfileTab
                    user={user}
                    profile={profile}
                    onLogout={onLogout}
                    onUpdate={fetchInquiries}
                    styles={styles}
                    theme={theme}
                />
            )}

            {/* Bottom Tab Bar */}
            <View style={styles.tabBar}>
                <Animated.View
                    style={[
                        styles.tabIndicator,
                        { width: `${tabWidth}%` },
                        { transform: [{ translateX: indicatorTranslateX }] },
                    ]}
                />
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => switchTab('home')}
                >
                    <Ionicons
                        name={activeTab === 'home' ? 'home' : 'home-outline'}
                        size={24}
                        color={activeTab === 'home' ? theme.accent.secondary : theme.text.secondary}
                    />
                    <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
                        Home
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => switchTab('history')}
                >
                    <Ionicons
                        name={activeTab === 'history' ? 'time' : 'time-outline'}
                        size={24}
                        color={activeTab === 'history' ? theme.accent.secondary : theme.text.secondary}
                    />
                    <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
                        History
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => switchTab('documents')}
                >
                    <Ionicons
                        name={activeTab === 'documents' ? "documents" : "documents-outline"}
                        size={22}
                        color={activeTab === 'documents' ? COLORS.amberStart : theme.text.secondary}
                    />
                    <Text style={[styles.tabLabel, activeTab === 'documents' && styles.tabLabelActive]}>
                        {t.dashboard.tabs.documents}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => switchTab('profile')}
                >
                    <Ionicons
                        name={activeTab === 'profile' ? 'person' : 'person-outline'}
                        size={24}
                        color={activeTab === 'profile' ? theme.accent.secondary : theme.text.secondary}
                    />
                    <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
                        Profile
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background.primary,
    },
    tabContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    // Welcome Section
    welcomeSection: {
        paddingTop: 20,
        paddingBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: theme.text.secondary,
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginTop: 4,
    },
    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.surface.default,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: theme.text.secondary,
        marginTop: 4,
    },
    // Hero Card
    heroCard: {
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
    },
    heroGradient: {
        padding: 20,
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroText: {
        flex: 1,
        marginLeft: 16,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    heroSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    // Recent Section
    recentSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.text.primary,
        marginBottom: 12,
    },
    // Reports Tab
    reportsHeaderCard: {
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
        marginTop: 20,
    },
    reportsListContainer: {
        flex: 1,
    },
    reportCard: {
        marginBottom: 12,
        backgroundColor: theme.surface.default,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border.subtle,
        overflow: 'hidden',
    },
    reportCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    reportIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    reportInfo: {
        flex: 1,
    },
    reportName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.primary,
        marginBottom: 4,
    },
    reportMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reportMeta: {
        fontSize: 12,
        color: theme.text.secondary,
    },
    reportMetaDot: {
        fontSize: 12,
        color: theme.text.tertiary,
        marginHorizontal: 6,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 0,
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: "#2563EB",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Security Section
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.surface.default,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    securityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    securityTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text.primary,
    },
    securitySubtitle: {
        fontSize: 12,
        color: theme.text.secondary,
        marginTop: 2,
    },
    recentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    recentCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    recentIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentInfo: {
        marginLeft: 12,
        flex: 1,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
    },
    recentDate: {
        fontSize: 12,
        color: theme.text.secondary,
        marginTop: 2,
    },
    // Tips
    tipsSection: {
        marginBottom: 24,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.emeraldMedium,
    },
    tipText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: theme.text.secondary,
        lineHeight: 20,
    },
    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        paddingHorizontal: 14,
        marginVertical: 16,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: theme.text.primary,
    },
    // History List
    historyList: {
        paddingBottom: 100,
    },
    historyCard: {
        backgroundColor: theme.surface.default,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    historyCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    historyDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    historyDate: {
        fontSize: 13,
        color: theme.text.primary,
        fontWeight: '500',
    },
    historyTime: {
        fontSize: 12,
        color: theme.text.secondary,
    },
    historyComplaint: {
        fontSize: 15,
        color: theme.text.primary,
        lineHeight: 22,
        marginBottom: 10,
    },
    historyDiagnosis: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    historyDiagnosisText: {
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.amberStart,
        fontWeight: '500',
    },
    viewReportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.border.default,
        paddingTop: 12,
    },
    viewReportText: {
        fontSize: 14,
        color: COLORS.emeraldMedium,
        fontWeight: '600',
        marginRight: 4,
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: theme.text.primary,
        marginTop: 16,
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.text.secondary,
        marginTop: 8,
    },
    // Profile Tab
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatarGradient: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    profileEmail: {
        fontSize: 14,
        color: theme.text.secondary,
        marginTop: 4,
    },
    // Form
    formSection: {
        marginBottom: 20,
    },
    formSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.primary,
        marginBottom: 16,
    },
    formField: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 13,
        color: theme.text.secondary,
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 15,
        color: theme.text.primary,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    formInputFocused: {
        borderColor: COLORS.emeraldMedium,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
        shadowColor: COLORS.emeraldMedium,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    formInputError: {
        borderColor: '#EF4444',
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
    },
    formTextarea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    formRow: {
        flexDirection: 'row',
    },
    genderRow: {
        flexDirection: 'row',
        gap: 8,
    },
    genderOption: {
        flex: 1,
        backgroundColor: theme.surface.default,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    genderOptionActive: {
        backgroundColor: `${COLORS.emeraldMedium}30`,
        borderWidth: 1,
        borderColor: COLORS.emeraldMedium,
    },
    genderText: {
        fontSize: 13,
        color: theme.text.secondary,
    },
    genderTextActive: {
        color: COLORS.emeraldMedium,
        fontWeight: '600',
    },
    // Save Button
    saveButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
    },
    saveButtonSuccess: {},
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.emeraldDeep,
    },
    // Collapsible Sections
    collapsibleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    collapsibleHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    collapsibleContent: {
        paddingTop: 8,
        paddingBottom: 4,
    },
    // Logout
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EF4444',
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    // Tab Bar
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: isDark ? 'rgba(2, 44, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: theme.border.default,
        paddingBottom: 30,
        paddingTop: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    tabLabel: {
        fontSize: 11,
        color: theme.text.secondary,
        marginTop: 4,
    },
    tabLabelActive: {
        color: COLORS.amberStart,
        fontWeight: '600',
    },
    tabIndicator: {
        position: 'absolute',
        top: 0,
        height: 2,
        backgroundColor: COLORS.amberStart,
    },
    // Theme Toggle Styles
    themeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    themeOptionActive: {
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderColor: COLORS.amberStart,
    },
    themeText: {
        marginTop: 8,
        fontSize: 12,
        color: theme.text.secondary,
    },
    themeTextActive: {
        color: COLORS.amberStart,
        fontWeight: '600',
    },
    themeHint: {
        fontSize: 12,
        color: theme.text.secondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Password Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    passwordModal: {
        backgroundColor: theme.surface.elevated,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 360,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 20,
    },
    passwordModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    passwordModalSubtitle: {
        fontSize: 14,
        color: theme.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.input?.background || theme.surface.default,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border.default,
        marginBottom: 20,
    },
    passwordInputField: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: theme.text.primary,
    },
    passwordEyeButton: {
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    passwordModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    passwordModalCancel: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: theme.surface.default,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    passwordModalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.secondary,
    },
    passwordModalEnable: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    passwordModalEnableGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    passwordModalEnableText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});
