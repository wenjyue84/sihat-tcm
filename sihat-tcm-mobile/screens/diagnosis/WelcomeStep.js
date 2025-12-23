import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/themes';

export default function WelcomeStep({ onNext }) {
    return (
        <View style={styles.container}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Welcome to Your{'\n'}Health Assessment</Text>
                <Text style={styles.subtitle}>
                    Discover personalized insights based on Traditional Chinese Medicine principles combined with modern AI analysis.
                </Text>
            </View>

            {/* Feature Cards */}
            <View style={styles.featuresContainer}>
                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Ionicons name="shield-checkmark" size={24} color={COLORS.emeraldMedium} />
                    </View>
                    <View style={styles.featureText}>
                        <Text style={styles.featureTitle}>Private & Secure</Text>
                        <Text style={styles.featureDesc}>Your data stays on your device</Text>
                    </View>
                </View>

                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Ionicons name="time-outline" size={24} color={COLORS.amberStart} />
                    </View>
                    <View style={styles.featureText}>
                        <Text style={styles.featureTitle}>Quick Assessment</Text>
                        <Text style={styles.featureDesc}>Complete in just 5 minutes</Text>
                    </View>
                </View>

                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Ionicons name="analytics-outline" size={24} color={COLORS.emeraldMedium} />
                    </View>
                    <View style={styles.featureText}>
                        <Text style={styles.featureTitle}>AI-Powered Insights</Text>
                        <Text style={styles.featureDesc}>Personalized recommendations</Text>
                    </View>
                </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity style={styles.ctaButton} onPress={onNext}>
                <LinearGradient
                    colors={[COLORS.amberStart, COLORS.amberEnd]}
                    style={styles.gradientButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.ctaText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.emeraldDeep} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    featuresContainer: {
        marginBottom: 32,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    ctaButton: {
        marginTop: 'auto',
        marginBottom: 20,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
    },
    ctaText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.emeraldDeep,
    },
});
