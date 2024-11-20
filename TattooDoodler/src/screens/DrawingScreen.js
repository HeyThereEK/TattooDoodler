import React, {Suspense, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Modal,
  Image,
} from 'react-native';
import { Canvas } from '@react-three/fiber';
import { useLoader } from '@react-three/fiber';
import { OrbitControls} from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DrawingCanvas from '../components/DrawingCanvas';
import * as THREE from 'three';
import { extend } from '@react-three/fiber'
extend({ Div: THREE.Object3D})
import { MeshNormalMaterial } from 'three';


const BodyPartModel = ({ objPath }) => {
  const object = useLoader(OBJLoader, objPath);

  useEffect(() => {
    if (object) {
      object.traverse((child) => {
        if (child.isMesh) {
          child.material = new MeshNormalMaterial();
        }
      });
    }
  }, [object]);

  return <primitive 
    object={object}
    scale={[0.1, 0.1, 0.1]} // Reduce size to fit the scene
    position={[0, 0, 0]} // Center the model
    />;
};

const DrawingScreen = ({ navigation }) => {
  const [selectedTool, setSelectedTool] = useState('pen');
  const [penType, setPenType] = useState('fine');
  const canvasRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null); // To hold the path of selected 3D model
  const [showGrid, setShowGrid] = useState(true); // State to control grid visibility

    // Add a body part
    const handleImageSelect = (bodyPart) => {
      console.log(`Selected: ${bodyPart}`);
      setModalVisible(false); // Close the modal
      // Set the selected 3D model file
      const modelPath = getModelPath(bodyPart);
      setSelectedModel(modelPath);
    };

    // Helper function to return path based on selected body part
    const getModelPath = (bodyPart) => {
      switch (bodyPart) {
        case 'head':
          return {
            objPath: 'head.obj'
      }; 
        case 'arm':
          return {
            objPath: 'arm.obj'
      };
        case 'leg':
          return {
            objPath: 'leg.obj'
      };
        case 'torso':
          return {
            objPath: 'torso.obj'
      };
        default:
          return null;
      }
    };

    // Function to change body part (reset the selected model and open the modal)
    const changeBodyPart = () => {
      setModalVisible(true);
      setSelectedModel(null); // Reset the current model
    };

    // Toggle grid visibility
    const toggleGrid = () => setShowGrid((prev) => !prev);

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
          
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => canvasRef.current?.undoLastPath()}
          >
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
          {/* Conditionally render the BodyPartModel if a body part is selected */}
          {selectedModel ? (
            <Canvas style={styles.canvas}
            camera={{
              position: [0, 5, 10], // Adjust to fit your model (X, Y, Z)
              fov: 50, // Field of view (lower values zoom in, higher values zoom out)
            }}
            >
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <OrbitControls 
                target={[0, 0, 0]}
              />
              {showGrid && <gridHelper args={[100, 100]} />}
              <axesHelper args={[5]} />
              <Suspense fallback={null}>             
              <BodyPartModel 
                objPath={selectedModel.objPath} 
              />
              </Suspense>
            </Canvas>
          ) : (
            <View style={styles.bodyPartSelector}>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.selectorText}>SELECT A BODY PART</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Button to change body part */}
          {selectedModel && (
          <TouchableOpacity style={styles.toolButton} onPress={changeBodyPart}>
            <Text style={styles.toolText}>Change Body Part</Text>
          </TouchableOpacity>
          )}

          {/* Toggle button for grid */}
          {selectedModel && (
        <TouchableOpacity style={styles.toggleButton} onPress={toggleGrid}>
          <Text style={styles.toggleButtonText}>
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </Text>
        </TouchableOpacity>
          )}


        </View>


        
        <View style={styles.rightPanel}>
          <DrawingCanvas ref={canvasRef} selectedTool={selectedTool} />
        </View>
      </View>

      {/* Modal for popup */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Body Part</Text>

            <View style={styles.imageGrid}>
              <TouchableOpacity onPress={() => handleImageSelect('head')}>
                <Image
                  source={{ uri: 'https://images.free3d.com/imgd/l0/605600.jpg' }}
                  style={styles.imageButton}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleImageSelect('arm')}>
                <Image
                  source={{ uri: 'https://images.free3d.com/imgd/l84/605784.jpg' }}
                  style={styles.imageButton}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleImageSelect('leg')}>
                <Image
                  source={{ uri: 'https://images.free3d.com/imgd/l76/605776.jpg' }}
                  style={styles.imageButton}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleImageSelect('torso')}>
                <Image
                  source={{ uri: 'https://images.free3d.com/imgd/l42/605742.jpg' }}
                  style={styles.imageButton}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#F5F5F5',
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
  },
  drawingContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyPartSelector: {
    backgroundColor: '#C0C0C0',
    padding: 16,
    borderRadius: 10,
  },
  selectorText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageButton: {
    width: 100,
    height: 100,
    margin: 10,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
  toggleButton: {
    backgroundColor: '#007BFF',
    padding: 8,
    borderRadius: 6,
    marginLeft: 10
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: 18,
  },


});

export default DrawingScreen; BodyPartModel