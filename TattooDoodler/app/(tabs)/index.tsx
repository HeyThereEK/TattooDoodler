import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const DrawingAppPreview = () => {
  const drawings = [
    { id: '1', title: 'Landscape Study', date: '2024-03-15' },
    { id: '2', title: 'Portrait Sketch', date: '2024-03-14' },
    { id: '3', title: 'Abstract Art', date: '2024-03-13' },
    { id: '4', title: 'Still Life', date: '2024-03-12' },
    { id: '5', title: 'Urban Sketch', date: '2024-03-11' },
  ];

  // Calculate dimensions for grid items
  const screenWidth = Dimensions.get('window').width;
  const padding = 24;
  const spacing = 16;
  const numColumns = 3;
  const cardWidth = (screenWidth - 2 * padding - (numColumns - 1) * spacing) / numColumns;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>My Drawings</Text>
      </View>

      {/* Gallery Grid */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.gridContainer}>
          {/* New Drawing Button */}
          <TouchableOpacity 
            style={[styles.newDrawingButton, { width: cardWidth }]}
          >
            <Text style={styles.plusSign}>+</Text>
            <Text style={styles.newDrawingText}>New Drawing</Text>
          </TouchableOpacity>

          {/* Drawing Cards */}
          {drawings.map((drawing) => (
            <TouchableOpacity 
              key={drawing.id} 
              style={[styles.drawingCard, { width: cardWidth }]}
            >
              <View style={styles.thumbnail} />
              <View style={styles.cardInfo}>
                <Text style={styles.drawingTitle}>{drawing.title}</Text>
                <Text style={styles.drawingDate}>{drawing.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  newDrawingButton: {
    aspectRatio: 3/4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  plusSign: {
    fontSize: 48,
    color: '#666666',
  },
  newDrawingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  drawingCard: {
    aspectRatio: 3/4,
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
    backgroundColor: '#E8E8E8',
  },
  cardInfo: {
    padding: 12,
  },
  drawingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  drawingDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
});

export default DrawingAppPreview;