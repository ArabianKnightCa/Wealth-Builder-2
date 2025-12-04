import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { contentAPI, profileAPI } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [chapters, setChapters] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [chaptersRes, profileRes] = await Promise.all([
        contentAPI.getChapters(),
        profileAPI.getActiveProfile(),
      ]);
      setChapters(chaptersRes.data || []);
      setActiveProfile(profileRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const renderChapter = ({ item }) => (
    <TouchableOpacity
      style={styles.chapterCard}
      onPress={() => navigation.navigate('Chapter', { chapter: item })}>
      <View style={styles.chapterHeader}>
        <Text style={styles.chapterNumber}>Chapter {item.chapter_number}</Text>
        <Text style={styles.chapterTitle}>{item.title}</Text>
      </View>
      <Text style={styles.chapterDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.chapterFooter}>
        <Text style={styles.lessonCount}>{item.lessons?.length || 0} Lessons</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {activeProfile?.name || 'User'}!</Text>
        <Text style={styles.subtitle}>Continue your financial learning journey</Text>
      </View>

      <FlatList
        data={chapters}
        renderItem={renderChapter}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFA500',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  list: {
    padding: 20,
  },
  chapterCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterHeader: {
    marginBottom: 8,
  },
  chapterNumber: {
    fontSize: 12,
    color: '#FFA500',
    fontWeight: '600',
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  chapterDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  chapterFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lessonCount: {
    fontSize: 12,
    color: '#999',
  },
});
