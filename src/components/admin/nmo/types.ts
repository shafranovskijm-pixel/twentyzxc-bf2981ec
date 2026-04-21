export interface NmoRegistrationFull {
  id: string;
  client_id: string | null;
  organization_name: string;
  organization_abbr: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  legal_address: string | null;
  actual_address: string | null;
  organization_phone: string | null;
  organization_email: string | null;
  organization_website: string | null;
  region: string | null;
  has_dpo_appendix: boolean | null;
  application_number: string | null;
  application_date: string | null;
  mail_track_number: string | null;
  mail_sent_date: string | null;
  license_number: string | null;
  license_date: string | null;
  responsible_name: string | null;
  responsible_email: string | null;
  responsible_mobile: string | null;
  responsible_work_phone: string | null;
  responsible_phone: string | null;
  responsible_snils: string | null;
  responsible_position: string | null;
  responsible_birth_date: string | null;
  responsible_gender: string | null;
  responsible_main_workplace: string | null;
  responsible_region: string | null;
  responsible_login: string | null;
  responsible_password: string | null;
  status: string;
  checklist: Record<string, boolean>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NmoDocument {
  id: string;
  registration_id: string;
  doc_type: "application" | "obligation" | "license_scan" | "other";
  file_path: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}