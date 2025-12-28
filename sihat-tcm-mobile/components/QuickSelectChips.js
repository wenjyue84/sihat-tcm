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
        const styles = createStyles(theme, isDark);

        const handleSelect = (option) => {
            Haptics.selectionAsync();
            onSelect(String(option));
        };

        return (
            <View style={[styles.container, style]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {options.map((option) => (
                        <Chip
                            key={option}
                            option={option}
                            isSelected={currentValue === option}
                            onSelect={handleSelect}
                            unit={unit}
                            styles={styles}
                        />
                    ))}
                </ScrollView>
            </View>
        );
    };

    const Chip = React.memo(({ option, isSelected, onSelect, unit, styles }) => (
        <TouchableOpacity
            style={[
                styles.chip,
                isSelected && styles.chipSelected
            ]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
        >
            <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected
            ]}>
                {option}{unit ? ` ${unit}` : ''}
            </Text>
        </TouchableOpacity>
    ));

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
