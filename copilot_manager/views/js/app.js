// Entry point for the Copilot Manager dashboard.
// This module loads JSON data, registers navigation handlers and
// dispatches render functions for each view.

import { renderDashboard } from './dashboardView.js';
import { renderCriteria } from './criteriaView.js';
import { renderTimeline } from './timelineView.js';
import { renderActivity } from './activityView.js';
import { renderKeyProgress } from './keyProgressView.js';

const state = {
  keys: [],
  criteria: [],
  undologs: [],
};

// Load JSON data from the data directory
async function loadData() {
  const base = '../data';
  const load = async (file) => {
    try {
      const resp = await fetch(`${base}/${file}`);
      if (!resp.ok) throw new Error(`${file} fetch failed`);
      return await resp.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  };
  [state.keys, state.criteria, state.undologs] = await Promise.all([
    load('keys.json'),
    load('criteria.json'),
    load('undologs.json'),
  ]);
}

// Initialise navigation
function initNav() {
  const navList = document.getElementById('navList');
  navList.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      setActiveNav(btn);
      showView(view);
    });
  });
}

function setActiveNav(activeButton) {
  document.querySelectorAll('#navList button').forEach((btn) => {
    btn.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'font-semibold');
  });
  activeButton.classList.add('bg-gray-100', 'dark:bg-gray-700', 'font-semibold');
}

// Dispatch view rendering
function showView(viewName, extra = {}) {
  const container = document.getElementById('mainContent');
  container.innerHTML = '';
  switch (viewName) {
    case 'dashboard':
      renderDashboard(container, state, (keyName) => {
        // When a key card is clicked, show key progress view
        showView('keyProgress', { keyName });
      });
      break;
    case 'criteria':
      renderCriteria(container, state);
      break;
    case 'timeline':
      renderTimeline(container, state);
      break;
    case 'activity':
      renderActivity(container, state);
      break;
    case 'keyProgress':
      renderKeyProgress(container, state, extra.keyName);
      break;
    default:
      container.innerHTML = '<p>Unknown view.</p>';
  }
  // Refresh icons after content injection
  if (window.lucideIcons) {
    window.lucideIcons.createIcons({ icons: window.lucideIcons.icons });
  }
}

// Initialise the application
async function init() {
  await loadData();
  initNav();
  showView('dashboard');

  // Expose function globally so other modules can request key progress view
  window.appShowKeyProgress = (keyName) => showView('keyProgress', { keyName });

  // Also expose a dashboard function for back buttons
  window.appShowDashboard = () => showView('dashboard');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);