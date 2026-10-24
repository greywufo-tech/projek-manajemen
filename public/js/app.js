/* ============ TOAST ============ */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-indigo-600',
    warning: 'bg-amber-500',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${colors[type] || colors.info} text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ============ NAVIGATION ============ */
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.remove('hidden');
  const btn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
  if (btn) btn.classList.add('active');

  if (viewName === 'dashboard') loadDashboard();
  if (viewName === 'projects') loadProjects();
  if (viewName === 'tasks') loadTasks();
  if (viewName === 'dependencies') loadDependencies();
  if (viewName === 'resources') loadResources();
  if (viewName === 'gantt') loadGantt();
}

/* ============ MODAL ============ */
let currentModalCallback = null;

function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  box.innerHTML = html;
  overlay.classList.remove('hidden');
  box.classList.remove('hidden');
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay') || e.target.classList.contains('modal-close-btn')) {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-box').classList.add('hidden');
    currentModalCallback = null;
  }
}

function openProjectModal(project = null) {
  const isEdit = !!project;
  const title = isEdit ? 'Edit Proyek' : 'Buat Proyek Baru';
  const btnLabel = isEdit ? 'Simpan Perubahan' : 'Buat Proyek';
  const dataAttr = isEdit
    ? `data-id="${project.id}" data-name="${escapeHtml(project.name)}" data-desc="${escapeHtml(project.description)}" data-org="${escapeHtml(project.organization)}" data-start="${project.start_date}" data-end="${project.end_date}"`
    : '';

  openModal(`
    <div class="modal-box">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-800">${title}</h3>
        <button class="modal-close-btn text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>
      <form id="modal-form" class="space-y-4" onsubmit="handleFormSubmit(event)">
        <input type="hidden" name="id" value="${project?.id || ''}">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Proyek *</label>
          <input type="text" name="name" value="${isEdit ? escapeHtml(project.name) : ''}" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea name="description" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">${isEdit ? escapeHtml(project.description) : ''}</textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Organisasi / Klien</label>
          <input type="text" name="organization" value="${isEdit ? escapeHtml(project.organization) : ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
            <input type="date" name="start_date" value="${isEdit ? project.start_date : ''}" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai *</label>
            <input type="date" name="end_date" value="${isEdit ? project.end_date : ''}" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeModal({target: document.getElementById('modal-overlay')})" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition">Batal</button>
          <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition font-medium">${btnLabel}</button>
        </div>
      </form>
    </div>
  `);
}

function openTaskModal(task = null, projectId = null) {
  const isEdit = !!task;
  const title = isEdit ? 'Edit Tugas' : 'Buat Tugas Baru';
  const btnLabel = isEdit ? 'Simpan Perubahan' : 'Buat Tugas';
  const projectIdInput = projectId || task?.project_id || '';

  // populate phase dropdown
  fetch('/api/phases')
    .then(r => r.json())
    .then(phases => {
      const phaseOpts = phases.map(p =>
        `<option value="${p.id}" ${isEdit && task.phase_id === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
      ).join('');

      const priorityOpts = ['Low', 'Normal', 'High'].map(pr =>
        `<option value="${pr}" ${isEdit && task.priority === pr ? 'selected' : ''}>${pr}</option>`
      ).join('');

      const statusOpts = ['Planning', 'In Progress', 'Review', 'Done', 'Blocked'].map(st =>
        `<option value="${st}" ${isEdit && task.status === st ? 'selected' : ''}>${st}</option>`
      ).join('');

      openModal(`
        <div class="modal-box">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800">${title}</h3>
            <button class="modal-close-btn text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <form id="modal-form" class="space-y-4" onsubmit="handleFormSubmit(event)">
            <input type="hidden" name="id" value="${task?.id || ''}">
            <input type="hidden" name="project_id" value="${projectIdInput}">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama Tugas *</label>
              <input type="text" name="name" value="${isEdit ? escapeHtml(task.name) : ''}" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea name="description" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">${isEdit ? escapeHtml(task.description) : ''}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fase SDLC</label>
                <select name="phase_id" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white">
                  <option value="">-- Pilih fase --</option>
                  ${phaseOpts}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                <select name="priority" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white">
                  ${priorityOpts}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Durasi (hari kerja)</label>
                <input type="number" name="duration_days" min="1" value="${isEdit ? task.duration_days : 1}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white">
                  ${statusOpts}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
                <input type="date" name="start_date" value="${isEdit ? task.start_date : $(`[data-view="tasks"]`).querySelector('#task-project-filter').value}" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Target Selesai *</label>
                <input type="date" name="end_date" value="${isEdit ? task.end_date : ''}" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" onclick="closeModal({target: document.getElementById('modal-overlay')})" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition">Batal</button>
              <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition font-medium">${btnLabel}</button>
            </div>
          </form>
        </div>
      `);
    });
}

function openDependencyModal() {
  const taskId = document.getElementById('dep-task-filter').value;
  if (!taskId) { showToast('Pilih tugas terlebih dahulu.', 'warning'); return; }

  // Get all tasks in same project
  fetch('/api/projects/' + getTaskProjectId(taskId) + '/tasks')
    .then(r => r.json())
    .then(tasks => {
      const taskOpts = tasks.filter(t => t.id != taskId).map(t =>
        `<option value="${t.id}">${escapeHtml(t.name)} (${t.id})</option>`
      ).join('');

      openModal(`
        <div class="modal-box">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800">Tambah Ketergantungan Tugas</h3>
            <button class="modal-close-btn text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <form id="modal-form" class="space-y-4" onsubmit="handleFormSubmit(event)">
            <input type="hidden" name="action" value="add-dependency">
            <input type="hidden" name="task_id" value="${taskId}">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tugas Pendahulu (Predecessor) *</label>
              <select name="predecessor_id" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white">
                <option value="">-- Pilih --</option>
                ${taskOpts}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Hubungan</label>
              <select name="relation_type" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white">
                <option value="FS">FS - Finish-to-Start (dimulai setelah pendahulu selesai)</option>
                <option value="SS">SS - Start-to-Start (dimulai bersamaan + delay)</option>
                <option value="FF">FF - Finish-to-Finish (selesai bersamaan + delay)</option>
                <option value="SF">SF - Start-to-Finish (jarang digunakan)</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">FS: Start = Predecessor.End + Lag</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Lag / Jeda (hari)</label>
              <input type="number" name="lag_days" min="0" value="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
              <p class="text-xs text-gray-500 mt-1">Nilai positif: penundaan; negatif: overlap</p>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" onclick="closeModal({target: document.getElementById('modal-overlay')})" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition">Batal</button>
              <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition font-medium">Tambah Ketergantungan</button>
            </div>
          </form>
        </div>
      `);
    });
}

function openResourceModal(resource = null) {
  const isEdit = !!resource;
  const title = isEdit ? 'Edit Anggota Tim' : 'Tambah Anggota Tim';
  const btnLabel = isEdit ? 'Simpan Perubahan' : 'Tambah Anggota';

  const roleOpts = ['Project Manager', 'System Analyst', 'Programmer', 'Tester', 'UI/UX Designer', 'DevOps Engineer', 'Database Administrator', 'Business Analyst', 'QA Engineer', 'Technical Writer'].map(r =>
    `<option value="${r}" ${isEdit && resource.role === r ? 'selected' : ''}>${r}</option>`
  ).join('');

  openModal(`
    <div class="modal-box">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-800">${title}</h3>
        <button class="modal-close-btn text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>
      <form id="modal-form" class="space-y-4" onsubmit="handleFormSubmit(event)">
        <input type="hidden" name="id" value="${resource?.id || ''}">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
          <input type="text" name="name" value="${isEdit ? escapeHtml(resource.name) : ''}" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Peran / Posisi *</label>
          <select name="role" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white">
            ${roleOpts}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kontak (email/no HP)</label>
          <input type="text" name="contact" value="${isEdit ? escapeHtml(resource.contact) : ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Gaji / Budget (opsional)</label>
          <input type="number" name="salary" min="0" step="1000" value="${isEdit ? resource.salary : ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeModal({target: document.getElementById('modal-overlay')})" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition">Batal</button>
          <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition font-medium">${btnLabel}</button>
        </div>
      </form>
    </div>
  `);
}

function openAllocationModal() {
  const taskId = document.getElementById('alloc-task-filter').value;
  if (!taskId) { showToast('Pilih tugas terlebih dahulu.', 'warning'); return; }

  Promise.all([
    fetch('/api/resources').then(r => r.json()),
    fetch('/api/tasks/' + taskId + '/assignments').then(r => r.json())
  ]).then(([resources, currentAssignments]) => {
    const assignedIds = currentAssignments.map(a => a.resource_id);
    const resourceOpts = resources.map(r =>
      `<option value="${r.id}" ${assignedIds.includes(r.id) ? 'disabled' : ''}>${escapeHtml(r.name)} (${r.role})${assignedIds.includes(r.id) ? ' - sudah dialokasikan' : ''}</option>`
    ).join('');

    openModal(`
      <div class="modal-box">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-800">Alokasikan Tim ke Tugas</h3>
          <button class="modal-close-btn text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <p class="text-sm text-gray-600 mb-3">Tugas: <strong>${getTaskName(taskId)}</strong></p>
        <form id="modal-form" class="space-y-4" onsubmit="handleFormSubmit(event)">
          <input type="hidden" name="action" value="add-assignment">
          <input type="hidden" name="task_id" value="${taskId}">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Anggota Tim *</label>
            <select name="resource_id" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white">
              <option value="">-- Pilih anggota --</option>
              ${resourceOpts}
            </select>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" onclick="closeModal({target: document.getElementById('modal-overlay')})" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition">Batal</button>
            <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition font-medium">Alokasikan</button>
          </div>
        </form>
      </div>
    `);
  });
}

function openMilestoneModal() {
  const projectId = document.getElementById('ms-project-filter').value;
  if (!projectId) { showToast('Pilih proyek terlebih dahulu.', 'warning'); return; }

  openModal(`
    <div class="modal-box">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-800">Tambah Milestone</h3>
        <button class="modal-close-btn text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>
      <form id="modal-form" class="space-y-4" onsubmit="handleFormSubmit(event)">
        <input type="hidden" name="action" value="add-milestone">
        <input type="hidden" name="project_id" value="${projectId}">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Milestone *</label>
          <input type="text" name="name" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Terjadinya *</label>
          <input type="date" name="date_text" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea name="description" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeModal({target: document.getElementById('modal-overlay')})" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition">Batal</button>
          <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition font-medium">Tambah Milestone</button>
        </div>
      </form>
    </div>
  `);
}

/* ============ FORM SUBMIT HANDLER ============ */
function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = {};
  formData.forEach((val, key) => { data[key] = val; });

  const action = data.action;
  const overlay = document.getElementById('modal-overlay');

  delete data.action;

  if (action === 'add-dependency') {
    fetch(`/api/tasks/${data.task_id}/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predecessor_id: data.predecessor_id, relation_type: data.relation_type, lag_days: parseInt(data.lag_days) || 0 })
    })
    .then(r => r.json())
    .then(res => {
      if (r.ok) { showToast('Ketergantungan berhasil ditambahkan.', 'success'); loadDependencies(); }
      else showToast(res.error || 'Gagal menambahkan ketergantungan.', 'error');
    })
    .finally(() => { overlay.classList.add('hidden'); document.getElementById('modal-box').classList.add('hidden'); });
  } else if (action === 'add-assignment') {
    fetch(`/api/tasks/${data.task_id}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: parseInt(data.resource_id) })
    })
    .then(r => r.json())
    .then(res => {
      if (r.ok) { showToast('Penugasan berhasil ditambahkan.', 'success'); loadAllocations(); loadGantt(); }
      else showToast(res.error || 'Gagal menambahkan penugasan.', 'error');
    })
    .finally(() => { overlay.classList.add('hidden'); document.getElementById('modal-box').classList.add('hidden'); });
  } else if (action === 'add-milestone') {
    fetch(`/api/projects/${data.project_id}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, date_text: data.date_text, description: data.description })
    })
    .then(r => r.json())
    .then(res => {
      if (r.ok) { showToast('Milestone berhasil ditambahkan.', 'success'); loadMilestones(); loadGantt(); }
      else showToast(res.error || 'Gagal menambahkan milestone.', 'error');
    })
    .finally(() => { overlay.classList.add('hidden'); document.getElementById('modal-box').classList.add('hidden'); });
  } else {
    // regular CRUD
    const resource = data.name && data.role; // resource
    const project = data.name && data.start_date && data.end_date && !data.role; // project
    const task = data.name && data.start_date && data.end_date && data.project_id && !data.role; // task

    let url, method;
    if (resource) {
      url = data.id ? `/api/resources/${data.id}` : '/api/resources';
      method = data.id ? 'PUT' : 'POST';
    } else if (project) {
      url = data.id ? `/api/projects/${data.id}` : '/api/projects';
      method = data.id ? 'PUT' : 'POST';
    } else if (task) {
      url = data.id ? `/api/tasks/${data.id}` : `/api/projects/${data.project_id}/tasks`;
      method = data.id ? 'PUT' : 'POST';
      delete data.project_id; // not allowed in PUT /api/tasks/:id
    } else {
      showToast('Data tidak valid.', 'error');
      return;
    }

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(res => {
      if (r.error) {
        showToast(r.error, 'error');
        return;
      }
      if (r.ok) {
        showToast('Data berhasil disimpan.', 'success');
        if (project) loadProjects();
        if (task) loadTasks();
        if (resource) loadResources();
        if (task) loadGantt();
        if (project) loadGantt();
      }
    })
    .catch(() => showToast('Terjadi kesalahan.', 'error'))
    .finally(() => {
      overlay.classList.add('hidden');
      document.getElementById('modal-box').classList.add('hidden');
    });
  }
}

/* ============ HELPERS ============ */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getTaskProjectId(taskId) {
  const table = document.getElementById('tasks-table');
  const rows = table.querySelectorAll('tbody tr');
  for (const row of rows) {
    const idCell = row.querySelector('td:first-child');
    if (idCell && idCell.textContent.trim() == taskId) {
      const projCell = row.querySelector('td:nth-child(7)');
      return projCell ? projCell.textContent.trim() : '';
    }
  }
  return '';
}

function getTaskName(taskId) {
  const table = document.getElementById('tasks-table');
  const rows = table.querySelectorAll('tbody tr');
  for (const row of rows) {
    const idCell = row.querySelector('td:first-child');
    if (idCell && idCell.textContent.trim() == taskId) {
      const nameCell = row.querySelector('td:nth-child(3)');
      return nameCell ? nameCell.textContent.trim() : '';
    }
  }
  return '';
}

/* ============ DASHBOARD ============ */
function loadDashboard() {
  Promise.all([
    fetch('/api/projects').then(r => r.json()),
    fetch('/api/tasks').then(r => r.json())
  ]).then(([projects, allTasks]) => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => new Date(p.end_date) >= new Date()).length;
    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter(t => t.status === 'Done').length;
    const inProgress = allTasks.filter(t => t.status === 'In Progress').length;
    const completion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    document.getElementById('dashboard-stats').innerHTML = `
      <div class="bg-white rounded-xl shadow p-4 text-center">
        <div class="text-3xl mb-1">📁</div>
        <div class="text-2xl font-bold text-indigo-700">${totalProjects}</div>
        <div class="text-sm text-gray-500">Total Proyek</div>
      </div>
      <div class="bg-white rounded-xl shadow p-4 text-center">
        <div class="text-3xl mb-1">⚡</div>
        <div class="text-2xl font-bold text-emerald-600">${activeProjects}</div>
        <div class="text-sm text-gray-500">Proyek Aktif</div>
      </div>
      <div class="bg-white rounded-xl shadow p-4 text-center">
        <div class="text-3xl mb-1">✅</div>
        <div class="text-2xl font-bold text-emerald-600">${doneTasks}</div>
        <div class="text-sm text-gray-500">Tugas Selesai</div>
      </div>
      <div class="bg-white rounded-xl shadow p-4 text-center">
        <div class="text-3xl mb-1">🚀</div>
        <div class="text-2xl font-bold text-indigo-700">${completion}%</div>
        <div class="text-sm text-gray-500">Progress Keseluruhan</div>
      </div>
    `;

    document.getElementById('dashboard-projects').innerHTML = projects.length
      ? projects.slice(0, 5).map(p => `
          <div class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
            <div>
              <div class="font-medium text-gray-800">${escapeHtml(p.name)}</div>
              <div class="text-xs text-gray-500">${escapeHtml(p.organization) || 'Tanpa klien'} · ${p.start_date} s.d. ${p.end_date}</div>
            </div>
            <span class="text-xs px-2 py-1 rounded-full ${new Date(p.end_date) >= new Date() ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}">${new Date(p.end_date) >= new Date() ? 'Aktif' : 'Selesai'}</span>
          </div>
        `).join('')
      : '<p class="text-gray-400 text-sm">Belum ada proyek.</p>';

    document.getElementById('dashboard-tasks').innerHTML = allTasks.length
      ? allTasks.slice(0, 5).map(t => `
          <div class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
            <div>
              <div class="font-medium text-gray-800">${escapeHtml(t.name)}</div>
              <div class="text-xs text-gray-500">${t.status} · ${t.priority} priority · ${t.duration_days}h</div>
            </div>
            <span class="text-xs px-2 py-1 rounded-full status-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span>
          </div>
        `).join('')
      : '<p class="text-gray-400 text-sm">Belum ada tugas.</p>';
  });
}

/* ============ PROJECTS ============ */
function loadProjects() {
  fetch('/api/projects')
    .then(r => r.json())
    .then(projects => {
      if (!projects.length) {
        document.getElementById('projects-table').innerHTML = `
          <div class="p-8 text-center text-gray-500">
            <div class="text-3xl mb-2">📁</div>
            <p>Belum ada proyek. Klik "Buat Proyek Baru" untuk memulai.</p>
          </div>`;
        return;
      }
      document.getElementById('projects-table').innerHTML = `
        <table class="w-full text-left">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Nama Proyek</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Deskripsi</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Organisasi / Klien</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Mulai</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Selesai</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody id="projects-tbody">
            ${projects.map(p => `
              <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-800">${escapeHtml(p.name)}</td>
                <td class="px-4 py-3 text-gray-600 text-sm">${escapeHtml(p.description) || '-'}</td>
                <td class="px-4 py-3 text-gray-600 text-sm">${escapeHtml(p.organization) || '-'}</td>
                <td class="px-4 py-3 text-gray-600 text-sm">${p.start_date}</td>
                <td class="px-4 py-3 text-gray-600 text-sm">${p.end_date}</td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-1 rounded-full ${new Date(p.end_date) >= new Date() ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}">${new Date(p.end_date) >= new Date() ? 'Aktif' : 'Selesai'}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button onclick="editProject(${p.id})" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-2">Edit</button>
                  <button onclick="deleteProject(${p.id})" class="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
    });
}

function openProjectModal(project) { /* implemented */ }
function editProject(id) {
  fetch(`/api/projects`)
    .then(r => r.json())
    .then(projects => {
      const p = projects.find(x => x.id === id);
      if (p) openProjectModal(p);
    });
}

function deleteProject(id) {
  if (!confirm('Hapus proyek ini? Semua tugas, dependency, dan milestone terkait juga akan terhapus.')) return;
  fetch(`/api/projects/${id}`, { method: 'DELETE' })
    .then(() => { showToast('Proyek berhasil dihapus.', 'success'); loadProjects(); loadGantt(); })
    .catch(() => showToast('Gagal menghapus proyek.', 'error'));
}

/* ============ TASKS ============ */
function loadTasks() {
  const filter = document.getElementById('task-project-filter')?.value;
  let url = '/api/tasks';
  if (filter) {
    // tasks endpoint doesn't filter by project at base, use project-specific
    fetch(`/api/projects/${filter}/tasks`)
      .then(r => r.json())
      .then(tasks => renderTasks(tasks, filter));
  } else {
    fetch('/api/projects')
      .then(r => r.json())
      .then(projects => {
        if (!projects.length) {
          document.getElementById('tasks-table').innerHTML = '<div class="p-8 text-gray-500 text-center">Buat proyek terlebih dahulu.</div>';
          return;
        }
        // aggregate all tasks
        const allTasks = [];
        projects.forEach(p => {
          fetch(`/api/projects/${p.id}/tasks`).then(r => r.json()).then(tasks => allTasks.push(...tasks));
        });
        Promise.all(projects.map(p => fetch(`/api/projects/${p.id}/tasks`).then(r => r.json())))
          .then(results => {
            const all = results.flat();
            renderTasks(all, null);
          });
      });
  }
}

function renderTasks(tasks, projectId) {
  if (!tasks.length) {
    document.getElementById('tasks-table').innerHTML = `
      <div class="p-8 text-center text-gray-500">
        <div class="text-3xl mb-2">📝</div>
        <p>Belum ada tugas. Klik "Tambah Tugas" untuk membuat.</p>
      </div>`;
    return;
  }

  // group by phase
  const phases = {};
  tasks.forEach(t => {
    const ph = t.phase_name || 'Tanpa fase';
    if (!phases[ph]) phases[ph] = [];
    phases[ph].push(t);
  });
  const phaseOrder = ['Analisis Kebutuhan', 'Analisis Sistem', 'Perancangan / Desain', 'Implementasi / Coding', 'Pengujian / Testing', 'Deployment & Maintenance'];

  let html = '<table class="w-full text-left">';
  phaseOrder.forEach(phName => {
    const phaseTasks = phases[phName];
    if (!phaseTasks) return;
    html += `
      <thead class="bg-indigo-50">
        <tr>
          <th colspan="8" class="px-4 py-2 text-sm font-semibold text-indigo-700">📌 ${phName}</th>
        </tr>
      </thead>`;
    html += `<tbody class="divide-y">`;
    phaseTasks.forEach(t => {
      html += `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-2 text-sm font-mono text-gray-400">#${t.id}</td>
          <td class="px-4 py-2">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-800">${escapeHtml(t.name)}</span>
            </div>
            <div class="text-xs text-gray-500">${escapeHtml(t.description) || '-'}</div>
          </td>
          <td class="px-4 py-2">
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">${escapeHtml(t.phase_name) || 'Tanpa fase'}</span>
          </td>
          <td class="px-4 py-2">
            <span class="text-xs px-2 py-0.5 rounded-full priority-${t.priority.toLowerCase()}">${t.priority}</span>
          </td>
          <td class="px-4 py-2 text-sm text-gray-600">${t.duration_days} hari</td>
          <td class="px-4 py-2">
            <span class="text-xs px-2 py-0.5 rounded-full status-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span>
          </td>
          <td class="px-4 py-2 text-sm text-gray-600">${t.start_date}<br/>${t.end_date}</td>
          <td class="px-4 py-2 text-right">
            <button onclick="editTask(${t.id})" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-2">Edit</button>
            <button onclick="deleteTask(${t.id})" class="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
          </td>
        </tr>`;
    });
    html += '</tbody>';
  });
  html += '</table>';
  document.getElementById('tasks-table').innerHTML = html;
}

function editTask(id) {
  fetch('/api/tasks') // not a real endpoint, need to find project
    .catch(() => {});
  // fetch via all projects
  fetch('/api/projects')
    .then(r => r.json())
    .then(projects => {
      let found = null;
      projects.forEach(p => {
        fetch(`/api/projects/${p.id}/tasks`).then(r => r.json()).then(tasks => {
          const t = tasks.find(x => x.id === id);
          if (t) found = { ...t, project_id: p.id };
          if (!found) return;
          openTaskModal(found, p.id);
        });
      });
    });
}

function deleteTask(id) {
  if (!confirm('Hapus tugas ini?')) return;
  fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    .then(() => { showToast('Tugas berhasil dihapus.', 'success'); loadTasks(); loadGantt(); loadDependencies(); })
    .catch(() => showToast('Gagal menghapus tugas.', 'error'));
}

/* ============ DEPENDENCIES ============ */
function loadDependencies() {
  const taskFilter = document.getElementById('dep-task-filter')?.value;

  // populate task dropdown
  fetch('/api/projects')
    .then(r => r.json())
    .then(projects => {
      const sel = document.getElementById('dep-task-filter');
      sel.innerHTML = '<option value="">Pilih Tugas</option>';
      projects.forEach(p => {
        fetch(`/api/projects/${p.id}/tasks`).then(r => r.json()).then(tasks => {
          tasks.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = `${t.name} (#{t.id}) - ${p.name}`;
            sel.appendChild(opt);
          });
        });
      });
      if (taskFilter) sel.value = taskFilter;
      if (taskFilter) loadDependenciesForTask(taskFilter);
      else document.getElementById('dependencies-table').innerHTML = '<div class="p-8 text-gray-500 text-center">Pilih tugas untuk melihat ketergantungan.</div>';
    });
}

function loadDependenciesForTask(taskId) {
  if (!taskId) {
    document.getElementById('dependencies-table').innerHTML = '<div class="p-8 text-gray-500 text-center">Pilih tugas.</div>';
    return;
  }

  fetch(`/api/tasks/${taskId}/dependencies`)
    .then(r => r.json())
    .then(deps => {
      const taskInfo = deps.length ? deps[0] : null;
      document.getElementById('dependencies-table').innerHTML = deps.length
        ? `
          <table class="w-full text-left">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tugas Pendahulu (Predecessor)</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tugas Anak</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Jenis</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Lag (hari)</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${deps.map(d => `
                <tr class="border-b hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-mono text-gray-400">#${d.id}</td>
                  <td class="px-4 py-3">
                    <span class="font-medium text-gray-800">${escapeHtml(d.predecessor_name)}</span>
                    <div class="text-xs text-gray-500">#{d.predecessor_task_id}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="font-medium text-gray-800">${taskInfo ? taskInfo.predecessor_name : 'N/A'}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono">${d.relation_type}</span>
                  </td>
                  <td class="px-4 py-3 text-sm">${d.lag_days > 0 ? `+${d.lag_days}` : d.lag_days}</td>
                  <td class="px-4 py-3 text-right">
                    <button onclick="deleteDependency(${d.id})" class="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `
        : '<div class="p-8 text-gray-500 text-center">Tidak ada ketergantungan untuk tugas ini.</div>';

      // diagram text
      const diagram = buildDependencyDiagram(taskId);
      const diagramDiv = document.getElementById('dep-diagram');
      const diagramContent = document.getElementById('dep-diagram-content');
      if (diagram) {
        diagramDiv.classList.remove('hidden');
        diagramContent.textContent = diagram;
      } else {
        diagramDiv.classList.add('hidden');
      }
    });
}

function buildDependencyDiagram(taskId) {
  // Gather all deps for this task and traverse predecessors
  fetch(`/api/tasks/${taskId}/dependencies`).then(r => r.json()).then(deps => {
    if (!deps.length) return '';
    const lines = [];
    lines.push(`Tugas: ${getTaskName(taskId)} (#{taskId})`);
    lines.push('');
    lines.push('Alur ketergantungan (predecessors):');
    deps.forEach(d => {
      lines.push(`  → #{d.predecessor_task_id} "${d.predecessor_name}" [${d.relation_type}] +${d.lag_days} hari`);
    });
    return lines.join('\n');
  });
  return '';
}

function deleteDependency(id) {
  if (!confirm('Hapus ketergantungan ini?')) return;
  fetch(`/api/dependencies/${id}`, { method: 'DELETE' })
    .then(() => { showToast('Ketergantungan dihapus.', 'success'); loadDependencies(); })
    .catch(() => showToast('Gagal menghapus.', 'error'));
}

function loadDependencies() {
  const taskFilter = document.getElementById('dep-task-filter')?.value;
  if (!taskFilter) {
    // populate dropdown
    fetch('/api/projects')
      .then(r => r.json())
      .then(projects => {
        const sel = document.getElementById('dep-task-filter');
        sel.innerHTML = '<option value="">Pilih Tugas</option>';
        const opts = [];
        projects.forEach(p => {
          fetch(`/api/projects/${p.id}/tasks`).then(r => r.json()).then(tasks => {
            tasks.forEach(t => {
              opts.push(`<option value="${t.id}">${escapeHtml(t.name)} (#{t.id}) - ${escapeHtml(p.name)}</option>`);
            });
            sel.innerHTML = '<option value="">Pilih Tugas</option>' + opts.join('');
          });
        });
      });
    document.getElementById('dependencies-table').innerHTML = '<div class="p-8 text-gray-500 text-center">Pilih tugas untuk melihat ketergantungan.</div>';
    document.getElementById('dep-diagram').classList.add('hidden');
    return;
  }
  loadDependenciesForTask(taskFilter);
}

/* ============ RESOURCES ============ */
function loadResources() {
  fetch('/api/resources')
    .then(r => r.json())
    .then(resources => {
      if (!resources.length) {
        document.getElementById('resources-table').innerHTML = `
          <div class="p-8 text-center text-gray-500">
            <div class="text-3xl mb-2">👥</div>
            <p>Belum ada anggota tim. Klik "Tambah Anggota Tim" untuk mendaftarkan.</p>
          </div>`;
        return;
      }
      document.getElementById('resources-table').innerHTML = `
        <table class="w-full text-left">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Nama</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Peran</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Kontak</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Gaji</th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${resources.map(r => `
              <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-800">${escapeHtml(r.name)}</td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">${escapeHtml(r.role)}</span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(r.contact) || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${r.salary ? 'Rp ' + r.salary.toLocaleString() : '-'}</td>
                <td class="px-4 py-3 text-right">
                  <button onclick="editResource(${r.id})" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-2">Edit</button>
                  <button onclick="deleteResource(${r.id})" class="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
    });
}

function editResource(id) {
  fetch('/api/resources')
    .then(r => r.json())
    .then(resources => {
      const r = resources.find(x => x.id === id);
      if (r) openResourceModal(r);
    });
}

function deleteResource(id) {
  if (!confirm('Hapus anggota tim ini? Penugasan yang terkait juga akan terhapus.')) return;
  fetch(`/api/resources/${id}`, { method: 'DELETE' })
    .then(() => { showToast('Anggota tim dihapus.', 'success'); loadResources(); loadAllocations(); loadGantt(); })
    .catch(() => showToast('Gagal menghapus.', 'error'));
}

/* ============ ALLOCATIONS ============ */
function loadAllocations() {
  const taskFilter = document.getElementById('alloc-task-filter')?.value;

  Promise.all([
    fetch('/api/tasks').then(r => r.json()),
    fetch('/api/resources').then(r => r.json())
  ]).then(([allTasks, resources]) => {
    const sel = document.getElementById('alloc-task-filter');
    sel.innerHTML = '<option value="">Semua Tugas</option>' +
      allTasks.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (#{t.id})</option>`).join('');
    if (taskFilter) sel.value = taskFilter;

    fetch('/api/tasks')
      .then(r => r.json())
      .then(tasks => {
        const rows = [];
        tasks.forEach(t => {
          if (taskFilter && String(t.id) !== taskFilter) return;
          fetch(`/api/tasks/${t.id}/assignments`).then(r => r.json()).then(assignments => {
            assignments.forEach(a => {
              rows.push(`
                <tr class="border-b hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-mono text-gray-400">#${t.id}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">${escapeHtml(t.name)}</td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">${escapeHtml(a.resource_name)}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">${escapeHtml(a.role)}</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <button onclick="unassign(${a.id})" class="text-red-600 hover:text-red-800 text-sm font-medium">Batalkan</button>
                  </td>
                </tr>
              `);
            });
            document.getElementById('alloc-table').innerHTML = rows.length
              ? `<table class="w-full text-left"><thead class="bg-gray-50 border-b"><tr>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tugas ID</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tugas</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Anggota Tim</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Peran</th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">Aksi</th>
                </tr></thead><tbody>${rows.join('')}</tbody></table>`
              : '<div class="p-8 text-gray-500 text-center">Belum ada alokasi penugasan.</div>';
          });
        });
      });
  });
}

function unassign(allocId) {
  if (!confirm('Batalkan penugasan ini?')) return;
  fetch(`/api/assignments/${allocId}`, { method: 'DELETE' })
    .then(() => { showToast('Penugasan dibatalkan.', 'success'); loadAllocations(); loadGantt(); })
    .catch(() => showToast('Gagal membatalkan.', 'error'));
}

/* ============ MILESTONES ============ */
function loadMilestones() {
  const projectId = document.getElementById('ms-project-filter')?.value;
  if (!projectId) {
    fetch('/api/projects')
      .then(r => r.json())
      .then(projects => {
        const sel = document.getElementById('ms-project-filter');
        sel.innerHTML = '<option value="">Pilih Proyek</option>' +
          projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
      });
    document.getElementById('milestones-table').innerHTML = '<div class="p-8 text-gray-500 text-center">Pilih proyek untuk melihat milestones.</div>';
    return;
  }

  fetch(`/api/projects/${projectId}/milestones`)
    .then(r => r.json())
    .then(milestones => {
      document.getElementById('milestones-table').innerHTML = milestones.length
        ? `<table class="w-full text-left"><thead class="bg-gray-50 border-b"><tr>
            <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Nama</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Deskripsi</th>
            <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">Aksi</th>
          </tr></thead><tbody>
            ${milestones.map(m => `
              <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3"><span class="text-amber-600">⭐</span> ${escapeHtml(m.name)}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${m.date_text}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(m.description) || '-'}</td>
                <td class="px-4 py-3 text-right">
                  <button onclick="deleteMilestone(${m.id})" class="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody></table>`
        : '<div class="p-8 text-gray-500 text-center">Belum ada milestone untuk proyek ini.</div>';
    });
}

function deleteMilestone(id) {
  if (!confirm('Hapus milestone ini?')) return;
  fetch(`/api/milestones/${id}`, { method: 'DELETE' })
    .then(() => { showToast('Milestone dihapus.', 'success'); loadMilestones(); loadGantt(); })
    .catch(() => showToast('Gagal menghapus.', 'error'));
}

/* ============ GANTT SETUP ============ */
function loadGantt() {
  const projectId = document.getElementById('gantt-project-filter')?.value;
  const svg = document.getElementById('gantt-svg');
  const loading = document.getElementById('gantt-loading');
  const empty = document.getElementById('gantt-empty');

  if (projectId) {
    fetchGanttData(projectId);
  } else {
    fetch('/api/projects')
      .then(r => r.json())
      .then(projects => {
        const sel = document.getElementById('gantt-project-filter');
        sel.innerHTML = '<option value="">Pilih Proyek</option>' +
          projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
        loading.classList.remove('hidden');
        svg.classList.add('hidden');
        empty.classList.add('hidden');
      });
  }
}

function fetchGanttData(projectId) {
  const svg = document.getElementById('gantt-svg');
  const loading = document.getElementById('gantt-loading');
  const empty = document.getElementById('gantt-empty');

  loading.classList.remove('hidden');
  svg.classList.add('hidden');
  empty.classList.add('hidden');

  fetch(`/api/projects/${projectId}/gantt`)
    .then(r => r.json())
    .then(data => {
      loading.classList.add('hidden');
      if (!data.tasks.length) {
        svg.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
      }
      svg.classList.remove('hidden');
      renderGantt(data);
    })
    .catch(() => {
      loading.classList.add('hidden');
      empty.classList.remove('hidden');
    });
}

function exportGanttImage() {
  const svg = document.getElementById('gantt-svg');
  if (!svg || svg.classList.contains('hidden')) {
    showToast('Tidak ada data Gantt untuk di-export.', 'warning');
    return;
  }
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const link = document.createElement('a');
    link.download = 'gantt-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Gambar Gantt berhasil diunduh.', 'success');
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

/* ============ INIT ============ */
document.addEventListener('DOMContentLoaded', () => {
  switchView('dashboard');
  // populate project filters
  fetch('/api/projects')
    .then(r => r.json())
    .then(projects => {
      ['task-project-filter', 'gantt-project-filter', 'ms-project-filter'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
          sel.innerHTML = '<option value="">Pilih Proyek</option>' +
            projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
        }
      });
    });
});

/* Dep loaded event re-setup */
document.getElementById('dep-task-filter').addEventListener('change', function() {
  loadDependenciesForTask(this.value);
});
