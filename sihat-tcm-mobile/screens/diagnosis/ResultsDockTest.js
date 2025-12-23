import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

// Mock Theme
const theme = {
    mode: 'dark',
    background: '#121212',
    accent: { primary: '#10B981', secondary: '#F59E0B' },
    text: { primary: '#FFFFFF', secondary: '#A1A1AA', tertiary: '#71717A', inverse: '#000' },
    surface: { default: '#1E1E1E', elevated: '#27272A' },
    semantic: { success: '#10B981', error: '#EF4444' },
    border: { default: '#27272A', subtle: '#3F3F46' },
    gradients: { accent: ['#10B981', '#059669'] }
};

export default function ResultsDockTest() {
    const [log, setLog] = useState('Tap a button to test...');

    const logAction = (action) => setLog(`✅ Clicked: ${action}`);

    return (
        <SafeAreaView style={styles.rootContainer}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Floating Dock Test</Text>
                <Text style={styles.headerSubtitle}>Verify layout parity & touch targets</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.placeholderCard}><Text style={styles.cardText}>Content Card 1</Text></View>
                <View style={styles.placeholderCard}><Text style={styles.cardText}>Content Card 2</Text></View>
                <View style={styles.placeholderCard}><Text style={styles.cardText}>Content Card 3</Text></View>
                <View style={styles.placeholderCard}><Text style={styles.cardText}>Content Card 4</Text></View>
                <View style={[styles.placeholderCard, { height: 200 }]}><Text style={styles.cardText}>Bottom Content (Should be visible)</Text></View>

                <Text style={styles.logText}>{log}</Text>

                {/* Final Disclaimer */}
                <View style={styles.finalDisclaimer}>
                    <Ionicons name="information-circle-outline" size={16} color={theme.text.tertiary} />
                    <Text style={styles.disclaimerText}>
                        This assessment is for informational purposes only. Please consult a qualified TCM practitioner.
                    </Text>
                </View>
            </ScrollView>

            {/* --- NEW FLOATING DOCK IMPLEMENTATION --- */}
            <View style={styles.floatingDockContainer}>
                <BlurView intensity={80} tint="dark" style={styles.dockBlur}>
                    <View style={styles.actionsContainer}>

                        {/* Row 1: Primary Actions */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.primaryActionButton}
                                onPress={() => logAction('Ask AI')}
                            >
                                <Ionicons name="chatbubbles" size={22} color={theme.accent.primary} />
                                <Text style={styles.primaryActionText}>Ask AI</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.primaryActionButton}
                                onPress={() => logAction('Visual')}
                            >
                                <Ionicons name="image" size={22} color={theme.accent.secondary} />
                                <Text style={styles.primaryActionText}>Visual</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row 2: Secondary Tools */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.secondaryActionButton} onPress={() => logAction('PDF')}>
                                <Ionicons name="document-text" size={20} color={theme.text.secondary} />
                                <Text style={styles.secondaryActionText}>PDF</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryActionButton} onPress={() => logAction('Share')}>
                                <Ionicons name="share-social-outline" size={20} color={theme.text.secondary} />
                                <Text style={styles.secondaryActionText}>Share</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryActionButton} onPress={() => logAction('Verify')}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={theme.semantic.success} />
                                <Text style={[styles.secondaryActionText, { color: theme.semantic.success }]}>Verify</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row 3: Navigation */}
                        <View style={styles.navRow}>
                            <TouchableOpacity style={styles.resetButton} onPress={() => logAction('Start New')}>
                                <LinearGradient colors={theme.gradients.accent} style={styles.gradientButton}>
                                    <Ionicons name="refresh" size={20} color={theme.text.inverse} />
                                    <Text style={styles.resetButtonText}>Start New Assessment</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.homeButton} onPress={() => logAction('Home')}>
                                <Text style={styles.homeButtonText}>Return to Home</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </BlurView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    rootContainer: { flex: 1, backgroundColor: theme.background },
    header: { padding: 20, paddingTop: 60, alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    headerSubtitle: { color: theme.text.secondary, marginTop: 4 },
    scrollContent: { padding: 20, paddingBottom: 340 }, // Match production padding
    placeholderCard: { height: 100, backgroundColor: theme.surface.default, borderRadius: 16, marginBottom: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border.default },
    cardText: { color: theme.text.tertiary },
    logText: { textAlign: 'center', color: theme.accent.primary, marginVertical: 20, fontSize: 16, fontWeight: 'bold' },

    // --- COPIED DOCK STYLES ---
    floatingDockContainer: {
        position: 'absolute', bottom: 24, left: 20, right: 20,
        borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: theme.border.default,
        elevation: 10, shadowColor: 'black', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25, shadowRadius: 15, backgroundColor: 'rgba(0,0,0,0.8)',
    },
    dockBlur: { padding: 16 },
    actionsContainer: { gap: 12 },
    actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
    navRow: { flexDirection: 'column', gap: 8, marginTop: 4 },
    primaryActionButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.surface.elevated, paddingVertical: 14, borderRadius: 16,
        borderWidth: 1, borderColor: theme.border.subtle, gap: 8, height: 54,
    },
    primaryActionText: { fontSize: 15, fontWeight: '700', color: theme.text.primary },
    secondaryActionButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.surface.default, paddingVertical: 12, borderRadius: 14,
        borderWidth: 1, borderColor: 'transparent', gap: 6, height: 48,
    },
    secondaryActionText: { fontSize: 13, fontWeight: '600', color: theme.text.secondary },
    resetButton: { width: '100%', borderRadius: 16, overflow: 'hidden', height: 52 },
    gradientButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    resetButtonText: { color: theme.text.inverse, fontSize: 16, fontWeight: 'bold' },
    homeButton: { width: '100%', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    homeButtonText: { color: theme.text.tertiary, fontSize: 14, fontWeight: '600' },
    finalDisclaimer: {
        alignItems: 'center',
        marginBottom: 20,
        opacity: 0.7,
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center'
    },
    disclaimerText: {
        fontSize: 10,
        color: theme.text.tertiary,
        textAlign: 'center',
    },
});
