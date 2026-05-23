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
  const token = getAccessToken();
  if (!token) throw new Error("Google access token missing or expired. Please sign in again.");

  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch form: ${response.statusText}`);
  }

  return response.json();
}

export const getFormResponses = async (formId: string): Promise<{responses: FormResponse[]}> => {
  const token = getAccessToken();
  if (!token) throw new Error("Google access token missing or expired. Please sign in again.");

  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch form responses: ${response.statusText}`);
  }

  return response.json();
}
