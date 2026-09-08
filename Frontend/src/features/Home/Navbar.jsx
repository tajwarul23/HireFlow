import { lazy, Suspense, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/Hooks/useAuth";
import { Briefcase, Building2, Cpu, FileSearchCorner, FileUser, LayersPlus, NotebookPen, Rss, Sparkles, SquareKanban, User, Users } from "lucide-react";

const NotificationBell = lazy(() => import("../Notifications/Components/NotificationBell"));


const candidateNavLinks = [
  { to: "/all/job", label: "Job Feed", icon:Rss },
  { to: "/candidate/dashboard", label: "Application Tracker", icon:SquareKanban  },
  { to: "/resume-builder", label: "Resume Builder", icon:Sparkles },
  { to: "/resume-analyzer", label: "Resume Analyzer", icon:FileSearchCorner  },
  { to: "/interview/allReports", label: "Interview Reports", icon:NotebookPen },
  { to: "/resume/allResume", label: "Resumes", icon:FileUser }, //move that to user profile
];

const recruiterNavLinks = [
  { to: "/recruiter/pipeline", label: "Recruit Pipeline", icon:Users },
  { to: "/recruiter/jobFeed", label: "Job Feed", icon:Rss },
  { to: "/recruiter/jobStudio", label: "Job Studio", icon:Briefcase },
  { to: "/recruiter/companyProfile", label: "Company Profile", icon:Building2 },
];

const pendingRecruiterNavLinks = [
  { to: "/all/job", label: "Job Feed", icon:Rss },
  { to: "/onboarding/company", label: "Join Company", icon:LayersPlus },
];

const Navbar = () => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const authIntent = sessionStorage.getItem("authIntent");

  let navLinks;
  if (!user) navLinks = [];
  else if (user?.role === "pending_recruiter") navLinks = pendingRecruiterNavLinks;
  else if (user?.role === "candidate" && authIntent === "recruiter") navLinks = [];
  else if (user?.role === "company_admin" || user.role === "recruiter")
    navLinks = recruiterNavLinks;
  else if (user?.role === "candidate") navLinks = candidateNavLinks;

  const linkClass = ({ isActive }) =>
    `cursor-pointer text-sm transition-colors duration-200 font-sans flex items-center justify-center gap-2 pb-1 ${
      isActive ? "text-violet border-b-2 border-violet" : "text-muted hover:text-ink"
    }`;

  return (
    <div className="font-sans">
      <nav className="relative z-10 flex h-16 items-center justify-between border-b border-line px-6 lg:px-8">
        {/* Brand Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet/10 border border-violet-border flex items-center justify-center text-violet-text group-hover:bg-violet/20 group-hover:border-violet transition-colors">
            <Cpu className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <span className="font-display font-bold text-ink text-2xl tracking-relax">
              HireFlow
            </span>
          </div>
        </div>

        {/* ── Desktop nav links — hidden on mobile/tablet ── */}
        <div className="hidden lg:flex flex-1 justify-center gap-8 ">
          {navLinks.map((link) => {
            const Icon = link?.icon;
            return(
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {Icon && <Icon size={18}/>}
              <span>{link.label}</span>
            </NavLink>
          )
          })}
        </div>

        {/* ── Desktop right buttons — hidden on mobile/tablet ── */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {user ? (
            <>
              <Suspense fallback={null}>
                <NotificationBell />
              </Suspense>
              <button
                onClick={() => navigate("/profile")}
                className="rounded-xl border border-line px-4 py-2 text-lg text-muted font-sans
                   cursor-pointer hover:text-ink transition-colors duration-200
                   flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
            </>
          ) : (
            <Link
              to={"/login"}
              className="rounded-xl bg-violet px-4 py-2 text-white text-lg cursor-pointer"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* ── Hamburger button — visible on mobile/tablet only ── */}
       <div className="lg:hidden flex gap-3 items-center" >
        <Suspense fallback={null}>
          <NotificationBell/>
        </Suspense>
         <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className=" flex flex-col justify-center items-center gap-1.5 w-8 h-8 cursor-pointer"
          aria-label="Toggle menu"
        >
          {/* 3 bars — animate into X when open */}
          <span
            className={`block w-6 h-0.5 bg-ink transition-all duration-300 origin-center
            ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-ink transition-all duration-300
            ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-ink transition-all duration-300 origin-center
            ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
        
       </div>
      </nav>

      {/* ── Mobile drawer — slides down when open ── */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300
        ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="flex flex-col gap-1 px-6 py-4 border-b border-line bg-surface">
          {/* Nav links */}
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={linkClass}
              onClick={() => setMenuOpen(false)} // close on navigate
            >
              {link.label}
            </NavLink>
          ))}

          {/* Divider */}
          <div className="border-t border-line my-2" />

          {/* Auth buttons */}
          {user ? (
            <div>
              
             
              <button
              onClick={() => {
                navigate("/profile");
                setMenuOpen(false);
              }}
              className="text-left text-lg flex items-center gap-2 text-muted hover:text-ink transition-colors duration-200 cursor-pointer"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            </div>
          ) : (
            <Link
              to={"/login"}
              className="mt-1 rounded-xl bg-violet px-4 py-2 text-white text-lg text-left w-fit cursor-pointer"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
