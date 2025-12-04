import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { profileAPI } from '../services/api';
import { storage } from '../services/storage';

export default function ProfileManagementScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await profileAPI.getProfiles();
      setProfiles(response.data.profiles || []);
      
      const activeId = await storage.getActiveProfile();
      setActiveProfileId(activeId);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profiles');
    }
  };

  const switchProfile = async (profile) => {
    try {
      await profileAPI.setActiveProfile(profile.id);
      await storage.saveActiveProfile(profile.id);
      setActiveProfileId(profile.id);
      Alert.alert('Success', `Switched to ${profile.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to switch profile');
    }
  };

  const deleteProfile = async (profileId, profileName) => {
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${profileName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileAPI.deleteProfile(profileId);
              loadProfiles();
              Alert.alert('Success', 'Profile deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile');
            }
          },
        },
      ]
    );
  };

  const renderProfile = ({ item }) => (
    <View style={styles.profileCard}>
      <TouchableOpacity
        style={styles.profileMain}
        onPress={() => switchProfile(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.avatar || '👤'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{item.name}</Text>
          <Text style={styles.profileAge}>Age: {item.age}</Text>
          {item.id === activeProfileId && (
            <Text style={styles.activeLabel}>Active</Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteProfile(item.id, item.name)}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Profiles</Text>
      </View>

      <FlatList
        data={profiles}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProfile')}>
        <Text style={styles.addButtonText}>+ Add New Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await storage.clearAll();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 20,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profileAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  activeLabel: {
    fontSize: 12,
    color: '#FFA500',
    fontWeight: 'bold',
    marginTop: 4,
  },
  deleteButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: '#ff4444',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#FFA500',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logoutButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
