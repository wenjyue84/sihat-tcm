import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const getDoctorLevels = (t) => [
    {
        id: 'master',
        name: t.chooseDoctor?.masterPhysician?.name || 'Master Physician',
        nameZh: t.chooseDoctor?.masterPhysician?.nameZh || '国医大师',
        description: t.chooseDoctor?.masterPhysician?.description || 'Expert consultation',
        model: 'gemini-1.5-pro', // Using known stable pro model
        icon: 'ribbon-outline',
        gradient: ['#f59e0b', '#d97706'], // Amber
        bg: '#fffbeb',
        border: '#fcd34d'
    },
    {
        id: 'expert',
        name: t.chooseDoctor?.seniorPhysician?.name || 'Senior Physician',
        nameZh: t.chooseDoctor?.seniorPhysician?.nameZh || '主任医师',
        description: t.chooseDoctor?.seniorPhysician?.description || 'Advanced analysis',
        model: 'gemini-2.0-flash', // Using 2.0 Flash as Expert
        icon: 'medkit-outline',
        gradient: ['#10b981', '#059669'], // Emerald
        bg: '#ecfdf5',
        border: '#6ee7b7'
    },
    {
        id: 'physician',
        name: t.chooseDoctor?.physician?.name || 'Physician',
        nameZh: t.chooseDoctor?.physician?.nameZh || '医师',
        description: t.chooseDoctor?.physician?.description || 'Standard consultation',
        model: 'gemini-1.5-flash', // Fast fallback
        icon: 'person-outline',
        gradient: ['#3b82f6', '#2563eb'], // Blue
        bg: '#eff6ff',
        border: '#93c5fd'
    }
];

export default function ChooseDoctorStep({ onNext, theme, isDark }) {
    const { t } = useLanguage();
    const [selectedId, setSelectedId] = useState('physician');
    const doctorLevels = useMemo(() => getDoctorLevels(t), [t]);

    const handleSelect = (id) => {
        Haptics.selectionAsync();
        setSelectedId(id);
    };

    const handleConfirm = () => {
        const selectedDoc = doctorLevels.find(d => d.id === selectedId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onNext({ doctorLevel: selectedDoc });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="people" size={32} color={theme.accent.primary} />
                </View>
                <Text style={[styles.title, isDark && styles.textLight]}>{t.chooseDoctor.title || 'Choose Your Doctor'}</Text>
                <Text style={[styles.subtitle, isDark && styles.textLightSecondary]}>
                    {t.chooseDoctor.subtitle || 'Select the AI model capability for your consultation'}
                </Text>
            </View>

            <View style={styles.cardsContainer}>
                {doctorLevels.map((doc) => {
                    const isSelected = selectedId === doc.id;
                    return (
                        <TouchableOpacity
                            key={doc.id}
                            activeOpacity={0.9}
                            onPress={() => handleSelect(doc.id)}
                            style={[
                                styles.card,
                                isSelected && styles.cardSelected,
                                { borderColor: isSelected ? doc.border : 'transparent' },
                                !isSelected && isDark && styles.cardDark
                            ]}
                        >
                            <LinearGradient
                                colors={isSelected ? doc.gradient : isDark ? ['#1e293b', '#1e293b'] : ['#ffffff', '#ffffff']}
                                style={styles.cardGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={styles.cardContent}>
                                    <View style={[
                                        styles.iconBox,
                                        { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : doc.bg }
                                    ]}>
                                        <Ionicons
                                            name={doc.icon}
                                            size={24}
                                            color={isSelected ? '#fff' : doc.gradient[0]}
                                        />
                                    </View>
                                    <View style={styles.textInfo}>
                                        <View style={styles.nameRow}>
                                            <Text style={[styles.docName, isSelected && styles.textWhite, !isSelected && isDark && styles.textLight]}>
                                                {doc.name}
                                            </Text>
                                            <Text style={[styles.docNameZh, isSelected && styles.textWhiteOpacity, !isSelected && isDark && styles.textLightSecondary]}>
                                                {doc.nameZh}
                                            </Text>
                                        </View>
                                        <Text style={[styles.docDesc, isSelected && styles.textWhiteOpacity, !isSelected && isDark && styles.textLightSecondary]}>
                                            {doc.description}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <View style={styles.checkIcon}>
                                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                        </View>
                                    )}
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.accent.primary }]}
                onPress={handleConfirm}
            >
                <Text style={styles.confirmText}>{t.common.next || 'Start Consultation'}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    iconContainer: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 15
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
    textLight: { color: '#f3f4f6' },
    textLightSecondary: { color: '#9ca3af' },

    cardsContainer: { gap: 16, marginBottom: 30 },
    card: {
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        backgroundColor: '#fff'
    },
    cardDark: { backgroundColor: '#1e293b' },
    cardSelected: { transform: [{ scale: 1.02 }], elevation: 4 },
    cardGradient: { padding: 16 },
    cardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },

    iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    textInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
    docName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    docNameZh: { fontSize: 14, color: '#6b7280' },
    docDesc: { fontSize: 13, color: '#6b7280' },
    textWhite: { color: '#ffffff' },
    textWhiteOpacity: { color: 'rgba(255,255,255,0.9)' },

    confirmButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, borderRadius: 30, gap: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
    },
    confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
