const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface RAGDocument {
  id: string;
  name: string;
  chunk_count?: number;
}

export interface RAGSource {
  document_id: string;
  document_name: string;
  text: string;
}

export interface RAGQueryResponse {
  answer: string;
  sources: RAGSource[];
}

export async function apiFetch(endpoint: string, options: any = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    try {
      const customHeaders = options.headers;
      for (const key in customHeaders) {
        if (Object.prototype.hasOwnProperty.call(customHeaders, key)) {
          headers[key] = customHeaders[key];
        }
      }
    } catch (e) {
      console.warn("Header merging skipped due to unconventional format");
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.detail || data?.message || `Status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    const msg = error?.message || "Network error";
    console.error("Fetch Error:", msg);
    throw new Error(msg);
  }
}

export async function getRAGDocuments(): Promise<RAGDocument[]> {
  const data = await apiFetch("/rag/documents", { method: "GET" });
  return data.documents || [];
}

export async function uploadRAGDocument(file: File): Promise<{ document_id: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
  const response = await fetch(`${API_URL}/rag/documents`, {
    method: "POST",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

export async function deleteRAGDocument(documentId: string): Promise<void> {
  await apiFetch(`/rag/documents/${documentId}`, { method: "DELETE" });
}

export async function queryRAG(
  query: string, 
  documentIds?: string[], 
  topK: number = 5
): Promise<RAGQueryResponse> {
  return apiFetch("/rag/query", {
    method: "POST",
    body: JSON.stringify({
      query,
      document_ids: documentIds,
      top_k: topK,
    }),
  });
}
