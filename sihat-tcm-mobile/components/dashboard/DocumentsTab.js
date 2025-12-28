import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * DocumentsTab - Manages medical document uploads and viewing.
 * 
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user object
 * @param {Object} props.styles - Shared StyleSheet from parent
 * @param {Object} props.theme - Current theme object
 */
export function DocumentsTab({ user, styles, theme }) {
    const { t } = useLanguage();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, [user?.id]);

    const loadDocuments = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('medical_reports')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (e) {
            console.log('Error loading documents', e);
        } finally {
            setLoading(false);
        }
    };

    const pickDocument = async () => {
        if (!user?.id) {
            Alert.alert('Login Required', 'Please login to upload documents.');
            return;
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;
            setUploading(true);

            const file = result.assets[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            // Read file as base64 for potential storage upload
            const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
            const contentType = file.mimeType || 'application/octet-stream';

            // Create the record (storage URL is a placeholder for now)
            const newDoc = {
                user_id: user.id,
                name: file.name,
                type: file.mimeType,
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                file_url: `https://placeholder.url/${fileName}`,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('medical_reports')
                .insert(newDoc)
                .select()
                .single();

            if (error) throw error;

            setDocuments([data, ...documents]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Document uploaded successfully!');

        } catch (err) {
            console.log('Error picking document', err);
            Alert.alert('Error', 'Failed to upload document.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (id) => {
        Alert.alert(
            t.documents.deleteConfirm,
            '',
            [
                { text: t.common.cancel, style: 'cancel' },
                {
                    text: t.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('medical_reports')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;
                            setDocuments(documents.filter(doc => doc.id !== id));
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete document');
                        }
                    }
                }
            ]
        );
    };

    const handleViewDocument = async (doc) => {
        try {
            Haptics.selectionAsync();
            // In a real app, you'd open the file_url or download it
            Alert.alert("View Document", `Viewing: ${doc.name}\nURL: ${doc.file_url}`);
        } catch (e) {
            console.log(e);
            Alert.alert('Error', 'Could not open document');
        }
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.reportCard}>
            <TouchableOpacity
                style={styles.reportCardInner}
                onPress={() => handleViewDocument(item)}
            >
                <View style={styles.reportIconContainer}>
                    <Ionicons
                        name={item.type?.includes('image') ? "image-outline" : "document-text-outline"}
                        size={24}
                        color="#2563EB"
                    />
                </View>
                <View style={styles.reportInfo}>
                    <Text style={styles.reportName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.reportMetaRow}>
                        <Text style={styles.reportMeta}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        <Text style={styles.reportMetaDot}>•</Text>
                        <Text style={styles.reportMeta}>{item.size}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteDocument(item.id)} style={{ padding: 8 }}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.tabContent}>
            <LinearGradient
                colors={['#2563EB', '#4F46E5']}
                style={styles.reportsHeaderCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.heroContent, { padding: 0 }]}>
                    <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name="documents-outline" size={32} color="#ffffff" />
                    </View>
                    <View style={styles.heroText}>
                        <Text style={styles.heroTitle}>{t.documents.title}</Text>
                        <Text style={styles.heroSubtitle}>{t.documents.subtitle}</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.reportsListContainer}>
                {loading ? (
                    <View style={styles.emptyState}>
                        <Text>{t.common.loading}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={documents}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="cloud-upload-outline" size={48} color={theme.text.secondary} />
                                <Text style={styles.emptyText}>{t.documents.noRecords}</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <TouchableOpacity
                style={styles.fab}
                onPress={pickDocument}
                disabled={uploading}
            >
                <LinearGradient
                    colors={['#2563EB', '#4F46E5']}
                    style={styles.fabGradient}
                >
                    {uploading ? (
                        <Text style={{ color: '#fff', fontSize: 10 }}>...</Text>
                    ) : (
                        <Ionicons name="add" size={30} color="#fff" />
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

export default DocumentsTab;
