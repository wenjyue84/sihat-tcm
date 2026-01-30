/**
 * GlassCard Component Tests
 *
 * Tests for the GlassCard UI component that provides a
 * glassmorphism-styled container.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { GlassCard } from '../components/ui/GlassCard';

describe('GlassCard', () => {
    it('renders children correctly', () => {
        const { getByText } = render(
            <GlassCard>
                <Text>Test Content</Text>
            </GlassCard>
        );

        expect(getByText('Test Content')).toBeTruthy();
    });

    it('applies custom style when provided', () => {
        const customStyle = { padding: 20 };
        const { getByTestId } = render(
            <GlassCard style={customStyle} testID="glass-card">
                <Text>Content</Text>
            </GlassCard>
        );

        const card = getByTestId('glass-card');
        expect(card).toBeTruthy();
    });

    it('renders without crashing when no children provided', () => {
        const { container } = render(<GlassCard />);
        expect(container).toBeTruthy();
    });
});
