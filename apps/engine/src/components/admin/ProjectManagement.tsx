import { ProjectsTab } from "./ProjectsTab";

interface ProjectManagementProps {
  businessId: string;
  primaryLanguage?: "en" | "pl";
}

export function ProjectManagement({ businessId, primaryLanguage = "en" }: ProjectManagementProps) {
  return (
    <ProjectsTab businessId={businessId} primaryLanguage={primaryLanguage} />
  );
}
