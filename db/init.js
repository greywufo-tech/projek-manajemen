const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'pms.db');

let SQL;
let db;

async function initDb() {
  SQL = await initSqlJs();
  if (!fs.existsSync(dbPath)) {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        organization TEXT DEFAULT '',
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        sort_order INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        phase_id INTEGER,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        duration_days INTEGER NOT NULL DEFAULT 1,
        priority TEXT NOT NULL DEFAULT 'Normal',
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Planning',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (phase_id) REFERENCES phases(id)
      );
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        contact TEXT DEFAULT '',
        salary REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS task_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        resource_id INTEGER NOT NULL,
        assigned_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
        UNIQUE(task_id, resource_id)
      );
      CREATE TABLE IF NOT EXISTS dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        predecessor_id INTEGER NOT NULL,
        relation_type TEXT NOT NULL DEFAULT 'FS',
        lag_days INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE,
        UNIQUE(task_id, predecessor_id)
      );
      CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        date_text TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);
    const phases = [
      ['Analisis Kebutuhan', 1],
      ['Analisis Sistem', 2],
      ['Perancangan / Desain', 3],
      ['Implementasi / Coding', 4],
      ['Pengujian / Testing', 5],
      ['Deployment & Maintenance', 6]
    ];
    // Use db.run with array params - the only form that persists in sql.js
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Analisis Kebutuhan', 1]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Analisis Sistem', 2]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Perancangan / Desain', 3]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Implementasi / Coding', 4]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Pengujian / Testing', 5]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Deployment & Maintenance', 6]);
    // Verify persistence
    const data = db.export();
    const verifyDb = new SQL.Database(data);
    const verify = verifyDb.exec('SELECT * FROM phases');
    console.log('Phases verification:', JSON.stringify(verify));
    console.log('Phases count:', verify ? verify[0].values.length : 0);
    saveDb();
    console.log('DB saved.');
  } else {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('Loaded DB, phases count:', db.exec('SELECT * FROM phases')[0]?.values.length || 0);
  }
  return db;
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Wrapped interface to mimic better-sqlite3 API
const wrapper = {
  prepare(sql) {
    return {
      run(...params) {
        db.run(sql, params);
        saveDb();
        const res = db.exec('SELECT last_insert_rowid()');
        const lastId = res && res[0] && res[0].values[0] ? res[0].values[0][0] : 0;
        return { lastInsertRowid: lastId };
      },
      get(...params) {
        const results = db.exec(sql, params);
        if (!results.length || !results[0].values.length) return undefined;
        const cols = results[0].columns;
        const row = results[0].values[0];
        const obj = {};
        cols.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      },
      all(...params) {
        const results = db.exec(sql, params);
        if (!results.length) return [];
        const rows = [];
        const cols = results[0].columns;
        for (const row of results[0].values) {
          const obj = {};
          cols.forEach((col, i) => { obj[col] = row[i]; });
          rows.push(obj);
        }
        return rows;
      }
    };
  },
  exec(sql) {
    db.run(sql);
    saveDb();
  },
  pragma(...args) {
    // no-op for sql.js
  }
};

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'pms.db');

let SQL;
let db;

async function initDb() {
  SQL = await initSqlJs();
  if (!fs.existsSync(dbPath)) {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        organization TEXT DEFAULT '',
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        sort_order INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        phase_id INTEGER,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        duration_days INTEGER NOT NULL DEFAULT 1,
        priority TEXT NOT NULL DEFAULT 'Normal',
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Planning',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (phase_id) REFERENCES phases(id)
      );
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        contact TEXT DEFAULT '',
        salary REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS task_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        resource_id INTEGER NOT NULL,
        assigned_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
        UNIQUE(task_id, resource_id)
      );
      CREATE TABLE IF NOT EXISTS dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        predecessor_id INTEGER NOT NULL,
        relation_type TEXT NOT NULL DEFAULT 'FS',
        lag_days INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE,
        UNIQUE(task_id, predecessor_id)
      );
      CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        date_text TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Analisis Kebutuhan', 1]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Analisis Sistem', 2]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Perancangan / Desain', 3]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Implementasi / Coding', 4]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Pengujian / Testing', 5]);
    db.run('INSERT OR IGNORE INTO phases (name, sort_order) VALUES (?, ?)', ['Deployment & Maintenance', 6]);
    // Save and reload to verify persistence
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    const checkDb = new SQL.Database(fs.readFileSync(dbPath));
    console.log('DB created. Phases in file:', checkDb.exec('SELECT * FROM phases')[0]?.values.length || 0);
    checkDb.close();
  } else {
    db = new SQL.Database(fs.readFileSync(dbPath));
    console.log('DB loaded. Phases in file:', db.exec('SELECT * FROM phases')[0]?.values.length || 0);
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// Wrapped interface to mimic better-sqlite3 API
// IMPORTANT: uses closure over `db` variable, not a getter
const wrapper = {
  prepare(sql) {
    return {
      run(...params) {
        db.run(sql, params);
        saveDb();
        const res = db.exec('SELECT last_insert_rowid()');
        const lastId = res && res[0] && res[0].values[0] ? res[0].values[0][0] : 0;
        return { lastInsertRowid: lastId };
      },
      get(...params) {
        const results = db.exec(sql, params);
        if (!results.length || !results[0].values.length) return undefined;
        const cols = results[0].columns;
        const row = results[0].values[0];
        const obj = {};
        cols.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      },
      all(...params) {
        const results = db.exec(sql, params);
        if (!results.length) return [];
        const rows = [];
        const cols = results[0].columns;
        for (const row of results[0].values) {
          const obj = {};
          cols.forEach((col, i) => { obj[col] = row[i]; });
          rows.push(obj);
        }
        return rows;
      }
    };
  },
  exec(sql) {
    db.run(sql);
    saveDb();
  }
};

module.exports = {
  initDb,
  dbPrepare: wrapper.prepare,
  saveDb
};
module.exports.initDb = initDb;
module.exports.saveDb = saveDb;
