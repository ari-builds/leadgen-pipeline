export interface LeadExportData {
  id: number;
  company_name: string | null;
  website_url: string | null;
  industry: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_linkedin: string | null;
  contact_title: string | null;
  tech_stack: string | null;
  company_size: string | null;
  revenue_range: string | null;
  location: string | null;
  what_they_sell: string | null;
  pain_points: string | null;
  competitors: string | null;
  recent_news: string | null;
  score: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export const LEAD_COLUMNS: { key: keyof LeadExportData; label: string; width: number }[] = [
  { key: "company_name", label: "Company", width: 25 },
  { key: "website_url", label: "Website", width: 30 },
  { key: "industry", label: "Industry", width: 20 },
  { key: "location", label: "Location", width: 20 },
  { key: "company_size", label: "Company Size", width: 15 },
  { key: "revenue_range", label: "Revenue", width: 15 },
  { key: "contact_name", label: "Contact", width: 25 },
  { key: "contact_title", label: "Title", width: 20 },
  { key: "contact_email", label: "Email", width: 25 },
  { key: "contact_phone", label: "Phone", width: 15 },
  { key: "contact_linkedin", label: "LinkedIn", width: 30 },
  { key: "tech_stack", label: "Tech Stack", width: 25 },
  { key: "what_they_sell", label: "Products/Services", width: 25 },
  { key: "pain_points", label: "Pain Points", width: 25 },
  { key: "competitors", label: "Competitors", width: 25 },
  { key: "recent_news", label: "Recent News", width: 25 },
  { key: "score", label: "Score", width: 8 },
  { key: "status", label: "Status", width: 12 },
  { key: "notes", label: "Notes", width: 30 },
  { key: "created_at", label: "Created", width: 15 },
];
