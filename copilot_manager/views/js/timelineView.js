// Timeline view – shows keys in a Gantt-style timeline.

export function renderTimeline(container, state) {
  const { keys, criteria } = state;
  // Build tasks array for Gantt
  const tasks = keys.map((key) => {
    const criteriaForKey = criteria.filter((c) => c.key_id === key.id);
    const total = criteriaForKey.length;
    const finalCount = criteriaForKey.filter((c) => c.status === 'Final').length;
    const progress = total > 0 ? Math.round((finalCount / total) * 100) : 0;
    return {
      id: String(key.id),
      name: key.key_name,
      start: key.created_at,
      end: key.updated_at,
      progress: progress,
      custom_class: '',
    };
  });
  // Create container for Gantt
  const ganttContainer = document.createElement('div');
  ganttContainer.id = 'gantt';
  ganttContainer.className = 'overflow-x-auto';
  container.appendChild(ganttContainer);
  // Calculate width based on number of tasks
  const gantt = new Gantt(ganttContainer, tasks, {
    view_mode: 'Week',
    custom_popup_html: (task) => {
      return `<div class="p-2"><strong>${task.name}</strong><br>Progress: ${task.progress}%</div>`;
    },
    on_click: (task) => {
      // When a bar is clicked, show key progress
      const keyName = task.name;
      if (window.appShowKeyProgress) {
        window.appShowKeyProgress(keyName);
      }
    },
  });
}