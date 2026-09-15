import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, Linking, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { getSiteBannerByPosition } from '../lib/api';

interface PositionalBannerProps {
  position: string;
  style?: StyleProp<ViewStyle>;
}

export default function PositionalBanner({ position, style }: PositionalBannerProps) {
  const [banner, setBanner] = useState<{imageUrl: string; linkUrl: string | null} | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(6); // Default fallback

  useEffect(() => {
    const fetchBanner = async () => {
      const { data } = await getSiteBannerByPosition(position);
      if (data) {
        setBanner(data);
        if (data.imageUrl) {
          Image.getSize(
            data.imageUrl,
            (width, height) => {
              if (height > 0) {
                setAspectRatio(width / height);
              }
            },
            (error) => {
              console.error('Failed to get image size:', error);
            }
          );
        }
      }
    };
    fetchBanner();
  }, [position]);

  if (!banner) return null;

  const content = (
    <Image 
      source={{ uri: banner.imageUrl }} 
      style={styles.image} 
      resizeMode="cover"
    />
  );

  return (
    <View style={style}>
      {banner.linkUrl ? (
        <TouchableOpacity 
          style={[styles.container, { aspectRatio }]}
          onPress={() => Linking.openURL(banner.linkUrl!)}
          activeOpacity={0.9}
        >
          {content}
        </TouchableOpacity>
      ) : (
        <View style={[styles.container, { aspectRatio }]}>
          {content}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
