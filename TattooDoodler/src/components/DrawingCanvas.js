import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import html2canvas from 'html2canvas';

const DrawingCanvas = forwardRef(({ selectedTool }, ref) => {
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef(null);

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
    exportImage
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
      <Svg ref = {svgRef} style={styles.svg}>
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

        <TouchableOpacity style={styles.exportButton} onPress={exportImage}>
        <Text style={styles.exportButtonText}>Export Image</Text>
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
