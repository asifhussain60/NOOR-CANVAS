// Criteria view – shows all acceptance criteria in a table.

export function renderCriteria(container, state) {
  const { criteria, keys } = state;
  // Build lookup map from key_id to key_name
  const keyMap = {};
  keys.forEach((k) => (keyMap[k.id] = k.key_name));
  // Prepare row data for Tabulator
  const rows = criteria.map((c) => {
    return {
      id: c.id,
      key: keyMap[c.key_id] || c.key_id,
      description: c.description,
      status: c.status,
      created_at: c.created_at,
      updated_at: c.updated_at,
    };
  });
  // Create table container
  const tableEl = document.createElement('div');
  tableEl.className = 'mt-4';
  container.appendChild(tableEl);

  // Create Tabulator table
  new Tabulator(tableEl, {
    data: rows,
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    pagination: 'local',
    paginationSize: 10,
    height: '60vh',
    placeholder: 'No criteria available',
    columns: [
      { title: 'Key', field: 'key', headerFilter: 'input' },
      { title: 'Criterion', field: 'description', headerFilter: 'input', widthGrow: 3 },
      { title: 'Status', field: 'status', headerFilter: true },
      { title: 'Created', field: 'created_at', sorter: 'datetime' },
      { title: 'Updated', field: 'updated_at', sorter: 'datetime' },
    ],
    rowClick: (e, row) => {
      const keyName = row.getData().key;
      if (window.appShowKeyProgress) {
        window.appShowKeyProgress(keyName);
      }
    },
  });
}