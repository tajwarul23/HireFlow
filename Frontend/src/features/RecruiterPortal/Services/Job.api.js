import axios from "axios";

const api = axios.create({
    baseURL:"https://hireflow-r73i.onrender.com/api/job",
    withCredentials:true
});

export const createJobApi = async(data)=>{
    const response = await api.post("/create", data);
    return response.data;
}

export const getCompanyJobFeedApi = async({ page = 1 } = {})=>{
    const response = await api.get("/company", { params: { page } });
    return response.data;
}

// move this to candidate portal
export const getJobFeedApi = async({pageParam, filters = {}})=>{
    const params = {...filters};
    if(pageParam)params.cursor = pageParam;
    const response = await api.get("/", {params});
    return response.data;
}

export const updateJobApi = async(jobId, data)=>{
    const response = await api.patch(`/${jobId}`, data);
    return response.data;
}

export const deleteJobApi = async(jobId)=>{
    const response = await api.delete(`/${jobId}`);
    return response.data;
}

export const generateJobDescriptionApi = async(data)=>{
    const response = await api.post("/generate-description", data);
    return response.data;
}