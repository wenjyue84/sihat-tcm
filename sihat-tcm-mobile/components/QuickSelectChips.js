import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * QuickSelectChips - A row of quick-select buttons for common values
 * Used for Age, Height, Weight inputs with progressive disclosure
 */
const QuickSelectChips = ({
    options,
    value,
    onSelect,
    unit,
    theme,
    isDark,
    style
}) => {
    const currentValue = parseInt(value) || 0;

    const handleSelect = (option) => {
        Haptics.selectionAsync();
        onSelect(String(option));
    };

    const styles = createStyles(theme, isDark);

    return (
        <View style={[styles.container, style]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {options.map((option) => {
                    const isSelected = currentValue === option;
                    return (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.chip,
                                isSelected && styles.chipSelected
                            ]}
                            onPress={() => handleSelect(option)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.chipText,
                                isSelected && styles.chipTextSelected
                            ]}>
                                {option}{unit ? ` ${unit}` : ''}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        marginTop: 8,
        marginBottom: 4,
    },
    scrollContent: {
        paddingHorizontal: 0,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: theme.surface.elevated,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    chipSelected: {
        backgroundColor: theme.accent.primary,
        borderColor: theme.accent.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.secondary,
    },
    chipTextSelected: {
        color: '#ffffff',
    },
});

export default QuickSelectChips;
