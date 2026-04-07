async function init() {
    const response = await fetch('data.json');
    const data = await response.json();
    const rows = data.results || data;

    const tablesMap = {};
    rows.forEach(row => {
        const t = row['Tabel']?.[0];
        if (t) {
            if (!tablesMap[t.id]) tablesMap[t.id] = [];
            tablesMap[t.id].push(row);
        }
    });

    const container = document.getElementById('table-container');
    container.innerHTML = '';

    for (const tableId in tablesMap) {
        renderTable(tablesMap[tableId], container, tableId);
    }
}

function renderTable(items, container, id) {
    const sorted = items.sort((a, b) => (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true}));
    const leafNodes = sorted.filter(i => !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + ".")));
    
    // Bereken grid kolommen op basis van sub-aanduidingen
    let totalGridCols = 0;
    const leafConfig = leafNodes.map(leaf => {
        const subType = leaf['sub']?.id;
        const count = subType === 1351 ? 3 : (subType === 1352 ? 2 : 1);
        const start = totalGridCols + 1;
        totalGridCols += count;
        return { ...leaf, gridStart: start, gridEnd: totalGridCols + 1, count };
    });

    const depths = sorted.map(i => (i['logische volgorde'] || "").split('.').length);
    const maxDepth = Math.max(...depths);

    const grid = document.createElement('div');
    grid.className = 'table-grid';
    grid.style.gridTemplateColumns = `repeat(${totalGridCols}, 1fr)`;

    // 1. Plaats de hiërarchische headers (Zone A)
    sorted.forEach(item => {
        const code = item['logische volgorde'] || "";
        const depth = code.split('.').length;
        const leavesUnder = leafConfig.filter(l => l['logische volgorde'].startsWith(code));
        const start = leavesUnder[0].gridStart;
        const end = leavesUnder[leavesUnder.length - 1].gridEnd;

        const cell = document.createElement('div');
        cell.className = 'cell';
        const isGroup = sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
        
        if (isGroup) {
            cell.classList.add('group-cell');
        }
        
        cell.style.gridColumn = `${start} / ${end}`;
        cell.style.gridRow = depth;

        const span = document.createElement('span');
        span.innerHTML = item['titel'] || item['lbl'] || '';
        if (item['verticaal']) span.className = 'vertical-text';
        cell.appendChild(span);
        grid.appendChild(cell);
    });

    // 2. Plaats de kolomnummers (Zone B - Vaste rij)
    const numRowY = maxDepth + 1;
    leafConfig.forEach(leaf => {
        const cell = document.createElement('div');
        cell.className = 'cell num-row-cell';
        cell.style.gridColumn = `${leaf.gridStart} / ${leaf.gridEnd}`;
        cell.style.gridRow = numRowY;
        cell.textContent = leaf['volgorde lbl'] || '';
        grid.appendChild(cell);
    });

    // 3. Plaats de sub-letters (Zone C - Vaste rij)
    const subRowY = maxDepth + 2;
    leafConfig.forEach(leaf => {
        const subType = leaf['sub']?.id;
        const letters = subType === 1351 ? ['b', 'r', 'e'] : (subType === 1352 ? ['f', 'c'] : [null]);
        
        letters.forEach((l, idx) => {
            const cell = document.createElement('div');
            cell.className = 'cell sub-row-cell';
            cell.style.gridColumn = leaf.gridStart + idx;
            cell.style.gridRow = subRowY;
            cell.innerHTML = l || '&nbsp;';
            grid.appendChild(cell);
        });
    });

    const h2 = document.createElement('h2');
    h2.textContent = `Tabel: ${id}`;
    container.appendChild(h2);
    container.appendChild(grid);
}

window.onload = init;