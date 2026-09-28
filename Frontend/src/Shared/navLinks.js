import {
  Briefcase,
  Building2,
  FileSearchCorner,
  FileUser,
  LayersPlus,
  NotebookPen,
  Rss,
  Sparkles,
  SquareKanban,
  Users,
} from "lucide-react";

export const candidateNavLinks = [
  { to: "/all/job", label: "Job Feed", icon: Rss },
  { to: "/candidate/dashboard", label: "Application Tracker", icon: SquareKanban },
  { to: "/resume-builder", label: "Resume Builder", icon: Sparkles },
  { to: "/resume-analyzer", label: "Resume Analyzer", icon: FileSearchCorner },
  { to: "/interview/allReports", label: "Interview Reports", icon: NotebookPen },
  { to: "/resume/allResume", label: "Resumes", icon: FileUser }, //move that to user profile
];

export const recruiterNavLinks = [
  { to: "/recruiter/pipeline", label: "Recruit Pipeline", icon: Users },
  { to: "/recruiter/jobFeed", label: "Job Feed", icon: Rss },
  { to: "/recruiter/jobStudio", label: "Job Studio", icon: Briefcase },
  { to: "/recruiter/companyProfile", label: "Company Profile", icon: Building2 },
];

export const pendingRecruiterNavLinks = [
  { to: "/all/job", label: "Job Feed", icon: Rss },
  { to: "/onboarding/company", label: "Join Company", icon: LayersPlus },
];

// Which links a user should see, based on their role. Shared by the Navbar and Footer.
export const getNavLinks = (user) => {
  if (!user) return [];
  const authIntent = sessionStorage.getItem("authIntent");
  if (user.role === "pending_recruiter") return pendingRecruiterNavLinks;
  if (user.role === "candidate" && authIntent === "recruiter") return [];
  if (user.role === "company_admin" || user.role === "recruiter") return recruiterNavLinks;
  if (user.role === "candidate") return candidateNavLinks;
  return [];
};
