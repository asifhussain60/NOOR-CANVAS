// Key Progress view – shows details and criteria for a selected key.

export function renderKeyProgress(container, state, keyName) {
  const { keys, criteria } = state;
  const key = keys.find((k) => k.key_name === keyName);
  if (!key) {
    container.innerHTML = `<p class="text-red-500">Key '${keyName}' not found.</p>`;
    return;
  }
  // Header with back button
  const header = document.createElement('div');
  header.className = 'flex items-center mb-4';
  const backBtn = document.createElement('button');
  backBtn.className = 'mr-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700';
  backBtn.innerHTML = '<i data-lucide="arrow-left"></i>';
  backBtn.addEventListener('click', () => {
    if (window.appShowDashboard) window.appShowDashboard();
  });
  const title = document.createElement('h2');
  title.className = 'text-2xl font-semibold';
  title.textContent = key.key_name;
  header.appendChild(backBtn);
  header.appendChild(title);
  container.appendChild(header);

  // Key metadata
  const meta = document.createElement('p');
  meta.className = 'text-sm text-gray-600 dark:text-gray-400 mb-4';
  meta.textContent = `Created: ${formatDate(key.created_at)} | Updated: ${formatDate(key.updated_at)}`;
  container.appendChild(meta);

  // Criteria for this key
  const keyCriteria = criteria.filter((c) => c.key_id === key.id);
  const statusCounts = countStatuses(keyCriteria);
  // Chart container
  const chartCanvas = document.createElement('canvas');
  chartCanvas.height = 200;
  container.appendChild(chartCanvas);
  // Chart data
  const labels = Object.keys(statusCounts);
  const dataPoints = Object.values(statusCounts);
  const colors = {
    Proposed: '#FBBF24',
    InProgress: '#3B82F6',
    Satisfied: '#10B981',
    Final: '#6B7280',
  };
  const datasetColors = labels.map((l) => colors[l] || '#9CA3AF');
  const ctx = chartCanvas.getContext('2d');
  if (window.keyProgressChart) {
    window.keyProgressChart.destroy();
  }
  window.keyProgressChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data: dataPoints,
          backgroundColor: datasetColors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#4B5563' } },
      },
    },
  });

  // Table of criteria
  const tableEl = document.createElement('div');
  tableEl.className = 'mt-4';
  container.appendChild(tableEl);
  const rows = keyCriteria.map((c) => ({
    id: c.id,
    description: c.description,
    status: c.status,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));
  new Tabulator(tableEl, {
    data: rows,
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    pagination: 'local',
    paginationSize: 5,
    height: '50vh',
    columns: [
      { title: 'Description', field: 'description', headerFilter: 'input', widthGrow: 3 },
      { title: 'Status', field: 'status', headerFilter: true },
      { title: 'Created', field: 'created_at', sorter: 'datetime' },
      { title: 'Updated', field: 'updated_at', sorter: 'datetime' },
    ],
  });
}

function countStatuses(criteria) {
  const counts = {};
  criteria.forEach((c) => {
    counts[c.status] = (counts[c.status] || 0) + 1;
  });
  return counts;
}

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString();
}