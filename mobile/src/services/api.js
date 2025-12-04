import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
  getCurrentUser: () => api.get('/me'),
};

export const profileAPI = {
  getProfiles: () => api.get('/profiles'),
  createProfile: (profileData) => api.post('/profiles', profileData),
  updateProfile: (profileId, profileData) => api.put(`/profiles/${profileId}`, profileData),
  deleteProfile: (profileId) => api.delete(`/profiles/${profileId}`),
  setActiveProfile: (profileId) => api.post(`/profiles/${profileId}/activate`),
  getActiveProfile: () => api.get('/profiles/active'),
};

export const ppiAPI = {
  getQuestions: () => api.get('/ppi-questions'),
  submitAnswers: (answers) => api.post('/ppi-submit', { answers }),
};

export const contentAPI = {
  getChapters: () => api.get('/chapters'),
  getChapter: (chapterId) => api.get(`/chapters/${chapterId}`),
  getLesson: (chapterId, lessonId) => api.get(`/chapters/${chapterId}/lessons/${lessonId}`),
  getQuiz: (chapterId) => api.get(`/chapters/${chapterId}/quiz`),
  submitQuiz: (quizData) => api.post('/quiz-submit', quizData),
  trackLessonEngagement: (data) => api.post('/telemetry/lesson-engagement', data),
};

export const feedbackAPI = {
  submitFeedback: (message) => api.post('/feedback', { message }),
};

export default api;
