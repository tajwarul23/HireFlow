import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense } from "react";

import MainLayout from "./features/Layout/MainLayout.jsx";
import ProtectedLayout from "./features/Layout/ProtectedLayout.jsx";
import HomePage from "./features/Home/HomePage.jsx";
import NotFound from "./features/Layout/NotFound.jsx";
import SpinLoader from "./Shared/SpinLoader.jsx";

const CandidateDashBoard = lazy(()=>import("./features/Candidate/CandidateDashBoard.jsx"))
const RecruiterDashBoard = lazy(()=>import("./features/RecruiterPortal/Pages/RecruiterDashBoard.jsx"))
const OnBoardCompany = lazy(()=>import("./features/RecruiterPortal/Pages/OnBoardCompany.jsx"))
const JobFeed = lazy(()=>import("./features/RecruiterPortal/Pages/JobFeed.jsx"))
const JobStudio = lazy(()=>import("./features/RecruiterPortal/Pages/JobStudio.jsx"))
const CompanyProfile = lazy(()=>import("./features/RecruiterPortal/Pages/CompanyProfile.jsx"))
const RecruitPipeline = lazy(()=>import("./features/RecruiterPortal/Pages/RecruitPipeline.jsx"))
const AllJobFeed = lazy(()=>import("./Shared/AllJobFeed.jsx"))

const Login = lazy(()=>import("./features/Auth/pages/Login.jsx"))
const Register = lazy(()=>import("./features/Auth/pages/Register.jsx"))
const Profile = lazy(()=>import("./features/Auth/pages/Profile.jsx"))
const ResumeAnalyzer = lazy(()=>import("./features/interview/pages/ResumeAnalyzer.jsx"))
const InterviewReport = lazy(()=>import("./features/interview/pages/InterviewReport.jsx"))
const AllReports = lazy(()=>import("./features/interview/pages/AllReports.jsx"))
const ResumeBuilder = lazy(()=>import("./features/ResumeBuilder/Pages/ResumeBuilder.jsx"))
const ResumeViewer = lazy(()=>import("./features/ResumeBuilder/Pages/ResumeViewer.jsx"))
const AllResumes = lazy(()=>import("./features/ResumeBuilder/Pages/AllResumes.jsx"))




const App = () => {
  return (
    <div className="min-h-screen bg-app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000, // 3 seconds
        }}
      />
      <Router>
  <Routes>
    {/* Public Auth Routes */}
    <Route path="/login" element={<Suspense fallback={<SpinLoader/>}><Login /></Suspense>} />
    <Route path="/register" element={<Suspense fallback={<SpinLoader/>}><Register /></Suspense>} />

    {/* Layout with Navbar */}
    <Route element={<MainLayout />}>
      <Route path="/" element={<HomePage />} />

      {/* Protected — any authenticated user, no role restriction */}
      <Route element={<ProtectedLayout />}>
        <Route path="/onboarding/company" element={<Suspense fallback={<SpinLoader/>}><OnBoardCompany/></Suspense>} />
        <Route path="/resume/:resumeId" element={<Suspense fallback={<SpinLoader/>}><ResumeViewer /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<SpinLoader/>}><Profile/></Suspense>} />
      </Route>

      {/* Protected — candidate only */}
      <Route element={<ProtectedLayout allowedRoles={["candidate"]} />}>
        <Route path="/candidate/dashboard" element={<Suspense fallback={<SpinLoader/>}><CandidateDashBoard/></Suspense>} />
        <Route path="/resume-builder" element={<Suspense fallback={<SpinLoader/>}><ResumeBuilder /></Suspense>} />
        
        <Route path="/resume/allResume" element={<Suspense fallback={<SpinLoader/>}><AllResumes /></Suspense>} />
        <Route path="/resume-analyzer" element={<Suspense fallback={<SpinLoader/>}><ResumeAnalyzer /></Suspense>} />
      </Route>

      {/* Protected — recruiter only */}
      <Route element={<ProtectedLayout allowedRoles={["recruiter", "company_admin"]} />}>
        <Route path="/recruiter/dashboard" element={<Suspense fallback={<SpinLoader/>}><RecruiterDashBoard/></Suspense>} />
        <Route path="/recruiter/jobFeed" element={<Suspense fallback={<SpinLoader/>}><JobFeed/></Suspense>} />
        <Route path="/recruiter/jobStudio" element={<Suspense fallback={<SpinLoader/>}><JobStudio/></Suspense>} />
        <Route path="/recruiter/companyProfile" element={<Suspense fallback={<SpinLoader/>}><CompanyProfile/></Suspense>} />
        
        <Route path="/recruiter/pipeline" element={<Suspense fallback={<SpinLoader/>}><RecruitPipeline/></Suspense>} />
      </Route>

      {/* Protected — candidate or recruiter */}
      <Route element={<ProtectedLayout allowedRoles={["candidate", "recruiter", "company_admin"]} />}>
        <Route path="/interview/allReports" element={<Suspense fallback={<SpinLoader/>}><AllReports /></Suspense>} />
        <Route path="/interview/:interviewId" element={<Suspense fallback={<SpinLoader/>}><InterviewReport /></Suspense>} />
      </Route>

      {/* Protected — candidate, recruiter, or pending_recruiter (read-only job browsing) */}
      <Route element={<ProtectedLayout allowedRoles={["candidate", "recruiter", "company_admin", "pending_recruiter"]} />}>
        <Route path="/all/job" element={<Suspense fallback={<SpinLoader/>}><AllJobFeed /></Suspense>} />
      </Route>

      {/* 404 inside the layout so Navbar still shows */}
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
</Router>
    </div>
  );
};

export default App;
