import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { ppiAPI } from '../services/api';

export default function PPIScreen({ navigation }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await ppiAPI.getQuestions();
      setQuestions(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    const newAnswers = [
      ...answers,
      {
        question_id: questions[currentIndex].id,
        answer: answer,
      },
    ];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitPPI(newAnswers);
    }
  };

  const submitPPI = async (finalAnswers) => {
    try {
      await ppiAPI.submitAnswers(finalAnswers);
      Alert.alert(
        'Complete!',
        'Your personality profile has been created',
        [{ text: 'OK', onPress: () => navigation.replace('Main') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit assessment');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading questions...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.question}>{currentQuestion?.question}</Text>

        <View style={styles.options}>
          {currentQuestion?.options?.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleAnswer(option)}>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  progress: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFA500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});
