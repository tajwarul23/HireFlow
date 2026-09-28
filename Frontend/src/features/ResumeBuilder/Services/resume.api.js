import axios from "axios";
import { API_URL } from "../../../Config/api.js";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const createResumeAPI = async (data) => {
  const response = await api.post("/api/resume/", data);
  return response.data;
};

export const getAllResumeAPI = async () =>{
    const response = await api.get("/api/resume/");
    return response.data
}

export const getResumeByIdAPI = async(resumeId) =>{
    const response = await api.get(`/api/resume/${resumeId}`);
    return response.data
}

export const deleteResumeByIdAPI = async(resumeId)=>{
  const response = await api.delete(`/api/resume/${resumeId}`)
  return response.data
}
