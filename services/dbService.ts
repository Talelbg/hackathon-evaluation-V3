// services/dbService.ts
import { Project, Judge, Criterion, Score } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

interface DBState {
  projects: Project[];
  judges: Judge[];
  criteria: Criterion[];
  scores: Score[];
}

// --- Private Helper for API calls ---
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to fetch from ${endpoint}. Status: ${response.status}`);
  }
  return response.json();
};

// --- Public API ---

export const getAllData = async (): Promise<DBState> => {
  return apiFetch('/data');
};

// Project API
export const createProjects = async (newProjectsData: Omit<Project, 'id'>[]): Promise<Project[]> => {
  return apiFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(newProjectsData),
  });
};

export const updateProject = async (updatedProject: Project): Promise<Project> => {
  return apiFetch(`/projects/${updatedProject.id}`, {
    method: 'PUT',
    body: JSON.stringify(updatedProject),
  });
};

export const deleteProject = async (projectId: string): Promise<{ success: boolean }> => {
  return apiFetch(`/projects/${projectId}`, {
    method: 'DELETE',
  });
};

// Judge API
export const createJudge = async (newJudgeData: Omit<Judge, 'id'>): Promise<Judge> => {
  return apiFetch('/judges', {
    method: 'POST',
    body: JSON.stringify(newJudgeData),
  });
};

export const updateJudge = async (updatedJudge: Judge): Promise<Judge> => {
  return apiFetch(`/judges/${updatedJudge.id}`, {
    method: 'PUT',
    body: JSON.stringify(updatedJudge),
  });
};

export const deleteJudge = async (judgeId: string): Promise<{ success: boolean }> => {
  return apiFetch(`/judges/${judgeId}`, {
    method: 'DELETE',
  });
};

// Criterion API
export const createCriterion = async (newCriterionData: Omit<Criterion, 'id'>): Promise<Criterion> => {
  return apiFetch('/criteria', {
    method: 'POST',
    body: JSON.stringify(newCriterionData),
  });
};

export const updateCriterion = async (updatedCriterion: Criterion): Promise<Criterion> => {
  return apiFetch(`/criteria/${updatedCriterion.id}`, {
    method: 'PUT',
    body: JSON.stringify(updatedCriterion),
  });
};

export const deleteCriterion = async (criterionId: string): Promise<{ success: boolean }> => {
  return apiFetch(`/criteria/${criterionId}`, {
    method: 'DELETE',
  });
};

// Score API
export const createOrUpdateScore = async (score: Score): Promise<Score> => {
  // Generate a client-side ID if it's a new score
  if (!score.id) {
    score.id = `s_${score.projectId}_${score.judgeId}_${Date.now()}`;
  }
  return apiFetch('/scores', {
    method: 'POST', // The backend uses POST for upserting scores
    body: JSON.stringify(score),
  });
};

export const deleteScore = async (scoreId: string): Promise<{ success: boolean }> => {
  return apiFetch(`/scores/${scoreId}`, {
    method: 'DELETE',
  });
};
