async function init() {
    const res = await fetch('data.json');
    const data = await res.json();
    const items = data.results || data;
    const container = document.getElementById('table-container');
    container.innerHTML = '';

    const tables = {};
    items.forEach(r => { const id = r['Tabel']?.[0]?.id; if(id) (tables[id] = tables[id] || []).push(r); });

    for (const id in tables) {
        renderClassicTable(tables[id], container, id);
    }
}

function renderClassicTable(items, target, id) {
    const sorted = items.sort((a, b) => (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true}));
    
    // 1. Analyseer tekstregels
    const getLineCount = (node) => {
        if (node['verticaal']) return 10; // Reserveer hoogte voor verticale tekst
        const txt = node['titel'] || node['lbl'] || "";
        return txt.split(/<br\s*\/?>/i).length;
    };

    // 2. Bereken colspan per node
    const getColSpan = (node) => {
        const code = node['logische volgorde'];
        const leaves = sorted.filter(i => {
            const isDesc = i['logische volgorde'].startsWith(code + ".");
            const isLeaf = !sorted.some(other => other['logische volgorde'].startsWith(i['logische volgorde'] + "."));
            return (i['logische volgorde'] === code && isLeaf) || (isDesc && isLeaf);
        });
        return leaves.reduce((sum, leaf) => {
            const sub = leaf['sub']?.id;
            return sum + (sub === 1351 ? 3 : (sub === 1352 ? 2 : 1));
        }, 0);
    };

    // 3. Bouw de matrix (rijen)
    const maxLevel = Math.max(...sorted.map(i => i['logische volgorde'].split('.').length));
    const table = document.createElement('table');
    
    // We maken rijen voor elk niveau in de hiërarchie
    for (let level = 1; level <= maxLevel; level++) {
        const tr = document.createElement('tr');
        const nodesAtLevel = sorted.filter(n => n['logische volgorde'].split('.').length === level);
        
        nodesAtLevel.forEach(node => {
            const th = document.createElement('th');
            th.colSpan = getColSpan(node);
            
            const isLeaf = !sorted.some(other => other['logische volgorde'].startsWith(node['logische volgorde'] + "."));
            
            // Als het een groep is, heeft hij GEEN onderlijn (rowspan 1)
            // Als het een leaf is, trekt hij door naar de bodem van de header-sectie
            if (isLeaf) {
                th.rowSpan = (maxLevel - level) + 1;
            }

            const container = document.createElement('div');
            container.className = 'title-container';
            
            // Accolade toevoegen als het een groep is
            const hasChildren = sorted.some(other => other['logische volgorde'].startsWith(node['logische volgorde'] + "."));
            if (hasChildren) {
                const acc = document.createElement('div');
                acc.className = 'accolade-space';
                th.appendChild(acc);
            }

            const span = document.createElement('span');
            span.innerHTML = node['titel'] || node['lbl'];
            if (node['verticaal']) span.className = 'vertical-text';
            container.appendChild(span);
            
            if (isLeaf) {
                const lbl = document.createElement('div');
                lbl.style.fontSize = '10px';
                lbl.style.marginTop = '10px';
                lbl.textContent = node['volgorde lbl'] || '';
                container.appendChild(lbl);
            }

            th.appendChild(container);
            tr.appendChild(th);
        });
        table.appendChild(tr);
    }

    // 4. De sub-letters rij (b|r|e) - de absolute bodem zonder onderlijn
    const subTr = document.createElement('tr');
    const leafNodes = sorted.filter(i => !sorted.some(other => other['logische volgorde'].startsWith(i['logische volgorde'] + ".")));
    
    leafNodes.forEach(node => {
        const subId = node['sub']?.id;
        const letters = (subId === 1351) ? ['b','r','e'] : (subId === 1352 ? ['f','c'] : [null]);
        letters.forEach(l => {
            const td = document.createElement('td');
            td.className = 'sub-cell';
            td.innerHTML = l || '&nbsp;';
            subTr.appendChild(td);
        });
    });
    table.appendChild(subTr);

    target.appendChild(table);
}

window.onload = init;