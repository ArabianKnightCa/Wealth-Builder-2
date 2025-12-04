import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileSelectorScreen from '../screens/ProfileSelectorScreen';
import AddProfileScreen from '../screens/AddProfileScreen';
import PPIScreen from '../screens/PPIScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ChapterScreen from '../screens/ChapterScreen';
import LessonScreen from '../screens/LessonScreen';
import QuizScreen from '../screens/QuizScreen';
import ProfileManagementScreen from '../screens/ProfileManagementScreen';
import FeedbackScreen from '../screens/FeedbackScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFA500',
        tabBarInactiveTintColor: '#666',
      }}>
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="ProfilesTab" 
        component={ProfileManagementScreen}
        options={{ tabBarLabel: 'Profiles' }}
      />
      <Tab.Screen 
        name="FeedbackTab" 
        component={FeedbackScreen}
        options={{ tabBarLabel: 'Feedback' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#FFA500' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Create Account' }}
        />
        <Stack.Screen 
          name="ProfileSelector" 
          component={ProfileSelectorScreen}
          options={{ title: 'Select Profile' }}
        />
        <Stack.Screen 
          name="AddProfile" 
          component={AddProfileScreen}
          options={{ title: 'Add Profile' }}
        />
        <Stack.Screen 
          name="PPI" 
          component={PPIScreen}
          options={{ title: 'Personality Assessment' }}
        />
        <Stack.Screen 
          name="Main" 
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Chapter" 
          component={ChapterScreen}
          options={{ title: 'Chapter' }}
        />
        <Stack.Screen 
          name="Lesson" 
          component={LessonScreen}
          options={{ title: 'Lesson' }}
        />
        <Stack.Screen 
          name="Quiz" 
          component={QuizScreen}
          options={{ title: 'Quiz' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
