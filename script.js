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
        h2.textContent = tables[id].name;
        container.appendChild(h2);

        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        
        const htmlTable = renderTable(tables[id].rows);
        wrapper.appendChild(htmlTable);
        container.appendChild(wrapper);
        
        adjustTableScale(htmlTable);
    }
}

function renderTable(items) {
    const sorted = items.sort((a, b) => (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true}));
    const leafNodes = sorted.filter(i => !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + ".")));
    
    const table = document.createElement('table');

    // Breedte berekening
    const getLeafUnits = (n) => (n['sub']?.id === 1351) ? 3 : (n['sub']?.id === 1352 ? 2 : 1);
    const totalUnits = leafNodes.reduce((sum, l) => sum + getLeafUnits(l), 0);

    const colgroup = document.createElement('colgroup');
    leafNodes.forEach(l => {
        const u = getLeafUnits(l);
        for(let i=0; i<u; i++) {
            const col = document.createElement('col');
            col.style.width = (100 / totalUnits) + "%";
            colgroup.appendChild(col);
        }
    });
    table.appendChild(colgroup);

    const maxLevel = Math.max(...sorted.map(i => i['logische volgorde'].split('.').length));

    for (let level = 1; level <= maxLevel; level++) {
        const tr = document.createElement('tr');
        const nodesAtLevel = sorted.filter(n => n['logische volgorde'].split('.').length === level);
        
        nodesAtLevel.forEach(node => {
            const th = document.createElement('th');
            const code = node['logische volgorde'];
            const isLeaf = !sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
            
            const nodeLeaves = leafNodes.filter(l => l['logische volgorde'].startsWith(code));
            th.colSpan = nodeLeaves.reduce((sum, l) => sum + getLeafUnits(l), 0);
            
            if (isLeaf) th.rowSpan = (maxLevel - level) + 1;
            
            const cont = document.createElement('div');
            cont.className = 'title-container';
            const span = document.createElement('span');
            span.innerHTML = node['titel'] || node['lbl'];
            if (node['verticaal']) span.className = 'vertical-text';
            cont.appendChild(span);
            th.appendChild(cont);

            if (!isLeaf) {
                th.style.borderBottom = 'none';
                const acc = document.createElement('div');
                acc.className = 'accolade-row';
                th.appendChild(acc);
            }

            tr.appendChild(th);
        });
        table.appendChild(tr);
    }

    // Nummer-rij
    const nTr = document.createElement('tr');
    leafNodes.forEach(l => {
        const td = document.createElement('td');
        td.className = 'num-cell';
        td.colSpan = getLeafUnits(l);
        td.textContent = l['volgorde lbl'];
        nTr.appendChild(td);
    });
    table.appendChild(nTr);

    // Letter-rij
    const lTr = document.createElement('tr');
    leafNodes.forEach(l => {
        const subId = l['sub']?.id;
        const chars = subId === 1351 ? ['b','r','e'] : (subId === 1352 ? ['f','c'] : [null]);
        chars.forEach((c, idx) => {
            const td = document.createElement('td');
            td.className = 'sub-cell';
            if (idx === chars.length - 1) td.classList.add('sub-cell-end');
            td.innerHTML = c || '&nbsp;';
            lTr.appendChild(td);
        });
    });
    table.appendChild(lTr);

    return table;
}

function adjustTableScale(table) {
    const wrapper = table.parentElement;
    let fs = 14;
    table.style.fontSize = fs + "px";

    // Krimp lettertype totdat de fysieke scrollbreedte binnen de wrapper valt
    while (table.scrollWidth > wrapper.clientWidth && fs > 6) {
        fs -= 0.2;
        table.style.fontSize = fs + "px";
    }
}

window.onload = init;
window.onresize = () => document.querySelectorAll('table').forEach(adjustTableScale);