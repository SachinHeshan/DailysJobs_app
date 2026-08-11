import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Share,
  Animated,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import { Job } from '../../types';
import { getJobById } from '../../lib/api';
import { formatRelativeTime, formatDate } from '../../lib/dateUtils';
import { slugify } from '../../lib/slugUtils';
import { COLORS } from '../../lib/constants';
import { useTheme } from '../../lib/theme';
import CompanyLogo from '../../components/CompanyLogo';

function getTypeColors(type: Job['type'], isDark: boolean) {
  switch (type) {
    case 'Full-Time':
      return {
        bg:     isDark ? 'rgba(16,185,129,0.10)' : '#ecfdf5',
        text:   isDark ? '#34d399'               : '#047857',
        border: isDark ? 'rgba(16,185,129,0.20)' : '#d1fae5',
      };
    case 'Part-Time':
      return {
        bg:     isDark ? 'rgba(245,158,11,0.10)' : '#fffbeb',
        text:   isDark ? '#fbbf24'               : '#b45309',
        border: isDark ? 'rgba(245,158,11,0.20)' : '#fde68a',
      };
    case 'Internship':
      return {
        bg:     isDark ? 'rgba(139,92,246,0.10)' : '#faf5ff',
        text:   isDark ? '#a78bfa'               : '#6d28d9',
        border: isDark ? 'rgba(139,92,246,0.20)' : '#ede9fe',
      };
    case 'Remote':
      return {
        bg:     isDark ? 'rgba(59,130,246,0.10)' : '#eff6ff',
        text:   isDark ? '#60a5fa'               : '#1d4ed8',
        border: isDark ? 'rgba(59,130,246,0.20)' : '#dbeafe',
      };
    default:
      return {
        bg:     isDark ? '#1e293b' : '#f8fafc',
        text:   isDark ? '#cbd5e1' : '#334155',
        border: isDark ? '#334155' : '#f1f5f9',
      };
  }
}


function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s,;'"<>()\[\]]+/);
  return match ? match[0].replace(/[.,;!?]+$/, '') : null;
}

function isHtmlContent(text: string): boolean {
  return text.includes('<p>') || text.includes('<ul>') || text.includes('<ol>') || text.includes('<strong>');
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [descHeight, setDescHeight] = useState(300);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    const { data, error } = await getJobById(id as string);
    if (error || !data) {
      setError('Job not found.');
    } else {
      setJob(data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
    setLoading(false);
  };

  const handleCopyEmail = async (email: string) => {
    await Clipboard.setStringAsync(email);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2500);
  };

  const handleShare = async () => {
    setIsShareModalOpen(true);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading job details...</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Job not found</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeColors = getTypeColors(job.type, isDark);
  const displaySalary = job.salary
    ? job.salary.toLowerCase().startsWith('lkr') ? job.salary : `LKR ${job.salary}`
    : null;
  const applyEmail = extractEmail(job.howToApply);
  const applyUrl = extractUrl(job.howToApply);

  const cleanHowToApply = job.howToApply
    .replace(/https?:\/\/[^\s,;'"<>()\[\]]+/g, '')
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '')
    .replace(/\bwww\.[^\s,;'"<>()\[\]]+/g, '')
    .trim();

  const isHtml = isHtmlContent(job.description || '');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 14px; 
          color: ${isDark ? '#cbd5e1' : '#334155'}; 
          line-height: 1.7;
          padding: 0;
          background: transparent;
          overflow: hidden;
        }
        h1, h2, h3 { color: ${isDark ? '#f1f5f9' : '#0f172a'}; margin: 12px 0 6px; font-weight: 700; }
        h1 { font-size: 18px; }
        h2 { font-size: 16px; }
        h3 { font-size: 14px; }
        p { margin-bottom: 8px; }
        ul, ol { padding-left: 20px; margin: 8px 0; }
        li { margin-bottom: 4px; }
        a { color: #0d9488; }
        strong { font-weight: 700; }
        em { font-style: italic; }
      </style>
    </head>
    <body>${job.description}</body>
    <script>
      window.addEventListener('load', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ height: document.body.scrollHeight }));
      });
    <\/script>
    </html>
  `;

  const renderDescription = () => {
    if (!job.description || job.description.trim() === '' || job.description === '<p><br></p>') return null;

    if (isHtml) {
      return (
        <WebView
          source={{ html: htmlContent }}
          style={{ height: descHeight, backgroundColor: 'transparent' }}
          scrollEnabled={false}
          onMessage={(e) => {
            try {
              const { height } = JSON.parse(e.nativeEvent.data);
              if (height > 0) setDescHeight(height + 16);
            } catch {}
          }}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    const lines = job.description.split('\n');
    return (
      <View style={{ gap: 4 }}>
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith('# ')) {
            return <Text key={i} style={styles.descH1}>{trimmed.replace(/^#\s+/, '')}</Text>;
          }
          if (trimmed.startsWith('## ')) {
            return <Text key={i} style={styles.descH2}>{trimmed.replace(/^##\s+/, '')}</Text>;
          }
          if (/^[-*•]\s/.test(trimmed)) {
            return (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{trimmed.replace(/^[-*•]\s+/, '')}</Text>
              </View>
            );
          }
          return <Text key={i} style={styles.descParagraph}>{trimmed}</Text>;
        })}
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.topBar, {
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
      }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.inputBg }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]} numberOfLines={1}>Job Details</Text>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.inputBg }]} onPress={handleShare}>
          <Ionicons name="share-social" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: typeColors.bg, borderColor: typeColors.border }]}>
              <Ionicons name="briefcase-outline" size={11} color={typeColors.text} />
              <Text style={[styles.badgeText, { color: typeColors.text }]}>{job.type}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText} numberOfLines={1}>{job.category}</Text>
            </View>
            {job.urgent && (
              <View style={styles.urgentBadge}>
                <View style={styles.urgentDot} />
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.jobTitle, { color: colors.textPrimary }]}>{job.title}</Text>

          {/* Company + Meta */}
          <View style={[styles.metaSection, { borderTopColor: colors.borderLight }]}>
            <View style={styles.companyRow}>
              <CompanyLogo website={job.companyWebsite} name={job.companyName} size="sm" />
              <Text style={[styles.companyName, { color: colors.textSecondary }]}>{job.companyName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.primary} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{job.location}, Sri Lanka</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>Posted {formatRelativeTime(job.postedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Job Description */}
        {job.description && job.description.trim() !== '' && job.description !== '<p><br></p>' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Job Description</Text>
            {renderDescription()}
          </View>
        )}

        {/* Job Post Image */}
        {job.jobPostImageUrl && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardSectionLabel, { color: colors.textMuted }]}>JOB POST</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setIsImageModalOpen(true)}>
              <View style={[styles.imageFrame, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                <Image
                  source={{ uri: job.jobPostImageUrl }}
                  style={styles.jobPostImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardSectionLabel, { color: colors.textMuted }]}>JOB TAGS</Text>
            <View style={styles.tagsWrap}>
              {job.tags.map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
                  <Ionicons name="pricetag-outline" size={10} color={colors.textMuted} />
                  <Text style={[styles.tagText, { color: colors.textMuted }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Job Overview */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Job Overview</Text>
          <View style={styles.overviewList}>
            {displaySalary && (
              <View style={styles.overviewItem}>
                <View style={[styles.overviewIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>SALARY RANGE</Text>
                  <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>{displaySalary}</Text>
                  <Text style={[styles.overviewNote, { color: colors.textMuted }]}>Average market estimate. Actual may vary.</Text>
                </View>
              </View>
            )}
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>LOCATION</Text>
                <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>{job.location}</Text>
              </View>
            </View>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="briefcase-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>JOB TYPE</Text>
                <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>{job.type}</Text>
              </View>
            </View>
            {job.expiresAt && formatDate(job.expiresAt) && (
              <View style={styles.overviewItem}>
                <View style={[styles.overviewIcon, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="alert-circle-outline" size={18} color="#dc2626" />
                </View>
                <View>
                  <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>EXPIRY DATE</Text>
                  <Text style={[styles.overviewValue, { color: '#dc2626' }]}>{formatDate(job.expiresAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* How to Apply */}
        <View style={[styles.card, styles.applyCard, {
          backgroundColor: isDark ? 'rgba(13,148,136,0.06)' : 'rgba(240,253,250,0.4)',
          borderColor: isDark ? 'rgba(13,148,136,0.18)' : 'rgba(13,148,136,0.2)',
        }]}>
          <View style={styles.applyHeader}>
            <Ionicons name="mail" size={18} color={COLORS.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>How to Apply</Text>
          </View>
          <Text style={[styles.applyNote, { color: colors.textMuted }]}>
            Please follow the employer's guidelines below. Mention that you found the job on DailyJobs.
          </Text>

          {cleanHowToApply ? (
            <View style={[styles.applyInstructions, {
              backgroundColor: colors.card,
              borderColor: isDark ? 'rgba(13,148,136,0.15)' : 'rgba(13,148,136,0.1)',
            }]}>
              <Text style={[styles.applyInstructionsText, { color: colors.textSecondary }]}>{cleanHowToApply}</Text>
            </View>
          ) : null}

          {/* Email Copy */}
          {applyEmail && (
            <TouchableOpacity
              style={styles.emailCopyBtn}
              onPress={() => handleCopyEmail(applyEmail)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={emailCopied ? 'checkmark-circle' : 'copy-outline'}
                size={16}
                color={emailCopied ? '#15803d' : '#64748b'}
              />
              <Text style={[styles.emailCopyText, emailCopied && { color: '#15803d' }]}>
                {emailCopied ? 'Email Copied!' : applyEmail}
              </Text>
            </TouchableOpacity>
          )}

          {/* Apply via Email */}
          {applyEmail && (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() =>
                Linking.openURL(
                  `mailto:${applyEmail}?subject=${encodeURIComponent(`Application for ${job.title} - ${job.companyName}`)}`
                )
              }
              activeOpacity={0.85}
            >
              <Ionicons name="mail" size={16} color="#fff" />
              <Text style={styles.applyBtnText}>Apply Now via Email</Text>
            </TouchableOpacity>
          )}

          {/* Apply via Website */}
          {applyUrl && (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => Linking.openURL(applyUrl)}
              activeOpacity={0.85}
            >
              <Ionicons name="globe-outline" size={16} color="#fff" />
              <Text style={styles.applyBtnText}>Apply via Website</Text>
            </TouchableOpacity>
          )}

          {/* External Job Post URL */}
          {job.jobPostUrl && (
            <TouchableOpacity
              style={styles.applyBtnOutline}
              onPress={() => Linking.openURL(job.jobPostUrl!)}
              activeOpacity={0.85}
            >
              <Ionicons name="open-outline" size={16} color={COLORS.primary} />
              <Text style={styles.applyBtnOutlineText}>Apply Now</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 32 }} />
      </Animated.ScrollView>

      {/* Share Modal */}
      <Modal visible={isShareModalOpen} transparent={true} animationType="fade" onRequestClose={() => setIsShareModalOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsShareModalOpen(false)}>
          <View style={[styles.shareModalContent, { backgroundColor: colors.card, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 16, textAlign: 'center' }]}>
              Share this job
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
                onPress={() => { Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://dailysjobs.com/job/${slugify(job.title)}`)}`); setIsShareModalOpen(false); }}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-facebook" size={20} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#25D366' }]}
                onPress={() => { Linking.openURL(`whatsapp://send?text=${encodeURIComponent(`Check out this job: ${job.title} at ${job.companyName} in ${job.location}, Sri Lanka.\n\nhttps://dailysjobs.com/job/${slugify(job.title)}`)}`); setIsShareModalOpen(false); }}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#000000' }]}
                onPress={() => { Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this job: ${job.title} at ${job.companyName} in ${job.location}, Sri Lanka.`)}&url=${encodeURIComponent(`https://dailysjobs.com/job/${slugify(job.title)}`)}`); setIsShareModalOpen(false); }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginTop: -2 }}>𝕏</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { Share.share({ message: `Check out this job: https://dailysjobs.com/job/${slugify(job.title)}` }); setIsShareModalOpen(false); }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
                  style={styles.socialBtn}
                >
                  <Ionicons name="logo-instagram" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#000000' }]}
                onPress={() => { Share.share({ message: `Check out this job: https://dailysjobs.com/job/${slugify(job.title)}` }); setIsShareModalOpen(false); }}
                activeOpacity={0.8}
              >
                <FontAwesome5 name="tiktok" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#0A66C2' }]}
                onPress={() => { Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://dailysjobs.com/job/${slugify(job.title)}`)}`); setIsShareModalOpen(false); }}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-linkedin" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: '#0088cc' }]}
                onPress={() => { Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(`https://dailysjobs.com/job/${slugify(job.title)}`)}&text=${encodeURIComponent(`Check out this job: ${job.title} at ${job.companyName} in ${job.location}, Sri Lanka.`)}`); setIsShareModalOpen(false); }}
                activeOpacity={0.8}
              >
                <FontAwesome5 name="telegram-plane" size={20} color="#fff" style={{ marginRight: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Zoom Modal */}
      {job.jobPostImageUrl && (
        <Modal visible={isImageModalOpen} transparent={true} animationType="fade" onRequestClose={() => setIsImageModalOpen(false)}>
          <View style={styles.imageModalBackdrop}>
            <TouchableOpacity style={styles.imageModalCloseBtn} onPress={() => setIsImageModalOpen(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <ScrollView
              contentContainerStyle={styles.imageModalScroll}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent={true}
            >
              <Image
                source={{ uri: job.jobPostImageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  backHomeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  backHomeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginHorizontal: 12,
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: 180,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  urgentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  urgentText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 30,
    marginBottom: 16,
  },
  metaSection: {
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  cardSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#94a3b8',
    marginBottom: 10,
  },
  descH1: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 4,
  },
  descH2: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 3,
  },
  descParagraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  jobPostImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 4 / 5,
    borderRadius: 8,
  },
  imageFrame: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  overviewList: {
    gap: 16,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  overviewIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#94a3b8',
    marginBottom: 2,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  overviewNote: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontStyle: 'italic',
  },
  applyCard: {
    borderColor: 'rgba(13,148,136,0.2)',
    backgroundColor: 'rgba(240,253,250,0.4)',
  },
  applyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  applyNote: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: '300',
  },
  applyInstructions: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  applyInstructionsText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 20,
  },
  emailCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  emailCopyText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  applyBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 13,
  },
  applyBtnOutlineText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shareModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageModalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
