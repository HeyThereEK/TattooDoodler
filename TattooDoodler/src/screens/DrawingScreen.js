import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useFonts } from "expo-font";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { TitilliumWeb_200ExtraLight } from '@expo-google-fonts/titillium-web'
import {TitilliumWeb_300Light} from '@expo-google-fonts/titillium-web'

const DrawingScreen = ({ navigation }) => {
  const [selectedTool, setSelectedTool] = useState('pen');
  const [penType, setPenType] = useState('fine');
  const [fontsLoaded] = useFonts({
    TitilliumWeb_200ExtraLight,
    TitilliumWeb_300Light,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.leftTools}>
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons name="file-download" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons name="file-upload" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons name="save" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons name="undo" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton}>
            <MaterialIcons name="redo" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.centerTools}>
          <TouchableOpacity 
            style={[styles.toolButton, styles.eraserButton]}
            onPress={() => setSelectedTool('eraser')}
          >
            <MaterialIcons name="edit" size={24} color="white" />
            <Text style={styles.toolText}>Eraser</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toolButton, styles.penButton]}
            onPress={() => setSelectedTool('pen')}
          >
            <Text style={styles.toolText}>Fine Point</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightTools}>
          <TouchableOpacity style={[styles.toolButton, styles.colorWheel]}>
            <Text style={styles.toolText}>Color Wheel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => navigation.navigate('Home')}
          >
            <MaterialIcons name="home" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Drawing Area */}
      <View style={styles.drawingContainer}>
        <View style={styles.leftPanel}>
          <View style={styles.bodyPartSelector}>
            <Text style={styles.selectorText}>Select Body Part</Text>
          </View>
        </View>
        
        <View style={styles.rightPanel}>
          <View style={styles.sketchpad}>
            {/* This is where we'll implement the actual drawing functionality */}
          </View>
          <Text style={styles.sketchpadLabel}>Sketchpad</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d3d3d',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#3d3d3d',
    height: 80,
    marginTop: 40, // Add space for the back button
  },
  leftTools: {
    flexDirection: 'row',
    gap: 8,
  },
  centerTools: {
    flexDirection: 'row',
    gap: 8,
  },
  rightTools: {
    flexDirection: 'row',
    gap: 8,
  },
  toolButton: {
    backgroundColor: '#707070',
    borderRadius: 20,
    padding: 12,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'TitilliumWeb_200ExtraLight',
  },
  eraserButton: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  penButton: {
    paddingHorizontal: 16,
  },
  colorWheel: {
    paddingHorizontal: 16,
  },
  toolText: {
    color: '#FFFFFF',
    fontWeight: '400',
    fontSize: 16,
    fontFamily: 'TitilliumWeb_300Light',    
  },
  drawingContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyPartSelector: {
    backgroundColor: '#C0C0C0',
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 10,
  },
  selectorText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'TitilliumWeb_300Light',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  sketchpad: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  sketchpadLabel: {
    textAlign: 'right',
    marginTop: 8,
    color: '#515151',
    fontSize: 20,
  },
});

export default DrawingScreen;