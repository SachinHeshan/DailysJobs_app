import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../lib/constants';

interface CompanyLogoProps {
  website?: string;
  name: string;
  size?: 'sm' | 'md';
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

function getFaviconUrl(website?: string): string | null {
  if (!website) return null;
  try {
    let url = website;
    if (!url.startsWith('http')) url = `https://${url}`;
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

const BG_COLORS = [
  '#0d9488', '#0f766e', '#0369a1', '#7c3aed',
  '#b45309', '#059669', '#dc2626', '#d97706',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export default function CompanyLogo({ website, name, size = 'md' }: CompanyLogoProps) {
  const dim = size === 'sm' ? 28 : 40;
  const fontSize = size === 'sm' ? 10 : 14;
  const faviconUrl = getFaviconUrl(website);
  const initials = getInitials(name);
  const bgColor = getColor(name);

  if (faviconUrl) {
    return (
      <View style={[styles.container, { width: dim, height: dim, borderRadius: dim / 4 }]}>
        <Image
          source={{ uri: faviconUrl }}
          style={{ width: dim, height: dim, borderRadius: dim / 4 }}
          onError={() => {}}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: dim, height: dim, borderRadius: dim / 4, backgroundColor: bgColor },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '800',
  },
});
