import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { DEFAULT_BANNERS, COLORS } from '../lib/constants';
import { useTheme } from '../lib/theme';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 32;
const BANNER_HEIGHT = 230;

interface BannerData {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
}

export default function BannerSlider() {
  const { colors, isDark } = useTheme();
  const [banners, setBanners] = useState<BannerData[]>(DEFAULT_BANNERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length === 0) return;
    startTimer();
    return () => stopTimer();
  }, [banners, currentIndex]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      const next = (currentIndex + 1) % banners.length;
      goToSlide(next);
    }, 4000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    flatListRef.current?.scrollToOffset({ offset: index * SLIDER_WIDTH, animated: true });
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Animated.FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SLIDER_WIDTH);
          setCurrentIndex(idx);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Dark overlay for readability */}
            <View style={styles.darkOverlay} />
            <LinearGradient
              colors={['transparent', 'rgba(2,6,23,0.88)']}
              style={styles.overlay}
            />
            <View style={styles.content}>
              <Text style={styles.label}>Sri Lankan Job Vacancy Portal</Text>
              {item.title ? (
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              ) : null}
              {item.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>
              ) : null}
              <TouchableOpacity style={styles.button} activeOpacity={0.85}>
                <Text style={styles.buttonText}>Explore Opportunities</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {banners.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToSlide(index)}
            style={[
              styles.dot,
              index === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: BANNER_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#0d9488',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  containerDark: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
  },
  slide: {
    width: SLIDER_WIDTH,
    height: BANNER_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 38,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#2dd4bf',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 26,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginBottom: 10,
    fontWeight: '300',
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
});
