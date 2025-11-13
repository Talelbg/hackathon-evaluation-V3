// services/dbService.ts
import { Project, Judge, Criterion, Score } from '../types';
import { MOCK_PROJECTS, MOCK_JUDGES, MOCK_CRITERIA, MOCK_SCORES } from '../data/mockData';

const DB_KEY = 'HAH_EVAL_DB';

interface DBState {
  projects: Project[];
  judges: Judge[];
  criteria: Criterion[];
  scores: Score[];
}

// Initialize DB from mock data if it doesn't exist in localStorage
const getDb = (): DBState => {
  const dbJson = localStorage.getItem(DB_KEY);
  if (dbJson) {
    try {
        return JSON.parse(dbJson);
    } catch (e) {
        console.error("Failed to parse DB from localStorage, resetting.", e);
        localStorage.removeItem(DB_KEY);
    }
  }
  
  const initialState: DBState = {
    projects: MOCK_PROJECTS,
    judges: MOCK_JUDGES,
    criteria: MOCK_CRITERIA,
    scores: MOCK_SCORES,
  };
  localStorage.setItem(DB_KEY, JSON.stringify(initialState));
  return initialState;
};

const saveDb = (db: DBState) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Keep functions async to match the previous signature and minimize changes in App.tsx
export const getAllData = async (): Promise<DBState> => {
  return Promise.resolve(getDb());
};

// Project API
export const createProjects = async (newProjectsData: Omit<Project, 'id'>[]): Promise<Project[]> => {
  const db = getDb();
  const createdProjects: Project[] = newProjectsData.map((p, i) => ({
    ...p,
    id: `p_${Date.now()}_${i}`,
  }));
  db.projects.push(...createdProjects);
  saveDb(db);
  return Promise.resolve(createdProjects);
};

export const updateProject = async (updatedProject: Project): Promise<Project> => {
  const db = getDb();
  const index = db.projects.findIndex(p => p.id === updatedProject.id);
  if (index > -1) {
    db.projects[index] = updatedProject;
    saveDb(db);
  }
  return Promise.resolve(updatedProject);
};

export const deleteProject = async (projectId: string): Promise<{ success: boolean }> => {
  const db = getDb();
  db.projects = db.projects.filter(p => p.id !== projectId);
  db.scores = db.scores.filter(s => s.projectId !== projectId);
  saveDb(db);
  return Promise.resolve({ success: true });
};

// Judge API
export const createJudge = async (newJudgeData: Omit<Judge, 'id'>): Promise<Judge> => {
  const db = getDb();
  const newJudge: Judge = { ...newJudgeData, id: `j_${Date.now()}` };
  db.judges.push(newJudge);
  saveDb(db);
  return Promise.resolve(newJudge);
};

export const updateJudge = async (updatedJudge: Judge): Promise<Judge> => {
  const db = getDb();
  const index = db.judges.findIndex(j => j.id === updatedJudge.id);
  if (index > -1) {
    db.judges[index] = updatedJudge;
    saveDb(db);
  }
  return Promise.resolve(updatedJudge);
};

export const deleteJudge = async (judgeId: string): Promise<{ success: boolean }> => {
  const db = getDb();
  db.judges = db.judges.filter(j => j.id !== judgeId);
  db.scores = db.scores.filter(s => s.judgeId !== judgeId);
  saveDb(db);
  return Promise.resolve({ success: true });
};

// Criterion API
export const createCriterion = async (newCriterionData: Omit<Criterion, 'id'>): Promise<Criterion> => {
  const db = getDb();
  const newCriterion: Criterion = { ...newCriterionData, id: `c_${Date.now()}` };
  db.criteria.push(newCriterion);
  saveDb(db);
  return Promise.resolve(newCriterion);
};

export const updateCriterion = async (updatedCriterion: Criterion): Promise<Criterion> => {
  const db = getDb();
  const index = db.criteria.findIndex(c => c.id === updatedCriterion.id);
  if (index > -1) {
    db.criteria[index] = updatedCriterion;
    saveDb(db);
  }
  return Promise.resolve(updatedCriterion);
};

export const deleteCriterion = async (criterionId: string): Promise<{ success: boolean }> => {
  const db = getDb();
  db.criteria = db.criteria.filter(c => c.id !== criterionId);
  // Note: Deleting a criterion doesn't remove scores, the calculation will just ignore it.
  saveDb(db);
  return Promise.resolve({ success: true });
};

// Score API
export const createOrUpdateScore = async (score: Score): Promise<Score> => {
  const db = getDb();
  const index = db.scores.findIndex(s => s.id === score.id);
  if (index > -1) {
    db.scores[index] = score;
  } else {
    // Generate an ID if it's a new score. The modal already does this, but this is a fallback.
    if (!score.id) {
        score.id = `s_${score.projectId}_${score.judgeId}_${Date.now()}`;
    }
    db.scores.push(score);
  }
  saveDb(db);
  return Promise.resolve(score);
};

export const deleteScore = async (scoreId: string): Promise<{ success: boolean }> => {
  const db = getDb();
  db.scores = db.scores.filter(s => s.id !== scoreId);
  saveDb(db);
  return Promise.resolve({ success: true });
};
