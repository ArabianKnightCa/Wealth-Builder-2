import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import 'react-native-gesture-handler';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FFA500" />
      <AppNavigator />
    </>
  );
}
