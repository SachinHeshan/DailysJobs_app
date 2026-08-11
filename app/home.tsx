import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  RefreshControl,
  Linking,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Job } from '../types';
import { getJobs } from '../lib/api';
import { LOCATIONS, CATEGORIES, JOB_TYPES } from '../lib/constants';
import { useTheme } from '../lib/theme';
import BannerSlider from '../components/BannerSlider';
import JobCard from '../components/JobCard';

const { width } = Dimensions.get('window');

type FilterModal = 'location' | 'category' | null;

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalOpen, setModalOpen] = useState<FilterModal>(null);

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    progressAnim.setValue(0);
    progressLoop.current = Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    progressLoop.current.start();

    try {
      const noFilters = !debouncedSearch && !selectedLocation && !selectedCategory && !selectedType;
      const { data } = await getJobs({
        searchTerm: debouncedSearch,
        location: selectedLocation,
        category: selectedCategory,
        type: selectedType,
        approvedOnly: true,
        limit: noFilters ? 20 : undefined,
      });
      setJobs(data);
      setVisibleCount(6);
    } finally {
      progressLoop.current?.stop();
      setLoading(false);
    }
  }, [debouncedSearch, selectedLocation, selectedCategory, selectedType]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const noFilters = !debouncedSearch && !selectedLocation && !selectedCategory && !selectedType;
      const { data } = await getJobs({
        searchTerm: debouncedSearch,
        location: selectedLocation,
        category: selectedCategory,
        type: selectedType,
        approvedOnly: true,
        limit: noFilters ? 20 : undefined,
      });
      setJobs(data);
      setVisibleCount(6);
    } finally {
      setRefreshing(false);
    }
  }, [debouncedSearch, selectedLocation, selectedCategory, selectedType]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedLocation('');
    setSelectedCategory('');
  };

  const hasFilters = searchTerm || selectedType || selectedLocation || selectedCategory;
  const featuredJobs = jobs.filter((j) => j.featured).slice(0, 6);
  const regularJobsAll = jobs.filter((j) => !j.featured);
  const regularJobs = regularJobsAll.slice(0, visibleCount);

  // Section header — website: h2 text-xl font-bold text-slate-800 + p text-xs text-slate-500
  const renderSectionHeader = (title: string, subtitle: string, count?: number) => (
    <View style={styles.sectionHeader}>
      <View>
        {/* website: text-xl font-bold text-slate-800 dark:text-slate-100 */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        {/* website: text-xs text-slate-500 font-light mt-0.5 */}
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      {count !== undefined && (
        /* website: text-xs font-semibold text-slate-500 */
        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
          {count} {count === 1 ? 'job' : 'jobs'} found
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Loading progress bar — website: fixed top-16 h-[3px] bg-teal-100/50 dark:bg-teal-900/30 */}
      {loading && (
        <View style={[
          styles.progressBar,
          { backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : 'rgba(204,251,241,0.5)' },
        ]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                transform: [{
                  translateX: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width / 2, width],
                  }),
                }],
              },
            ]}
          />
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0d9488"
            colors={['#0d9488']}
            progressBackgroundColor={isDark ? '#0f172a' : '#f0fdfa'}
            progressViewOffset={80}
          />
        }
      >
        {/* ─── Sticky Navbar ─── */}
        {/* website: sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80
                    bg-white/80 dark:bg-slate-950/80 backdrop-blur-md */}
        <View style={[
          styles.navbar,
          {
            backgroundColor: colors.navBar,
            borderBottomColor: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(226,232,240,0.8)',
          },
        ]}>
          <View style={styles.navbarInner}>
            {/* Logo — website: flex items-center gap-2.5 */}
            <View style={styles.logoRow}>
              {/* website: h-10 w-10 rounded-xl bg-teal-600 shadow-md shadow-teal-500/25 */}
              <View style={styles.logoIcon}>
                <Ionicons name="briefcase" size={20} color="#fff" />
              </View>
              {/* website: text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 */}
              <Text style={[styles.logoText, { color: colors.textPrimary }]}>
                Dailys<Text style={styles.logoAccent}>Jobs</Text>
              </Text>
            </View>

            {/* Dark mode toggle — website: rounded-xl border border-slate-200 dark:border-slate-800 */}
            <TouchableOpacity
              style={[
                styles.themeBtn,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f1f5f9',  // slate-900 | slate-100
                  borderColor:     isDark ? '#1e293b' : '#e2e8f0',  // slate-800 | slate-200
                },
              ]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={19}
                color={isDark ? '#fbbf24' : '#64748b'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Banner Slider ─── */}
        <BannerSlider />

        {/* ─── Search & Filter Panel ─── */}
        {/* website: rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-100 dark:border-slate-800 */}
        <View style={[
          styles.filterPanel,
          {
            backgroundColor: colors.filterPanel,
            borderColor:     isDark ? '#1e293b' : '#f1f5f9',   // slate-800 | slate-100
            shadowColor:     isDark ? '#000'    : '#0f172a',
          },
        ]}>
          {/* Search Input — website: rounded-2xl border border-slate-200 dark:border-slate-800
                           bg-slate-50/50 dark:bg-slate-950, focus ring teal-500 */}
          <View style={[
            styles.searchRow,
            {
              backgroundColor: colors.inputBg,
              borderColor:     isDark ? '#1e293b' : '#e2e8f0',
            },
          ]}>
            {/* website: absolute left-4 top-1/2 text-teal-600 */}
            <Ionicons name="search" size={18} color="#0d9488" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search jobs by title, company, or keywords..."
              placeholderTextColor={colors.textMuted}
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Job Type chips — website: text-xs font-bold uppercase tracking-wider text-slate-400 */}
          <View style={styles.typeSection}>
            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>JOB TYPE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {/* "All Types" chip */}
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedType === '' ? '#0d9488' : (isDark ? '#0f172a' : '#ffffff'),
                    borderColor:     selectedType === '' ? '#0d9488' : (isDark ? '#1e293b' : '#e2e8f0'),
                  },
                  selectedType === '' && styles.chipActiveShadow,
                ]}
                onPress={() => setSelectedType('')}
              >
                <Text style={[
                  styles.chipText,
                  { color: selectedType === '' ? '#fff' : (isDark ? '#cbd5e1' : '#475569') },
                ]}>All Types</Text>
              </TouchableOpacity>

              {JOB_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedType === type ? '#0d9488' : (isDark ? '#0f172a' : '#ffffff'),
                      borderColor:     selectedType === type ? '#0d9488' : (isDark ? '#1e293b' : '#e2e8f0'),
                    },
                    selectedType === type && styles.chipActiveShadow,
                  ]}
                  onPress={() => setSelectedType(selectedType === type ? '' : type)}
                >
                  <Text style={[
                    styles.chipText,
                    { color: selectedType === type ? '#fff' : (isDark ? '#cbd5e1' : '#475569') },
                  ]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Location & Category dropdowns */}
          <View style={[styles.dropdownsRow, { borderTopColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            {/* Location */}
            <TouchableOpacity
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.inputBg,
                  borderColor:     selectedLocation
                    ? '#0d9488'
                    : (isDark ? '#1e293b' : '#e2e8f0'),
                },
              ]}
              onPress={() => setModalOpen('location')}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={selectedLocation ? '#0d9488' : colors.textMuted}
              />
              <Text
                style={[
                  styles.dropdownText,
                  { color: selectedLocation ? '#0d9488' : colors.textMuted },
                  selectedLocation ? { fontWeight: '600' } : null,
                ]}
                numberOfLines={1}
              >
                {selectedLocation || 'Location'}
              </Text>
              <Ionicons name="chevron-down" size={13} color={selectedLocation ? '#0d9488' : colors.textMuted} />
            </TouchableOpacity>

            {/* Category */}
            <TouchableOpacity
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.inputBg,
                  borderColor:     selectedCategory
                    ? '#0d9488'
                    : (isDark ? '#1e293b' : '#e2e8f0'),
                },
              ]}
              onPress={() => setModalOpen('category')}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={selectedCategory ? '#0d9488' : colors.textMuted}
              />
              <Text
                style={[
                  styles.dropdownText,
                  { color: selectedCategory ? '#0d9488' : colors.textMuted },
                  selectedCategory ? { fontWeight: '600' } : null,
                ]}
                numberOfLines={1}
              >
                {selectedCategory ? selectedCategory.split('/')[0].trim() : 'Category'}
              </Text>
              <Ionicons name="chevron-down" size={13} color={selectedCategory ? '#0d9488' : colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Active filters summary — website: border-t pt-4 flex items-center justify-between */}
          {hasFilters && (
            <View style={[styles.activeFilters, { borderTopColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Text style={[styles.activeFiltersText, { color: colors.textMuted }]}>
                Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
              </Text>
              {/* website: text-xs font-bold text-teal-600 */}
              <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                <Ionicons name="refresh" size={12} color="#0d9488" />
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── Ad Banner ─── */}
        {/* website: teal gradient, rounded-2xl, shadow */}
        <TouchableOpacity
          style={styles.adBanner}
          onPress={() => Linking.openURL('https://wa.me/94711010575')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#0f766e', '#0d9488', '#0891b2']}   // teal-700 → teal-600 → sky-600
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.adBannerGradient}
          >
            <View style={styles.adBannerContent}>
              <View style={styles.adIconBg}>
                <Ionicons name="megaphone-outline" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adBannerTitle}>Advertise With Us</Text>
                <Text style={styles.adBannerSubtitle}>Reach 50,000+ job seekers · +94 71 101 0575</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={26} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ─── Job Listings ─── */}
        <View style={styles.jobsSection}>
          {loading ? (
            // Skeleton — website: h-48 rounded-2xl bg-white border border-slate-200 animate-pulse
            <View>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[
                  styles.skeleton,
                  {
                    backgroundColor: colors.card,
                    borderColor:     isDark ? '#1e293b' : '#e2e8f0',
                  },
                ]}>
                  <View style={styles.skeletonRow}>
                    {/* avatar pulse */}
                    <View style={[styles.skeletonAvatar, { backgroundColor: colors.skeleton }]} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={[styles.skeletonLine, { width: '60%', backgroundColor: colors.skeleton }]} />
                      <View style={[styles.skeletonLine, { width: '35%', backgroundColor: colors.skeleton }]} />
                    </View>
                  </View>
                  <View style={[styles.skeletonLine, { width: '80%', marginTop: 10, backgroundColor: colors.skeleton }]} />
                  <View style={[styles.skeletonLine, { width: '50%', marginTop: 6,  backgroundColor: colors.skeleton }]} />
                </View>
              ))}
            </View>
          ) : jobs.length === 0 ? (
            // Empty state — website: rounded-3xl border border-dashed border-slate-300 dark:border-slate-700
            <View style={[
              styles.emptyState,
              {
                backgroundColor: colors.card,
                borderColor:     isDark ? '#334155' : '#cbd5e1',  // slate-700 | slate-300
              },
            ]}>
              {/* website: rounded-2xl bg-teal-50 dark:bg-teal-500/10 */}
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="briefcase-outline" size={28} color="#0d9488" />
              </View>
              {/* website: text-lg font-bold text-slate-800 dark:text-slate-100 */}
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No jobs matched</Text>
              {/* website: text-sm text-slate-500 dark:text-slate-400 font-light */}
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Try adjusting your filters or search terms.
              </Text>
              {/* website: bg-teal-600 rounded-xl px-5 py-2.5 text-sm font-semibold text-white */}
              <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
                <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Featured Jobs */}
              {featuredJobs.length > 0 && (
                <View>
                  {renderSectionHeader('New Opportunities', 'Top-tier positions recommended by our team')}
                  {featuredJobs.map((job) => <JobCard key={job.id} job={job} />)}
                </View>
              )}

              {/* Regular Jobs */}
              <View style={{ marginTop: featuredJobs.length > 0 ? 20 : 0 }}>
                {renderSectionHeader(
                  featuredJobs.length > 0 ? 'All Job Openings' : 'Recent Openings',
                  'Discover the newest vacancies listed in Sri Lanka',
                  jobs.length,
                )}
                {(featuredJobs.length > 0 ? regularJobs : jobs.slice(0, visibleCount)).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </View>

              {/* "View All Jobs" — shows 5 more per tap; website: bg-teal-600 rounded-xl shadow-teal-600/20 */}
              {(() => {
                const totalList   = featuredJobs.length > 0 ? regularJobsAll : jobs;
                const shownCount  = featuredJobs.length > 0 ? regularJobs.length : Math.min(visibleCount, jobs.length);
                const hasMore     = shownCount < totalList.length;
                return hasMore ? (
                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => setVisibleCount((c) => c + 5)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.viewAllBtnText}>View All Jobs</Text>
                    <Ionicons name="chevron-down" size={16} color="#fff" />
                  </TouchableOpacity>
                ) : null;
              })()}
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Location / Category Modal ─── */}
      <Modal
        visible={modalOpen !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(null)}
      >
        {/* website: dark:bg-slate-950 */}
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.modalBg }]}>
          {/* website: bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 */}
          <View style={[
            styles.modalHeader,
            {
              backgroundColor: colors.card,
              borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
            },
          ]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {modalOpen === 'location' ? 'Select Location' : 'Select Category'}
            </Text>
            <TouchableOpacity onPress={() => setModalOpen(null)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalList}>
            {/* "All" option — website: text-teal-600 font-bold */}
            <TouchableOpacity
              style={[
                styles.modalItem,
                {
                  backgroundColor: colors.modalItemBg,
                  borderColor:     isDark ? '#1e293b' : '#f1f5f9',
                },
              ]}
              onPress={() => {
                if (modalOpen === 'location') setSelectedLocation('');
                else setSelectedCategory('');
                setModalOpen(null);
              }}
            >
              <Text style={styles.modalItemAll}>
                All {modalOpen === 'location' ? 'Locations' : 'Categories'}
              </Text>
            </TouchableOpacity>

            {(modalOpen === 'location' ? LOCATIONS : CATEGORIES).map((item) => {
              const isSelected =
                modalOpen === 'location' ? selectedLocation === item : selectedCategory === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.modalItem,
                    {
                      backgroundColor: isSelected ? colors.modalItemSelectedBg : colors.modalItemBg,
                      borderColor:     isSelected ? 'rgba(13,148,136,0.3)' : (isDark ? '#1e293b' : '#f1f5f9'),
                    },
                  ]}
                  onPress={() => {
                    if (modalOpen === 'location') setSelectedLocation(item);
                    else setSelectedCategory(item);
                    setModalOpen(null);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    { color: isSelected ? '#0d9488' : colors.textSecondary },
                    isSelected && { fontWeight: '700' },
                  ]}>
                    {item}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#0d9488" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Progress bar — website: fixed top-16 h-[3px] overflow-hidden
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 100,
    overflow: 'hidden',
  },
  // website: bg-teal-600 animate-custom-progress w-1/2 rounded-full
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#0d9488',   // teal-600
    borderRadius: 99,
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // ── Navbar ──
  // website: sticky z-50 border-b backdrop-blur-md h-16
  navbar: {
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 50,
  },
  navbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // website: h-10 w-10 rounded-xl bg-teal-600 shadow-md shadow-teal-500/25
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,            // rounded-xl ≈ 12px
    backgroundColor: '#0d9488',  // teal-600
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  // website: text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100
  logoText: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // website: text-teal-600 dark:text-teal-500
  logoAccent: { color: '#0d9488' },

  // Theme toggle — website: rounded-xl border border-slate-200 dark:border-slate-800 h-10 w-10
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Filter Panel ──
  // website: rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border
  filterPanel: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,            // rounded-3xl
    padding: 20,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
  },

  // Search input — website: rounded-2xl border py-4 pl-12 pr-4
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,            // rounded-2xl
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchIcon: { marginRight: 2 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },

  // Job type chips
  typeSection: { marginTop: 20 },
  // website: text-xs font-bold uppercase tracking-wider text-slate-400
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  chipsRow: { gap: 8, paddingRight: 4 },

  // Chip — website: rounded-xl px-4 py-2 text-sm font-semibold border transition-all
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,           // rounded-xl
    borderWidth: 1,
  },
  // Active chip shadow — website: shadow-md shadow-teal-600/15
  chipActiveShadow: {
    shadowColor: '#0d9488',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  // Dropdowns row — website: mt-6 border-t pt-6 grid grid-cols-2 gap-6
  dropdownsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  // Dropdown button — website: rounded-2xl border py-3.5 px-4
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,           // rounded-2xl
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dropdownText: { flex: 1, fontSize: 12, fontWeight: '500' },

  // Active filters row — website: mt-6 border-t pt-4
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  // website: text-sm text-slate-500
  activeFiltersText: { fontSize: 12 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // website: text-xs font-bold text-teal-600
  clearBtnText: { fontSize: 12, fontWeight: '700', color: '#0d9488' },

  // ── Ad Banner ──
  adBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,           // rounded-2xl
    overflow: 'hidden',
    shadowColor: '#0d9488',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  adBannerGradient:  { paddingHorizontal: 16, paddingVertical: 14 },
  adBannerContent:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adBannerTitle:    { fontSize: 15, fontWeight: '800', color: '#fff' },
  adBannerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // ── Jobs section ──
  jobsSection: { marginHorizontal: 16, marginTop: 24 },

  // Section header — website: flex items-center justify-between mb-6
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  // website: text-xl font-bold text-slate-800 dark:text-slate-100
  sectionTitle:    { fontSize: 18, fontWeight: '800' },
  // website: text-xs text-slate-500 font-light mt-0.5
  sectionSubtitle: { fontSize: 11, marginTop: 2, fontWeight: '300' },
  // website: text-xs font-semibold text-slate-500
  sectionCount:    { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Skeleton — website: rounded-2xl bg-white border border-slate-200 animate-pulse
  skeleton: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  skeletonRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 10 },
  skeletonLine:  { height: 12, borderRadius: 6 },

  // Empty state — website: rounded-3xl border border-dashed border-slate-300 dark:border-slate-700
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 24,           // rounded-3xl
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  // website: rounded-2xl bg-teal-50 dark:bg-teal-500/10 mb-4
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  // website: text-lg font-bold text-slate-800 dark:text-slate-100
  emptyTitle:    { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  // website: text-sm text-slate-500 dark:text-slate-400 font-light
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  // website: rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white
  clearFiltersBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,           // rounded-xl
  },
  clearFiltersBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // "View All Jobs" button — website: bg-teal-600 rounded-xl px-6 py-3 shadow-md shadow-teal-600/20
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',  // teal-600
    paddingVertical: 14,
    borderRadius: 12,             // rounded-xl
    marginTop: 20,
    marginBottom: 8,
    shadowColor: '#0d9488',
    shadowOpacity: 0.20,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  viewAllBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── Modal ──
  modal:       { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  // website: text-lg font-bold text-slate-800 dark:text-slate-100
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalList:  { padding: 16, gap: 4 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,           // rounded-xl
    marginBottom: 4,
    borderWidth: 1,
  },
  // website: text-teal-600 font-bold
  modalItemAll:  { fontSize: 14, fontWeight: '700', color: '#0d9488' },
  modalItemText: { fontSize: 13, flex: 1, paddingRight: 8 },
});
