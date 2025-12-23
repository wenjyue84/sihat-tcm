import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/themes';
import { getGenAI, API_CONFIG } from '../lib/googleAI';
import { useTheme } from '../contexts/ThemeContext';
import { getSystemPrompt as fetchPrompt } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

// Report Chat System Prompt
const getSystemPrompt = (reportData) => `You are a Traditional Chinese Medicine (TCM) health assistant. The user has just received a TCM diagnosis report and may have questions about it.

## USER'S DIAGNOSIS REPORT:
${JSON.stringify(reportData, null, 2)}

## YOUR ROLE:
1. Answer questions about their specific diagnosis and recommendations
2. Explain TCM concepts in simple, understandable terms
3. Provide practical advice based on their constitution type
4. Clarify any food recommendations, lifestyle changes, or herbal formulas mentioned
5. Be supportive and encouraging

## GUIDELINES:
- Keep answers concise but helpful (2-4 sentences for simple questions)
- Use their actual diagnosis data when responding
- Explain TCM terms if they ask
- If asked about something not in their report, provide general TCM guidance
- Always remind them to consult a TCM practitioner for personalized treatment

Respond naturally and helpfully.`;

// Quick question suggestions - Trigger refresh
const getQuickQuestions = (t) => [
    t.reportChat?.questions?.meaning || "What does my diagnosis mean?",
    t.reportChat?.questions?.food || "Why should I avoid certain foods?",
    t.reportChat?.questions?.constitution || "How can I improve my constitution?",
    t.reportChat?.questions?.acupoints || "Explain the acupoints suggested",
];

export default function ReportChatModal({ visible, onClose, reportData, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatSession, setChatSession] = useState(null);
    const scrollViewRef = useRef(null);

    const QUICK_QUESTIONS = useMemo(() => getQuickQuestions(t), [t]);

    // Initialize chat session when modal opens
    useEffect(() => {
        if (visible && !chatSession) {
            initializeChat();
        }
    }, [visible]);

    const initializeChat = async () => {
        try {
            // Fetch base prompt template from Admin Dashboard (Supabase)
            const basePromptTemplate = await fetchPrompt('report_chat', getSystemPrompt(reportData));

            // If we got the prompt from DB, we need to inject the reportData
            // If we're using the fallback getSystemPrompt(reportData), it's already injected
            let finalPrompt = basePromptTemplate;
            if (!basePromptTemplate.includes(JSON.stringify(reportData))) {
                finalPrompt = `${basePromptTemplate}\n\n## USER'S DIAGNOSIS REPORT:\n${JSON.stringify(reportData, null, 2)}`;
            }
            finalPrompt += `\n\nIMPORTANT: Use ${language === 'zh' ? 'Chinese (Simplified)' : language === 'ms' ? 'Malay' : 'English'} for all responses.`;

            const model = getGenAI().getGenerativeModel({ model: API_CONFIG.DEFAULT_MODEL });
            const chat = model.startChat({
                history: [],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
            });

            // Send system context
            await chat.sendMessage(finalPrompt);
            setChatSession(chat);

            // Add welcome message
            const introMsg = t.reportChat?.intro || "Hello! I'm here to help you understand your TCM diagnosis. You have a **{type}** constitution. Feel free to ask me anything about your report!";
            const constitutionType = reportData?.constitution?.type || 'unique';

            setMessages([{
                id: 1,
                text: introMsg.replace('{type}', constitutionType),
                isUser: false,
                timestamp: new Date(),
            }]);
        } catch (error) {
            console.error('Failed to initialize chat:', error);
        }
    };

    const sendMessage = async (text) => {
        if (!text.trim() || isLoading || !chatSession) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const userMessage = {
            id: Date.now(),
            text: text.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Create placeholder for AI response
            const aiMessageId = Date.now() + 1;
            let isFirstChunk = true;
            let fullText = '';

            const result = await chatSession.sendMessageStream(text.trim());

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;

                if (isFirstChunk) {
                    setIsLoading(false); // Stop loading indicator once we have data
                    // Add the AI message with first chunk
                    setMessages(prev => [...prev, {
                        id: aiMessageId,
                        text: fullText,
                        isUser: false,
                        timestamp: new Date(),
                    }]);
                    isFirstChunk = false;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                    // Update existing message
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMessageId
                            ? { ...msg, text: fullText }
                            : msg
                    ));
                }
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Chat error:', error);
            setIsLoading(false); // Ensure loading stops on error

            const errorMessage = {
                id: Date.now() + 1,
                text: t.reportChat?.error || "I'm having trouble responding. Please try again.",
                isUser: false,
                isError: true,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleQuickQuestion = (question) => {
        setInputText(question);
        sendMessage(question);
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="chatbubbles" size={20} color={theme.accent.primary} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>{t.reportChat?.title || 'Ask About Your Report'}</Text>
                            <Text style={styles.headerSubtitle}>{t.reportChat?.subtitle || 'AI-powered TCM assistant'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.text.primary} />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.messageBubble,
                                msg.isUser ? styles.userBubble : styles.aiBubble,
                                msg.isError && styles.errorBubble,
                            ]}
                        >
                            {!msg.isUser && (
                                <View style={styles.aiAvatar}>
                                    <Text style={styles.aiAvatarText}>🌿</Text>
                                </View>
                            )}
                            <View style={[styles.messageContent, msg.isUser && styles.userMessageContent]}>
                                <Text style={[styles.messageText, msg.isUser && styles.userMessageText]}>
                                    {msg.text}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {isLoading && (
                        <View style={[styles.messageBubble, styles.aiBubble]}>
                            <View style={styles.aiAvatar}>
                                <Text style={styles.aiAvatarText}>🌿</Text>
                            </View>
                            <View style={styles.messageContent}>
                                <ActivityIndicator size="small" color={theme.accent.primary} />
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Quick Questions */}
                {messages.length <= 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickQuestions}>
                        {QUICK_QUESTIONS.map((q, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.quickQuestionChip}
                                onPress={() => handleQuickQuestion(q)}
                            >
                                <Text style={styles.quickQuestionText}>{q}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder={t.reportChat?.placeholder || "Ask about your diagnosis..."}
                        placeholderTextColor={theme.text.tertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                        onPress={() => sendMessage(inputText)}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Ionicons name="send" size={20} color={inputText.trim() && !isLoading ? '#ffffff' : theme.text.tertiary} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border.subtle,
        backgroundColor: theme.surface.elevated,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.text.secondary,
    },
    closeButton: {
        padding: 8,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 24,
    },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    aiBubble: {
        alignSelf: 'flex-start',
    },
    errorBubble: {},
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    aiAvatarText: {
        fontSize: 16,
    },
    messageContent: {
        backgroundColor: theme.surface.elevated,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderTopLeftRadius: 4,
        maxWidth: '100%',
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    userMessageContent: {
        backgroundColor: theme.accent.secondary,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 4,
        borderColor: theme.accent.secondary,
    },
    messageText: {
        color: theme.text.primary,
        fontSize: 15,
        lineHeight: 22,
    },
    userMessageText: {
        color: '#ffffff',
        fontWeight: '500',
    },
    quickQuestions: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: theme.background.primary,
    },
    quickQuestionChip: {
        backgroundColor: theme.surface.elevated,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    quickQuestionText: {
        color: theme.text.secondary,
        fontSize: 13,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        borderTopWidth: 1,
        borderTopColor: theme.border.subtle,
        gap: 12,
        backgroundColor: theme.surface.elevated,
    },
    textInput: {
        flex: 1,
        backgroundColor: theme.input.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: theme.text.primary,
        fontSize: 15,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.accent.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: theme.accent.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    sendButtonDisabled: {
        backgroundColor: theme.surface.default,
        elevation: 0,
        shadowOpacity: 0,
    },
});
