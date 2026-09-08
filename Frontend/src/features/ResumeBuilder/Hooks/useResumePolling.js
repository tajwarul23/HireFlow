import { useEffect, useRef, useState } from "react";
import axios from "axios";

// Polls GET /api/resume/:id every 3 seconds until resumeUrl is ready
const useResumePolling = (resumeId, initialIsSaving) => {
  const [resumeUrl, setResumeUrl] = useState(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(initialIsSaving);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Don't poll if already saved or no ID
    if (!initialIsSaving || !resumeId) return;

    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`https://hireflow-r73i.onrender.com/api/resume/${resumeId}`, {
          withCredentials: true,
        });

        const resume = data.resumeById;

        if (resume.saveFailed) {
          // Background save failed — stop polling, show retry
          setIsSaving(false);
          setSaveFailed(true);
          clearInterval(intervalRef.current);
          return;
        }

        if (resume.resumeUrl) {
          // Cloudinary URL is ready — stop polling, show download button
          setResumeUrl(resume.resumeUrl);
          setIsSaving(false);
          clearInterval(intervalRef.current);
        }
        // If still null, keep polling
      } catch (error) {
        console.error("Polling failed:", error.message);
        // Don't stop polling on a single network hiccup
      }
    }, 3000); // check every 3 seconds

    // Cleanup on unmount — prevent polling after user navigates away
    return () => clearInterval(intervalRef.current);
  }, [resumeId, initialIsSaving]);

  return { resumeUrl, isSaving, saveFailed };
};

export default useResumePolling;