import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';

/**
 * Universal Vintage Kolkata Map Screen Background
 * Provides the authentic heritage Durga Puja vintage map backdrop
 * across all mobile screens.
 */
export default function ScreenBackground({
  children,
  style,
  contentStyle,
  opacity = 0.16,
  tintColor = 'rgba(253, 248, 238, 0.90)',
}) {
  return (
    <ImageBackground
      source={require('../../../assets/kolkata_vintage_map.jpg')}
      style={[styles.backgroundImage, style]}
      imageStyle={[styles.backgroundImageStyle, { opacity }]}
    >
      <View style={[styles.frostedBackdrop, { backgroundColor: tintColor }]} />
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  frostedBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});
