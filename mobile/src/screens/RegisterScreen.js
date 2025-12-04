import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authAPI } from '../services/api';
import { storage } from '../services/storage';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    date_of_birth: '',
    language: 'en',
    experience_level: '3',
    life_stage: '',
    occupation: '',
    state: '',
    financial_goals: [],
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.date_of_birth) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      await storage.saveToken(response.data.token);
      
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.replace('ProfileSelector') }
      ]);
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.detail || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={formData.first_name}
            onChangeText={(value) => updateField('first_name', value)}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
          />

          <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="1990-01-15"
            value={formData.date_of_birth}
            onChangeText={(value) => updateField('date_of_birth', value)}
          />

          <Text style={styles.label}>Financial Experience Level (1-5)</Text>
          <TextInput
            style={styles.input}
            placeholder="3"
            value={formData.experience_level}
            onChangeText={(value) => updateField('experience_level', value)}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Occupation</Text>
          <TextInput
            style={styles.input}
            placeholder="Your occupation"
            value={formData.occupation}
            onChangeText={(value) => updateField('occupation', value)}
          />

          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            placeholder="California"
            value={formData.state}
            onChangeText={(value) => updateField('state', value)}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#FFA500',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
