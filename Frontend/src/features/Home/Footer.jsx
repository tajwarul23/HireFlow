
import { Link } from "react-router-dom";
import { useAuth } from "../Auth/Hooks/useAuth";
import Brand from "../../Shared/Brand";
import { candidateNavLinks, getNavLinks, recruiterNavLinks } from "../../Shared/navLinks";

const LINKEDIN_URL = "https://www.linkedin.com/in/tajwarul-chowdhury-7288381a9/";

// lucide-react no longer ships brand logos, so the LinkedIn mark is inlined.
const LinkedInIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
);

const focusRing =
  "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet";

const FooterColumn = ({ title, links }) => (
  <div>
    <h3 className="mb-3 text-xs font-mono uppercase tracking-wider text-muted">{title}</h3>
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.to}>
          <Link
            to={link.to}
            className={`text-sm text-ink/80 hover:text-violet-text transition-colors ${focusRing}`}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);



const Footer = () => {
  const { user } = useAuth();
  

  // Logged out: show what both sides get. Logged in: only the user's own pages.
  const roleLinks = getNavLinks(user);
  const columns = user
    ? roleLinks.length
      ? [{ title: "Explore", links: roleLinks }]
      : []
    : [
        { title: "For candidates", links: candidateNavLinks },
        { title: "For recruiters", links: recruiterNavLinks },
      ];

  return (
    <footer className="mt-16 border-t border-line bg-surface/40 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_2fr]">
          {/* Brand */}
          <div className="space-y-4">
            <Brand animated={false} />
            <p className="max-w-xs text-sm text-muted">
              AI-powered hiring for candidates and recruiters: build resumes, prepare
              for interviews and find the right fit.
            </p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-ink hover:border-linehov transition-colors ${focusRing}`}
            >
              <LinkedInIcon className="h-4 w-4" />
              Connect on LinkedIn
            </a>
          </div>

          {/* Links */}
          {columns.length > 0 && (
            <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-2">
              {columns.map((column) => (
                <FooterColumn key={column.title} {...column} />
              ))}
            </nav>
          )}
        </div>

      
      </div>
    </footer>
  );
};

export default Footer;
