import React from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { Bokor_400Regular } from "@expo-google-fonts/bokor";
import { useFonts } from "expo-font";

const LoadingScreen = ({ opacity }) => {
  const [fontsLoaded] = useFonts({
    Bokor_400Regular,
  });
  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* <Text style={styles.appName}>Tattoo</Text><Text style={styles.doodler}>Doodler</Text> */}
      <Image
        source={require('../../assets/TattooDoodlerLogo.png')} // Update the path to your logo
        style={styles.logo}
        resizeMode="contain"
      />
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
    fontSize: 48,
    fontWeight: 'bold',
    color: '#afafaf',
    fontFamily: 'Bokor_400Regular',
  },
  doodler: {
    fontSize: 48,
    color: '#afafaf',
    fontFamily: 'GloriaHallelujah_400Regular',
  },
  logo: {
    width: 400, // Adjust the width as needed
    height: 200, // Adjust the height as needed
  },
});

export default LoadingScreen;