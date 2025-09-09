import { API_SYSTEME_KEY, API_URL, DEV_API_URL, SYSTEME_API_URL, CHAT_API_URL } from "@env";
import axios from "axios";
import store from "../redux/Store";

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = store.getState()?.auth?.userData?.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 500) {
      return Promise.reject(new Error("Server error. Please try again later."));
    }
   
    return Promise.reject(error);
  }
);



export const axiosInstanceSysteme = axios.create({
    baseURL: SYSTEME_API_URL,
    headers: {
      "X-API-Key": API_SYSTEME_KEY,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  
  axiosInstanceSysteme.interceptors.request.use(
    async (config) => {
      // const token = store.getState()?.auth?.token;
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  axiosInstanceSysteme.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 500) {
        return Promise.reject(new Error("Server error. Please try again later."));
      }
     
      return Promise.reject(error);
    }
  );
  
  
