// LoadingScreen.js
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const LoadingScreen = () => {
    return (
    <Animated.View style={[styles.container, { opacity }]}>
    <Text style={styles.appName}>My App</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#232324',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#afafaf',
  },
});

export default LoadingScreen;