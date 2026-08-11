import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Text entrance
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle fade
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for the logo icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    setTimeout(() => pulse.start(), 700);

    // Navigate to Home after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/home');
    }, 2500);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Replaced gradient with solid color */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020617' }]} />

      {/* Background decorative circles */}
      <View style={[styles.circle, styles.circleTop]} />
      <View style={[styles.circle, styles.circleBottom]} />

      {/* Grid pattern overlay */}
      <View style={styles.gridOverlay} />

      {/* Logo container */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Logo Icon */}
        <Animated.View
          style={[
            styles.logoIconWrapper,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {/* Replaced Ionicons briefcase with image */}
          <View style={styles.logoIconInner}>
            <Image 
              source={require('../assets/favicon_1.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            alignItems: 'center',
            marginTop: 28,
          }}
        >
          <Text style={styles.appName}>
            Dailys<Text style={styles.appNameAccent}>Jobs</Text>
          </Text>
          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
            Sri Lanka's #1 Job Portal
          </Animated.Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom tagline */}
      <Animated.View style={[styles.bottomTag, { opacity: subtitleOpacity }]}>
        <View style={styles.bottomDivider} />
        <Text style={styles.bottomText}>Find. Apply. Succeed.</Text>
        <View style={styles.bottomDivider} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  circleTop: {
    width: 400,
    height: 400,
    top: -100,
    left: -80,
  },
  circleBottom: {
    width: 350,
    height: 350,
    bottom: -60,
    right: -80,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
  },
  content: {
    alignItems: 'center',
  },
  logoIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconInner: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  appNameAccent: {
    color: '#2dd4bf',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '400',
    letterSpacing: 1,
    marginTop: 6,
  },
  bottomTag: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bottomText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
