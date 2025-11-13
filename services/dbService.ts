// services/dbService.ts
import { Project, Judge, Criterion, Score } from '../types';
import { MOCK_PROJECTS, MOCK_JUDGES, MOCK_CRITERIA, MOCK_SCORES } from '../data/mockData';

interface DBState {
  projects: Project[];
  judges: Judge[];
  criteria: Criterion[];
  scores: Score[];
}

const DB_KEY = 'hah_eval_db';

// --- Private Helpers ---

const getDB = (): DBState => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to parse DB from localStorage", error);
  }
  
  // If no data, initialize with mock data
  const mockDB: DBState = {
    projects: MOCK_PROJECTS,
    judges: MOCK_JUDGES,
    criteria: MOCK_CRITERIA,
    scores: MOCK_SCORES,
  };
  setDB(mockDB);
  return mockDB;
};

const setDB = (db: DBState) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Failed to save DB to localStorage", error);
  }
};


// --- Public API (mimicking async behavior of a real API) ---

export const getAllData = async (): Promise<DBState> => {
  return Promise.resolve(getDB());
};

// Project API
export const createProjects = async (newProjectsData: Omit<Project, 'id'>[]): Promise<Project[]> => {
  const db = getDB();
  const createdProjects: Project[] = newProjectsData.map((p, i) => ({
    ...p,
    id: `p_local_${Date.now()}_${i}`,
  }));
  db.projects.push(...createdProjects);
  setDB(db);
  return Promise.resolve(createdProjects);
};

export const updateProject = async (updatedProject: Project): Promise<Project> => {
  const db = getDB();
  const index = db.projects.findIndex(p => p.id === updatedProject.id);
  if (index > -1) {
    db.projects[index] = updatedProject;
    setDB(db);
  }
  return Promise.resolve(updatedProject);
};

export const deleteProject = async (projectId: string): Promise<{ success: boolean }> => {
  const db = getDB();
  db.projects = db.projects.filter(p => p.id !== projectId);
  // Also delete associated scores
  db.scores = db.scores.filter(s => s.projectId !== projectId);
  setDB(db);
  return Promise.resolve({ success: true });
};

// Judge API
export const createJudge = async (newJudgeData: Omit<Judge, 'id'>): Promise<Judge> => {
  const db = getDB();
  const newJudge: Judge = {
    ...newJudgeData,
    id: `j_local_${Date.now()}`,
  };
  db.judges.push(newJudge);
  setDB(db);
  return Promise.resolve(newJudge);
};

export const updateJudge = async (updatedJudge: Judge): Promise<Judge> => {
  const db = getDB();
  const index = db.judges.findIndex(j => j.id === updatedJudge.id);
  if (index > -1) {
    db.judges[index] = updatedJudge;
    setDB(db);
  }
  return Promise.resolve(updatedJudge);
};

export const deleteJudge = async (judgeId: string): Promise<{ success: boolean }> => {
  const db = getDB();
  db.judges = db.judges.filter(j => j.id !== judgeId);
  // Also delete associated scores
  db.scores = db.scores.filter(s => s.judgeId !== judgeId);
  setDB(db);
  return Promise.resolve({ success: true });
};

// Criterion API
export const createCriterion = async (newCriterionData: Omit<Criterion, 'id'>): Promise<Criterion> => {
  const db = getDB();
  const newCriterion: Criterion = {
    ...newCriterionData,
    id: `c_local_${Date.now()}`,
  };
  db.criteria.push(newCriterion);
  setDB(db);
  return Promise.resolve(newCriterion);
};

export const updateCriterion = async (updatedCriterion: Criterion): Promise<Criterion> => {
  const db = getDB();
  const index = db.criteria.findIndex(c => c.id === updatedCriterion.id);
  if (index > -1) {
    db.criteria[index] = updatedCriterion;
    setDB(db);
  }
  return Promise.resolve(updatedCriterion);
};

export const deleteCriterion = async (criterionId: string): Promise<{ success: boolean }> => {
  const db = getDB();
  db.criteria = db.criteria.filter(c => c.id !== criterionId);
  // Note: Deleting a criterion doesn't automatically remove parts of scores,
  // as that could be complex. The evaluation service should handle missing criteria gracefully.
  setDB(db);
  return Promise.resolve({ success: true });
};

// Score API
export const createOrUpdateScore = async (score: Score): Promise<Score> => {
  const db = getDB();
  // Ensure it has an ID if it's new, then find its index
  if (!score.id) {
      score.id = `s_${score.projectId}_${score.judgeId}_${Date.now()}`;
  }
  const index = db.scores.findIndex(s => s.id === score.id);
  
  if (index > -1) {
    db.scores[index] = score;
  } else {
    db.scores.push(score);
  }
  setDB(db);
  return Promise.resolve(score);
};

export const deleteScore = async (scoreId: string): Promise<{ success: boolean }> => {
  const db = getDB();
  db.scores = db.scores.filter(s => s.id !== scoreId);
  setDB(db);
  return Promise.resolve({ success: true });
};
