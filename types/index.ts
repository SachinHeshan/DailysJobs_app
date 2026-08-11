export interface Job {
  id: string;
  title: string;
  companyName: string;
  logoUrl?: string;
  location: string;
  category: string;
  type: 'Full-Time' | 'Part-Time' | 'Internship' | 'Remote';
  tags: string[];
  salary?: string;
  description: string;
  howToApply: string;
  postedAt: any;
  expiresAt?: any;
  featured: boolean;
  approved: boolean;
  urgent?: boolean;
  jobPostUrl?: string;
  companyWebsite?: string;
  jobPostImageUrl?: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  linkUrl?: string;
  createdAt: any;
}
