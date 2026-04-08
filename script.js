async function init() {
    const res = await fetch('data.json');
    const data = await res.json();
    const items = data.results || data;
    const container = document.getElementById('table-container');
    container.innerHTML = '';

    const tables = {};
    items.forEach(r => { 
        const tInfo = r['Tabel']?.[0];
        if(tInfo) {
            const id = tInfo.id;
            if(!tables[id]) tables[id] = { name: tInfo.value, rows: [] };
            tables[id].rows.push(r);
        }
    });

    for (const id in tables) {
        const h2 = document.createElement('h2');
        h2.textContent = tables[id].name || `Tabel ${id}`;
        container.appendChild(h2);

        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        
        const grid = renderGridTable(tables[id].rows);
        wrapper.appendChild(grid);
        container.appendChild(wrapper);
        
        // Directe schaling na renderen
        adjustTableScale(grid);
    }
}

function renderGridTable(items) {
    const sorted = items.sort((a, b) => (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true}));
    const leafNodes = sorted.filter(i => !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + ".")));

    let totalX = 0;
    const leafMap = leafNodes.map(leaf => {
        const sub = leaf['sub']?.id;
        const width = sub === 1351 ? 3 : (sub === 1352 ? 2 : 1);
        const start = totalX + 1;
        totalX += width;
        return { ...leaf, start, end: totalX + 1, width };
    });

    const maxDepth = Math.max(...sorted.map(i => i['logische volgorde'].split('.').length));
    
    const grid = document.createElement('div');
    grid.className = 'grid-container';
    grid.style.gridTemplateColumns = `repeat(${totalX}, 1fr)`;

    sorted.forEach(item => {
        const code = item['logische volgorde'];
        const depth = code.split('.').length;
        const itemLeaves = leafMap.filter(l => l['logische volgorde'].startsWith(code));
        const isGroup = sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));

        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        if (isGroup) cell.classList.add('no-b-border');
        
        cell.style.gridColumn = `${itemLeaves[0].start} / ${itemLeaves[itemLeaves.length-1].end}`;
        cell.style.gridRow = depth;

        const content = document.createElement('div');
        content.innerHTML = item['titel'] || item['lbl'];
        if (item['verticaal']) content.className = 'vertical-text';
        cell.appendChild(content);

        if (isGroup) {
            const acc = document.createElement('div');
            acc.className = 'accolade-zone';
            cell.appendChild(acc);
        }

        grid.appendChild(cell);

        if (!isGroup && depth < maxDepth) {
            cell.style.gridRow = `${depth} / ${maxDepth + 1}`;
        }
    });

    // Nummers
    leafMap.forEach(leaf => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell num-cell no-t-border';
        cell.style.gridColumn = `${leaf.start} / ${leaf.end}`;
        cell.style.gridRow = maxDepth + 1;
        cell.textContent = leaf['volgorde lbl'];
        grid.appendChild(cell);
    });

    // Letters
    leafMap.forEach(leaf => {
        const subId = leaf['sub']?.id;
        const letters = subId === 1351 ? ['b','r','e'] : (subId === 1352 ? ['f','c'] : [null]);
        letters.forEach((l, i) => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell sub-cell';
            // Als het de laatste letter van de leaf is, geef harde rand
            if (i === letters.length - 1) cell.classList.add('sub-cell-end');
            
            cell.style.gridColumn = leaf.start + i;
            cell.style.gridRow = maxDepth + 2;
            cell.innerHTML = l || '&nbsp;';
            grid.appendChild(cell);
        });
    });

    return grid;
}

function adjustTableScale(grid) {
    const wrapper = grid.parentElement;
    const availableWidth = wrapper.clientWidth - 10;
    let fs = 14; // Begin wat groter
    grid.style.fontSize = fs + "px";

    // Krimp totdat de grid fysiek in de wrapper past zonder scroll
    // We gebruiken scrollWidth van de grid t.o.v. de clientWidth van de wrapper
    while (grid.scrollWidth > availableWidth && fs > 6) {
        fs -= 0.2;
        grid.style.fontSize = fs + "px";
    }
}

window.onload = init;
window.onresize = () => {
    document.querySelectorAll('.grid-container').forEach(adjustTableScale);
};