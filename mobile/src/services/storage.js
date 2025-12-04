import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  // Token management
  saveToken: async (token) => {
    try {
      await AsyncStorage.setItem('token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  removeToken: async () => {
    try {
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // Active profile
  saveActiveProfile: async (profileId) => {
    try {
      await AsyncStorage.setItem('activeProfileId', profileId);
    } catch (error) {
      console.error('Error saving active profile:', error);
    }
  },

  getActiveProfile: async () => {
    try {
      return await AsyncStorage.getItem('activeProfileId');
    } catch (error) {
      console.error('Error getting active profile:', error);
      return null;
    }
  },

  removeActiveProfile: async () => {
    try {
      await AsyncStorage.removeItem('activeProfileId');
    } catch (error) {
      console.error('Error removing active profile:', error);
    }
  },

  // Clear all data
  clearAll: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
