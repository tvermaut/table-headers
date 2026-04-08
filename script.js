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
            if(!tables[id]) {
                tables[id] = { name: tInfo.value, rows: [] };
            }
            tables[id].rows.push(r);
        }
    });

    for (const id in tables) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        
        const h2 = document.createElement('h2');
        h2.style.fontWeight = 'normal';
        // Gebruik de Baserow label naam in plaats van alleen het ID
        h2.textContent = tables[id].name || `Tabel ${id}`;
        wrapper.appendChild(h2);

        renderPerfectTable(tables[id].rows, wrapper);
        container.appendChild(wrapper);
    }
}

function renderPerfectTable(items, target) {
    const sorted = items.sort((a, b) => 
        (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
    );

    const leafNodes = sorted.filter(i => !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + ".")));
    const maxLevel = Math.max(...sorted.map(i => i['logische volgorde'].split('.').length));

    const table = document.createElement('table');

    const getWidth = (node) => {
        const code = node['logische volgorde'];
        const nodeLeaves = leafNodes.filter(l => l['logische volgorde'].startsWith(code));
        return nodeLeaves.reduce((sum, leaf) => {
            const sub = leaf['sub']?.id;
            return sum + (sub === 1351 ? 3 : (sub === 1352 ? 2 : 1));
        }, 0);
    };

    // 1. ZONE A & B: Hiërarchie en Titels
    for (let level = 1; level <= maxLevel; level++) {
        const tr = document.createElement('tr');
        const nodesAtLevel = sorted.filter(n => n['logische volgorde'].split('.').length === level);
        
        nodesAtLevel.forEach(node => {
            const th = document.createElement('th');
            const code = node['logische volgorde'];
            const isLeaf = !sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
            
            th.colSpan = getWidth(node);
            if (isLeaf) th.rowSpan = (maxLevel - level) + 1;

            // Als het een groep is, verberg de onderlijn (want de accolade komt eronder)
            if (!isLeaf) th.className = 'no-border-bottom';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'title-cell';
            const span = document.createElement('span');
            span.innerHTML = node['titel'] || node['lbl'];
            if (node['verticaal']) span.className = 'vertical-text';
            titleDiv.appendChild(span);
            th.appendChild(titleDiv);

            if (!isLeaf) {
                const acc = document.createElement('div');
                acc.className = 'accolade-row';
                th.appendChild(acc);
            }

            tr.appendChild(th);
        });
        table.appendChild(tr);
    }

    // 2. ZONE C: Kolomnummers
    const numTr = document.createElement('tr');
    leafNodes.forEach(node => {
        const th = document.createElement('th');
        th.className = 'num-row-cell no-border-top'; // Verberg bovenlijn
        th.colSpan = (node['sub']?.id === 1351) ? 3 : (node['sub']?.id === 1352 ? 2 : 1);
        th.textContent = node['volgorde lbl'] || '';
        numTr.appendChild(th);
    });
    table.appendChild(numTr);

    // 3. ZONE D: Sub-letters
    const subTr = document.createElement('tr');
    leafNodes.forEach(node => {
        const subId = node['sub']?.id;
        const letters = (subId === 1351) ? ['b','r','e'] : (subId === 1352) ? ['f','c'] : [null];
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