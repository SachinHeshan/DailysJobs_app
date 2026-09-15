import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../types';
import { formatRelativeTime } from '../lib/dateUtils';
import { useTheme } from '../lib/theme';
import CompanyLogo from './CompanyLogo';

interface JobCardProps {
  job: Job;
}

/**
 * Returns badge bg/text/border colors that exactly mirror the website's
 * `getTypeStyles()` in components/JobCard.tsx (Tailwind CSS values).
 */
function getTypeColors(type: Job['type'], isDark: boolean) {
  switch (type) {
    case 'Full-Time':
      return {
        bg:     isDark ? 'rgba(16,185,129,0.10)' : '#ecfdf5',   // emerald-500/10 | emerald-50
        text:   isDark ? '#34d399'                : '#047857',   // emerald-400    | emerald-700
        border: isDark ? 'rgba(16,185,129,0.20)' : '#d1fae5',   // emerald-500/20 | emerald-100
      };
    case 'Part-Time':
      return {
        bg:     isDark ? 'rgba(245,158,11,0.10)' : '#fffbeb',   // amber-500/10 | amber-50
        text:   isDark ? '#fbbf24'               : '#b45309',   // amber-400    | amber-700
        border: isDark ? 'rgba(245,158,11,0.20)' : '#fde68a',   // amber-500/20 | amber-100
      };
    case 'Internship':
      return {
        bg:     isDark ? 'rgba(139,92,246,0.10)' : '#faf5ff',   // purple-500/10 | purple-50
        text:   isDark ? '#a78bfa'               : '#6d28d9',   // purple-400    | purple-700
        border: isDark ? 'rgba(139,92,246,0.20)' : '#ede9fe',   // purple-500/20 | purple-100
      };
    case 'Remote':
      return {
        bg:     isDark ? 'rgba(59,130,246,0.10)' : '#eff6ff',   // blue-500/10 | blue-50
        text:   isDark ? '#60a5fa'               : '#1d4ed8',   // blue-400    | blue-700
        border: isDark ? 'rgba(59,130,246,0.20)' : '#dbeafe',   // blue-500/20 | blue-100
      };
    case 'Remote Internship':
      return {
        bg:     isDark ? 'rgba(244,63,94,0.10)'  : '#fff1f2',   // rose-500/10 | rose-50
        text:   isDark ? '#fb7185'               : '#be123c',   // rose-400    | rose-700
        border: isDark ? 'rgba(244,63,94,0.20)'  : '#ffe4e6',   // rose-500/20 | rose-100
      };
    default:
      return {
        bg:     isDark ? '#1e293b' : '#f8fafc',    // slate-800 | slate-50
        text:   isDark ? '#cbd5e1' : '#334155',    // slate-300 | slate-700
        border: isDark ? '#334155' : '#f1f5f9',    // slate-700 | slate-100
      };
  }
}

export default function JobCard({ job }: JobCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const typeC = getTypeColors(job.type, isDark);
  const displaySalary = job.salary
    ? job.salary.toLowerCase().startsWith('lkr') ? job.salary : `LKR ${job.salary}`
    : null;

  const handlePress = () => router.push(`/job/${job.id}`);

  // Card border — website: border-teal-200 | dark:border-slate-800
  //               urgent:  border-red-200  | dark:border-red-900/50
  const cardBorderColor = job.urgent
    ? (isDark ? 'rgba(127,29,29,0.5)' : '#fecaca')  // red-900/50 | red-200
    : (isDark ? '#1e293b'             : '#99f6e4');  // slate-800  | teal-200

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: cardBorderColor,
          shadowColor: isDark ? '#000' : '#0f172a',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.92}
    >
      {/* NEW ribbon — website: amber-500 pill, absolute top-right */}
      {job.featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>NEW</Text>
        </View>
      )}

      {/* Header: Logo + Company + Date */}
      <View style={styles.header}>
        <View style={styles.companyRow}>
          <CompanyLogo website={job.companyWebsite} name={job.companyName} size="md" />
          <View style={styles.companyInfo}>
            {/* website: font-semibold text-slate-700 dark:text-slate-200 */}
            <Text style={[styles.companyName, { color: colors.textSecondary }]} numberOfLines={1}>
              {job.companyName}
            </Text>
            {/* website: text-xs text-slate-400 */}
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {formatRelativeTime(job.postedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Urgent badge — website: red-50/red-100 border, red-600 text, pulse dot */}
        {job.urgent && (
          <View style={[
            styles.urgentBadge,
            {
              backgroundColor: isDark ? 'rgba(239,68,68,0.10)' : '#fef2f2',
              borderColor:     isDark ? 'rgba(239,68,68,0.20)' : '#fecaca',
            },
          ]}>
            <View style={styles.urgentDot} />
            <Text style={styles.urgentText}>Urgent</Text>
          </View>
        )}
      </View>

      {/* Title — website: text-lg font-bold text-slate-800 dark:text-slate-100 */}
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {job.title}
      </Text>

      {/* Type & Category badges */}
      <View style={styles.badges}>
        {/* Type badge — exact website colors per type */}
        <View style={[styles.typeBadge, { backgroundColor: typeC.bg, borderColor: typeC.border }]}>
          <Ionicons name="briefcase-outline" size={10} color={typeC.text} />
          <Text style={[styles.typeBadgeText, { color: typeC.text }]}>{job.type}</Text>
        </View>

        {/* Category badge — website: bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 */}
        <View style={[
          styles.categoryBadge,
          {
            backgroundColor: colors.categoryBadgeBg,
            borderColor:     colors.categoryBadgeBorder,
          },
        ]}>
          <Text style={[styles.categoryBadgeText, { color: colors.categoryBadgeText }]} numberOfLines={1}>
            {job.category}
          </Text>
        </View>
      </View>

      {/* Divider — website: border-t border-slate-100 dark:border-slate-800 */}
      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      {/* Location — website: text-sm text-slate-500 dark:text-slate-400, teal-600 pin */}
      <View style={styles.metaRow}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={isDark ? '#14b8a6' : '#0d9488'} />
          <Text style={[styles.locationText, { color: colors.textMuted }]}>
            {job.location}, Sri Lanka
          </Text>
        </View>

        {/* Salary — website: text-teal-700 dark:text-teal-400, font-semibold */}
        {displaySalary && (
          <View style={styles.salaryBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.salaryLabel, { color: colors.textSecondary }]}>Salary</Text>
              <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
            </View>
            <Text style={[styles.salaryText, { color: isDark ? '#2dd4bf' : '#0f766e' }]}>
              {displaySalary}
            </Text>
          </View>
        )}
      </View>

      {/* Tags & Action — website: border-t border-slate-100 dark:border-slate-800 */}
      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        {/* Tags — website: bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 */}
        <View style={styles.tagsRow}>
          {job.tags.slice(0, 2).map((tag, i) => (
            <View key={i} style={[
              styles.tag,
              {
                backgroundColor: colors.chipBg,
                borderColor:     colors.chipBorder,
              },
            ]}>
              <Ionicons name="pricetag-outline" size={8} color={colors.textMuted} />
              <Text style={[styles.tagText, { color: colors.textMuted }]}>{tag}</Text>
            </View>
          ))}
          {job.tags.length > 2 && (
            <Text style={[styles.moreTagsText, { color: colors.textMuted }]}>
              +{job.tags.length - 2} more
            </Text>
          )}
        </View>

        {/* "View Job" button — website: bg-slate-100 dark:bg-slate-800, text-slate-700 dark:text-slate-200
            hover: bg-teal-600 text-white (mirrored as press state via activeOpacity) */}
        <TouchableOpacity
          style={[
            styles.viewButton,
            {
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',  // slate-800 | slate-100
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Text style={[styles.viewButtonText, { color: isDark ? '#e2e8f0' : '#334155' }]}>
            View Job
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Card — website: rounded-2xl border-2 shadow-sm transition-all hover:shadow-xl
  card: {
    borderRadius: 16,        // rounded-2xl
    padding: 16,             // p-6 ≈ 24px; using 16px for mobile density
    marginBottom: 12,
    borderWidth: 2,          // border-2 (website)
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    position: 'relative',
  },

  // Featured badge — website: amber-500 rounded-full px-3 py-1 text-[10px] font-bold
  featuredBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: '#f59e0b',   // amber-500
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  companyInfo: { flex: 1 },

  // Company name — website: font-semibold text-sm
  companyName: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Date row — website: text-xs text-slate-400
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  dateText: { fontSize: 11 },

  // Urgent badge — website: rounded-lg border flex items-center gap-1.5
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,        // rounded-lg
  },
  urgentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',   // red-500 — website: animate-pulse (static on native)
  },
  urgentText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#dc2626',              // red-600
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Title — website: text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-2
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 10,
  },

  // Badges row — website: mt-3 flex flex-wrap gap-2
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },

  // Type badge — website: inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-semibold
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,         // rounded-lg
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',       // font-semibold (website)
  },

  // Category badge — website: rounded-lg border px-2.5 py-0.5 text-xs font-medium
  categoryBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,         // rounded-lg
    maxWidth: 200,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Divider — website: border-t (translated to a 1px line View)
  divider: {
    height: 1,
    marginBottom: 12,
  },

  // Location & salary meta block — website: mt-4 flex flex-col gap-2 border-t pt-4
  metaRow: {
    marginBottom: 12,
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // website: text-sm text-slate-500 dark:text-slate-400
  locationText: { fontSize: 13 },

  // Salary block — website: flex-col gap-0.5
  salaryBlock: { gap: 2 },
  // website: text-sm font-medium text-slate-600 dark:text-slate-300
  salaryLabel: { fontSize: 12, fontWeight: '500' },
  // website: text-sm font-semibold text-teal-700 dark:text-teal-400
  salaryText: { fontSize: 13, fontWeight: '600' },

  // Footer — website: mt-6 flex items-center justify-between border-t border-slate-100 pt-4
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },

  // Tag chip — website: rounded bg-slate-50 dark:bg-slate-800 border px-1.5 py-0.5 text-[10px]
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,         // rounded (website uses simple rounded)
  },
  tagText: { fontSize: 10, fontWeight: '500' },
  moreTagsText: { fontSize: 10, fontWeight: '500' },

  // "View Job" button — website: rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-sm font-bold
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,        // rounded-xl
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '700',       // font-bold (website)
  },
});
