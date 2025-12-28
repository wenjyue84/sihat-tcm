import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Animated,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/themes';

/**
 * HistoryTab - Displays list of past diagnosis inquiries with search functionality.
 * 
 * @param {Object} props
 * @param {Array} props.inquiries - Array of diagnosis inquiry objects
 * @param {boolean} props.loading - Whether data is loading
 * @param {Function} props.onRefresh - Pull-to-refresh callback
 * @param {boolean} props.refreshing - Whether refresh is in progress
 * @param {Object} props.styles - Shared StyleSheet from parent
 * @param {Object} props.theme - Current theme object
 * @param {Function} props.onViewReport - Callback when "View Report" is pressed
 */
export function HistoryTab({ inquiries, loading, onRefresh, refreshing, styles, theme, onViewReport }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredInquiries = inquiries.filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        const symptoms = (item.symptoms || '').toLowerCase();
        const diagnosis = (item.diagnosis_report?.tcmDiagnosis || '').toLowerCase();
        return symptoms.includes(searchLower) || diagnosis.includes(searchLower);
    });

    const renderItem = ({ item, index }) => {
        const date = new Date(item.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const diagnosis = item.diagnosis_report?.tcmDiagnosis ||
            item.diagnosis_report?.syndromePattern ||
            'Pending review';
        const complaint = item.symptoms || item.diagnosis_report?.mainComplaint || 'General Consultation';

        return (
            <Animated.View style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                    <View style={styles.historyDateBadge}>
                        <Ionicons name="calendar-outline" size={14} color={theme.accent.primary} />
                        <Text style={styles.historyDate}>{formattedDate}</Text>
                        <Text style={styles.historyTime}>{formattedTime}</Text>
                    </View>
                </View>
                <Text style={styles.historyComplaint} numberOfLines={2}>
                    {complaint}
                </Text>
                <View style={styles.historyDiagnosis}>
                    <Ionicons name="medical-outline" size={16} color={theme.accent.secondary} />
                    <Text style={styles.historyDiagnosisText} numberOfLines={1}>
                        {diagnosis}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.viewReportButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (onViewReport) {
                            onViewReport(item);
                        }
                    }}
                >
                    <Text style={styles.viewReportText}>View Report</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.accent.primary} />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.tabContent}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={theme.text.secondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search diagnoses..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.text.secondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            <FlatList
                data={filteredInquiries}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.historyList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.accent.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color={theme.text.secondary} />
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No matching diagnoses found' : 'No diagnosis history yet'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            Start your first assessment to see it here
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

export default HistoryTab;
