import { Job } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function mapRowToJob(row: any): Job {
  return {
    id: row.firebase_id || row.id,
    title: row.title,
    companyName: row.company_name ?? row.companyName,
    logoUrl: row.logo_url ?? row.logoUrl,
    location: row.location,
    category: row.category,
    type: row.type,
    tags: (() => {
      try {
        const t = row.tags ?? row.tags;
        return typeof t === 'string' ? JSON.parse(t || '[]') : t || [];
      } catch {
        return [];
      }
    })(),
    salary: row.salary,
    description: row.description,
    howToApply: row.how_to_apply ?? row.howToApply,
    postedAt: row.posted_at ?? row.postedAt,
    expiresAt: row.expires_at ?? row.expiresAt,
    featured: row.featured === '1' || row.featured === 1 || row.featured === true,
    approved: row.approved === '1' || row.approved === 1 || row.approved === true,
    urgent: row.urgent === '1' || row.urgent === 1 || row.urgent === true,
    jobPostUrl: row.job_post_url ?? row.jobPostUrl,
    companyWebsite: row.company_website ?? row.companyWebsite,
    jobPostImageUrl: row.job_post_image_url ?? row.jobPostImageUrl,
  };
}

export interface GetJobsParams {
  searchTerm?: string;
  location?: string;
  category?: string;
  type?: string;
  approvedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export async function getJobs(params: GetJobsParams): Promise<{ data: Job[]; error: string | null }> {
  try {
    const urlParams = new URLSearchParams();
    if (params.approvedOnly !== undefined) urlParams.append('approvedOnly', String(params.approvedOnly));
    if (params.searchTerm) urlParams.append('search', params.searchTerm);
    if (params.location) urlParams.append('location', params.location);
    if (params.category) urlParams.append('category', params.category);
    if (params.type) urlParams.append('type', params.type);
    if (params.limit !== undefined) urlParams.append('limit', String(params.limit));
    if (params.offset !== undefined) urlParams.append('offset', String(params.offset));

    const response = await fetch(`${API_URL}/api/jobs?${urlParams.toString()}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const json = await response.json();
    if (json.error) throw new Error(json.error);

    return { data: (json.data as any[]).map(mapRowToJob), error: null };
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return { data: [], error: error.message };
  }
}

export async function getJobById(id: string): Promise<{ data: Job | null; error: string | null }> {
  try {
    const response = await fetch(`${API_URL}/api/jobs/${id}`);
    if (!response.ok) {
      if (response.status === 404) return { data: null, error: 'Not found' };
      throw new Error(`API error: ${response.status}`);
    }

    const json = await response.json();
    if (json.error) throw new Error(json.error);

    return { data: mapRowToJob(json.data), error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getSiteBannerByPosition(position: string): Promise<{ data: any | null; error: string | null }> {
  try {
    const response = await fetch(`${API_URL}/api/banners/${position}`);
    if (!response.ok) {
      if (response.status === 404) return { data: null, error: 'Not found' };
      throw new Error(`API error: ${response.status}`);
    }

    const json = await response.json();
    if (json.error) throw new Error(json.error);

    return { data: json.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
