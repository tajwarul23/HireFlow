import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  Star,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  useGetAllApplicationForCompany,
  useUpdateApplicationStatus,
} from "../Hooks/useApplication";
import UpdateJobStatusModalBody from "./UpdateJobStatusModalBody";

const statusStyles = {
  applied: "border border-violet/30 bg-violet/10 text-violet",
  shortlisted: "border border-blue-400/30 bg-blue-400/10 text-blue-400",
  rejected: "border border-red-400/30 bg-red-400/10 text-red-400",
  hired: "border border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
};

const getMatchScoreStyles = (score) => {
  if (score >= 80) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-400";
  if (score >= 50) return "border-amber-400/30 bg-amber-400/10 text-amber-400";
  return "border-line bg-ink/5 text-muted";
};

const RecruitPipelineApplicantList = ({
  selectedJobId,
  selectedApplication,
  setSelectedApplication,
  statusFilter,
}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllApplicationForCompany({
    job: selectedJobId,
    status: statusFilter,
  });

  const {
    mutate: updateApplicationStatus,
    isPending,
    variables: pendingVariables,
  } = useUpdateApplicationStatus();

  const isActionPending = (applicationId, status) =>
    isPending &&
    pendingVariables?.applicationId === applicationId &&
    pendingVariables?.status === status;

  const applications = data?.pages?.flatMap((p) => p?.data?.applications ?? []) ?? [];

  const updateStatusRef = useRef(null);

  const [pendingUpdate, setPendingUpdate] = useState(null);

  // Automatically select first applicant
  useEffect(() => {
    if (applications.length === 0) {
      setSelectedApplication(null);
      return;
    }

    const selectedStillExists = applications.some(
      (application) => application._id === selectedApplication?._id,
    );

    if (!selectedStillExists) {
      setSelectedApplication(applications[0]);
    }
  }, [applications, selectedApplication, setSelectedApplication]);

  const handleViewResume = (resumeId) => {
    window.open(`/resume/${resumeId}`, "_blank", "noopener,noreferrer");
  };

  const handleContactEmail = (email) => {
    if (!email) return;

    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`,
      "_blank",
    );
  };

  if (!selectedJobId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-8 text-center">
        <UserRound className="h-8 w-8 text-muted" />
        <p className="mt-3 text-sm text-muted">
          Select a job to view applicants.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-ink/10" />
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-line bg-ink/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center">
        <p className="text-sm text-red-400">
          {error?.response?.data?.message || "Failed to load applicants"}
        </p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-8 text-center">
        <UserRound className="h-8 w-8 text-muted" />
        <p className="mt-3 text-sm font-semibold text-ink">No applicants yet</p>
        <p className="mt-1 text-xs text-muted">
          Applicants for this job will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {applications.map((application) => {
        const isSelected = application._id === selectedApplication?._id;
        const candidate = application.candidate;
        const matchScore = application.recruiterReport?.matchScore;

        return (
          <div
            key={application._id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedApplication(application)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setSelectedApplication(application);
              }
            }}
            className={`
            group w-full rounded-xl border p-3 text-left
            transition-all duration-200
            cursor-pointer
            ${
              isSelected
                ? "border-violet bg-violet/10 shadow-sm shadow-violet/10"
                : "border-line bg-surface hover:-translate-y-0.5 hover:border-violet/40 hover:bg-overlay hover:shadow-md hover:shadow-black/5"
            }
          `}
          >
            <div className="flex items-start gap-3">
              <div
                className={`
                flex h-9 w-9 shrink-0 items-center justify-center
                rounded-full text-sm font-bold
                transition-colors
                ${
                  isSelected
                    ? "bg-violet text-white"
                    : "bg-ink/10 text-muted group-hover:bg-violet/10 group-hover:text-violet"
                }
              `}
              >
                {candidate?.userName?.[0]?.toUpperCase() ?? (
                  <UserRound className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                {/* - NAME + STATUS - */}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`
                    truncate text-sm font-semibold
                    transition-colors
                    ${isSelected ? "text-violet" : "text-ink"}
                  `}
                  >
                    {candidate?.userName || "Unknown Candidate"}
                  </h3>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {matchScore != null && (
                      <span
                        className={`rounded-lg border px-1.5 py-0.5 text-sm font-mono font-bold ${getMatchScoreStyles(matchScore)}`}
                      >
                        {matchScore}%
                      </span>
                    )}

                    <span
                      className={`
                      rounded-lg px-2 py-0.5
                      text-sm font-mono font-bold uppercase
                      ${statusStyles[application.status] ?? "bg-ink/5 text-muted"}
                    `}
                    >
                      {application.status}
                    </span>
                  </div>
                </div>

                <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                  <Mail className="h-3 w-3 shrink-0" />
                  {candidate?.email}
                </p>

                {/* - CONTACT / RESUME (secondary chip actions) - */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!application?.resume?._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewResume(application?.resume?._id);
                    }}
                    className="
                    flex items-center gap-1.5 rounded-lg
                    border border-violet/20 bg-overlay px-2.5 py-1
                    text-[11px] font-semibold text-violet/80
                    transition-colors
                    hover:border-violet/40 hover:bg-violet/10 hover:text-violet
                    cursor-pointer
                    disabled:cursor-not-allowed disabled:opacity-50 disabled:border-line disabled:text-muted disabled:hover:border-line disabled:hover:bg-overlay disabled:hover:text-muted
                  "
                  >
                    <FileText className="h-3 w-3" />
                    View Resume
                  </button>

                  <button
                    type="button"
                    disabled={!candidate?.email}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContactEmail(candidate?.email);
                    }}
                    className="
                    flex items-center gap-1.5 rounded-lg
                    border border-blue-400/20 bg-overlay px-2.5 py-1
                    text-[11px] font-semibold text-blue-400/80
                    transition-colors
                    hover:border-blue-400/40 hover:bg-blue-400/10 hover:text-blue-400
                    cursor-pointer
                    disabled:cursor-not-allowed disabled:opacity-50 disabled:border-line disabled:text-muted disabled:hover:border-line disabled:hover:bg-overlay disabled:hover:text-muted
                  "
                  >
                    <Mail className="h-3 w-3" />
                    Contact via Email
                  </button>
                </div>

                {/* - TAKE ACTION - */}
                <div className="mt-3 border-t border-line pt-2.5">
                  <p className="mb-1.5 text-[9px] font-mono uppercase tracking-wider text-muted">
                    Take Action
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isPending || application.status === "interview"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingUpdate({
                          applicationId: application._id,
                          status: "interview",
                        });
                        updateStatusRef.current?.showModal();
                      }}
                      className={`
                      flex items-center gap-1.5 rounded-lg
                      border px-2.5 py-1
                      text-[11px] font-semibold
                      transition-colors
                      disabled:cursor-not-allowed
                      ${
                        application.status === "interview"
                          ? "border-amber-400/40 bg-amber-400/15 text-amber-400 opacity-70"
                          : "border-amber-400/30 bg-amber-400/5 text-amber-400 hover:bg-amber-400/15 cursor-pointer disabled:opacity-50"
                      }
                    
`}
                    >
                      {isActionPending(application._id, "interview") ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CalendarClock className="h-3.5 w-3.5" />
                      )}
                      {application.status === "interview" ? "Interviewing" : "Call For Interview"}
                    </button>

                    <button
                      type="button"
                      disabled={isPending || application.status === "shortlisted"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingUpdate({
                          applicationId: application._id,
                          status: "shortlisted",
                        });
                        updateStatusRef.current?.showModal();
                      }}
                      className={`
                      flex items-center gap-1.5 rounded-lg
                      border px-2.5 py-1
                      text-[11px] font-semibold
                      transition-colors
                      disabled:cursor-not-allowed
                      ${
                        application.status === "shortlisted"
                          ? "border-blue-400/40 bg-blue-400/15 text-blue-400 opacity-70"
                          : "border-blue-400/30 bg-blue-400/5 text-blue-400 hover:bg-blue-400/15 cursor-pointer disabled:opacity-50"
                      }
                    
`}
                    >
                      {isActionPending(application._id, "shortlisted") ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Star className="h-3.5 w-3.5" />
                      )}
                      {application.status === "shortlisted" ? "Shortlisted" : "Mark as Shortlist"}
                    </button>

                    <button
                      type="button"
                      disabled={isPending || application.status === "hired"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingUpdate({
                          applicationId: application._id,
                          status: "hired",
                        });
                        updateStatusRef.current?.showModal();
                      }}
                      className={`
                      flex items-center gap-1.5 rounded-lg
                      border px-2.5 py-1
                      text-[11px] font-semibold
                      transition-colors
                      disabled:cursor-not-allowed
                      ${
                        application.status === "hired"
                          ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-400 opacity-70"
                          : "border-emerald-400/30 bg-emerald-400/5 text-emerald-400 hover:bg-emerald-400/15 cursor-pointer disabled:opacity-50"
                      }
                    
`}
                    >
                      {isActionPending(application._id, "hired") ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {application.status === "hired" ? "Hired" : "Hire"}
                    </button>

                    <button
                      type="button"
                      disabled={isPending || application.status === "rejected"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingUpdate({
                          applicationId: application._id,
                          status: "rejected",
                        });
                        updateStatusRef.current?.showModal();
                      }}
                      className={`
                      flex items-center gap-1.5 rounded-lg
                      border px-2.5 py-1
                      text-[11px] font-semibold
                      transition-colors
                      disabled:cursor-not-allowed
                      ${
                        application.status === "rejected"
                          ? "border-red-400/40 bg-red-400/15 text-red-400 opacity-70"
                          : "border-red-400/30 bg-red-400/5 text-red-400 hover:bg-red-400/15 cursor-pointer disabled:opacity-50"
                      }
                    
`}
                    >
                      {isActionPending(application._id, "rejected") ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {application.status === "rejected" ? "Rejected" : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full rounded-xl border border-line bg-surface py-2 text-sm font-semibold text-muted transition-colors hover:border-violet/40 hover:text-violet disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isFetchingNextPage ? "Loading..." : "Load more applicants"}
        </button>
      )}
      <UpdateJobStatusModalBody
        updateStatusRef={updateStatusRef}
        applicationId={pendingUpdate?.applicationId}
        status={pendingUpdate?.status}
        updateApplicationStatus={updateApplicationStatus}
        isPending={isPending}
      />
    </div>
  );
};

export default RecruitPipelineApplicantList;
