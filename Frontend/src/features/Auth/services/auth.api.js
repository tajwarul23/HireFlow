import axios from "axios";
import { API_URL } from "../../../Config/api.js";

//whenever there is any interaction with the cookie we have to use withCredentials : true
////so the browser sends the cookie to server also receives/stores the cookie

//creating an instance of axios that is constant for API calling


const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const register = async ({ userName, email, password }) => {
  const response = await api.post("/api/auth/register", {
    userName,
    email,
    password,
  });
  return response.data;
};

export const login = async ({ email, password }) => {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/api/auth/logout");
  return response.data;
};



export const getMe = async () => {
  const response = await api.get("/api/auth/get-me");
  return response.data;
};

export const becomeCandidate = async () => {
  const response = await api.post("/api/auth/become-candidate");
  return response.data;
};


