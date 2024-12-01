import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import html2canvas from 'html2canvas';

const DrawingCanvas = forwardRef(({ selectedTool, onToolChange }, ref) => {
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [redoStack, setRedoStack] = useState([]);
  const [strokeColor, setStrokeColor] = useState('black');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserSize, setEraserSize] = useState(1);
  const svgRef = useRef(null);
  
  // Store path attributes for each stroke
  const [pathAttributes, setPathAttributes] = useState([]);
  
  const colors = ['black', '#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080'];
  const brushSizes = [1, 2, 4, 6, 8, 10];

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
    if (selectedTool === 'pen') {
      setCurrentPath(`M${x},${y}`);
      setIsDrawing(true);
    } else if (selectedTool === 'eraser') {
      handleErase(x, y);
    }
  };

  const handleMove = (event) => {
    if (!isDrawing) return;
  
    const { x, y } = getCoordinates(event);
    if (selectedTool === 'pen' && isDrawing) {
      setCurrentPath((prev) => `${prev} L${x},${y}`);
    } else if (selectedTool === 'eraser') {
      handleErase(x, y);
    }
  };
  
  
  const handleEnd = () => {
    if (selectedTool === 'pen' && currentPath) {
      setPaths((prevPaths) => [...prevPaths, currentPath]);
      setPathAttributes((prevAttributes) => [
        ...prevAttributes,
        { color: strokeColor, width: strokeWidth }
      ]);
      setRedoStack([]); // Clear redo stack after a new path is drawn
    }
    setCurrentPath('');
    setIsDrawing(false);
  };

  const handleErase = (x, y) => {
    // Remove paths that intersect with eraser
    setPaths((prevPaths) => 
      prevPaths.filter((_, index) => {
        // Simple bounding box check - could be improved with proper path intersection
        const pathBounds = getPathBounds(prevPaths[index]);
        return !isPointInRange(x, y, pathBounds, eraserSize);
      })
    );
    setPathAttributes((prevAttributes) => 
      prevAttributes.filter((_, index) => {
        const pathBounds = getPathBounds(paths[index]);
        return !isPointInRange(x, y, pathBounds, eraserSize);
      })
    );
  };

  const getPathBounds = (pathData) => {
    // Simple path bounds calculation - could be improved
    const coordinates = pathData
      .split(' ')
      .map(coord => coord.replace(/[ML]/g, ''))
      .map(coord => coord.split(',').map(Number));
    
    const xCoords = coordinates.map(([x]) => x);
    const yCoords = coordinates.map(([, y]) => y);
    
    return {
      minX: Math.min(...xCoords),
      maxX: Math.max(...xCoords),
      minY: Math.min(...yCoords),
      maxY: Math.max(...yCoords),
    };
  };

  const isPointInRange = (x, y, bounds, range) => {
    return x >= bounds.minX - range &&
           x <= bounds.maxX + range &&
           y >= bounds.minY - range &&
           y <= bounds.maxY + range;
  };

  const clearCanvas = () => {
    if (paths.length > 0) {
      setRedoStack((prevRedo) => [{
        paths: paths,
        attributes: pathAttributes
      }, ...prevRedo]);
      setPaths([]);
      setPathAttributes([]);
    }
  };

  const undoLastPath = () => {
    setPaths((prevPaths) => {
      if (prevPaths.length === 0) return prevPaths;
      const lastPath = prevPaths[prevPaths.length - 1];
      setRedoStack((prevRedo) => [{
        path: lastPath,
        attributes: pathAttributes[pathAttributes.length - 1]
      }, ...prevRedo]);
      return prevPaths.slice(0, -1);
    });
    setPathAttributes(prev => prev.slice(0, -1));
  };

  const redoLastPath = () => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const { path, attributes } = prevRedo[0];
      setPaths(prevPaths => [...prevPaths, path]);
      setPathAttributes(prevAttributes => [...prevAttributes, attributes]);
      return prevRedo.slice(1);
    });
  };

  const exportImage = async () => {
    try {
            console.log("Export image triggered");
            const svg = svgRef.current;
    
            if (!svg) {
                throw new Error("SVG reference is not available.");
            }
            // Serialize the SVG to a string
            const svgData = `
              <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
                ${paths.map(path => `<path d="${path}" stroke="black" stroke-width="2" fill="none"/>`).join('')}
                ${currentPath && `<path d="${currentPath}" stroke="black" stroke-width="2" fill="none"/>`}
              </svg>
            `;

            // Create a Blob with the SVG data

            // const blob = new Blob([svgData], { type: 'image/svg+xml' });


            // Export as SVG

            // const link = document.createElement('a');
            // link.href = URL.createObjectURL(blob);
            // link.download = 'image.svg';
            // link.click();
            // console.log("SVG Download triggered");

            // Export as JPEG using html2canvas
            // First, render the SVG onto the page inside a container
            const svgContainer = document.createElement('div');
            svgContainer.innerHTML = svgData;
            document.body.appendChild(svgContainer);

            // Wait for the SVG to be rendered, then use html2canvas
            const jpegDataUrl = await new Promise((resolve, reject) => {
              html2canvas(svgContainer).then((canvas) => {
                const jpegDataUrl = canvas.toDataURL('image/jpeg', 1.0);
                resolve(jpegDataUrl);

                // Create a download link for the JPEG image
                const jpegLink = document.createElement('a');
                jpegLink.href = jpegDataUrl;
                jpegLink.download = 'image.jpeg';
                jpegLink.click();
                console.log("JPEG Download triggered");
                // Clean up the temporary SVG container
                document.body.removeChild(svgContainer);
              }).catch(reject);
            });

            console.log("JPEG image generated");
            return jpegDataUrl; // Return JPEG data URL

            } catch (error) {
            console.error('Error exporting image:', error);
            alert('Failed to export image. Please try again.');
            return null;
        }
    };

  useImperativeHandle(ref, () => ({
    undoLastPath,
    redoLastPath,
    clearCanvas,
    setStrokeColor,
    setStrokeWidth,
    setEraserSize,
    exportImage
  }));

  return (
    <View style={styles.container}>
      <View style={styles.toolbox}>
        <View style={styles.colorPalette}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorButton, { backgroundColor: color }]}
              onPress={() => setStrokeColor(color)}
            />
          ))}
        </View>
        <View style={styles.brushSizes}>
          {brushSizes.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeButton, strokeWidth === size && styles.selectedSize]}
              onPress={() => setStrokeWidth(size)}
            >
              <View style={[styles.sizePreview, { width: size * 2, height: size * 2 }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <Pressable
        style={styles.canvas}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
      >
        <Svg ref = {svgRef} style={styles.svg}>
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path}
              stroke={pathAttributes[index]?.color || 'black'}
              strokeWidth={pathAttributes[index]?.width || 2}
              fill="none"
            />
          ))}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
          )}
        </Svg>
      </Pressable>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportButton} onPress={exportImage}>
          <Text style={styles.exportButtonText}>Export Image</Text>
        </TouchableOpacity>
        {selectedTool === 'eraser' && (
          <View style={styles.eraserSizes}>
            {[1, 2, 3].map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.eraserButton, eraserSize === size && styles.selectedEraser]}
                onPress={() => setEraserSize(size)}
              >
                <Text style={styles.eraserButtonText}>{size}px</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  toolbox: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 8,
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  brushSizes: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  selectedSize: {
    backgroundColor: '#EEEEEE',
  },
  sizePreview: {
    backgroundColor: 'black',
    borderRadius: 100,
  },
  canvas: {
    flex: 1,
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
    alignItems: 'center',
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
  eraserSizes: {
    flexDirection: 'row',
    gap: 8,
  },
  eraserButton: {
    backgroundColor: '#EEEEEE',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectedEraser: {
    backgroundColor: '#DDDDDD',
  },
  eraserButtonText: {
    fontSize: 12,
  },

  exportButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default DrawingCanvas;