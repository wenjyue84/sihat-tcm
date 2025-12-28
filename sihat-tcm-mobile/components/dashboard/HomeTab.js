import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/themes';

/**
 * HomeTab - Dashboard home screen showing welcome, stats, and quick actions.
 * 
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user object
 * @param {Object} props.profile - User's profile data (full_name, height, weight)
 * @param {Function} props.onStartDiagnosis - Callback when "Start Assessment" is pressed
 * @param {Array} props.recentInquiries - Array of recent diagnosis inquiries
 * @param {Object} props.styles - Shared StyleSheet from parent
 * @param {Object} props.theme - Current theme object
 */
export function HomeTab({ user, profile, onStartDiagnosis, recentInquiries, styles, theme }) {
    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const userName = profile?.full_name || user?.email?.split('@')[0] || 'Guest';

    // Calculate BMI if available
    const calculateBMI = () => {
        if (profile?.height && profile?.weight) {
            const heightM = profile.height / 100;
            return (profile.weight / (heightM * heightM)).toFixed(1);
        }
        return null;
    };

    return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Welcome Header */}
            <View style={styles.welcomeSection}>
                <Text style={styles.greeting}>{greeting()},</Text>
                <Text style={styles.userName}>{userName}</Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
                {calculateBMI() && (
                    <View style={styles.statCard}>
                        <Ionicons name="fitness-outline" size={24} color={COLORS.emeraldMedium} />
                        <Text style={styles.statValue}>{calculateBMI()}</Text>
                        <Text style={styles.statLabel}>BMI</Text>
                    </View>
                )}
                <View style={styles.statCard}>
                    <Ionicons name="document-text-outline" size={24} color={COLORS.amberStart} />
                    <Text style={styles.statValue}>{recentInquiries?.length || 0}</Text>
                    <Text style={styles.statLabel}>Diagnoses</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
                    <Text style={styles.statValue}>
                        {recentInquiries?.[0]
                            ? new Date(recentInquiries[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'N/A'}
                    </Text>
                    <Text style={styles.statLabel}>Last Visit</Text>
                </View>
            </View>

            {/* Start New Assessment Hero */}
            <TouchableOpacity style={styles.heroCard} onPress={onStartDiagnosis}>
                <LinearGradient
                    colors={theme.gradients.success}
                    style={styles.heroGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.heroContent}>
                        <View style={styles.heroIcon}>
                            <Ionicons name="add-circle" size={40} color="#ffffff" />
                        </View>
                        <View style={styles.heroText}>
                            <Text style={styles.heroTitle}>Start New Assessment</Text>
                            <Text style={styles.heroSubtitle}>
                                Get personalized TCM diagnosis using AI
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#ffffff" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            {/* Recent Activity */}
            {recentInquiries && recentInquiries.length > 0 && (
                <View style={styles.recentSection}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {recentInquiries.slice(0, 3).map((inquiry, index) => (
                        <View key={inquiry.id} style={styles.recentCard}>
                            <View style={styles.recentCardLeft}>
                                <View style={[styles.recentIcon, { backgroundColor: `${theme.accent.secondary}20` }]}>
                                    <Ionicons name="clipboard-outline" size={18} color={theme.accent.secondary} />
                                </View>
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentTitle} numberOfLines={1}>
                                        {inquiry.diagnosis_report?.tcmDiagnosis ||
                                            inquiry.symptoms?.substring(0, 30) ||
                                            'Health Consultation'}
                                    </Text>
                                    <Text style={styles.recentDate}>
                                        {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={theme.text.secondary} />
                        </View>
                    ))}
                </View>
            )}

            {/* Tips Section */}
            <View style={styles.tipsSection}>
                <Text style={styles.sectionTitle}>Health Tips</Text>
                <View style={styles.tipCard}>
                    <Ionicons name="leaf-outline" size={24} color={theme.accent.primary} />
                    <Text style={styles.tipText}>
                        Regular TCM check-ups help maintain balance between Yin and Yang in your body.
                    </Text>
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

export default HomeTab;
