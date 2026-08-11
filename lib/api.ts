import { Job } from '../types';

const TURSO_URL = 'https://dailysjobs-sachin22.aws-ap-south-1.turso.io';
const TURSO_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODM1Nzc5MjMsImlkIjoiMDE5ZjQ1ODQtZjIwMS03NWRhLWE4ZGUtZDYyYzRmZDRiNmIzIiwia2lkIjoiRHJOMEx1alVfNEx1RVBLTzZuYlBXTW1WSWRzUURuVmZEeGJ0WmdPc2xPVSIsInJpZCI6IjIzN2UxZWU3LTZkOTAtNDQyMS05ZDY3LTRhZDIyNGQ0NmM1MCJ9.IG1XheyHquyKJA2RWMXhkZe0n66g6F1ZIKbQt_V07auGtJLCzTHeeSNRefWzQRxpHrmAFLFrA2fW-G5CWndMBg';

interface TursoRequest {
  sql: string;
  args?: any[];
}

async function executeTurso(requests: TursoRequest[]): Promise<any[][]> {
  const response = await fetch(`${TURSO_URL}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: requests.map((r) => ({
        type: 'execute',
        stmt: {
          sql: r.sql,
          args: (r.args || []).map((arg) => {
            if (arg === null || arg === undefined)
              return { type: 'null', value: null };
            if (typeof arg === 'number')
              return { type: 'integer', value: String(arg) };
            return { type: 'text', value: String(arg) };
          }),
        },
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Turso API error: ${response.status}`);
  }

  const data = await response.json();
  const results: any[][] = [];

  for (const result of data.results) {
    if (result.type === 'error') {
      throw new Error(result.error?.message || 'Unknown Turso error');
    }
    const cols = result.response?.result?.cols?.map((c: any) => c.name) || [];
    const rows = (result.response?.result?.rows || []).map((row: any[]) => {
      const obj: any = {};
      cols.forEach((col: string, idx: number) => {
        const cell = row[idx];
        obj[col] = cell?.value ?? null;
      });
      return obj;
    });
    results.push(rows);
  }

  return results;
}

function mapRowToJob(row: any): Job {
  return {
    id: row.firebase_id || row.id,
    title: row.title,
    companyName: row.company_name,
    logoUrl: row.logo_url,
    location: row.location,
    category: row.category,
    type: row.type,
    tags: (() => {
      try {
        return typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags || [];
      } catch {
        return [];
      }
    })(),
    salary: row.salary,
    description: row.description,
    howToApply: row.how_to_apply,
    postedAt: row.posted_at,
    expiresAt: row.expires_at,
    featured: row.featured === '1' || row.featured === 1,
    approved: row.approved === '1' || row.approved === 1,
    urgent: row.urgent === '1' || row.urgent === 1,
    jobPostUrl: row.job_post_url,
    companyWebsite: row.company_website,
    jobPostImageUrl: row.job_post_image_url,
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
    let sql = `SELECT id, firebase_id, title, company_name, logo_url, location, category, type, tags, salary, description, how_to_apply, posted_at, expires_at, featured, urgent, approved, company_website, job_post_url, job_post_image_url FROM job_vacancies WHERE 1=1`;
    const args: any[] = [];

    if (params.approvedOnly) {
      sql += ` AND approved = 1`;
    }
    if (params.searchTerm) {
      sql += ` AND (title LIKE '%' || ? || '%' OR company_name LIKE '%' || ? || '%')`;
      args.push(params.searchTerm, params.searchTerm);
    }
    if (params.location) {
      sql += ` AND location = ?`;
      args.push(params.location);
    }
    if (params.category) {
      sql += ` AND category = ?`;
      args.push(params.category);
    }
    if (params.type) {
      sql += ` AND type = ?`;
      args.push(params.type);
    }

    sql += ` ORDER BY posted_at DESC`;

    if (params.limit !== undefined) {
      sql += ` LIMIT ?`;
      args.push(params.limit);
    }
    if (params.offset !== undefined) {
      sql += ` OFFSET ?`;
      args.push(params.offset);
    }

    const [rows] = await executeTurso([{ sql, args }]);
    return { data: rows.map(mapRowToJob), error: null };
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return { data: [], error: error.message };
  }
}

export async function getJobById(id: string): Promise<{ data: Job | null; error: string | null }> {
  try {
    const [rows] = await executeTurso([{
      sql: `SELECT id, firebase_id, title, company_name, logo_url, location, category, type, tags, salary, description, how_to_apply, posted_at, expires_at, featured, urgent, approved, job_post_url, company_website, job_post_image_url FROM job_vacancies WHERE id = ? OR firebase_id = ?`,
      args: [id, id],
    }]);
    if (rows.length === 0) return { data: null, error: 'Not found' };
    return { data: mapRowToJob(rows[0]), error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
