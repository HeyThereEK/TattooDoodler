import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const DrawingCanvas = forwardRef(({ selectedTool }, ref) => {
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  const getCoordinates = (event) => {
    if (event.nativeEvent.touches && event.nativeEvent.touches.length > 0) {
      const { locationX, locationY } = event.nativeEvent.touches[0];
      return { x: locationX, y: locationY };
    } else if (event.nativeEvent) {
      const { offsetX, offsetY } = event.nativeEvent;
      return { x: offsetX, y: offsetY };
    }
    return { x: 0, y: 0 };
  };

  const handleStart = (event) => {
    const { x, y } = getCoordinates(event);
    setCurrentPath(`M${x},${y}`);
    setIsDrawing(true);
  };

  const handleMove = (event) => {
    if (!isDrawing) return;
  
    const { x, y } = getCoordinates(event);
  
    if (selectedTool === 'eraser') {
      console.log(`Eraser at: (${x}, ${y})`); // Debugging touch point
      setPaths((prevPaths) =>
        prevPaths.filter((path) => {
          const pathPoints = path.split(' L').map((point) => {
            const [px, py] = point.slice(1).split(',');
            return { x: parseFloat(px), y: parseFloat(py) };
          });
  
          return !pathPoints.some((point) =>
            Math.hypot(point.x - x, point.y - y) < 20 // Adjust eraser radius
          );
        })
      );
      console.log('Paths after erase:', paths); // Debug remaining paths
    } else {
      setCurrentPath((prev) => `${prev} L${x},${y}`);
    }
  };
  
  
  const handleEnd = () => {
    if (selectedTool === 'pen' && currentPath) {
      setPaths((prevPaths) => [...prevPaths, currentPath]);
    }
    setCurrentPath('');
    setIsDrawing(false);
  };
  

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const undoLastPath = () => {
    setPaths((prevPaths) => prevPaths.slice(0, -1));
  };

    useImperativeHandle(ref, () => ({
    undoLastPath,
  }));

  return (
    <View
      style={styles.container}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
    >
      <Svg style={styles.svg}>
        {paths.map((path, index) => (
          <Path key={index} d={path} stroke="black" strokeWidth={2} fill="none" />
        ))}
        {currentPath && (
          <Path d={currentPath} stroke="black" strokeWidth={2} fill="none" />
        )}
      </Svg>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  svg: {
    flex: 1,
  },
  actions: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 16,
  },
  clearButton: {
    backgroundColor: '#FF5757',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default DrawingCanvas;
