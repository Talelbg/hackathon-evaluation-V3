import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, Project, Judge, Criterion, Score, Track } from './types';
import * as dbService from './services/dbService';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import JudgeDashboard from './components/JudgeDashboard';
import Header from './components/Header';

function App() {
  const [user, setUser] = useState<{ role: UserRole; id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    // Load initial data from our "database" when the app starts
    const fetchData = async () => {
        const data = await dbService.getAllData();
        setProjects(data.projects);
        setJudges(data.judges);
        setCriteria(data.criteria);
        setScores(data.scores);
        setIsLoading(false);
    };
    fetchData();
  }, []);


  // --- Admin Handlers ---
  const addProjects = async (newProjectsData: Omit<Project, 'id'>[]) => {
      const createdProjects = await dbService.createProjects(newProjectsData);
      setProjects(prev => [...prev, ...createdProjects]);
  };
  const editProject = async (updatedProject: Project) => {
      const savedProject = await dbService.updateProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === savedProject.id ? savedProject : p));
  };
  const deleteProject = async (projectId: string) => {
    await dbService.deleteProject(projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setScores(prev => prev.filter(s => s.projectId !== projectId));
  };

  const addJudge = async (newJudgeData: Omit<Judge, 'id'>) => {
    const newJudge = await dbService.createJudge(newJudgeData);
    setJudges(prev => [...prev, newJudge]);
    return newJudge;
  };
  const editJudge = async (updatedJudge: Judge) => {
      const savedJudge = await dbService.updateJudge(updatedJudge);
      setJudges(prev => prev.map(j => j.id === savedJudge.id ? savedJudge : j));
  };
  const deleteJudge = async (judgeId: string) => {
    await dbService.deleteJudge(judgeId);
    setJudges(prev => prev.filter(j => j.id !== judgeId));
    setScores(prev => prev.filter(s => s.judgeId !== judgeId));
  };

  const addCriterion = async (newCriterionData: Omit<Criterion, 'id'>) => {
      const newCriterion = await dbService.createCriterion(newCriterionData);
      setCriteria(prev => [...prev, newCriterion]);
  };
  const editCriterion = async (updatedCriterion: Criterion) => {
      const savedCriterion = await dbService.updateCriterion(updatedCriterion);
      setCriteria(prev => prev.map(c => c.id === savedCriterion.id ? savedCriterion : c));
  };
  const deleteCriterion = async (criterionId: string) => {
    await dbService.deleteCriterion(criterionId);
    setCriteria(prev => prev.filter(c => c.id !== criterionId));
  };

  // --- Judge Handler ---
  const addOrUpdateScore = async (newScore: Score) => {
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
  };
  
  const deleteScore = async (scoreId: string) => {
    await dbService.deleteScore(scoreId);
    setScores(prev => prev.filter(s => s.id !== scoreId));
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
        // This could happen if a judge was deleted while they were logged in.
        // Log them out gracefully.
        handleLogout();
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
            return <p className="p-8 text-center text-red-500">Your judge profile was not found. You may have been logged out.</p>
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
      <main className="max-w-screen-xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
