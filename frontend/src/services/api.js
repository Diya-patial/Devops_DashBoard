import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export const getDeployments = () => api.get("/deployments");
export const getLogs = () => api.get("/logs");
export const getHealthMetrics = () => api.get("/health");

export const createDeployment = (data) => api.post("/deployments", data);
export const createLog = (data) => api.post("/logs", data);
export const createHealthMetric = (data) => api.post("/health", data);

export default api;
