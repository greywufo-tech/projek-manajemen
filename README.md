<img width="640" height="293" alt="image" src="https://github.com/user-attachments/assets/c6384c2c-0a35-4ede-af0c-05a21a87097c" />

# Project Management & Task Scheduling System

Aplikasi web full-stack untuk manajemen proyek perangkat lunak dengan fitur Gantt Chart, fase SDLC, alokasi resource tim, dan ketergantungan tugas.

## Stack Teknologi

- Backend: Node.js + Express.js
- Database: SQLite (via sql.js)
- Frontend: HTML5, Tailwind CSS (CDN), Vanilla JavaScript
- Visualisasi: Gantt Chart custom (SVG)

## Instalasi

```bash
npm install
```

## Menjalankan Aplikasi

```bash
npm start
# atau
node server.js
```

Buka browser dan akses: **http://localhost:3000**

## Fitur

1. **Manajemen Proyek** - Buat, edit, hapus proyek (nama, deskripsi, organisasi/klien, tanggal mulai & selesai)
2. **Manajemen Tugas & Fase SDLC** - CRUD tugas, pengelompokan berdasarkan 6 fase SDLC, durasi, prioritas, status
3. **Ketergantungan Tugas** - Hubungkan tugas dengan predecessor, atur jenis hubungan (FS/SS/FF/SF) dan lag/jeda hari
4. **Manajemen Sumber Daya Tim** - Daftarkan anggota tim (nama, peran, kontak, gaji), alokasi penugasan ke tugas
5. **Gantt Chart** - Visualisasi timeline tugas dengan bar berwarna, milestone, indikator today, dan hubungan ketergantungan

## Struktur Folder

```
.
├── server.js          # Express server + REST API
├── db/
│   └── init.js         # Inisialisasi database SQLite
├── public/
│   ├── index.html      # Single page application
│   ├── css/
│   │   └── style.css   # Custom styles
│   └── js/
│       ├── app.js      # Logic frontend (CRUD, nav, modals)
│       └── gantt.js    # Rendering Gantt Chart SVG
├── package.json
└── README.md
```

## API Endpoints

- `GET/POST /api/projects` - Daftar / buat proyek
- `PUT/DELETE /api/projects/:id` - Edit / hapus proyek
- `GET /api/phases` - Daftar fase SDLC
- `GET/POST /api/projects/:projectId/tasks` - Daftar / buat tugas
- `PUT/DELETE /api/tasks/:id` - Edit / hapus tugas
- `GET/POST /api/resources` - Daftar / buat resource tim
- `PUT/DELETE /api/resources/:id` - Edit / hapus resource
- `GET/POST /api/tasks/:taskId/assignments` - Alokasikan resource ke tugas
- `DELETE /api/assignments/:id` - Batalkan alokasi
- `GET/POST /api/tasks/:taskId/dependencies` - Lihat / tambah ketergantungan
- `DELETE /api/dependencies/:id` - Hapus ketergantungan
- `GET/POST /api/projects/:projectId/milestones` - Milestone
- `DELETE /api/milestones/:id` - Hapus milestone
- `GET /api/projects/:projectId/gantt` - Data untuk Gantt Chart

## Notes

- Database disimpan di `data/pms.db` (SQLite file 기반)
- Tidak diperlukan konfigurasi database eksternal
- Aplikasi berjalan di localhost:3000 secara default
