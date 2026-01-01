import React from 'react';
import { View, Text } from 'react-native';

/**
 * List Item Component
 * A simple bullet-point list item with colored dot
 */
export default function ListItem({ text, color, styles }) {
    return (
        <View style={styles.listItem}>
            <View style={[styles.listDot, { backgroundColor: color }]} />
            <Text style={styles.listText}>{text}</Text>
        </View>
    );
}
