// Dashboard view – shows high level status and key cards.

export function renderDashboard(container, state, onKeySelect) {
  const { keys, criteria } = state;
  // Create overall stats card
  const stats = countCriteriaStatuses(criteria);
  const statsSection = document.createElement('div');
  statsSection.className = 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-6';
  const statusColors = {
    Proposed: 'bg-yellow-100 text-yellow-800',
    InProgress: 'bg-blue-100 text-blue-800',
    Satisfied: 'bg-green-100 text-green-800',
    Final: 'bg-gray-100 text-gray-800 dark:text-gray-200 dark:bg-gray-700',
  };
  Object.keys(stats).forEach((status) => {
    const card = document.createElement('div');
    card.className = 'flex flex-col p-4 rounded-lg shadow bg-white dark:bg-gray-800';
    const label = document.createElement('span');
    label.className = `text-sm font-medium ${statusColors[status] || ''} px-2 py-1 rounded`;
    label.textContent = status;
    const count = document.createElement('span');
    count.className = 'text-3xl font-bold mt-2';
    count.textContent = stats[status] || 0;
    card.appendChild(label);
    card.appendChild(count);
    statsSection.appendChild(card);
  });
  container.appendChild(statsSection);

  // Add a donut chart summarising criteria statuses
  const chartCanvas = document.createElement('canvas');
  chartCanvas.id = 'statusChart';
  chartCanvas.height = 200;
  container.appendChild(chartCanvas);
  // Chart.js config
  const ctx = chartCanvas.getContext('2d');
  const chartData = {
    labels: Object.keys(stats),
    datasets: [
      {
        data: Object.values(stats),
        backgroundColor: [
          '#FBBF24', // yellow for Proposed
          '#3B82F6', // blue for InProgress
          '#10B981', // green for Satisfied
          '#6B7280', // gray for Final
        ],
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#4B5563' },
      },
    },
  };
  // Destroy existing chart instance if present
  if (window.statusChart) {
    window.statusChart.destroy();
  }
  window.statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: chartOptions,
  });

  // Render key cards
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6';
  keys.forEach((key) => {
    const criteriaForKey = criteria.filter((c) => c.key_id === key.id);
    const total = criteriaForKey.length;
    const finalCount = criteriaForKey.filter((c) => c.status === 'Final').length;
    const ratio = total > 0 ? finalCount / total : 0;
    const card = document.createElement('div');
    card.className = 'cursor-pointer p-4 rounded-lg shadow hover:shadow-lg transition bg-white dark:bg-gray-800';
    card.addEventListener('click', () => onKeySelect(key.key_name));
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold mb-2';
    title.textContent = key.key_name;
    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm text-gray-500 dark:text-gray-400 mb-3';
    subtitle.textContent = `Last updated: ${formatDate(key.updated_at)}`;
    // Progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2';
    const progressBar = document.createElement('div');
    progressBar.className = 'h-2 rounded-full bg-green-500';
    progressBar.style.width = `${ratio * 100}%`;
    progressContainer.appendChild(progressBar);
    const progressLabel = document.createElement('p');
    progressLabel.className = 'text-xs text-gray-600 dark:text-gray-300 mt-1';
    progressLabel.textContent = `${finalCount}/${total} criteria finalised`;
    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(progressContainer);
    card.appendChild(progressLabel);
    cardsContainer.appendChild(card);
  });
  container.appendChild(cardsContainer);
}

// Helper to count criteria statuses
function countCriteriaStatuses(criteria) {
  const counts = {};
  criteria.forEach((c) => {
    counts[c.status] = (counts[c.status] || 0) + 1;
  });
  return counts;
}

// Helper to format ISO dates
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString();
}