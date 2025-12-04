import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { contentAPI } from '../services/api';

export default function LessonScreen({ route }) {
  const { chapterId, lessonId, lessonTitle } = route.params;
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLesson();
    const startTime = Date.now();

    return () => {
      // Track engagement when leaving
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      trackEngagement(timeSpent);
    };
  }, []);

  const loadLesson = async () => {
    try {
      const response = await contentAPI.getLesson(chapterId, lessonId);
      setLesson(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const trackEngagement = async (timeSpent) => {
    try {
      await contentAPI.trackLessonEngagement({
        chapterId,
        lessonId,
        timeSpentSeconds: timeSpent,
        completed: true,
        scrollDepth: 100,
      });
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{lessonTitle}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.text}>{lesson?.content || 'No content available'}</Text>
      </View>

      {lesson?.key_takeaways && (
        <View style={styles.takeaways}>
          <Text style={styles.takeawaysTitle}>Key Takeaways</Text>
          {lesson.key_takeaways.map((takeaway, index) => (
            <Text key={index} style={styles.takeawayItem}>
              • {takeaway}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  text: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  takeaways: {
    padding: 20,
    backgroundColor: '#FFF5E6',
    margin: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  takeawaysTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  takeawayItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
