async function init() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const items = data.results || data;

        const tablesMap = {};
        items.forEach(r => { 
            const tid = r['Tabel']?.[0]?.id; 
            if(tid) (tablesMap[tid] = tablesMap[tid] || []).push(r); 
        });

        const container = document.getElementById('table-container');
        container.innerHTML = '';

        for (const tid in tablesMap) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            
            const h2 = document.createElement('h2');
            h2.textContent = tablesMap[tid][0]['Tabel']?.[0]?.value || `Tabel ${tid}`;
            wrapper.appendChild(h2);

            renderPerfectTable(tablesMap[tid], wrapper);
            container.appendChild(wrapper);
        }
    } catch (e) {
        console.error("Fout:", e);
    }
}

function renderPerfectTable(items, target) {
    // Sorteer op logische code (AA.BB.CC)
    const sorted = items.sort((a, b) => 
        (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
    );

    // Identificeer de eindkolommen (leaves)
    const leafNodes = sorted.filter(i => 
        !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + "."))
    );
    
    // Bereken grid-coördinaten op basis van b|r|e (3) of f|c (2)
    let currentX = 1;
    const leafMap = leafNodes.map(node => {
        const subId = node['sub']?.id;
        const width = (subId === 1351) ? 3 : (subId === 1352 ? 2 : 1);
        const info = { ...node, start: currentX, end: currentX + width };
        currentX += width;
        return info;
    });

    const depths = sorted.map(i => (i['logische volgorde'] || "").split('.').length);
    const maxDepth = Math.max(...depths);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.width = '100%';
    grid.style.borderTop = '1px solid #555';
    grid.style.borderLeft = '1px solid #555';
    grid.style.gridTemplateColumns = `repeat(${currentX - 1}, 1fr)`;
    grid.style.backgroundColor = '#fff';

    // Helper: Maak een grid-cel
    const createGridCell = (span, isVertical, isGroup) => {
        const cell = document.createElement('div');
        cell.style.display = 'flex';
        cell.style.justifyContent = 'center';
        cell.style.alignItems = 'center';
        cell.style.textAlign = 'center';
        cell.style.borderRight = '1px solid #555';
        cell.style.borderBottom = '1px solid #555';
        cell.style.padding = '8px 4px';
        cell.style.fontSize = '11px';
        cell.style.background = '#fff';
        
        if (isGroup) {
            cell.classList.add('group-cell');
            cell.style.borderBottom = 'none'; // Geen harde onderlijn
        }

        const spanElem = document.createElement('span');
        spanElem.innerHTML = span || '';
        if (isVertical) spanElem.className = 'vertical-text';
        cell.appendChild(spanElem);
        return cell;
    };

    // 1. Render de Hiërarchie (Zone A)
    sorted.forEach(item => {
        const code = item['logische volgorde'] || "";
        const depth = code.split('.').length;
        
        // Vind alle bladeren die onder deze groep vallen voor de breedte
        const groupLeaves = leafMap.filter(l => l['logische volgorde'].startsWith(code));
        const start = groupLeaves[0].start;
        const end = groupLeaves[groupLeaves.length - 1].end;

        const isGroup = sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
        
        const cell = createGridCell(item['titel'] || item['lbl'], item['verticaal'], isGroup);
        cell.style.gridColumn = `${start} / ${end}`;
        cell.style.gridRow = depth;
        grid.appendChild(cell);
    });

    // 2. Render de Kolomnummers (Zone B - Vaste rij)
    const numRowY = maxDepth + 1;
    leafMap.forEach(l => {
        const c = document.createElement('div');
        c.className = 'cell num-cell';
        c.style.display = 'flex';
        c.style.justifyContent = 'center';
        c.style.alignItems = 'flex-end'; // Uitlijnen aan de bodem van de cel
        c.style.padding = '2px';
        c.style.fontSize = '11px';
        c.style.height = '35px';
        c.style.borderRight = '1px solid #555';
        c.style.borderBottom = '1px solid #555';
        c.style.gridColumn = `${l.start} / ${l.end}`;
        c.style.gridRow = numRowY;
        c.textContent = l['volgorde lbl'] || '';
        grid.appendChild(c);
    });

    // 3. Render de Sub-letters (Zone C - Vaste rij onder de lijn)
    const subRowY = maxDepth + 2;
    leafMap.forEach(l => {
        const subId = l['sub']?.id;
        const letters = (subId === 1351) ? ['b','r','e'] : (subId === 1352 ? ['f','c'] : [null]);
        
        letters.forEach((char, i) => {
            const c = document.createElement('div');
            c.style.display = 'flex';
            c.style.justifyContent = 'center';
            c.style.alignItems = 'center';
            c.style.fontSize = '10px';
            c.style.height = '25px';
            c.style.borderRight = '1px solid #555';
            c.style.gridColumn = l.start + i;
            c.style.gridRow = subRowY;
            c.innerHTML = char || '&nbsp;';
            grid.appendChild(c);
        });
    });

    target.appendChild(grid);
}

window.onload = init;