/**
 * Health Data Summary Component
 * 
 * Displays aggregated health data from connected devices
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  HealthDataSummary as IHealthDataSummary,
  HealthMetricTrend,
} from '../interfaces/HealthDeviceInterfaces';

import { HapticTouchButton } from '../../../ui/touch';

interface HealthDataSummaryProps {
  data: IHealthDataSummary | null;
  onSync: () => void;
  onUseForDiagnosis: () => void;
  isLoading: boolean;
  theme?: any;
}

export const HealthDataSummary: React.FC<HealthDataSummaryProps> = ({
  data,
  onSync,
  onUseForDiagnosis,
  isLoading,
  theme,
}) => {
  /**
   * Get trend icon
   */
  const getTrendIcon = (trend: HealthMetricTrend): string => {
    switch (trend) {
      case 'increasing':
        return 'trending-up';
      case 'decreasing':
        return 'trending-down';
      case 'stable':
        return 'remove';
      default:
        return 'remove';
    }
  };

  /**
   * Get trend color
   */
  const getTrendColor = (trend: HealthMetricTrend, isPositive: boolean = true): string => {
    switch (trend) {
      case 'increasing':
        return isPositive ? '#4CAF50' : '#F44336';
      case 'decreasing':
        return isPositive ? '#F44336' : '#4CAF50';
      case 'stable':
        return '#FF9800';
      default:
        return theme?.text?.secondary || '#9E9E9E';
    }
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  /**
   * Render metric card
   */
  const renderMetricCard = (
    title: string,
    value: string | number,
    unit: string,
    trend?: HealthMetricTrend,
    icon?: string,
    isPositiveTrend: boolean = true
  ) => (
    <View style={[styles.metricCard, { backgroundColor: theme?.surface?.elevated }]}>
      <View style={styles.metricHeader}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={theme?.accent?.primary}
          />
        )}
        <Text style={[styles.metricTitle, { color: theme?.text?.secondary }]}>
          {title}
        </Text>
      </View>
      
      <View style={styles.metricValue}>
        <Text style={[styles.metricNumber, { color: theme?.text?.primary }]}>
          {value}
        </Text>
        <Text style={[styles.metricUnit, { color: theme?.text?.secondary }]}>
          {unit}
        </Text>
      </View>
      
      {trend && (
        <View style={styles.metricTrend}>
          <Ionicons
            name={getTrendIcon(trend) as any}
            size={16}
            color={getTrendColor(trend, isPositiveTrend)}
          />
          <Text style={[
            styles.trendText,
            { color: getTrendColor(trend, isPositiveTrend) }
          ]}>
            {trend}
          </Text>
        </View>
      )}
    </View>
  );

  if (!data) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="fitness-outline"
          size={64}
          color={theme?.text?.secondary}
        />
        <Text style={[styles.emptyTitle, { color: theme?.text?.primary }]}>
          No Health Data
        </Text>
        <Text style={[styles.emptyText, { color: theme?.text?.secondary }]}>
          Connect devices to see your health metrics
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme?.text?.primary }]}>
            Health Summary
          </Text>
          <Text style={[styles.subtitle, { color: theme?.text?.secondary }]}>
            Updated {formatTimeAgo(data.timestamp)}
          </Text>
        </View>
        
        <HapticTouchButton
          onPress={onSync}
          style={[styles.syncButton, { backgroundColor: theme?.accent?.primary }]}
          disabled={isLoading}
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#ffffff"
          />
        </HapticTouchButton>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Heart Rate */}
        {data.heartRate && renderMetricCard(
          'Heart Rate',
          data.heartRate.current,
          'bpm',
          data.heartRate.trend,
          'heart',
          false // Lower heart rate is generally better
        )}

        {/* Steps */}
        {data.steps && renderMetricCard(
          'Steps Today',
          data.steps.today.toLocaleString(),
          `/ ${data.steps.goal.toLocaleString()}`,
          undefined,
          'walk'
        )}

        {/* Sleep */}
        {data.sleep && renderMetricCard(
          'Sleep Quality',
          data.sleep.quality,
          `${data.sleep.lastNight}h`,
          data.sleep.trend,
          'bed'
        )}

        {/* Weight */}
        {data.weight && renderMetricCard(
          'Weight',
          data.weight.current,
          'kg',
          data.weight.trend,
          'scale'
        )}

        {/* Blood Pressure */}
        {data.bloodPressure && (
          <View style={[styles.metricCard, styles.wideCard, { backgroundColor: theme?.surface?.elevated }]}>
            <View style={styles.metricHeader}>
              <Ionicons
                name="medical"
                size={20}
                color={theme?.accent?.primary}
              />
              <Text style={[styles.metricTitle, { color: theme?.text?.secondary }]}>
                Blood Pressure
              </Text>
            </View>
            
            <View style={styles.bpContainer}>
              <Text style={[styles.bpValue, { color: theme?.text?.primary }]}>
                {data.bloodPressure.systolic}/{data.bloodPressure.diastolic}
              </Text>
              <Text style={[styles.bpUnit, { color: theme?.text?.secondary }]}>
                mmHg
              </Text>
            </View>
            
            <View style={[
              styles.bpCategory,
              { backgroundColor: data.bloodPressure.category === 'normal' ? '#4CAF50' : '#FF9800' }
            ]}>
              <Text style={styles.bpCategoryText}>
                {data.bloodPressure.category.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Sensor Data */}
        {data.sensorData && (
          <View style={[styles.metricCard, styles.wideCard, { backgroundColor: theme?.surface?.elevated }]}>
            <View style={styles.metricHeader}>
              <Ionicons
                name="hardware-chip"
                size={20}
                color={theme?.accent?.primary}
              />
              <Text style={[styles.metricTitle, { color: theme?.text?.secondary }]}>
                Current Activity
              </Text>
            </View>
            
            <View style={styles.sensorGrid}>
              <View style={styles.sensorItem}>
                <Text style={[styles.sensorLabel, { color: theme?.text?.secondary }]}>
                  Activity
                </Text>
                <Text style={[styles.sensorValue, { color: theme?.text?.primary }]}>
                  {data.sensorData.activity}
                </Text>
              </View>
              
              <View style={styles.sensorItem}>
                <Text style={[styles.sensorLabel, { color: theme?.text?.secondary }]}>
                  Posture
                </Text>
                <Text style={[styles.sensorValue, { color: theme?.text?.primary }]}>
                  {data.sensorData.posture}
                </Text>
              </View>
              
              <View style={styles.sensorItem}>
                <Text style={[styles.sensorLabel, { color: theme?.text?.secondary }]}>
                  Stress
                </Text>
                <Text style={[styles.sensorValue, { color: theme?.text?.primary }]}>
                  {data.sensorData.stress}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Action Button */}
      <LinearGradient
        colors={[theme?.accent?.primary || '#007AFF', theme?.accent?.secondary || '#0056CC']}
        style={styles.actionButton}
      >
        <HapticTouchButton
          onPress={onUseForDiagnosis}
          style={styles.actionButtonInner}
        >
          <Ionicons name="medical" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>
            Use for TCM Diagnosis
          </Text>
        </HapticTouchButton>
      </LinearGradient>

      {/* Data Sources */}
      <View style={styles.sources}>
        <Text style={[styles.sourcesTitle, { color: theme?.text?.secondary }]}>
          Data Sources
        </Text>
        <Text style={[styles.sourcesText, { color: theme?.text?.secondary }]}>
          {data.source.join(', ')}
        </Text>
      </View>
    </ScrollView>
  );
};