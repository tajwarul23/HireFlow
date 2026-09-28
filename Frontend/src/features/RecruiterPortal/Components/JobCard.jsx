import {
  MapPin,
  Users,
  Wallet,
  CalendarClock,
  Briefcase,
  Map,
  SquarePen,
  Trash2,
  Send,
  Sparkles,
} from "lucide-react";
import { useRef } from "react";
import { useDialog } from "../../../Hooks/useDialog";
import { useAuth } from "../../Auth/Hooks/useAuth";
import DescriptionModalBody from "./DescriptionModalBody";
import UpdateModalBody from "./UpdateModalBody";
import DeleteModalBody from "./DeleteModalBody";
import { useNavigate } from "react-router-dom";
import ApplyModalBody from "./ApplyModalBody";
import AnalyzePrepModalBody from "./AnalyzePrepModalBody";
import AboutCompanyModalBody from "./AboutCompanyModalBody";

const formatSalary = (min, max, currency) => {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  });
  if (!min && !max) return "Not disclosed";
  if (min && max) return `${fmt.format(min)} – ${fmt.format(max)}`;
  return fmt.format(min || max);
};

const formatDeadline = (deadline) => {
  if (!deadline) return null;
  const date = new Date(deadline);
  const daysLeft = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { label, daysLeft };
};

const workModeStyles = {
  REMOTE: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  HYBRID: "bg-violet/10 text-violet-text border-violet-border",
  ONSITE: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
};

const statusStyles = {
  OPEN: "bg-teal/10 text-teal border-teal/30",
  CLOSED: "bg-red-500/10 text-red-400 border-red-500/30",
};

const JobCard = ({ job, view }) => {
  const {
    title,
    skills = [],
    location,
    workMode,
    employmentType,
    experienceLevel,
    salary,
    vacancy,
    deadline,
    description,
    companyName,
    status,
    company,
    
  } = job;
  const dialogRef = useRef(null);
  const {
    ref: applyDialogRef,
    isOpen: isApplyDialogOpen,
    show: showApplyDialog,
    close: closeApplyDialog,
  } = useDialog();
  const {
    ref: analyzeDialogRef,
    isOpen: isAnalyzeDialogOpen,
    show: showAnalyzeDialog,
    close: closeAnalyzeDialog,
  } = useDialog();
  const updateDialogRef = useRef(null);
  const deleteDialogRef = useRef(null);
  const {
    ref: aboutCompanyDialogRef,
    isOpen: isAboutCompanyDialogOpen,
    show: showAboutCompanyDialog,
    close: closeAboutCompanyDialog,
  } = useDialog();
  const deadlineInfo = formatDeadline(deadline);
  const isClosingSoon =
    deadlineInfo?.daysLeft !== undefined &&
    deadlineInfo.daysLeft <= 7 &&
    deadlineInfo.daysLeft >= 0;

  const { user } = useAuth();
  const navigate = useNavigate();

  const isMyCompany = user?.company === company;
  const isCandidate = user?.role === "candidate";

  return (
    <div
      className="
      group flex h-full flex-col rounded-2xl
      border border-line bg-surface
      p-4 sm:p-5
      transition-all duration-200
      hover:-translate-y-0.5
      hover:border-teal/40
      hover:shadow-lg hover:shadow-black/5
    "
    >
      {/* - ROW 1: title/status/myCompany (left) — update/delete (right) - */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className="
              line-clamp-2 text-base font-bold leading-6
              text-ink transition-colors
              group-hover:text-teal
            "
            >
              {title}
            </h2>

            <span
              className={`
              shrink-0 rounded-full border px-2.5 py-1
              text-sm font-mono font-bold uppercase tracking-wide
              ${statusStyles[status]}
            `}
            >
              {status.toLowerCase()}
            </span>

            {isMyCompany && (
              <span
                className="
                shrink-0 rounded-full border border-teal/40 bg-teal/10
                px-2.5 py-1 text-sm font-mono font-bold
                uppercase tracking-wide text-teal
              "
              >
                My Company
              </span>
            )}
          </div>
        </div>

        {isMyCompany && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => updateDialogRef.current?.showModal()}
              className="
              rounded-lg border-2 border-violet px-3 py-1.5
              text-xs font-semibold text-muted
              transition-colors hover:bg-overlay hover:text-ink
              cursor-pointer
            "
            >
              <SquarePen className="w-4 h-4 text-violet" />
            </button>

            <button
              type="button"
              onClick={() => deleteDialogRef.current?.showModal()}
              className="
              rounded-lg border-2 border-red-400/60 px-3 py-1.5
              text-xs font-semibold text-red-400
              transition-colors hover:bg-red-400/10
              cursor-pointer
            "
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* - ROW 2: companyName, location, workMode, salary, employmentType, experienceLevel, vacancy - */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={showAboutCompanyDialog}
          className="
    group cursor-pointer
    rounded-md px-2 py-1
    transition-all duration-200
    hover:bg-teal/10
  "
        >
          <span
            className="
      flex items-center gap-1.5
      text-sm font-medium text-ink
      transition-colors duration-200
      group-hover:text-teal
    "
          >
            <Map
              className="
        h-3.5 w-3.5 shrink-0 text-teal
        transition-transform duration-200
        group-hover:-translate-y-0.5
      "
            />
            {companyName}
          </span>
        </button>

        <span className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {location || "Location not specified"}
          </span>
        </span>

        <span
          className={`
          shrink-0 rounded-full border px-2.5 py-1
          text-sm font-mono font-bold uppercase tracking-wide
          ${workModeStyles[workMode]}
        `}
        >
          {workMode?.toLowerCase()}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Wallet className="h-3.5 w-3.5 shrink-0 text-teal" />
          {formatSalary(salary?.salaryMin, salary?.salaryMax, salary?.currency)}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          {employmentType?.replace("_", " ").toLowerCase()}
        </span>

        <span className="text-sm font-mono uppercase tracking-wide text-muted">
          {experienceLevel?.toLowerCase()} level
        </span>

        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Users className="h-3.5 w-3.5 shrink-0" />
          {vacancy} {vacancy === 1 ? "opening" : "openings"}
        </span>

        {deadlineInfo && (
          <span
            className={`
            flex items-center gap-1.5 text-[11px] font-mono
            ${isClosingSoon ? "text-red-400" : "text-muted"}
          `}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {isClosingSoon
              ? `${deadlineInfo.daysLeft}d left`
              : `Closes ${deadlineInfo.label}`}
          </span>
        )}
      </div>

      {/* - ROW 3: description (dark bg) + read more - */}
      <div className="mt-4 rounded-xl bg-ink/5 dark:bg-black/30 p-3.5">
        <p className="mb-2 text-sm font-mono uppercase tracking-wider text-muted">
          Job Description
        </p>

        <div className="line-clamp-4 text-sm leading-6 text-ink/80">
          {description
            ?.slice(0, 300)
            .split("\n")
            .filter(Boolean)
            .map((line, index) => {
              const isHeading = line.trim().endsWith(":");
              return (
                <p
                  key={index}
                  className={isHeading ? "font-semibold text-ink" : ""}
                >
                  {line}
                </p>
              );
            })}
        </div>

        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="
          group/link mt-2 inline-flex items-center gap-1.5
          text-xs font-semibold text-teal
          transition-colors hover:text-teal/80
          cursor-pointer
        "
        >
          Read more
          <span className="transition-transform group-hover/link:translate-x-0.5">
            →
          </span>
        </button>
      </div>

      {/* - SPACER - */}
      <div className="flex-1" />

      {/* - ROW 4: skills (left) — apply (right) - */}
      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          {skills?.length > 0 && (
            <>
              <p className="mb-2 text-sm font-mono uppercase tracking-wider text-muted">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skills.slice(0, 5).map((skill, i) => (
                  <span
                    key={i}
                    className="
                    rounded-md border border-line
                    bg-overlay px-2 py-1
                    text-[11px] font-mono text-ink
                    transition-colors
                    group-hover:border-teal/20
                  "
                  >
                    {skill}
                  </span>
                ))}
                {skills.length > 5 && (
                  <span className="rounded-md px-2 py-1 text-[11px] font-mono text-muted">
                    +{skills.length - 5} more
                  </span>
                )}
              </div>
            </>
          )}
          {isMyCompany && view === "company" && (
            <p className="mt-2 text-xs font-mono uppercase text-muted">
              Posted By: {job?.postedBy?.userName}
            </p>
          )}
        </div>

        {isCandidate && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={job?.isApplied}
              onClick={showApplyDialog}
              className={`flex items-center justify-center gap-1.5
        shrink-0 rounded-lg px-4 py-2
        text-xs font-semibold text-white
        transition-colors ${job?.isApplied ? "bg-violet/40 cursor-not-allowed opacity-60" : "bg-violet hover:bg-violet-dim cursor-pointer"}`}
            >
              <Send className="h-3.5 w-3.5" />
              {job?.isApplied ? "Applied" : "Apply Now"}
            </button>

            <button
              type="button"
              onClick={showAnalyzeDialog}
              className="
        flex items-center justify-center gap-1.5
        shrink-0 rounded-lg border-2 border-violet px-4 py-2
        text-xs font-semibold text-violet
        transition-colors hover:bg-violet/10
        cursor-pointer
      "
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analyze & Prep
            </button>
          </div>
        )}

        {isMyCompany && (
          <button
            type="button"
            onClick={() => {
              navigate(`/recruiter/pipeline?job=${job._id}`);
            }}
            className=" flex items-center justify-center
          shrink-0 rounded-lg bg-violet px-4 py-2
          text-xs font-semibold text-black font-sans
          transition-colors hover:bg-violet-dim
          cursor-pointer 
        "
          >
            See Application Details
          </button>
        )}
      </div>

      {/* - DESCRIPTION MODAL - */}
      <DescriptionModalBody
        dialogRef={dialogRef}
        title={title}
        workMode={workMode}
        employmentType={employmentType}
        description={description}
      />
      {/* - ABOUT COMPANY MODAL - */}
     <AboutCompanyModalBody
     aboutCompanyDialogRef={aboutCompanyDialogRef}
     isOpen={isAboutCompanyDialogOpen}
     onClose={closeAboutCompanyDialog}
     company = {company}
     />
      {/* UPDATE MODAL */}
      <UpdateModalBody updateDialogRef={updateDialogRef} job={job} />
      {/* DELETE MODAL */}
      <DeleteModalBody deleteDialogRef={deleteDialogRef} jobId={job._id} />
      {/* APPLY MODAL */}
      <ApplyModalBody
        applyDialogRef={applyDialogRef}
        isOpen={isApplyDialogOpen}
        onClose={closeApplyDialog}
        jobId={job._id}
      />
      {/* ANALYZE & PREP MODAL */}
      <AnalyzePrepModalBody
        analyzeDialogRef={analyzeDialogRef}
        isOpen={isAnalyzeDialogOpen}
        onClose={closeAnalyzeDialog}
        jobId={job._id}
      />
    </div>
  );
};

export default JobCard;
