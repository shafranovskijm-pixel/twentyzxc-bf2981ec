import type { CompanyRequisites } from "../document-templates";

/** Derive the sole proprietor's own signature only from the configured legal name. */
export function normalizeCompanyRequisites(source: CompanyRequisites): CompanyRequisites {
  const company = { ...source };
  const proprietorName = company.company_name.trim()
    .match(/^(?:ИП|Индивидуальный\s+предприниматель)\s+(.+)$/iu)?.[1]?.trim();
  if (!proprietorName) return company;

  if (!company.company_director_name.trim()) company.company_director_name = proprietorName;
  // A separately configured representative must retain their own explicit capacity.
  if (!company.company_director_post.trim() && company.company_director_name.trim() === proprietorName) {
    company.company_director_post = "ИП";
  }
  return company;
}
