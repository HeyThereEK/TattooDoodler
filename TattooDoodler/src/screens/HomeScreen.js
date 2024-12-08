import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { useFonts } from "expo-font";
import { Bokor_400Regular } from "@expo-google-fonts/bokor";
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from './LoadingScreen';
import { TitilliumWeb_200ExtraLight } from '@expo-google-fonts/titillium-web';
import { TitilliumWeb_300Light } from '@expo-google-fonts/titillium-web';

const HomeScreen = ({ navigation }) => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // State to manage loading screen visibility
  const [designs, setDesigns] = useState([]); // State to store retrieved designs
  const [fontsLoaded] = useFonts({
    Bokor_400Regular,
    TitilliumWeb_200ExtraLight,
    TitilliumWeb_300Light,
  });
  const opacity = useRef(new Animated.Value(1)).current;

  const clearDrawings = async () => {
    try {
      await AsyncStorage.removeItem('designs');
      setDesigns([]); // Clear the designs state
      console.log('Drawings cleared successfully');
    } catch (error) {
      console.error('Error clearing drawings:', error);
    }
  };

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    };
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    const showLoadingScreen = async () => {
      const hasShownLoadingScreen = await AsyncStorage.getItem('hasShownLoadingScreen');
      if (hasShownLoadingScreen === null) {
        setIsLoading(true);
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(async () => {
            setIsLoading(false);
            await AsyncStorage.setItem('hasShownLoadingScreen', 'true');
          });
        }, 2000); // Show the loading screen for 2 seconds
      } else {
        setIsLoading(false); // Immediately hide the loading screen if it has been shown before
      }
    };
    showLoadingScreen();
  }, []);

  // Retrieve saved designs
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const designs = await AsyncStorage.getItem('designs');
        if (designs) {
          setDesigns(JSON.parse(designs));
        }
      } catch (error) {
        console.error('Error retrieving designs:', error);
      }
    };
    fetchDesigns();
  }, []);

  if (isLoading || isFirstLaunch === null || !fontsLoaded) {
    return <LoadingScreen opacity={opacity} />;
  }

  const screenWidth = Dimensions.get('window').width;
  const padding = 24;
  const spacing = 16;
  const numColumns = 4;
  const cardWidth = ((screenWidth - 2 * padding - (numColumns - 1) * spacing) / numColumns);

  return (
    <>
      <StatusBar barStyle={'light-content'} />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.headerText}>My Designs</Text>
          <Image
            source={require('../../assets/TattooDoodlerLogo.png')} // Update the path to your logo
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={[styles.newDesignButton, { width: cardWidth }]}
              onPress={() => {
                console.log('Navigating to DrawingScreen');
                navigation.navigate('Drawing');
              }}
            >
              <Text style={styles.plusSign}>+</Text>
              <Text style={styles.newDesignText}>New Design</Text>
            </TouchableOpacity>

            {designs.map((design, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.designCard, { width: cardWidth }]}
                onPress={() => navigation.navigate('Drawing', { design })}
              >
                <Image source={{ uri: design }} style={styles.thumbnail} />
                <View style={styles.cardInfo}>
                  <Text style={styles.designTitle}>Design {index + 1}</Text>
                </View>
              </TouchableOpacity>
            ))}

          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={clearDrawings}>
                <Text style={styles.clearButtonText}>Clear Drawings</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  statusbar: {
    backgroundColor: '#232324',
    color: '#afafaf',
  },
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
  header: {
    padding: 20,
    paddingLeft: 32,
    backgroundColor: '#232324',
    borderBottomWidth: 1,
    borderBottomColor: '#232324',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 32,
    fontFamily: 'TitilliumWeb_300Light',
    color: '#afafaf',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: '#2c2c2c',
    minHeight: '100%',
  },
  newDesignButton: {
    aspectRatio: 3 / 4,
    backgroundColor: '#3d3d3d',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#565656',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  plusSign: {
    fontSize: 48,
    color: '#666666',
  },
  newDesignText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
    fontFamily: 'TitilliumWeb_300Light',
  },
  designCard: {
    aspectRatio: 3 / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    flex: 1,
    // backgroundColor: '#E8E8E8',
    // backgroundColor: '#3d3d3d',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    alignSelf: 'flex-start',
    alignItems: 'flex-start'
  },
  cardInfo: {
    padding: 12,
  },
  designTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  clearButton: {
    backgroundColor: '#FF5757',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    height: 24,
    width: 120,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  footer: {
    alignItems: 'flex-end',
    height: 100,
    justifyContent: 'flex-end',
  },
  logo: {
    width: 200, // Adjust the width as needed
    height: 50,
    // height: 200, // Adjust the height as needed
  },
});

export default HomeScreen;