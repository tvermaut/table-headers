async function init() {
    const response = await fetch('data.json');
    const data = await response.json();
    const rows = data.results || data;

    const tablesMap = {};
    rows.forEach(r => {
        const tid = r['Tabel']?.[0]?.id;
        if (tid) (tablesMap[tid] = tablesMap[tid] || []).push(r);
    });

    const container = document.getElementById('table-container');
    container.innerHTML = '';

    for (const tid in tablesMap) {
        renderTabel(tablesMap[tid], container, tid);
    }
}

function renderTabel(items, target, tid) {
    const sorted = items.sort((a, b) => 
        (a['logische volgorde'] || "").localeCompare(b['logische volgombe'] || "", undefined, {numeric: true})
    );

    const leaves = sorted.filter(i => 
        !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgombe'] + "."))
    );
    
    // Bereken grid-kolommen op basis van de sub-letters
    let currentX = 1;
    const leafMap = leaves.map(node => {
        const subId = node['sub']?.id;
        const width = (subId === 1351) ? 3 : (subId === 1352 ? 2 : 1);
        const info = { ...node, start: currentX, end: currentX + width };
        currentX += width;
        return info;
    });

    const maxDepth = Math.max(...sorted.map(i => (i['logische volgorde'] || "").split('.').length));
    const grid = document.createElement('div');
    grid.className = 'table-grid';
    grid.style.gridTemplateColumns = `repeat(${currentX - 1}, minmax(min-content, 1fr))`;

    // 1. De Hiërarchie (Zone A)
    sorted.forEach(item => {
        const code = item['logische volgorde'] || "";
        const depth = code.split('.').length;
        const groupLeaves = leafMap.filter(l => l['logische volgorde'].startsWith(code));
        
        const cell = document.createElement('div');
        cell.className = 'cell';
        const isGroup = sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
        if (isGroup) cell.classList.add('group-cell');

        cell.style.gridColumn = `${groupLeaves[0].start} / ${groupLeaves[groupLeaves.length - 1].end}`;
        cell.style.gridRow = depth;

        const span = document.createElement('span');
        span.innerHTML = item['titel'] || item['lbl'];
        if (item['verticaal']) span.className = 'vertical-text';
        cell.appendChild(span);
        grid.appendChild(cell);
    });

    // 2. De Nummers (Zone B)
    leafMap.forEach(l => {
        const c = document.createElement('div');
        c.className = 'cell num-cell';
        c.style.gridColumn = `${l.start} / ${l.end}`;
        c.style.gridRow = maxDepth + 1;
        c.textContent = l['volgorde lbl'] || '';
        grid.appendChild(c);
    });

    // 3. De Letters (Zone C)
    leafMap.forEach(l => {
        const subId = l['sub']?.id;
        const letters = (subId === 1351) ? ['b','r','e'] : (subId === 1352 ? ['f','c'] : [null]);
        letters.forEach((char, i) => {
            const c = document.createElement('div');
            c.className = 'cell sub-cell';
            c.style.gridColumn = l.start + i;
            c.style.gridRow = maxDepth + 2;
            c.innerHTML = char || '&nbsp;';
            grid.appendChild(c);
        });
    });

    const title = document.createElement('h2');
    title.textContent = `Tabel: ${tid}`;
    target.appendChild(title);
    target.appendChild(grid);
}

window.onload = init;