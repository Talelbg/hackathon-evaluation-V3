import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, Project, Judge, Criterion, Score, Track } from './types';
import * as dbService from './services/dbService';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import JudgeDashboard from './components/JudgeDashboard';
import Header from './components/Header';
import { MOCK_PROJECTS, MOCK_JUDGES, MOCK_CRITERIA, MOCK_SCORES } from './data/mockData';


function App() {
  const [user, setUser] = useState<{ role: UserRole; id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    // Load initial data from our "database" when the app starts
    const fetchData = async () => {
        try {
            const data = await dbService.getAllData();
            setProjects(data.projects);
            setJudges(data.judges);
            setCriteria(data.criteria);
            setScores(data.scores);
            setBackendError(null);
        } catch (error) {
            console.error("Failed to connect to backend:", error);
            setBackendError("Could not connect to the backend server. The application is running in offline mode with mock data. Please run 'npm install' and 'node server.js' in the 'backend' directory to enable full functionality.");
            // Fallback to mock data
            setProjects(MOCK_PROJECTS);
            setJudges(MOCK_JUDGES);
            setCriteria(MOCK_CRITERIA);
            setScores(MOCK_SCORES);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, []);

  const handleApiError = (error: unknown, context: string) => {
    console.error(context, error);
    if (!backendError) {
        setBackendError("Connection to server lost. Now in offline mode. Please ensure the backend is running and refresh the page to reconnect.");
    }
  };

  // --- Admin Handlers ---
  const addProjects = async (newProjectsData: Omit<Project, 'id'>[]) => {
      if (backendError) {
        const createdProjects = newProjectsData.map((p, i) => ({ ...p, id: `p_local_${Date.now()}_${i}` } as Project));
        setProjects(prev => [...prev, ...createdProjects]);
        return;
      }
      try {
        const createdProjects = await dbService.createProjects(newProjectsData);
        setProjects(prev => [...prev, ...createdProjects]);
      } catch (error) {
          handleApiError(error, 'Failed to add projects:');
      }
  };
  const editProject = async (updatedProject: Project) => {
      if (backendError) {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        return;
      }
      try {
        const savedProject = await dbService.updateProject(updatedProject);
        setProjects(prev => prev.map(p => p.id === savedProject.id ? savedProject : p));
      } catch (error) {
        handleApiError(error, `Failed to update project ${updatedProject.id}:`);
      }
  };
  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated scores and cannot be undone.')) {
        return;
    }
    if (backendError) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setScores(prev => prev.filter(s => s.projectId !== projectId));
        return;
    }
    try {
        await dbService.deleteProject(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setScores(prev => prev.filter(s => s.projectId !== projectId));
    } catch (error) {
        handleApiError(error, `Failed to delete project ${projectId}:`);
    }
  };

  const addJudge = async (newJudgeData: Omit<Judge, 'id'>) => {
    if (backendError) {
        const newJudge = { ...newJudgeData, id: `j_local_${Date.now()}`};
        setJudges(prev => [...prev, newJudge]);
        return newJudge;
    }
    try {
        const newJudge = await dbService.createJudge(newJudgeData);
        setJudges(prev => [...prev, newJudge]);
        return newJudge;
    } catch(error) {
        handleApiError(error, 'Failed to add judge:');
        // Return a temporary judge object so the UI can proceed without crashing.
        return { ...newJudgeData, id: `j_temp_${Date.now()}`};
    }
  };
  const editJudge = async (updatedJudge: Judge) => {
      if (backendError) {
        setJudges(prev => prev.map(j => j.id === updatedJudge.id ? updatedJudge : j));
        return;
      }
      try {
        const savedJudge = await dbService.updateJudge(updatedJudge);
        setJudges(prev => prev.map(j => j.id === savedJudge.id ? savedJudge : j));
      } catch (error) {
          handleApiError(error, `Failed to update judge ${updatedJudge.id}:`);
      }
  };
  const deleteJudge = async (judgeId: string) => {
    if (!window.confirm('Are you sure you want to delete this judge? This will also delete all their scores and cannot be undone.')) {
        return;
    }
    if (backendError) {
        setJudges(prev => prev.filter(j => j.id !== judgeId));
        setScores(prev => prev.filter(s => s.judgeId !== judgeId));
        return;
    }
    try {
        await dbService.deleteJudge(judgeId);
        setJudges(prev => prev.filter(j => j.id !== judgeId));
        setScores(prev => prev.filter(s => s.judgeId !== judgeId));
    } catch (error) {
        handleApiError(error, `Failed to delete judge ${judgeId}:`);
    }
  };

  const addCriterion = async (newCriterionData: Omit<Criterion, 'id'>) => {
      if (backendError) {
          const newCriterion = { ...newCriterionData, id: `c_local_${Date.now()}`};
          setCriteria(prev => [...prev, newCriterion]);
          return;
      }
      try {
        const newCriterion = await dbService.createCriterion(newCriterionData);
        setCriteria(prev => [...prev, newCriterion]);
      } catch(error) {
          handleApiError(error, 'Failed to add criterion:');
      }
  };
  const editCriterion = async (updatedCriterion: Criterion) => {
      if (backendError) {
          setCriteria(prev => prev.map(c => c.id === updatedCriterion.id ? updatedCriterion : c));
          return;
      }
      try {
        const savedCriterion = await dbService.updateCriterion(updatedCriterion);
        setCriteria(prev => prev.map(c => c.id === savedCriterion.id ? savedCriterion : c));
      } catch (error) {
        handleApiError(error, `Failed to update criterion ${updatedCriterion.id}:`);
      }
  };
  const deleteCriterion = async (criterionId: string) => {
     if (!window.confirm('Are you sure you want to delete this criterion? This could affect existing scores.')) {
        return;
     }
    if (backendError) {
        setCriteria(prev => prev.filter(c => c.id !== criterionId));
        return;
    }
    try {
        await dbService.deleteCriterion(criterionId);
        setCriteria(prev => prev.filter(c => c.id !== criterionId));
    } catch(error) {
        handleApiError(error, `Failed to delete criterion ${criterionId}:`);
    }
  };

  // --- Judge Handler ---
  const addOrUpdateScore = async (newScore: Score) => {
    if (backendError) {
        setScores(prev => {
            const index = prev.findIndex(s => s.id === newScore.id);
            if (index > -1) {
                const updatedScores = [...prev];
                updatedScores[index] = newScore;
                return updatedScores;
            }
            return [...prev, newScore];
        });
        return;
    }
    try {
        const savedScore = await dbService.createOrUpdateScore(newScore);
        setScores(prev => {
            const index = prev.findIndex(s => s.id === savedScore.id);
            if (index > -1) {
                const updatedScores = [...prev];
                updatedScores[index] = savedScore;
                return updatedScores;
            }
            return [...prev, savedScore];
        });
    } catch(error) {
        handleApiError(error, `Failed to save score for project ${newScore.projectId}:`);
    }
  };
  
  const deleteScore = async (scoreId: string) => {
    if (!window.confirm('Are you sure you want to delete this evaluation? This action cannot be undone.')) {
        return;
    }
    if (backendError) {
        setScores(prev => prev.filter(s => s.id !== scoreId));
        return;
    }
    try {
        await dbService.deleteScore(scoreId);
        setScores(prev => prev.filter(s => s.id !== scoreId));
    } catch(error) {
        handleApiError(error, `Failed to delete score ${scoreId}:`);
    }
  };

  const handleAdminLogin = () => setUser({ role: UserRole.ADMIN });

  const handleJuryLogin = async (judgeId: string, newJudgeData?: Omit<Judge, 'id'>) => {
    let finalJudgeId = judgeId;
    if (judgeId === 'new' && newJudgeData) {
      const newJudge = await addJudge(newJudgeData);
      finalJudgeId = newJudge.id;
    }
    setUser({ role: UserRole.JUDGE, id: finalJudgeId });
  };
  
  const handleLogout = () => setUser(null);

  const judgeData = useMemo(() => {
    if (user?.role !== UserRole.JUDGE || !user.id) {
        return null;
    }
    const currentJudge = judges.find(j => j.id === user.id);
    if (!currentJudge) {
        return null;
    }
    const judgeProjects = projects.filter(p => currentJudge.tracks.includes(p.track as Track));
    const judgeScores = scores.filter(s => s.judgeId === currentJudge.id);
    
    return { currentJudge, judgeProjects, judgeScores };
  }, [user, judges, projects, scores]);

  const renderContent = () => {
    if (isLoading) {
        return <div className="p-8 text-center">Loading platform data...</div>
    }

    if (!user) {
      return <LoginScreen onAdminLogin={handleAdminLogin} onJuryLogin={handleJuryLogin} judges={judges} />;
    }

    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminDashboard 
            projects={projects} 
            judges={judges} 
            criteria={criteria} 
            scores={scores}
            addProjects={addProjects}
            editProject={editProject}
            deleteProject={deleteProject}
            addJudge={addJudge}
            editJudge={editJudge}
            deleteJudge={deleteJudge}
            addCriterion={addCriterion}
            editCriterion={editCriterion}
            deleteCriterion={deleteCriterion}
        />;
      case UserRole.JUDGE:
        if (!judgeData) {
            // This can happen in offline mode if a new judge logs in and then refreshes
            const tempJudge = judges.find(j => j.id === user.id);
            if (tempJudge) {
                // If we can find the judge in state, let's try to render with what we have
                const judgeProjects = projects.filter(p => tempJudge.tracks.includes(p.track as Track));
                const judgeScores = scores.filter(s => s.judgeId === tempJudge.id);
                return <JudgeDashboard
                    judge={tempJudge}
                    projects={judgeProjects}
                    criteria={criteria}
                    scores={judgeScores}
                    onScoreSubmit={addOrUpdateScore}
                    onScoreDelete={deleteScore}
                />;
            }
            handleLogout();
            return <p className="p-8 text-center text-red-500">Your judge profile was not found. You have been logged out.</p>
        }
        
        return <JudgeDashboard
            judge={judgeData.currentJudge}
            projects={judgeData.judgeProjects}
            criteria={criteria}
            scores={judgeData.judgeScores}
            onScoreSubmit={addOrUpdateScore}
            onScoreDelete={deleteScore}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Header user={user} onLogout={handleLogout} judges={judges} />
      {backendError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 max-w-screen-xl mx-auto my-4 rounded-r-lg shadow-md" role="alert">
          <p className="font-bold">Offline Mode</p>
          <p>{backendError}</p>
        </div>
      )}
      <main className="max-w-screen-xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
