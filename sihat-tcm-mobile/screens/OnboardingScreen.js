import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SLIDES, ONBOARDING_TEXT } from './onboarding/OnboardingConstants';
import OnboardingSlide from './onboarding/OnboardingSlide';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ onComplete }) {
    const { language, setLanguage } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const t = ONBOARDING_TEXT[language] || ONBOARDING_TEXT.en;

    const handleNext = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex]);

    const handleSkip = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await AsyncStorage.setItem('@onboarding_completed', 'true');
        onComplete();
    }, [onComplete]);

    const handleStart = useCallback(async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await AsyncStorage.setItem('@onboarding_completed', 'true');
        onComplete();
    }, [onComplete]);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    const renderItem = useCallback(({ item }) => (
        <OnboardingSlide
            item={item}
            t={t}
            language={language}
            setLanguage={setLanguage}
            onStart={handleStart}
        />
    ), [t, language, setLanguage, handleStart]);

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background Gradient */}
            <LinearGradient
                colors={[COLORS.emeraldDeep, COLORS.emeraldDark, '#000000']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Skip Button */}
            {!isLastSlide && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>{t.skip}</Text>
                </TouchableOpacity>
            )}

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                scrollEventThrottle={16}
            />

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => {
                        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp',
                        });
                        const dotOpacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.4, 1, 0.4],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        width: dotWidth,
                                        opacity: dotOpacity,
                                        backgroundColor: index === currentIndex ? COLORS.emeraldMedium : COLORS.white,
                                    },
                                ]}
                            />
                        );
                    })}
                </View>

                {!isLastSlide && (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>{t.next}</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.emeraldDeep,
    },
    skipButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    skipText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    bottomNav: {
        paddingHorizontal: 32,
        paddingBottom: Platform.OS === 'ios' ? 50 : 32,
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
    },
    nextButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
