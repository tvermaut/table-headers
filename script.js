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
    
    // 1. Identificeer leaf-nodes en ken ze een index toe
    const leaves = sorted.filter(i => !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + ".")));
    
    // Bereken totaal aantal sub-kolommen voor het grid
    let totalGridCols = 0;
    const leafInfo = leaves.map(leaf => {
        const subType = leaf['sub']?.id;
        const subCount = subType === 1351 ? 3 : (subType === 1352 ? 2 : 1);
        const start = totalGridCols + 1;
        totalGridCols += subCount;
        return { ...leaf, gridStart: start, gridEnd: totalGridCols + 1, subCount };
    });

    const grid = document.createElement('div');
    grid.className = 'table-grid';
    grid.style.gridTemplateColumns = `repeat(${totalGridCols}, 1fr)`;

    // 2. Plaats alle items (ook groepen) in het grid
    sorted.forEach(item => {
        const code = item['logische volgorde'] || "";
        const depth = code.split('.').length;
        
        // Vind alle leaves die onder dit item vallen voor de breedte
        const leavesUnder = leafInfo.filter(l => (l['logische volgorde'] || "").startsWith(code));
        const start = leavesUnder[0].gridStart;
        const end = leavesUnder[leavesUnder.length - 1].gridEnd;

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.gridColumn = `${start} / ${end}`;
        cell.style.gridRow = depth;

        const isGroup = sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
        if (isGroup) cell.classList.add('group-cell');

        const span = document.createElement('span');
        span.innerHTML = item['titel'] || item['lbl'] || '';
        if (item['verticaal']) span.className = 'vertical-text';
        cell.appendChild(span);

        if (!isGroup) {
            const lbl = document.createElement('div');
            lbl.className = 'volgorde-lbl';
            lbl.textContent = item['volgorde lbl'] || '';
            cell.appendChild(lbl);
        }
        grid.appendChild(cell);
    });

    // 3. Plaats de sub-letters (b|r|e) in de onderste rij
    leafInfo.forEach(leaf => {
        const subType = leaf['sub']?.id;
        const letters = subType === 1351 ? ['b', 'r', 'e'] : (subType === 1352 ? ['f', 'c'] : [null]);
        
        letters.forEach((l, idx) => {
            const subCell = document.createElement('div');
            subCell.className = 'cell sub-item';
            subCell.innerHTML = l || '&nbsp;';
            subCell.style.gridColumn = leaf.gridStart + idx;
            // Plaats dit onder de diepste header-rij
            subCell.style.gridRow = 10; 
            grid.appendChild(subCell);
        });
    });

    const h2 = document.createElement('h2');
    h2.textContent = `Tabel: ${id}`;
    container.appendChild(h2);
    container.appendChild(grid);
}

window.onload = init;