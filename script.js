async function init() {
    try {
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
    } catch (e) {
        console.error("Fout bij laden data:", e);
    }
}

function renderTabel(items, target, tid) {
    // Sorteer op hiërarchische code
    const sorted = items.sort((a, b) => 
        (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
    );

    // Identificeer de bladeren (eindkolommen)
    const leaves = sorted.filter(i => 
        !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + "."))
    );
    
    // Bereken grid-coördinaten op basis van b|r|e (3) of f|c (2)
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
    grid.style.gridTemplateColumns = `repeat(${currentX - 1}, 1fr)`;

    // 1. Render de Hiërarchie (Zone A)
    sorted.forEach(item => {
        const code = item['logische volgorde'] || "";
        const depth = code.split('.').length;
        
        // Vind alle bladeren die onder deze groep vallen
        const groupLeaves = leafMap.filter(l => l['logische volgorde'].startsWith(code));
        const start = groupLeaves[0].start;
        const end = groupLeaves[groupLeaves.length - 1].end;

        const cell = document.createElement('div');
        cell.className = 'cell';
        
        const isGroup = sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
        if (isGroup) cell.classList.add('group-cell');

        cell.style.gridColumn = `${start} / ${end}`;
        cell.style.gridRow = depth;

        const span = document.createElement('span');
        span.innerHTML = item['titel'] || item['lbl'];
        if (item['verticaal']) span.className = 'vertical-text';
        cell.appendChild(span);
        grid.appendChild(cell);
    });

    // 2. Render de Kolomnummers (Zone B - Vaste rij)
    leafMap.forEach(l => {
        const c = document.createElement('div');
        c.className = 'cell num-cell';
        c.style.gridColumn = `${l.start} / ${l.end}`;
        c.style.gridRow = maxDepth + 1;
        c.textContent = l['volgorde lbl'] || '';
        grid.appendChild(c);
    });

    // 3. Render de Sub-letters (Zone C - Vaste rij onder de lijn)
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

    const h2 = document.createElement('h2');
    h2.textContent = `Tabel: ${tid}`;
    target.appendChild(h2);
    target.appendChild(grid);
}

window.onload = init;