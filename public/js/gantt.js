function renderGantt(data) {
  const svg = document.getElementById('gantt-svg');
  const { project, tasks, dependencies, milestones, assignments } = data;

  // Compute date range
  const allDates = [
    new Date(project.start_date),
    new Date(project.end_date),
    ...tasks.map(t => new Date(t.start_date)),
    ...tasks.map(t => new Date(t.end_date)),
    ...milestones.map(m => new Date(m.date_text)),
  ].filter(d => !isNaN(d.getTime()));

  if (!allDates.length) return;

  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  // Add some padding
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 2);

  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
  const dayWidth = Math.max(22, Math.min(40, (900 - 200) / totalDays));

  const rowHeight = 36;
  const headerHeight = 40;
  const leftMargin = 200; // for task names + phase labels
  const topMargin = headerHeight + 10;

  const width = leftMargin + totalDays * dayWidth + 30;
  const height = topMargin + tasks.length * rowHeight + milestones.length * 20 + 30;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.minHeight = height + 'px';

  // Clear
  svg.innerHTML = '';

  // Define patterns
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  // Priority colors
  const priorityColors = { Low: '#9ca3af', Normal: '#6366f1', High: '#ef4444' };

  // Milestones diamond marker
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'milestone-dot');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '5');
  marker.setAttribute('refY', '5');
  marker.setAttribute('orient', 'auto');
  const markerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  markerCircle.setAttribute('cx', '5');
  markerCircle.setAttribute('cy', '5');
  markerCircle.setAttribute('r', '4');
  markerCircle.setAttribute('fill', '#f59e0b');
  marker.appendChild(markerCircle);
  defs.appendChild(marker);

  svg.appendChild(defs);

  // Today line marker
  const today = new Date();
  const todayX = leftMargin + Math.max(0, Math.floor((today - minDate) / (1000 * 60 * 60 * 24))) * dayWidth;
  if (todayX >= leftMargin && todayX <= width) {
    const todayLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    todayLine.setAttribute('x1', todayX);
    todayLine.setAttribute('x2', todayX);
    todayLine.setAttribute('y1', topMargin - 5);
    todayLine.setAttribute('y2', height - 10);
    todayLine.setAttribute('stroke', '#ef4444');
    todayLine.setAttribute('stroke-width', '2');
    todayLine.setAttribute('stroke-dasharray', '5,5');
    todayLine.setAttribute('opacity', '0.6');
    svg.appendChild(todayLine);

    const todayLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    todayLabel.setAttribute('x', todayX + 3);
    todayLabel.setAttribute('y', topMargin - 8);
    todayLabel.setAttribute('fill', '#ef4444');
    todayLabel.setAttribute('font-size', '10');
    todayLabel.setAttribute('font-weight', 'bold');
    todayLabel.textContent = 'HARI INI';
    svg.appendChild(todayLabel);
  }

  // Header - Month/Year
  let currentMonth = '';
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(minDate);
    date.setDate(date.getDate() + d);
    const monthLabel = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
    if (monthLabel !== currentMonth) {
      currentMonth = monthLabel;
      const x = leftMargin + d * dayWidth;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', 14);
      text.setAttribute('fill', '#4b5563');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.textContent = monthLabel;
      svg.appendChild(text);
    }
    // Day grid lines
    if (d % 7 === 0) {
      const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gridLine.setAttribute('x1', leftMargin + d * dayWidth);
      gridLine.setAttribute('x2', leftMargin + d * dayWidth);
      gridLine.setAttribute('y1', topMargin);
      gridLine.setAttribute('y2', height);
      gridLine.setAttribute('stroke', '#e5e7eb');
      gridLine.setAttribute('stroke-width', '1');
      svg.appendChild(gridLine);
    }
  }
  // Vertical grid for each day (lighter)
  for (let d = 0; d < totalDays; d++) {
    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gridLine.setAttribute('x1', leftMargin + d * dayWidth);
    gridLine.setAttribute('x2', leftMargin + d * dayWidth);
    gridLine.setAttribute('y1', topMargin);
    gridLine.setAttribute('y2', height);
    gridLine.setAttribute('stroke', '#f3f4f6');
    gridLine.setAttribute('stroke-width', '1');
    svg.appendChild(gridLine);
  }

  // Group tasks by phase for visual grouping
  const phaseGroups = {};
  tasks.forEach(t => {
    const ph = t.phase_name || 'Tanpa Fase';
    if (!phaseGroups[ph]) phaseGroups[ph] = [];
    phaseGroups[ph].push(t);
  });

  const phaseOrder = ['Analisis Kebutuhan', 'Analisis Sistem', 'Perancangan / Desain', 'Implementasi / Coding', 'Pengujian / Testing', 'Deployment & Maintenance'];

  let yOffset = topMargin;

  phaseOrder.forEach(phName => {
    const groupTasks = phaseGroups[phName];
    if (!groupTasks || !groupTasks.length) return;

    // Phase separator line
    const sepLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    sepLine.setAttribute('x1', leftMargin - 8);
    sepLine.setAttribute('x2', width);
    sepLine.setAttribute('y1', yOffset - 4);
    sepLine.setAttribute('y2', yOffset - 4);
    sepLine.setAttribute('stroke', '#6366f1');
    sepLine.setAttribute('stroke-width', '2');
    svg.appendChild(sepLine);

    // Phase label
    const phaseLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    phaseLabel.setAttribute('x', 4);
    phaseLabel.setAttribute('y', yOffset + 12);
    phaseLabel.setAttribute('fill', '#6366f1');
    phaseLabel.setAttribute('font-size', '11');
    phaseLabel.setAttribute('font-weight', 'bold');
    phaseLabel.textContent = '■ ' + phName;
    svg.appendChild(phaseLabel);

    yOffset += 18;

    groupTasks.forEach(t => {
      const taskStart = new Date(t.start_date);
      const taskEnd = new Date(t.end_date);
      const x1 = leftMargin + Math.floor((taskStart - minDate) / (1000 * 60 * 60 * 24)) * dayWidth;
      const x2 = leftMargin + Math.ceil((taskEnd - minDate) / (1000 * 60 * 60 * 24)) * dayWidth;
      const barWidth = Math.max(4, x2 - x1);
      const y = yOffset;

      // Task name on left
      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('x', 8);
      nameText.setAttribute('y', y + 14);
      nameText.setAttribute('fill', '#1f2937');
      nameText.setAttribute('font-size', '12');
      nameText.setAttribute('font-family', 'system-ui, sans-serif');
      nameText.textContent = `${t.name} (${t.duration_days}h)`;
      svg.appendChild(nameText);

      // Priority indicator dot (colored bar)
      const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bar.setAttribute('x', x1);
      bar.setAttribute('y', y + 4);
      bar.setAttribute('width', barWidth);
      bar.setAttribute('height', 14);
      bar.setAttribute('rx', '4');
      bar.setAttribute('ry', '4');
      bar.setAttribute('fill', priorityColors[t.priority] || '#6366f1');
      bar.setAttribute('opacity', '0.9');
      bar.style.cursor = 'pointer';
      bar.setAttribute('data-task-id', t.id);
      bar.setAttribute('data-task-name', t.name);

      // Tooltip hover
      bar.addEventListener('mouseenter', (e) => {
        showBarTooltip(e, t, dependencies, assignments);
      });
      bar.addEventListener('mousemove', (e) => {
        moveTooltip(e);
      });
      bar.addEventListener('mouseleave', hideTooltip);

      svg.appendChild(bar);

      // Dependency arrows
      drawDependencyArrows(svg, t, dependencies, minDate, dayWidth, y, rowHeight, leftMargin);

      yOffset += rowHeight;
    });

    yOffset += 6; // spacing between phases
  });

  // Milestones row
  if (milestones.length) {
    const msSep = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    msSep.setAttribute('x1', leftMargin - 8);
    msSep.setAttribute('x2', width);
    msSep.setAttribute('y1', yOffset - 4);
    msSep.setAttribute('y2', yOffset - 4);
    msSep.setAttribute('stroke', '#f59e0b');
    msSep.setAttribute('stroke-width', '2');
    svg.appendChild(msSep);

    const msLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    msLabel.setAttribute('x', 4);
    msLabel.setAttribute('y', yOffset + 12);
    msLabel.setAttribute('fill', '#f59e0b');
    msLabel.setAttribute('font-size', '11');
    msLabel.setAttribute('font-weight', 'bold');
    msLabel.textContent = '⭐ MILESTONES';
    svg.appendChild(msLabel);

    yOffset += 20;

    milestones.forEach(m => {
      const msDate = new Date(m.date_text);
      const x = leftMargin + Math.floor((msDate - minDate) / (1000 * 60 * 60 * 24)) * dayWidth;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('x2', x);
      line.setAttribute('y1', yOffset);
      line.setAttribute('y2', yOffset + 12);
      line.setAttribute('stroke', '#f59e0b');
      line.setAttribute('stroke-width', '1.5');
      svg.appendChild(line);

      const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const s = 5;
      diamond.setAttribute('points', `${x},${yOffset+12} ${x+s},${yOffset+12+s} ${x},${yOffset+12+2*s} ${x-s},${yOffset+12+s}`);
      diamond.setAttribute('fill', '#f59e0b');
      svg.appendChild(diamond);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + 8);
      label.setAttribute('y', yOffset + 16);
      label.setAttribute('fill', '#92400e');
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '500');
      label.textContent = m.name;
      svg.appendChild(label);

      yOffset += 16;
    });
  }

  // Project info bar at bottom
  const infoBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  infoBar.setAttribute('x', 0);
  infoBar.setAttribute('y', height - 24);
  infoBar.setAttribute('width', width);
  infoBar.setAttribute('height', 24);
  infoBar.setAttribute('fill', '#f9fafb');
  infoBar.setAttribute('rx', '4');
  svg.appendChild(infoBar);

  const infoText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  infoText.setAttribute('x', 10);
  infoText.setAttribute('y', height - 8);
  infoText.setAttribute('fill', '#6b7280');
  infoText.setAttribute('font-size', '10');
  infoText.textContent = `Proyek: ${project.name} | ${milestones.length} milestone(s) | ${tasks.length} tugas | Durasi proyek: ${totalDays} hari kerja`;
  svg.appendChild(infoText);
}

/* ============ DEPENDENCY ARROWS ============ */
function drawDependencyArrows(svg, task, dependencies, minDate, dayWidth, y, rowHeight, leftMargin) {
  const taskStart = new Date(task.start_date);
  const taskEnd = new Date(task.end_date);
  const x1_end = leftMargin + Math.ceil((taskEnd - minDate) / (1000 * 60 * 60 * 24)) * dayWidth;
  const x2_start = leftMargin + Math.floor((taskStart - minDate) / (1000 * 60 * 60 * 24)) * dayWidth;
  const yCenter = y + 11;

  dependencies.forEach(d => {
    // Find predecessor task position (the predecessor is another task in same project)
    // We need to find its y position
    // This is simplified: we draw arrow from a generic point
    // Better: find predecessor in tasks array
    const pred = findTaskById(d.predecessor_task_id, svg);
    if (!pred) return;

    const predEndX = leftMargin + Math.ceil((new Date(d.predecessor_text?.end_date || taskStart) - minDate) / (1000 * 60 * 60 * 24)) * dayWidth;
    // Since we don't have pred end date easily, approximate
    const predEnd = new Date(d.predecessor_text?.end_date || taskStart);
    const predEndX2 = leftMargin + Math.ceil((predEnd - minDate) / (1000 * 60 * 60 * 24)) * dayWidth;

    const startX = predEndX2;
    const startY = yCenter;

    const endX = x2_start;
    const endY = yCenter;

    const midX = (startX + endX) / 2;

    // Simple bezier curve
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d_attr = `M ${startX} ${startY} C ${startX + 20} ${startY}, ${midX - 20} ${endY}, ${endX - 4} ${endY}`;
    path.setAttribute('d', d_attr);
    path.setAttribute('stroke', '#6b7280');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(path);
  });
}

function findTaskById(id, svg) {
  // Find task element with matching id
  const elements = svg.querySelectorAll('rect[data-task-id]');
  for (const el of elements) {
    if (parseInt(el.getAttribute('data-task-id')) === id) {
      return { id, y: parseFloat(el.getAttribute('y')) || 0 };
    }
  }
  return null;
}

/* ============ TOOLTIP ============ */
let tooltipEl = null;

function showBarTooltip(e, task, dependencies, assignments) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'gantt-tooltip';
    document.body.appendChild(tooltipEl);
  }

  const depList = dependencies.length
    ? dependencies.map(d => `→ Predecessor: ${d.predecessor_name} [${d.relation_type}] +${d.lag_days}h`).join('\n')
    : 'Tidak ada ketergantungan';

  const allocList = assignments.length
    ? assignments.map(a => `👤 ${a.resource_name} (${a.role})`).join('\n')
    : 'Tidak ada alokasi tim';

  tooltipEl.innerHTML = `
    <div class="font-medium text-white mb-1">${task.name}</div>
    <div class="text-gray-300 text-xs">ID: #${task.id} | ${task.status}</div>
    <div class="text-gray-300 text-xs mt-1">📅 ${task.start_date} s.d. ${task.end_date} (${task.duration_days} hari)</div>
    <div class="text-gray-300 text-xs mt-1">Prioritas: ${task.priority} | Fase: ${task.phase_name || '-'}</div>
    <div class="text-xs mt-1 text-gray-400 border-t pt-1">${depList}</div>
    <div class="text-xs mt-1 text-gray-400">${allocList}</div>
  `;

  tooltipEl.classList.add('show');
  moveTooltip(e);
}

function moveTooltip(e) {
  if (!tooltipEl) return;
  const x = e.clientX + 12;
  const y = e.clientY + 12;
  const rect = tooltipEl.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 10;
  const maxY = window.innerHeight - rect.height - 10;
  tooltipEl.style.left = Math.min(x, maxX) + 'px';
  tooltipEl.style.top = Math.min(y, maxY) + 'px';
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.classList.remove('show');
}
