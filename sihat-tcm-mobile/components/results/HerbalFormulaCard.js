import React from 'react';
import { View, Text } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Herbal Formula Card Component
 * Displays a TCM herbal formula with name, purpose, ingredients, and dosage
 */
export default function HerbalFormulaCard({ formula, styles }) {
    const { t } = useLanguage();

    return (
        <View style={styles.herbalCard}>
            <Text style={styles.herbalName}>{formula.name}</Text>
            {formula.purpose && (
                <Text style={styles.herbalDetail}>
                    <Text style={styles.herbalLabel}>{t.report?.formula?.purpose || 'Purpose'}: </Text>
                    {formula.purpose}
                </Text>
            )}
            {formula.ingredients && formula.ingredients.length > 0 && (
                <Text style={styles.herbalDetail}>
                    <Text style={styles.herbalLabel}>{t.report?.formula?.ingredients || 'Ingredients'}: </Text>
                    {formula.ingredients.join(', ')}
                </Text>
            )}
            {formula.dosage && (
                <Text style={styles.herbalDetail}>
                    <Text style={styles.herbalLabel}>{t.report?.formula?.dosage || 'Dosage'}: </Text>
                    {formula.dosage}
                </Text>
            )}
        </View>
    );
}
