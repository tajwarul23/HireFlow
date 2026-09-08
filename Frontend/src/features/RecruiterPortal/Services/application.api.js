import axios from "axios";

const api = axios.create({
  baseURL: "https://hireflow-r73i.onrender.com/api/application",
  withCredentials: true,
});

export const getAllApplicationForCompanyApi = async ({
  job,
  status,
  sort,
  page = 1,
} = {}) => {
  const params = { page };
  if (job) params.job = job;
  if (status) params.status = status;
  if (sort) params.sort = sort;

  const response = await api.get("/company", { params });
  return response.data;
};

export const updateApplicationStatusApi = async (
  applicationId,
  status,
  { interviewLink, interviewDate, interviewTime } = {},
) => {
  const response = await api.patch(`/${applicationId}`, {
    status,
    interviewLink,
    interviewDate,
    interviewTime,
  });
  return response.data;
};

// /api/application/:jobId

export const applyToJobApi = async ({ jobId, resumeId, file }) => {
  let body;
  let config = {};
  if (file) {
    body = new FormData();
    body.append("resume", file);
    config = { headers: { "Content-Type": "multipart/form-data" } };
  } else {
    body = { resumeId };
  }
  const response = await api.post(`/${jobId}`, body, config);
  return response.data;
};

// /api/application/analyze/:jobId

export const analyzePrepApi = async ({ jobId, resumeId, file }) => {
  let body;
  let config = {};
  if (file) {
    body = new FormData();
    body.append("resume", file);
    config = { headers: { "Content-Type": "multipart/form-data" } };
  } else {
    body = { resumeId };
  }
  const response = await api.post(`/analyze/${jobId}`, body, config);
  return response.data;
};
