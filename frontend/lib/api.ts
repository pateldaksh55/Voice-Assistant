// lib/api.ts
import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

// Items
export const fetchItems = () => api.get("/api/items");
export const createItem = (payload: { name: string; quantity?: number; category?: string }) =>
  api.post("/api/items", payload);
export const updateItem = (id: string, updates: any) => api.put(`/api/items/${id}`, updates);
export const deleteItem = (id: string) => api.delete(`/api/items/${id}`);

// Optional parse endpoint
export const parseCommand = (text: string) => api.post("/api/parse-command", { text });

export default api;






