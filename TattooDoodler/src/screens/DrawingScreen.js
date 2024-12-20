import React, { Suspense, useRef, useEffect, useState } from 'react';
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
  TextInput,
} from 'react-native';
import { useFonts } from "expo-font";
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as ImagePicker from 'expo-image-picker';
import { Canvas } from '@react-three/fiber';
import { useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MaterialIcons, MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { TitilliumWeb_200ExtraLight } from '@expo-google-fonts/titillium-web'
import { TitilliumWeb_300Light } from '@expo-google-fonts/titillium-web'
import DrawingCanvas from '../components/DrawingCanvas';
import * as THREE from 'three';
import { extend } from '@react-three/fiber'
extend({ Div: THREE.Object3D })
import { MeshNormalMaterial } from 'three';
import 'react-resizable/css/styles.css'; // Required for styling the resizable box
import Draggable from 'react-draggable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { TouchableWithoutFeedback } from 'react-native';
import { Slider } from 'react-native-elements';

const BodyPartModel = ({ objPath, texture, boundingBox, textureScale, canvasWidth, canvasHeight, onModelLoaded, skintoneColor }) => {
  const object = useLoader(OBJLoader, objPath);

  useEffect(() => {
    if (object) {
      // Re-center the model
      const box = new THREE.Box3().setFromObject(object);
      const center = new THREE.Vector3();
      box.getCenter(center);
      object.position.sub(center);

      object.traverse((child) => {
        if (child.isMesh && child.geometry) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (texture && canvasWidth > 0 && canvasHeight > 0) {
            child.material.map = texture;

            // Calculate the bounding box center
            const boxCenterX = boundingBox.x + boundingBox.width / 2;
            const boxCenterY = boundingBox.y + boundingBox.height / 2;
            const boxCenterYFromBottom = canvasHeight - boxCenterY;

            const textureRepeatX = (boundingBox.width / canvasWidth) / textureScale;
            const textureRepeatY = (boundingBox.height / canvasHeight) / textureScale;

            const textureOffsetX = (boxCenterX / canvasWidth) - (textureRepeatX / 2);
            const textureOffsetY = (boxCenterYFromBottom / canvasHeight) - (textureRepeatY / 2);

            texture.offset.set(textureOffsetX, textureOffsetY);
            texture.repeat.set(textureRepeatX, textureRepeatY);
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;

            child.material.needsUpdate = true;
          } else if (!texture) {
            // Default material if no texture
            child.material = new THREE.MeshPhysicalMaterial({
              // color: 0xffeeea, // Change skintone color
              // color: 0x935d47, // Model skintone color
              color: skintoneColor, // Custom skintone color
              roughness: 1.0,
              clearcoat: 1.0,
              clearcoatRoughness: 0.5,
            });
          }
        }
      });

      // Adjust rotations as needed for your model
      if (objPath.includes('head')) {
        object.rotation.y = Math.PI;
      } else if (objPath.includes('torso')) {
        object.rotation.x = -Math.PI / 2;
      } else if (objPath.includes('leg')) {
        object.rotation.x = -Math.PI;
      } else if (objPath.includes('arm')) {
        object.rotation.x = -Math.PI;
      } else {
        object.rotation.y = Math.PI;
      }

      if (typeof onModelLoaded === 'function') {
        onModelLoaded(object);
      }
    }

  }, [object, texture, boundingBox, textureScale, canvasWidth, canvasHeight, skintoneColor]);
  return (
    <primitive
      object={object}
      scale={[0.15, 0.15, 0.15]}
      position={[0, 0, 0]}
    />
  );
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
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false); // State to manage save modal visibility
  const [isDesignSaved, setIsDesignSaved] = useState(false);// State to track if the design is saved
  const [textureScale, setTextureScale] = useState(0.1); // State to manage the scale of the texture
  const [isTattooApplied, setIsTattooApplied] = useState(false); // State to track if the tattoo has been applied
  const [leftPanelDimensions, setLeftPanelDimensions] = useState({ width: 0, height: 0 });
  const canvasWidth = canvasRef.current?.canvasWidth || 0;
  const canvasHeight = canvasRef.current?.canvasHeight || 0;
  const [loadedObject, setLoadedObject] = useState(null);
  const [skintoneColor, setSkintoneColor] = useState('#935d47'); // Default skintone color

  const handleToolChange = (tool) => {
    setSelectedTool(tool);
  };

  const handleImportModel = async () => {
    // Create a file input element dynamically
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.obj'; // Restrict to .obj files

    // Set up the file selection handler
    input.onchange = (e) => {
      const file = e.target.files[0]; // Get the selected file
      if (file && file.name.endsWith('.obj')) {
        const fileUri = URL.createObjectURL(file); // Generate a temporary URL for the file
        console.log('Selected file:', fileUri);

        // You can now set the file to your state or handle it further
        setSelectedModel({ objPath: fileUri });
        setModalVisible(false); // Close the modal
      } else {
        alert('Please select a valid .obj file');
      }
    };

    // Trigger the file input dialog
    input.click();
  };

  const [boundingBox, setBoundingBox] = useState({
    x: 90, // initial X position
    y: 75, // initial Y position
    width: 100, // initial width
    height: 100, // initial height
  });

  const route = useRoute();
  const { design } = route.params || {}; // Get the passed design data

  useEffect(() => {
    if (design) {
      loadDesign(design); // Load the design into the canvas
    }
  }, [design]);

  // Function to load the design into the canvas (svg only)
  const loadDesign = async (design) => {
    try {
      const { svgData } = design;
      if (svgData) {
        canvasRef.current?.loadSVG(svgData); // Load the SVG data into the canvas
      } else {
        console.warn('No SVG data found to load!');
      }
    } catch (error) {
      console.error('Error loading design:', error);
    }
  };

  const saveDesign = async (design) => {
    try {
      const designs = await AsyncStorage.getItem('designs');
      const designsArray = designs ? JSON.parse(designs) : [];
      designsArray.push(design);
      await AsyncStorage.setItem('designs', JSON.stringify(designsArray));
      console.log('Design saved successfully');
    } catch (error) {
      console.error('Error saving design:', error);
    }
  };

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
    try {
      const texture = new THREE.TextureLoader().load(
        tattoo
      );
      texture.needsUpdate = true;
      console.log("New texture created");
      setSelectedTexture(texture);
      console.log("New texture selected");
      setIsTattooApplied(true);
    } catch (error) {
      console.error('Error loading texture:', error);
    }
  };

  const uploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const texture = new THREE.TextureLoader().load(uri);
        texture.needsUpdate = true;
        console.log('Texture loaded from:', uri);
        setSelectedTexture(texture); // Set the texture for your 3D model
      }
    } catch (err) {
      console.error('Error picking image:', err);
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

  const handleDownloadModel = () => {
    if (!loadedObject) {
      console.warn('No model to export');
      return;
    }

    const sceneToExport = new THREE.Scene();
    sceneToExport.add(loadedObject);

    const exporter = new GLTFExporter();
    exporter.parse(sceneToExport, (result) => {
        // result is an ArrayBuffer for binary, or a JSON for non-binary
        // We'll export binary .glb
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);

        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'model.glb';
        link.click();

        // Clean up
        URL.revokeObjectURL(url);
      },
      { binary: true } // ensures we get a .glb
    );
  };


  // Toggle grid visibility
  const toggleGrid = () => setShowGrid((prev) => !prev);

  // Function to save the drawing/design, svg only
  // const handleSaveDesign = async () => {
  //   const svgData = await canvasRef.current?.exportSVG();
  //   if (svgData) {
  //     await saveDesign({ svgData });
  //   } else {
  //     console.warn('No SVG data found to save!');
  //   }
  // };

  // Function to save the drawing/design, svg and jpeg
  const handleSaveDesign = async () => {
    const svgData = await canvasRef.current?.exportSVG();
    const jpegData = await canvasRef.current?.exportImage(); // Assuming exportImage returns a JPEG data URL
    if (svgData && jpegData) {
      await saveDesign({ svgData, jpegData });
    } else {
      console.warn('No SVG or JPEG data found to save!');
    }
  };

  const handleNavigateHome = () => {
    if (!isDesignSaved) {
      setIsSaveModalVisible(true); // Show the save modal if the design is not saved
    } else {
      navigation.navigate('Home'); // Navigate to home if the design is already saved
    }
  };

  const handleSaveAndNavigateHome = async () => {
    await handleSaveDesign(); // Save the design
    setIsDesignSaved(true); // Mark the design as saved
    setIsSaveModalVisible(false); // Hide the save modal
    navigation.navigate('Home'); // Navigate to home
  };

  const handleDiscardAndNavigateHome = () => {
    setIsSaveModalVisible(false); // Hide the save modal
    navigation.navigate('Home'); // Navigate to home
  };

  const clampedX = Math.min(
    Math.max(boundingBox.x, 0),
    Math.max(leftPanelDimensions.width - boundingBox.width, 0) // ensure no negative
  );
  const clampedY = Math.min(
    Math.max(boundingBox.y, 0),
    Math.max(leftPanelDimensions.height - boundingBox.height, 0)
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.leftTools}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleNavigateHome}
          >
            <MaterialIcons name="home" size={24} color="white" />
          </TouchableOpacity>
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

        <View style={styles.centerTools}>
          <Image
            source={require('../../assets/TattooDoodlerLogo.png')} // Update the path to your logo
            style={styles.logo}
            resizeMode="contain"
          />
        </View>


        <View style={styles.rightTools}>
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
                  onPress={handleDownloadModel} // Now exports model instead of drawing
                >
                  <MaterialIcons name="file-download" size={24} color="white" />
                  <Text style={styles.dropdownButtonText}>Download Model</Text>
                </Pressable>


                <Pressable
                  style={({ hovered }) => [
                    styles.dropdownButton,
                    hovered && styles.dropdownButtonHovered,
                  ]}
                  onPress={uploadImage}
                >
                  <MaterialIcons name="file-upload" size={24} color="white" />
                  <Text style={styles.dropdownButtonText}>Upload</Text>
                </Pressable>
                {/* <Pressable
                  style={({ hovered }) => [
                    styles.dropdownButton,
                    hovered && styles.dropdownButtonHovered,
                  ]}
                  onPress={handleSaveDesign}
                >
                  <MaterialIcons name="save" size={24} color="white" />
                  <Text style={styles.dropdownButtonText}>Save</Text>
                </Pressable> */}
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.toolButton, styles.eraserButton]}
            onPress={() => handleToolChange('eraser')}
          >
            <MaterialCommunityIcons name="eraser" size={24} color="white" />
            <Text style={styles.toolText}>Eraser</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton, styles.penButton]}
            onPress={() => handleToolChange('pen')}
          >
            <MaterialIcons name="draw" size={24} color="white" />
            <Text style={styles.toolText}>Pen</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity style={[styles.toolButton, styles.colorWheel]}>
            <Text style={styles.toolText}>Color Wheel</Text>
          </TouchableOpacity> */}
        </View>
      </View>


      {/* Drawing Area */}
      <View style={styles.drawingContainer}>
        <View
          style={styles.leftPanel}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            console.log('LeftPanel dimensions:', width, height);
            setLeftPanelDimensions({ width, height });
          }}
        >
          {selectedModel && (<View style={styles.colorInputContainer}>
              <TextInput
                style={styles.colorInput}
                value={skintoneColor}
                onChangeText={setSkintoneColor}
                placeholder="#935d47"
                placeholderTextColor="#888"
              />
            </View>
          )}
          
            
          {/* Conditionally render the BodyPartModel if a body part is selected */}
          {selectedModel ? (
            <Canvas
              style={styles.canvas}
              camera={{
                position: [0, 20, 10], // Adjust to fit your model (X, Y, Z)
                fov: 50, // Field of view (lower values zoom in, higher values zoom out)
              }}
              shadows
              gl={{ preserveDrawingBuffer: true }} // Add this line
            >
              <ambientLight intensity={0.3} />
              <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-bias={-0.0001}
              />
              <spotLight
                position={[0, 5, -5]}
                angle={0.15}
                penumbra={1}
                intensity={1.5} // Increase the intensity of the spotlight
                castShadow // Enable shadow casting
                shadow-mapSize-width={2048} // Increase shadow map size for better quality shadows
                shadow-mapSize-height={2048} // Increase shadow map size for better quality shadows
                shadow-bias={-0.0001} // Adjust shadow bias to reduce shadow artifacts
              />
              <pointLight
                position={[-10, -10, -10]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-bias={-0.0001}
              />
              <directionalLight
                position={[0, 5, -5]}
                intensity={1.5} // Add a directional light for additional brightness
                castShadow
                shadow-mapSize-width={2048} // Increase shadow map size for better quality shadows
                shadow-mapSize-height={2048} // Increase shadow map size for better quality shadows
                shadow-bias={-0.0001} // Adjust shadow bias to reduce shadow artifacts
              />
              <directionalLight
                position={[0, -5, 5]}
                intensity={1.5} // Add a directional light for additional brightness
                castShadow
                shadow-mapSize-width={2048} // Increase shadow map size for better quality shadows
                shadow-mapSize-height={2048} // Increase shadow map size for better quality shadows
                shadow-bias={-0.0001} // Adjust shadow bias to reduce shadow artifacts
              />
              <directionalLight
                position={[0, -5, 5]}
                intensity={1.5} // Add a directional light for additional brightness
                castShadow
                shadow-mapSize-width={2048} // Increase shadow map size for better quality shadows
                shadow-mapSize-height={2048} // Increase shadow map size for better quality shadows
                shadow-bias={-0.0001} // Adjust shadow bias to reduce shadow artifacts
              />
              <directionalLight
                position={[0, 20, 10]}
                intensity={1.5} // Add a directional light for additional brightness
                castShadow
                shadow-mapSize-width={2048} // Increase shadow map size for better quality shadows
                shadow-mapSize-height={2048} // Increase shadow map size for better quality shadows
                shadow-bias={-0.0001} // Adjust shadow bias to reduce shadow artifacts
              />
              <OrbitControls target={[0, 0, 0]} />
              {showGrid && <gridHelper args={[100, 100]} />}
              <axesHelper args={[5]} />
              <Suspense fallback={null}>
                <BodyPartModel
                  objPath={selectedModel?.objPath}
                  texture={selectedTexture}
                  boundingBox={boundingBox}
                  textureScale={textureScale} // Pass the texture scale to the model
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  onModelLoaded={(obj) => {
                    console.log('Model loaded:', obj);
                    setLoadedObject(obj);
                  }}
                  skintoneColor={skintoneColor}
                />
              </Suspense>
            </Canvas>
          ) : (
            <Pressable
              style={({ hovered }) => [
                styles.bodyPartSelector,
                hovered && { backgroundColor: '#505050' },
              ]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.selectorText}>SELECT A BODY PART</Text>
            </Pressable>
          )}

          {/* Save Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isSaveModalVisible}
            onRequestClose={() => setIsSaveModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setIsSaveModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => { }}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Save Your Design</Text>
                    <Text style={styles.modalMessage}>You have unsaved changes.</Text>
                    <Text style={styles.modalMessageEnd}>Would you like to save your design before returning home?</Text>
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleSaveAndNavigateHome}
                      >
                        <Text style={styles.modalButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.discardButton]}
                        onPress={handleDiscardAndNavigateHome}
                      >
                        <Text style={styles.modalButtonText}>Discard</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

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

          {isTattooApplied && selectedModel && (
            <>
              {/* Slider to adjust texture scale */}
              <Slider
                style={styles.slider}
                minimumValue={0.01}
                maximumValue={.2}
                value={textureScale}
                onValueChange={setTextureScale}
                thumbStyle={styles.thumb}
              />

              {/* Resizable bounding box */}
              <Draggable
                position={{ x: 0, y: 0 }}
                onDrag={(e, data) => {
                  setBoundingBox((prev) => ({
                    ...prev,
                    x: prev.x + data.deltaX,
                    y: prev.y + data.deltaY,
                  }));
                }}
              >
                <View style={{
                  position: 'absolute',
                  transform: `translate(${clampedX}px, ${clampedY}px)`,
                }}>
                  <Feather name="move" size={24} color="black" />
                </View>
              </Draggable>
            </>
          )}
        </View>

        <View style={styles.rightPanel}>
          <DrawingCanvas ref={canvasRef} selectedTool={selectedTool} onToolChange={handleToolChange} />

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

            {/* Add Import Model Button */}
            {/* <TouchableOpacity
              style={styles.smallerModalButton}
              onPress={handleImportModel}
            >
              <Text style={styles.smallerModalButtonText}>Import Custom Model</Text>
            </TouchableOpacity> */}
            <Pressable
              style={({ hovered }) => [
                styles.smallerModalButton,
                hovered && { backgroundColor: '#505050' },
              ]}
              onPress={handleImportModel}
            >
              <Text style={styles.smallerModalButtonText}>Import Custom Model</Text>
            </Pressable>

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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'TitilliumWeb_300Light',
  },
  smallerModalButton: {
    backgroundColor: '#2c2c2c',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 5,
    marginBottom: 20,
  },
  smallerModalButtonText: {
    fontSize: 18,
    fontFamily: 'TitilliumWeb_300Light',
    color: '#878787',
  },
  imageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    marginTop: 8,
    borderRadius: 6,
    // marginLeft: 10
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
  canvasLabel: {
    position: 'absolute',
    fontFamily: 'TitilliumWeb_300Light',
    top: 2,
    left: 6,
    fontSize: 16,
    color: '#505050', // Adjust the color as needed
    zIndex: 1, // Ensure the label is on top of the canvas
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '40%',
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
  modalMessage: {
    fontSize: 16,
    color: '#878787',
    fontFamily: 'TitilliumWeb_300Light',
    textAlign: 'center',
    marginBottom: 0,
  },
  modalMessageEnd: {
    fontSize: 16,
    color: '#878787',
    fontFamily: 'TitilliumWeb_300Light',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  discardButton: {
    backgroundColor: '#FF5757',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'TitilliumWeb_300Light',
  },
  slider: {
    width: '70%',
    alignSelf: 'center',
    marginTop: 8,
  },
  thumb: {
    width: 20, // Adjust the size of the thumb
    height: 20, // Adjust the size of the thumb
    backgroundColor: '#FF0000', // Change the color of the thumb
    // borderRadius: 10, // Make the thumb circular
    // borderWidth: 2,
    // borderColor: '#FFFFFF', // Optional: Add a border color
  },
  logo: {
    width: 175, // Adjust the width as needed
    height: 50,
    // height: 200, // Adjust the height as needed
  },
  colorInputContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  colorInput: {
    width: 100,
    height: 40,
    backgroundColor: '#3d3d3d',
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#878787',
    borderColor: '#878787',
    borderWidth: 1,
  },
});

export default DrawingScreen; BodyPartModel