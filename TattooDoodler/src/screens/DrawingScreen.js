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
  PanResponder,
  Pressable,
} from 'react-native';
import { useFonts } from "expo-font";
import { Canvas } from '@react-three/fiber';
import { useLoader } from '@react-three/fiber';
import { OrbitControls} from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { TitilliumWeb_200ExtraLight } from '@expo-google-fonts/titillium-web'
import {TitilliumWeb_300Light} from '@expo-google-fonts/titillium-web'
import DrawingCanvas from '../components/DrawingCanvas';
import * as THREE from 'three';
import { extend } from '@react-three/fiber'
extend({ Div: THREE.Object3D})
import { MeshNormalMaterial } from 'three';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css'; // Required for styling the resizable box
import Draggable from 'react-draggable';


const BodyPartModel = ({ objPath, texture, boundingBox}) => {
  const object = useLoader(OBJLoader, objPath);

  useEffect(() => {
    if (object) {
      object.traverse((child) => {
        if (child.isMesh && child.geometry) {
          console.log('UV Attributes:', child.geometry.attributes.uv || 'No UV found');
          console.log('UV Attributes array:', child.geometry.attributes.uv.array);
          const uvArray = child.geometry.attributes.uv.array;
          if (texture) {
            child.material.map = texture; // Apply texture
            console.log('Applying texture:', texture);
            console.log(child.geometry.attributes.position);
            texture.center.set(0.5,0.5);
            console.log("texture center", texture.center)
            texture.rotation = 0
            // Calculate new texture offset and repeat based on bounding box
            const textureOffsetX = boundingBox.x / boundingBox.width - 0.5;
            const textureOffsetY = boundingBox.y / boundingBox.height - 0.5; 

            const textureRepeatX = 100 / boundingBox.width; 
            const textureRepeatY = 100 / boundingBox.height; 

            texture.offset.set(
              THREE.MathUtils.clamp(textureOffsetX, -1, 1),
              THREE.MathUtils.clamp(textureOffsetY, -1, 1)
            );
            console.log('Applying texture offset:', textureOffsetX, textureOffsetY);
            texture.repeat.set(textureRepeatX, textureRepeatY);
            console.log('Applying texture repeat x:', textureRepeatX, 'Applying texture repeat y:', textureRepeatY);
            child.material.needsUpdate = true;
          } else {
            child.material = new THREE.MeshBasicMaterial(); // Default material
          }
        }
      });
    }
  }, [object, texture, boundingBox]);

  return <primitive
    object={object}
    scale={[0.1, 0.1, 0.1]} // Reduce size to fit the scene
    position={[0, 0, 0]} // Center the model
    />;
};

const DrawingScreen = ({ navigation }) => {
  console.log('DrawingScreen rendered');
  const [selectedTool, setSelectedTool] = useState('pen');
  const [penType, setPenType] = useState('fine');
  const [fontsLoaded] = useFonts({
    TitilliumWeb_200ExtraLight,
    TitilliumWeb_300Light,
  });
  const canvasRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null); // To hold the path of selected 3D model
  const [showGrid, setShowGrid] = useState(true); // State to control grid visibility
  const [selectedTexture, setSelectedTexture] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false); // State for dropdown visibility

  const [boundingBox, setBoundingBox] = useState({
    x: 0, // initial X position
    y: 0, // initial Y position
    width: 100, // initial width
    height: 100, // initial height
  });

  const handleResize = (e, data) => {
    setBoundingBox({
      x: boundingBox.x,
      y: boundingBox.y,
      width: data.size.width,
      height: data.size.height,
    });
  };
  
  const toggleDropdown = () => setDropdownVisible((prev) => !prev);

  // Generate texture on demand
  const applyDrawingToTexture = async () => {
    const tattoo = await canvasRef.current?.exportImage();
    if (!tattoo) {
      console.warn('No drawing found to export!');
      return;
    }
    try{
      const texture = new THREE.TextureLoader().load(
        tattoo
      );
      texture.needsUpdate = true;
      console.log("New texture created");
      setSelectedTexture(texture);
      console.log("New texture selected");
    }catch (error){
      console.error('Error loading texture:', error);
    }
  };

    // Add a body part
    const handleImageSelect = (bodyPart) => {
      console.log(`Selected: ${bodyPart}`);
      setModalVisible(false); // Close the modal
      // Set the selected 3D model file
      const modelPath = getModelPath(bodyPart);
      setSelectedModel(modelPath,);
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
          <View style={styles.dropdownContainer}>
            <TouchableOpacity style={styles.toolButton} onPress={toggleDropdown}>
              <MaterialCommunityIcons name="chevron-down-circle-outline" size={24} color="white" />
            </TouchableOpacity>

            {dropdownVisible && (
              <View style={styles.dropdown}>
                <Pressable
                  style={({ hovered }) => [
                    styles.dropdownButton,
                    hovered && styles.dropdownButtonHovered,
                  ]}
                >
                  <MaterialIcons name="file-download" size={24} color="white" />
                  <Text style={styles.dropdownButtonText}>Download</Text>
                </Pressable>

                <Pressable
                  style={({ hovered }) => [
                    styles.dropdownButton,
                    hovered && styles.dropdownButtonHovered,
                  ]}
                >
                  <MaterialIcons name="file-upload" size={24} color="white" />
                  <Text style={styles.dropdownButtonText}>Upload</Text>
                </Pressable>

                <Pressable
                  style={({ hovered }) => [
                    styles.dropdownButton,
                    hovered && styles.dropdownButtonHovered,
                  ]}
                >
                  <MaterialIcons name="save" size={24} color="white" />
                  <Text style={styles.dropdownButtonText}>Save</Text>
                </Pressable>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => canvasRef.current?.undoLastPath()}
          >
            <MaterialIcons name="undo" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => canvasRef.current?.redoLastPath()}
          >
            <MaterialIcons name="redo" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.rightTools}>
          <TouchableOpacity 
            style={[styles.toolButton, styles.eraserButton]}
            onPress={() => setSelectedTool('eraser')}
          >
            <MaterialCommunityIcons name="eraser" size={24} color="white" />
            <Text style={styles.toolText}>Eraser</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolButton, styles.penButton]}
            onPress={() => setSelectedTool('pen')}
          >
            <MaterialIcons name="draw" size={24} color="white" />
            <Text style={styles.toolText}>Pen</Text>
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
            <Canvas
              style={styles.canvas}
              camera={{
                position: [0, 5, 10], // Adjust to fit your model (X, Y, Z)
                fov: 50, // Field of view (lower values zoom in, higher values zoom out)
              }}
              gl={{ preserveDrawingBuffer: true }} // Add this line
            >
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <OrbitControls target={[0, 0, 0]} />
              {showGrid && <gridHelper args={[100, 100]} />}
              <axesHelper args={[5]} />
              <Suspense fallback={null}>
                <BodyPartModel
                  objPath={selectedModel.objPath}
                  texture={selectedTexture}
                  boundingBox={boundingBox}
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

          {/* Resizable bounding box */}
          <Draggable
            bounds={{
              left: 0,
              top: 0,
              right: 400 - boundingBox.width, // Adjust based on parent width and box width
              bottom: 650 - boundingBox.height, // Adjust based on parent height and box height
            }}
            position={{ x: boundingBox.x, y: boundingBox.y }}
            onDrag={(e, data) => {
              setBoundingBox((prev) => ({
                ...prev,
                x: data.x,
                y: data.y,
              }));
            }}
            onStop={(e, data) => {
              console.log(`Dragged to: ${data.x}, ${data.y}`);
            }}
          >
            <ResizableBox
              width={boundingBox.width}
              height={boundingBox.height}
              minConstraints={[1, 1]}
              maxConstraints={[356, 616]}
              onResizeStop={handleResize}
              style={{
                position: 'absolute',
                top: boundingBox.y,
                left: boundingBox.x,
                borderWidth: 5,
                borderColor: 'white',
                borderStyle: 'solid',
                backgroundColor: 'transparent',
              }}
            />
          </Draggable>
        </View>

        <View style={styles.rightPanel}>
          <DrawingCanvas ref={canvasRef} selectedTool={selectedTool} />

          <TouchableOpacity style={styles.toolButton} onPress={applyDrawingToTexture}>
            <Text style={styles.toolText}>Apply Tattoo</Text>
          </TouchableOpacity>
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
    zIndex: 10,
  },
  leftTools: {
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
    // fontFamily: 'TitilliumWeb_200ExtraLight',
    // fontFamily: 'TitilliumWeb_300Light',
  },
  eraserButton: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  penButton: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  colorWheel: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
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
    // backgroundColor: '#C0C0C0',
    backgroundColor: '#444444',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 10,
  },
  selectorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#878787',
    fontFamily: 'TitilliumWeb_300Light',
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
    color: '#2c2c2c',
    fontSize: 20,
    fontFamily: 'TitilliumWeb_200ExtraLight',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#3d3d3d',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#878787',
    fontFamily: 'TitilliumWeb_300Light',
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
    fontFamily: 'TitilliumWeb_300Light',
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
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'TitilliumWeb_300Light',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: 48, // Adjust this value to position the dropdown correctly
    left: 0,
    backgroundColor: '#707070',
    borderRadius: 8,
    padding: 8,
    zIndex: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  dropdownButtonHovered: {
    backgroundColor: '#505050', // Change this to your desired hover color
  },
  dropdownButtonText: {
    color: 'white',
    marginLeft: 8,
  },
});

export default DrawingScreen; BodyPartModel