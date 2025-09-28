// Activity view – shows rollback history and activity feed.

export function renderActivity(container, state) {
  const { keys, undologs } = state;
  // Build key map
  const keyMap = {};
  keys.forEach((k) => (keyMap[k.id] = k.key_name));
  // Sort logs by timestamp descending
  const logs = [...undologs].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  const list = document.createElement('ul');
  list.className = 'space-y-4';
  if (logs.length === 0) {
    const li = document.createElement('li');
    li.className = 'text-gray-500 dark:text-gray-400';
    li.textContent = 'No activity yet.';
    list.appendChild(li);
  } else {
    logs.forEach((log) => {
      const li = document.createElement('li');
      li.className = 'flex items-start bg-white dark:bg-gray-800 p-3 rounded-lg shadow';
      const iconSpan = document.createElement('span');
      iconSpan.className = 'mr-3';
      const iconName = getIconName(log.action);
      iconSpan.innerHTML = `<i data-lucide="${iconName}"></i>`;
      const content = document.createElement('div');
      const title = document.createElement('p');
      title.className = 'font-semibold';
      const keyName = keyMap[log.key_id] || `Key ${log.key_id}`;
      title.textContent = formatActionTitle(log.action, keyName);
      const meta = document.createElement('p');
      meta.className = 'text-sm text-gray-500 dark:text-gray-400';
      meta.textContent = new Date(log.timestamp).toLocaleString();
      content.appendChild(title);
      content.appendChild(meta);
      li.appendChild(iconSpan);
      li.appendChild(content);
      list.appendChild(li);
    });
  }
  container.appendChild(list);
}

function getIconName(action) {
  if (action === 'checkpoint') return 'save';
  if (action === 'rollback') return 'rotate-ccw';
  if (action === 'keylock') return 'lock';
  if (action.startsWith('continue:')) {
    const mode = action.split(':')[1];
    switch (mode) {
      case 'analyze':
        return 'search';
      case 'apply':
        return 'edit';
      case 'test':
        return 'flask-conical';
      default:
        return 'more-horizontal';
    }
  }
  return 'more-horizontal';
}

function formatActionTitle(action, keyName) {
  if (action === 'checkpoint') return `Checkpoint created for ${keyName}`;
  if (action === 'rollback') return `Rollback performed on ${keyName}`;
  if (action === 'keylock') return `Key ${keyName} finalised`;
  if (action.startsWith('continue:')) {
    const mode = action.split(':')[1];
    const label = mode.charAt(0).toUpperCase() + mode.slice(1);
    return `${label} step on ${keyName}`;
  }
  return `${action} on ${keyName}`;
}