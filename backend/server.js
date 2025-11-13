// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const query = require('./db');

const app = express();
const PORT = 3001;

// --- Instructions ---
// This backend now connects to a PostgreSQL database.
// 1. Ensure you have a `.env` file in this `backend` directory with the `DATABASE_URL`.
//    (You can copy `.env.example` to create it).
// 2. Run the SQL commands in `schema.sql` on your database to create the necessary tables and seed initial data.
// 3. Navigate to the `backend` directory in your terminal.
// 4. Run `npm install` to install dependencies.
// 5. Run `node server.js` to start the server.
// The server will run on http://localhost:3001.

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- General Error Handler ---
const handleError = (res, error, context) => {
  console.error(`Error in ${context}:`, error);
  res.status(500).json({ message: `An error occurred in ${context}.`, error: error.message });
};


// --- API Routes ---

// GET all data
app.get('/api/data', async (req, res) => {
  try {
    const [projectsRes, judgesRes, criteriaRes, scoresRes] = await Promise.all([
      query('SELECT * FROM projects ORDER BY name'),
      query('SELECT * FROM judges ORDER BY name'),
      query('SELECT * FROM criteria ORDER BY id'),
      query('SELECT * FROM scores ORDER BY id'),
    ]);
    res.json({
      projects: projectsRes.rows,
      judges: judgesRes.rows,
      criteria: criteriaRes.rows,
      scores: scoresRes.rows,
    });
  } catch (error) {
    handleError(res, error, 'fetching all data');
  }
});

// PROJECTS
app.post('/api/projects', async (req, res) => {
  try {
    const newProjectsData = req.body; // Expects an array
    const createdProjects = [];
    // Using a loop to insert projects one by one to handle potential errors individually
    for (const [i, p] of newProjectsData.entries()) {
        const newProject = {
            id: `p_${Date.now()}_${i}`,
            ...p,
            links: p.links || null // Ensure links is null if not provided
        };
        const result = await query(
            'INSERT INTO projects (id, name, description, track, trl, links) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [newProject.id, newProject.name, newProject.description, newProject.track, newProject.trl, newProject.links]
        );
        createdProjects.push(result.rows[0]);
    }
    res.status(201).json(createdProjects);
  } catch(error) {
    handleError(res, error, 'creating projects');
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const result = await query(
      'UPDATE projects SET name = $1, description = $2, track = $3, trl = $4, links = $5 WHERE id = $6 RETURNING *',
      [p.name, p.description, p.track, p.trl, p.links || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Project not found' });
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error, 'updating project');
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM projects WHERE id = $1', [id]);
    // The schema is set to ON DELETE CASCADE, so scores will be deleted automatically.
    if (result.rowCount === 0) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json({ success: true });
  } catch (error) {
    handleError(res, error, 'deleting project');
  }
});

// JUDGES
app.post('/api/judges', async (req, res) => {
    try {
        const newJudgeData = req.body;
        const newJudge = { id: `j_${Date.now()}`, ...newJudgeData };
        const result = await query(
            'INSERT INTO judges (id, name, tracks) VALUES ($1, $2, $3) RETURNING *',
            [newJudge.id, newJudge.name, newJudge.tracks]
        );
        res.status(201).json(result.rows[0]);
    } catch(error) {
        handleError(res, error, 'creating judge');
    }
});

app.put('/api/judges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const judge = req.body;
        const result = await query(
            'UPDATE judges SET name = $1, tracks = $2 WHERE id = $3 RETURNING *',
            [judge.name, judge.tracks, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Judge not found' });
        res.json(result.rows[0]);
    } catch (error) {
        handleError(res, error, 'updating judge');
    }
});

app.delete('/api/judges/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM judges WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Judge not found' });
        res.status(200).json({ success: true });
    } catch (error) {
        handleError(res, error, 'deleting judge');
    }
});

// CRITERIA
app.post('/api/criteria', async (req, res) => {
    try {
        const newCriterionData = req.body;
        const newCriterion = { id: `c_${Date.now()}`, ...newCriterionData };
        const result = await query(
            'INSERT INTO criteria (id, name, weight) VALUES ($1, $2, $3) RETURNING *',
            [newCriterion.id, newCriterion.name, newCriterion.weight]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        handleError(res, error, 'creating criterion');
    }
});

app.put('/api/criteria/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const criterion = req.body;
        const result = await query(
            'UPDATE criteria SET name = $1, weight = $2 WHERE id = $3 RETURNING *',
            [criterion.name, criterion.weight, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Criterion not found' });
        res.json(result.rows[0]);
    } catch (error) {
        handleError(res, error, 'updating criterion');
    }
});

app.delete('/api/criteria/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM criteria WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Criterion not found' });
        res.status(200).json({ success: true });
    } catch (error) {
        handleError(res, error, 'deleting criterion');
    }
});

// SCORES
app.post('/api/scores', async (req, res) => { // Handles upsert
    try {
        const score = req.body;
        const queryText = `
            INSERT INTO scores (id, "projectId", "judgeId", "criteriaScores", "juryTrl", notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
                "projectId" = EXCLUDED."projectId",
                "judgeId" = EXCLUDED."judgeId",
                "criteriaScores" = EXCLUDED."criteriaScores",
                "juryTrl" = EXCLUDED."juryTrl",
                notes = EXCLUDED.notes
            RETURNING *;
        `;
        const result = await query(queryText, [score.id, score.projectId, score.judgeId, score.criteriaScores, score.juryTrl, score.notes]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        handleError(res, error, 'creating or updating score');
    }
});

app.delete('/api/scores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM scores WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Score not found' });
        res.status(200).json({ success: true });
    } catch (error) {
        handleError(res, error, 'deleting score');
    }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
