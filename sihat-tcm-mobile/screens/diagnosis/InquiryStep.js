import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    LayoutAnimation,
    UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { COLORS } from '../../constants/themes';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { API_CONFIG, TCM_CONSULTATION_PROMPT, getApiKeySync } from '../../lib/apiConfig';
import { getSystemPrompt } from '../../lib/supabase';

// Note: genAI will be created dynamically with the fetched API key

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Message bubble component
const MessageBubble = ({ message, isUser, theme, isDark, styles }) => (
    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && (
            <View style={styles.aiAvatar}>
                <Ionicons name="medical" size={14} color="#ffffff" />
            </View>
        )}
        <View style={styles.bubbleWrapper}>
            {isUser ? (
                <LinearGradient
                    colors={theme.gradients.primary}
                    style={styles.userContent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.userText}>{message.content}</Text>
                </LinearGradient>
            ) : (
                <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.aiContent}>
                    <Text style={styles.aiText}>{message.content}</Text>
                </BlurView>
            )}
        </View>
    </View>
);

// Typing indicator component
const TypingIndicator = ({ theme, isDark, styles }) => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot, delay) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animateDot(dot1, 0);
        animateDot(dot2, 150);
        animateDot(dot3, 300);
    }, []);

    const translateY = (anim) => anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -6],
    });

    return (
        <View style={styles.typingContainer}>
            <View style={styles.aiAvatar}>
                <Ionicons name="medical" size={14} color="#ffffff" />
            </View>
            <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.typingBubble}>
                <Animated.View style={[styles.typingDot, { transform: [{ translateY: translateY(dot1) }], backgroundColor: theme.accent.primary }]} />
                <Animated.View style={[styles.typingDot, { transform: [{ translateY: translateY(dot2) }], backgroundColor: theme.accent.primary }]} />
                <Animated.View style={[styles.typingDot, { transform: [{ translateY: translateY(dot3) }], backgroundColor: theme.accent.primary }]} />
            </BlurView>
        </View>
    );
};

// Helper to extract OPTIONS from AI response
const extractOptions = (content) => {
    // Check for OPTIONS tag (case-insensitive)
    const match = content.match(/<OPTIONS>([\s\S]*?)<\/OPTIONS>/i);
    if (match) {
        const optionsStr = match[1];
        const cleanContent = content.replace(/<OPTIONS>[\s\S]*?<\/OPTIONS>/i, '').trim();
        const options = optionsStr.split(',').map(o => o.trim()).filter(o => o);
        console.log("DEBUG - Extracted Options:", options);
        return { cleanContent, options };
    }
    console.log("DEBUG - No OPTIONS tag found, will use intelligent fallback");
    return { cleanContent: content, options: [] };
};

// Intelligent fallback options based on question type detection
// Intelligent fallback options based on question type detection
const generateSmartFallbackOptions = (questionText, t) => {
    const q = questionText.toLowerCase();

    // Frequency questions
    if (q.includes('how often') || q.includes('how frequently') || q.includes('how many times')) {
        return [t.inquiry.options.everyDay || 'Every day', t.inquiry.options.fewTimesWeek || 'A few times a week', t.inquiry.options.onceWeek || 'Once a week', t.inquiry.options.occasionally || 'Occasionally'];
    }

    // Timing questions
    if (q.includes('when do') || q.includes('what time') || q.includes('when does')) {
        return [t.inquiry.options.morning || 'Morning', t.inquiry.options.afternoon || 'Afternoon', t.inquiry.options.evening || 'Evening', t.inquiry.options.night || 'At night'];
    }

    // Duration questions
    if (q.includes('how long') || q.includes('how many days') || q.includes('since when')) {
        return [t.inquiry.options.fewDays || 'A few days', t.inquiry.options.oneTwoWeeks || '1-2 weeks', t.inquiry.options.month || 'About a month', t.inquiry.options.months || 'Several months'];
    }

    // Location questions
    if (q.includes('where') && (q.includes('pain') || q.includes('feel') || q.includes('hurt'))) {
        return [t.inquiry.options.head || 'Head/neck area', t.inquiry.options.chest || 'Chest/upper body', t.inquiry.options.stomach || 'Stomach/abdomen', t.inquiry.options.limbs || 'Back/limbs'];
    }

    // Intensity/severity questions
    if (q.includes('how severe') || q.includes('intensity') || q.includes('how bad')) {
        return [t.inquiry.options.mild || 'Mild', t.inquiry.options.moderate || 'Moderate', t.inquiry.options.severe || 'Quite severe', t.inquiry.options.intense || 'Very intense'];
    }

    // Yes/No questions with nuance
    if (q.includes('do you') || q.includes('have you') || q.includes('are you') || q.includes('does it')) {
        return [t.inquiry.options.yesFreq || 'Yes, frequently', t.inquiry.options.yesTime || 'Yes, sometimes', t.inquiry.options.rarely || 'Rarely', t.inquiry.options.noNever || 'No, never'];
    }

    // Sleep-related questions
    if (q.includes('sleep') || q.includes('rest') || q.includes('tired')) {
        return [t.inquiry.options.sleepWell || 'Sleep well', t.inquiry.options.troubleSleep || 'Trouble falling asleep', t.inquiry.options.wakeOften || 'Wake up often', t.inquiry.options.tired || 'Always tired'];
    }

    // Diet/food questions
    if (q.includes('eat') || q.includes('food') || q.includes('appetite') || q.includes('diet')) {
        return [t.inquiry.options.normalAppetite || 'Normal appetite', t.inquiry.options.reducedAppetite || 'Reduced appetite', t.inquiry.options.increasedAppetite || 'Increased appetite', t.inquiry.options.irregularMeals || 'Irregular meals'];
    }

    // Stress/emotion questions
    if (q.includes('stress') || q.includes('anxious') || q.includes('mood') || q.includes('emotion')) {
        return [t.inquiry.options.calm || 'Feeling calm', t.inquiry.options.mildStress || 'Mildly stressed', t.inquiry.options.anxious || 'Quite anxious', t.inquiry.options.veryStressed || 'Very stressed'];
    }

    // Default general options
    return [t.common.yes || 'Yes', t.common.no || 'No', t.common.sometimes || 'Sometimes', t.common.notSure || 'Not sure'];
};

// No default suggestions - we use intelligent fallbacks instead
const DEFAULT_SUGGESTIONS = [];

export default function InquiryStep({ data, onUpdate, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dynamicOptions, setDynamicOptions] = useState([]);
    const [chatSession, setChatSession] = useState(null);
    const scrollViewRef = useRef(null);
    const hasInitialized = useRef(false);

    // Build patient context for system prompt
    // This now includes uploaded medical reports and medications from previous steps
    const buildPatientContext = useCallback(() => {
        const height = data.height ? Number(data.height) : null;
        const weight = data.weight ? Number(data.weight) : null;
        const bmi = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : null;

        // Format uploaded medical reports
        const reportsContext = data.files && data.files.length > 0
            ? data.files.map((f, i) => `  ${i + 1}. ${f.name}: ${f.extractedText || 'No text extracted'}`).join('\n')
            : 'None uploaded';

        // Format current medications
        const medicinesContext = data.medicines && data.medicines.length > 0
            ? data.medicines.map((m, i) => `  ${i + 1}. ${m.name}${m.content ? ` (${m.content})` : ''}`).join('\n')
            : 'None reported';

        return `
═══════════════════════════════════════════════════════════════════════════════
                          PATIENT INFORMATION
═══════════════════════════════════════════════════════════════════════════════

Name: ${data.name || 'Anonymous'}
Age: ${data.age || 'Not provided'}
Gender: ${data.gender || 'Not provided'}
Height: ${height ? height + ' cm' : 'Not provided'}
Weight: ${weight ? weight + ' kg' : 'Not provided'}
${bmi ? `BMI: ${bmi}` : ''}
Chief Complaint: ${data.mainConcern?.replace('_', ' ') || 'Not provided'}
Other Symptoms: ${typeof data.symptoms === 'string' ? data.symptoms : (data.symptoms ? data.symptoms.join(', ') : 'None specified')}
Duration: ${data.symptomDuration || 'Not provided'}

═══════════════════════════════════════════════════════════════════════════════
                          MEDICAL RECORDS (UPLOADED)
═══════════════════════════════════════════════════════════════════════════════
${reportsContext}

═══════════════════════════════════════════════════════════════════════════════
                          CURRENT MEDICATIONS
═══════════════════════════════════════════════════════════════════════════════
${medicinesContext}

**INSTRUCTION:** You now have access to the patient's uploaded medical records and current medications.
Reference them when relevant during your diagnostic questioning.
Start by acknowledging their chief complaint and ask your first diagnostic question.
Do NOT repeat all the above information verbatim - use it as context for your questions.
`;
    }, [data]);

    // Initialize chat session
    useEffect(() => {
        const initChat = async () => {
            try {
                // Fetch latest prompt from Admin Dashboard (Supabase)
                // Fallback to TCM_CONSULTATION_PROMPT if DB fetch fails
                const basePrompt = await getSystemPrompt('doctor', TCM_CONSULTATION_PROMPT);

                // Use selected model from previous step, or fallback
                const selectedModel = data.doctor?.doctorLevel?.model || API_CONFIG.DEFAULT_MODEL;
                console.log('Using AI Model:', selectedModel);

                // Create genAI instance with dynamically fetched API key from admin dashboard
                const apiKey = getApiKeySync();
                console.log('[InquiryStep] Using API key from:', apiKey.startsWith('AIza') ? 'fetched/fallback' : 'unknown');
                const genAI = new GoogleGenerativeAI(apiKey);

                const model = genAI.getGenerativeModel({
                    model: selectedModel,
                    systemInstruction: basePrompt + buildPatientContext() + `\n\nIMPORTANT: Use ${language === 'zh' ? 'Chinese (Simplified)' : language === 'ms' ? 'Malay' : 'English'} for all responses.`,
                });

                const chat = model.startChat({
                    history: [],
                    generationConfig: {
                        maxOutputTokens: 500,
                        temperature: 0.4, // Lower temperature for more consistent formatting
                    },
                });

                setChatSession(chat);
            } catch (error) {
                console.error('Failed to initialize chat:', error);
            }
        };

        initChat();
    }, [buildPatientContext]);

    // Initialize conversation
    useEffect(() => {
        if (!hasInitialized.current && chatSession) {
            hasInitialized.current = true;
            startConversation();
        }
    }, [chatSession]);

    const startConversation = async () => {
        if (!chatSession) return;

        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const initialPrompt = data.mainConcern
                ? `The patient is experiencing ${data.mainConcern.replace('_', ' ')}. Please start the diagnostic inquiry.`
                : 'Please start the diagnostic inquiry by asking about the patient\'s main symptoms.';

            // Use non-streaming for React Native compatibility
            // FORCE the model to include options by appending a hidden instruction
            const steeringPrompt = `${initialPrompt}\n\n(IMPORTANT: Respond with 2-3 sentences max asking a diagnosis question. Then provide 3-4 short potential answers for the patient in this format: <OPTIONS>Answer 1, Answer 2, Answer 3</OPTIONS>)`;
            const result = await chatSession.sendMessage(steeringPrompt);
            const fullText = result.response.text();

            const { cleanContent, options } = extractOptions(fullText);

            setMessages([{
                id: Date.now().toString(),
                role: 'assistant',
                content: cleanContent
            }]);

            // Use AI options if available, otherwise generate smart fallbacks
            const finalOptions = options.length > 0
                ? options
                : generateSmartFallbackOptions(cleanContent, t);

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setDynamicOptions(finalOptions);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (error) {
            console.error('Chat error:', error);
            const fallbackMessage = t.inquiry.fallbackIntro || "Hello! I'm here to help understand your health concerns. Could you describe what symptoms you're experiencing?";
            setMessages([{
                id: Date.now().toString(),
                role: 'assistant',
                content: fallbackMessage,
            }]);
            // Still provide options even on error
            setDynamicOptions(generateSmartFallbackOptions(fallbackMessage, t));
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || !chatSession) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
        };

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputText('');

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDynamicOptions([]);
        setIsLoading(true);

        try {
            // Use non-streaming for React Native compatibility
            // FORCE the model to include options by appending a hidden instruction
            const steeringPrompt = `${text}\n\n(IMPORTANT: Respond with 2-3 sentences max asking a diagnosis question. Then provide 3-4 short potential answers for the patient in this format: <OPTIONS>Answer 1, Answer 2, Answer 3</OPTIONS>)`;
            const result = await chatSession.sendMessage(steeringPrompt);
            const fullText = result.response.text();

            const { cleanContent, options } = extractOptions(fullText);
            const assistantMsgId = (Date.now() + 1).toString();

            setMessages(prev => [...prev, {
                id: assistantMsgId,
                role: 'assistant',
                content: cleanContent
            }]);

            // Use AI options if available, otherwise generate smart fallbacks
            const finalOptions = options.length > 0
                ? options
                : generateSmartFallbackOptions(cleanContent, t);

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setDynamicOptions(finalOptions);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Update form data with conversation
            const allMessages = [...updatedMessages, { id: assistantMsgId, role: 'assistant', content: cleanContent }];
            onUpdate({
                ...data,
                inquiryChat: allMessages,
                inquirySummary: allMessages
                    .map(m => `${m.role === 'user' ? 'Patient' : 'Doctor'}: ${m.content}`)
                    .join('\n'),
            });

        } catch (error) {
            console.error('Message error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            const errorMsg = t.inquiry.errorRetry || "I apologize for the interruption. Could you please repeat that?";
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: errorMsg,
            }]);
            // Provide retry options
            setDynamicOptions([t.inquiry.options.repeat || 'Repeat my last answer', t.inquiry.options.askElse || 'Ask me something else', t.inquiry.options.continue || 'Continue from here']);
        } finally {
            setIsLoading(false);
        }
    }, [messages, chatSession, data, onUpdate]);

    const handleSuggestionPress = (text) => {
        sendMessage(text);
    };

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollViewRef.current && messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd();
            }, 100);
        }
    }, [messages, isLoading]);

    // Determine which suggestions to show
    const suggestionsToShow = dynamicOptions.map((opt, idx) => ({
        id: `dynamic-${idx}`,
        label: opt,
        icon: 'chatbubble-outline'
    }));

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.headerIcon, { backgroundColor: `${theme.accent.primary}20` }]}>
                    <Ionicons name="chatbubbles" size={20} color={theme.accent.primary} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>{t.inquiry.title || 'Interactive Inquiry'}</Text>
                    <Text style={styles.subtitle}>{t.inquiry.subtitle || 'AI-powered TCM consultation'}</Text>
                </View>
                <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={12} color={theme.accent.secondary} />
                    <Text style={styles.aiBadgeText}>Gemini</Text>
                </View>
            </View>

            {/* Messages Area */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {messages.map((message) => {
                    const { cleanContent } = extractOptions(message.content);
                    return (
                        <MessageBubble
                            key={message.id}
                            message={{ ...message, content: cleanContent }}
                            isUser={message.role === 'user'}
                            theme={theme}
                            isDark={isDark}
                            styles={styles}
                        />
                    );
                })}
                {isLoading && <TypingIndicator theme={theme} isDark={isDark} styles={styles} />}
            </ScrollView>

            {/* Suggestion Chips */}
            {!isLoading && suggestionsToShow.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggestionsScroll}
                    >
                        {suggestionsToShow.map((chip) => (
                            <TouchableOpacity
                                key={chip.id}
                                style={[
                                    styles.suggestionChip,
                                    dynamicOptions.length > 0 && styles.dynamicChip
                                ]}
                                onPress={() => handleSuggestionPress(chip.label)}
                            >
                                <Ionicons name={chip.icon} size={14} color={
                                    dynamicOptions.length > 0 ? theme.accent.primary : theme.text.secondary
                                } />
                                <Text style={[
                                    styles.suggestionText,
                                    dynamicOptions.length > 0 && styles.dynamicSuggestionText
                                ]}>{chip.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder={t.inquiry.placeholder || "Describe your symptoms..."}
                        placeholderTextColor={COLORS.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                        onPress={() => sendMessage(inputText)}
                        disabled={!inputText.trim() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.accent.primary} size="small" />
                        ) : (
                            <Ionicons
                                name="send"
                                size={20}
                                color={inputText.trim() ? '#ffffff' : theme.text.tertiary}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border.subtle,
    },
    headerIcon: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: theme.accent.primary + '20',
        justifyContent: 'center', alignItems: 'center',
    },
    headerText: { flex: 1 },
    title: { fontSize: 18, fontWeight: 'bold', color: theme.text.primary },
    subtitle: { fontSize: 12, color: theme.text.secondary, marginTop: 2 },
    aiBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6,
    },
    aiBadgeText: { fontSize: 11, fontWeight: 'bold', color: theme.accent.primary },
    messagesContainer: { flex: 1 },
    messagesContent: { padding: 16, paddingBottom: 24 },
    messageBubble: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
    userBubble: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    aiBubble: { alignSelf: 'flex-start' },
    aiAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: theme.accent.primary,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 10,
    },
    bubbleWrapper: { maxWidth: '100%', borderRadius: 24, overflow: 'hidden' },
    userContent: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderBottomRightRadius: 4,
    },
    aiContent: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    userText: { color: '#ffffff', fontSize: 15, lineHeight: 22, fontWeight: '500' },
    aiText: { color: theme.text.primary, fontSize: 15, lineHeight: 22 },
    typingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    typingBubble: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: theme.border.subtle,
        overflow: 'hidden',
    },
    typingDot: { width: 8, height: 8, borderRadius: 4 },
    suggestionsContainer: { paddingVertical: 12 },
    suggestionsScroll: { paddingHorizontal: 16, gap: 10 },
    suggestionChip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: theme.surface.elevated,
        borderRadius: 24, borderWidth: 1, borderColor: theme.border.default,
        gap: 8,
    },
    dynamicChip: { borderColor: theme.accent.primary, backgroundColor: theme.accent.primary + '10' },
    suggestionText: { color: theme.text.secondary, fontSize: 14, fontWeight: '600' },
    dynamicSuggestionText: { color: theme.accent.primary },
    inputContainer: {
        paddingHorizontal: 16, paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 32 : 12,
        borderTopWidth: 1, borderTopColor: theme.border.subtle,
    },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'flex-end',
        backgroundColor: theme.input.background,
        borderRadius: 28, paddingHorizontal: 18, paddingVertical: 8,
        borderWidth: 1, borderColor: theme.border.default,
    },
    input: { flex: 1, color: theme.text.primary, fontSize: 16, maxHeight: 120, paddingTop: 10, paddingBottom: 10 },
    sendButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: theme.accent.primary,
        justifyContent: 'center', alignItems: 'center', marginLeft: 10,
    },
    sendButtonDisabled: { backgroundColor: theme.surface.elevated, opacity: 0.5 },
});
