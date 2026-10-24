const express = require('express');
const path = require('path');
const { initDb, dbPrepare, saveDb } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

let db;

async function startServer() {
  db = await initDb();
  console.log('Database initialized.');

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));



  // ======================== PROJECTS ========================
  app.get('/api/projects', (req, res) => {
    res.json(dbPrepare('SELECT * FROM projects ORDER BY created_at DESC').all());
  });

  app.post('/api/projects', (req, res) => {
    const { name, description, organization, start_date, end_date } = req.body;
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Nama, tanggal mulai, dan tanggal selesai wajib diisi.' });
    }
    const info = dbPrepare('INSERT INTO projects (name, description, organization, start_date, end_date) VALUES (?, ?, ?, ?, ?)').run(
      name, description || '', organization || '', start_date, end_date
    );
    const project = dbPrepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(project);
  });

  app.put('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, organization, start_date, end_date } = req.body;
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Nama, tanggal mulai, dan tanggal selesai wajib diisi.' });
    }
    dbPrepare('UPDATE projects SET name=?, description=?, organization=?, start_date=?, end_date=? WHERE id=?').run(
      name, description || '', organization || '', start_date, end_date, id
    );
    const project = dbPrepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(project);
  });

  app.delete('/api/projects/:id', (req, res) => {
    dbPrepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ======================== PHASES ========================
  app.get('/api/phases', (req, res) => {
    res.json(dbPrepare('SELECT * FROM phases ORDER BY sort_order').all());
  });

  // ======================== TASKS ========================
  app.get('/api/projects/:projectId/tasks', (req, res) => {
    const { projectId } = req.params;
    res.json(dbPrepare(`
      SELECT t.*, p.name AS phase_name
      FROM tasks t
      LEFT JOIN phases p ON t.phase_id = p.id
      WHERE t.project_id = ?
      ORDER BY t.id
    `).all(projectId));
  });

  app.post('/api/projects/:projectId/tasks', (req, res) => {
    const { projectId } = req.params;
    const { name, description, phase_id, duration_days, priority, start_date, end_date, status } = req.body;
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Nama, tanggal mulai, dan tanggal selesai wajib diisi.' });
    }
    const info = dbPrepare(
      'INSERT INTO tasks (project_id, phase_id, name, description, duration_days, priority, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      projectId,
      phase_id || null,
      name,
      description || '',
      duration_days || 1,
      priority || 'Normal',
      start_date,
      end_date,
      status || 'Planning'
    );
    const task = dbPrepare('SELECT t.*, p.name AS phase_name FROM tasks t LEFT JOIN phases p ON t.phase_id = p.id WHERE t.id = ?').get(info.lastInsertRowid);
    res.status(201).json(task);
  });

  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, phase_id, duration_days, priority, start_date, end_date, status } = req.body;
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Nama, tanggal mulai, dan tanggal selesai wajib diisi.' });
    }
    dbPrepare(
      'UPDATE tasks SET phase_id=?, name=?, description=?, duration_days=?, priority=?, start_date=?, end_date=?, status=? WHERE id=?'
    ).run(phase_id || null, name, description || '', duration_days || 1, priority || 'Normal', start_date, end_date, status || 'Planning', id);
    const task = dbPrepare('SELECT t.*, p.name AS phase_name FROM tasks t LEFT JOIN phases p ON t.phase_id = p.id WHERE t.id = ?').get(id);
    res.json(task);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    dbPrepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ======================== RESOURCES ========================
  app.get('/api/resources', (req, res) => {
    res.json(dbPrepare('SELECT * FROM resources ORDER BY name').all());
  });

  app.post('/api/resources', (req, res) => {
    const { name, role, contact, salary } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'Nama dan peran wajib diisi.' });
    }
    const info = dbPrepare('INSERT INTO resources (name, role, contact, salary) VALUES (?, ?, ?, ?)').run(name, role, contact || '', salary || 0);
    const resource = dbPrepare('SELECT * FROM resources WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(resource);
  });

  app.put('/api/resources/:id', (req, res) => {
    const { id } = req.params;
    const { name, role, contact, salary } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'Nama dan peran wajib diisi.' });
    }
    dbPrepare('UPDATE resources SET name=?, role=?, contact=?, salary=? WHERE id=?').run(name, role, contact || '', salary || 0, id);
    const resource = dbPrepare('SELECT * FROM resources WHERE id = ?').get(id);
    res.json(resource);
  });

  app.delete('/api/resources/:id', (req, res) => {
    dbPrepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ======================== TASK ASSIGNMENTS ========================
  app.get('/api/tasks/:taskId/assignments', (req, res) => {
    const { taskId } = req.params;
    res.json(dbPrepare(`
      SELECT ta.*, r.name AS resource_name, r.role, r.contact, r.salary
      FROM task_assignments ta
      JOIN resources r ON ta.resource_id = r.id
      WHERE ta.task_id = ?
    `).all(taskId));
  });

  app.post('/api/tasks/:taskId/assignments', (req, res) => {
    const { taskId } = req.params;
    const { resource_id } = req.body;
    if (!resource_id) return res.status(400).json({ error: 'resource_id wajib.' });
    try {
      dbPrepare('INSERT INTO task_assignments (task_id, resource_id) VALUES (?, ?)').run(taskId, resource_id);
      const rows = dbPrepare(`
        SELECT ta.*, r.name AS resource_name, r.role, r.contact, r.salary
        FROM task_assignments ta
        JOIN resources r ON ta.resource_id = r.id
        WHERE ta.task_id = ?
      `).all(taskId);
      res.json(rows);
    } catch (e) {
      res.status(400).json({ error: 'Penugasan sudah ada atau data tidak valid.' });
    }
  });

  app.delete('/api/assignments/:id', (req, res) => {
    dbPrepare('DELETE FROM task_assignments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ======================== DEPENDENCIES ========================
  app.get('/api/tasks/:taskId/dependencies', (req, res) => {
    const { taskId } = req.params;
    res.json(dbPrepare(`
      SELECT d.*, t.id AS predecessor_task_id, t.name AS predecessor_name,
             t.project_id AS predecessor_project_id
      FROM dependencies d
      JOIN tasks t ON d.predecessor_id = t.id
      WHERE d.task_id = ?
    `).all(taskId));
  });

  app.post('/api/tasks/:taskId/dependencies', (req, res) => {
    const { taskId } = req.params;
    const { predecessor_id, relation_type, lag_days } = req.body;
    if (!predecessor_id) return res.status(400).json({ error: 'predecessor_id wajib.' });
    try {
      dbPrepare('INSERT INTO dependencies (task_id, predecessor_id, relation_type, lag_days) VALUES (?, ?, ?, ?)')
        .run(taskId, predecessor_id, relation_type || 'FS', lag_days || 0);
      const rows = dbPrepare(`
        SELECT d.*, t.id AS predecessor_task_id, t.name AS predecessor_name, t.project_id AS predecessor_project_id
        FROM dependencies d
        JOIN tasks t ON d.predecessor_id = t.id
        WHERE d.task_id = ?
      `).all(taskId);
      res.json(rows);
    } catch (e) {
      res.status(400).json({ error: 'Ketergantungan sudah ada atau data tidak valid.' });
    }
  });

  app.delete('/api/dependencies/:id', (req, res) => {
    dbPrepare('DELETE FROM dependencies WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ======================== MILESTONES ========================
  app.get('/api/projects/:projectId/milestones', (req, res) => {
    res.json(dbPrepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY date_text').all(req.params.projectId));
  });

  app.post('/api/projects/:projectId/milestones', (req, res) => {
    const { projectId } = req.params;
    const { name, date_text, description } = req.body;
    if (!name || !date_text) return res.status(400).json({ error: 'Nama dan tanggal wajib.' });
    const info = dbPrepare('INSERT INTO milestones (project_id, name, date_text, description) VALUES (?, ?, ?, ?)')
      .run(projectId, name, date_text, description || '');
    const m = dbPrepare('SELECT * FROM milestones WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(m);
  });

  app.delete('/api/milestones/:id', (req, res) => {
    dbPrepare('DELETE FROM milestones WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ======================== GANTT DATA ========================
  app.get('/api/projects/:projectId/gantt', (req, res) => {
    const { projectId } = req.params;
    const project = dbPrepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Proyek tidak ditemukan.' });

    const tasks = dbPrepare(`
      SELECT t.*, p.name AS phase_name
      FROM tasks t
      LEFT JOIN phases p ON t.phase_id = p.id
      WHERE t.project_id = ?
      ORDER BY t.start_date, t.id
    `).all(projectId);

    const deps = dbPrepare(`
      SELECT d.*, t.name AS predecessor_name
      FROM dependencies d
      JOIN tasks t ON d.predecessor_id = t.id
      WHERE d.task_id IN (SELECT id FROM tasks WHERE project_id = ?)
    `).all(projectId);

    const milestones = dbPrepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY date_text').all(projectId);
    const assignments = dbPrepare(`
      SELECT ta.*, r.name AS resource_name, r.role
      FROM task_assignments ta
      JOIN resources r ON ta.resource_id = r.id
      WHERE ta.task_id IN (SELECT id FROM tasks WHERE project_id = ?)
    `).all(projectId);

    res.json({ project, tasks, dependencies: deps, milestones, assignments });
  });

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Project Management System running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
