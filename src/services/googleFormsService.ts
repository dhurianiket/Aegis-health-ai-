import { getAccessToken } from '../context/AuthContext';

export interface FormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers: Record<string, any>;
}

export interface FormMetadata {
  formId: string;
  info: {
    title: string;
    description: string;
    documentTitle: string;
  };
  items: any[];
}

export const getForm = async (formId: string): Promise<FormMetadata> => {
  const cleanId = formId ? formId.replace(/['"]/g, "").trim() : "";
  if (!cleanId) throw new Error("Google Form ID is empty or not configured.");
  
  const token = getAccessToken();
  if (!token) throw new Error("Google access token missing or expired. Please sign in again.");

  const response = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch form: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const getFormResponses = async (formId: string): Promise<{responses: FormResponse[]}> => {
  const cleanId = formId ? formId.replace(/['"]/g, "").trim() : "";
  if (!cleanId) throw new Error("Google Form ID is empty or not configured.");

  const token = getAccessToken();
  if (!token) throw new Error("Google access token missing or expired. Please sign in again.");

  const response = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}/responses`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch form responses: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
