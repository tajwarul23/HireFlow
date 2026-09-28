import axios from "axios";
import { API_URL } from "../../../Config/api.js";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});


export const generateInterviewReport = async({jobDescription, selfDescription, resumeFile}) =>{
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);
    formData.append("resume", resumeFile);
    try {
        const response = await api.post("/api/interview/", formData)
        // const response = await api.post("/api/interview/", formData,{
        //     headers:{"Content-Type" : "multipart/form-data"}
        // })

        return response.data
    } catch (error) {
        console.log("Error in generateInterviewReport, interview.api.js", error.message);
        return null;
        

}
}

export const getInterviewReportById = async(interviewId) =>{
    try {
        const response = await api.get(`/api/interview/report/${interviewId}`);
        return response.data
    } catch (error) {
        console.log("error in getInterviewReportById,api", error.message);
        
    }
}

export const getAllInterviewReports = async()=>{
    try {
        const response = await api.get("/api/interview/");
        return response.data;
    } catch (error) {
        console.log("Error in getAllInterviewReports,api", error.message);
        
    }
}