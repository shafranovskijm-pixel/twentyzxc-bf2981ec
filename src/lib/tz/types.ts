export interface TzItem {
  id: string;
  label: string;
  checked: boolean;
  note?: string;
}

export interface TzSection {
  id: string;
  title: string;
  items: TzItem[];
  enabled?: boolean; // for optional sections (e.g. CRM, ads). Default true.
  customNote?: string;
}

export interface TzPayload {
  // Header / context
  client_name: string;
  client_inn?: string;
  legal_address?: string;
  director_name?: string;
  contract_number?: string;
  contract_date?: string; // ISO
  contract_amount?: number;

  // Project parameters
  project_scope?: string; // e.g. "Импорт авто из Японии и Китая"
  deadline_days?: number;
  domain?: string;
  references?: string;

  sections: TzSection[];
}