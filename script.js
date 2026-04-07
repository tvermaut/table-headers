async function init() {
    const res = await fetch('data.json');
    const data = await res.json();
    const items = data.results || data;
    const container = document.getElementById('table-container');
    container.innerHTML = '';

    // Per tabel groeperen
    const tables = {};
    items.forEach(r => { const id = r['Tabel']?.[0]?.id; if(id) (tables[id] = tables[id] || []).push(r); });

    for (const id in tables) {
        const sorted = tables[id].sort((a, b) => (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true}));
        
        // 1. Bereken de breedte van de 'leaves' (eindkolommen)
        const leaves = sorted.filter(i => !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + ".")));
        let currentX = 1;
        const leafMap = leaves.map(node => {
            const width = (node['sub']?.id === 1351) ? 3 : (node['sub']?.id === 1352 ? 2 : 1);
            const info = { ...node, start: currentX, end: currentX + width };
            currentX += width;
            return info;
        });

        const grid = document.createElement('div');
        grid.className = 'header-grid';
        grid.style.gridTemplateColumns = `repeat(${currentX - 1}, 1fr)`;

        // 2. Render de hiërarchie: ELK item maar één keer tekenen
        const maxDepth = Math.max(...sorted.map(i => (i['logische volgorde'] || "").split('.').length));

        sorted.forEach(item => {
            const code = item['logische volgorde'];
            const depth = code.split('.').length;
            const itemLeaves = leafMap.filter(l => l['logische volgorde'].startsWith(code));
            
            const cell = document.createElement('div');
            cell.className = 'cell';
            const isGroup = sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
            if(isGroup) cell.classList.add('group-cell');

            cell.style.gridColumn = `${itemLeaves[0].start} / ${itemLeaves[itemLeaves.length-1].end}`;
            cell.style.gridRow = depth;

            // Alleen de tekst van dit specifieke niveau tonen
            const span = document.createElement('span');
            span.innerHTML = item['titel'] || item['lbl'];
            if(item['verticaal']) span.className = 'vertical-text';
            cell.appendChild(span);
            grid.appendChild(cell);
        });

        // 3. De nummers en letters (vaste rijen onderaan)
        leafMap.forEach(l => {
            const n = document.createElement('div');
            n.className = 'cell num-cell';
            n.style.gridColumn = `${l.start} / ${l.end}`;
            n.style.gridRow = maxDepth + 1;
            n.textContent = l['volgorde lbl'];
            grid.appendChild(n);

            const letters = (l['sub']?.id === 1351) ? ['b','r','e'] : (l['sub']?.id === 1352 ? ['f','c'] : [null]);
            letters.forEach((char, i) => {
                if(!char) return;
                const s = document.createElement('div');
                s.className = 'cell sub-cell';
                s.style.gridColumn = l.start + i;
                s.style.gridRow = maxDepth + 2;
                s.textContent = char;
                grid.appendChild(s);
            });
        });

        container.appendChild(grid);
    }
}
window.onload = init;