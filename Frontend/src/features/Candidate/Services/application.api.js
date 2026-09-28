import axios from "axios";
import { API_URL } from "../../../Config/api.js";

const api = axios.create({
  baseURL: `${API_URL}/api/application`,
  withCredentials: true,
});

export const getCandidateApplicationsApi = async ({
  status,
  job,
  sort,
  page,
  limit,
} = {}) => {
  const params = {};
  if (status) params.status = status;
  if (job) params.job = job;
  if (sort) params.sort = sort;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const response = await api.get("/", { params });
  return response.data;
};
