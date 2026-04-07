async function init() {
    const res = await fetch('data.json');
    const data = await res.json();
    const items = data.results || data;
    const container = document.getElementById('table-container');
    container.innerHTML = '';

    const tables = {};
    items.forEach(r => { 
        const id = r['Tabel']?.[0]?.id; 
        if(id) (tables[id] = tables[id] || []).push(r); 
    });

    for (const id in tables) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        
        const h2 = document.createElement('h2');
        h2.style.fontWeight = 'normal';
        h2.textContent = `Tabel: ${id}`;
        wrapper.appendChild(h2);

        renderClassicTable(tables[id], wrapper);
        container.appendChild(wrapper);
    }
}

function renderClassicTable(items, target) {
    const sorted = items.sort((a, b) => 
        (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
    );

    // Bepaal colspan (breedte in sub-kolommen)
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

    const maxLevel = Math.max(...sorted.map(i => i['logische volgorde'].split('.').length));
    const table = document.createElement('table');
    
    for (let level = 1; level <= maxLevel; level++) {
        const tr = document.createElement('tr');
        const nodesAtLevel = sorted.filter(n => n['logische volgorde'].split('.').length === level);
        
        nodesAtLevel.forEach(node => {
            const th = document.createElement('th');
            const code = node['logische volgorde'];
            const isLeaf = !sorted.some(other => other['logische volgorde'].startsWith(code + "."));
            
            th.colSpan = getColSpan(node);
            if (isLeaf) th.rowSpan = (maxLevel - level) + 1;

            const cellContent = document.createElement('div');
            cellContent.className = 'cell-content';

            // 1. De Titel-tekst (bovenin/midden)
            const titleArea = document.createElement('div');
            titleArea.className = 'title-text';
            const span = document.createElement('span');
            span.innerHTML = node['titel'] || node['lbl'];
            if (node['verticaal']) span.className = 'vertical-text';
            titleArea.appendChild(span);
            cellContent.appendChild(titleArea);

            // 2. De Accolade (Alleen voor groepen, onder de tekst)
            if (!isLeaf) {
                const acc = document.createElement('div');
                acc.className = 'accolade-row';
                cellContent.appendChild(acc);
            }

            // 3. Kolomnummer (Alleen voor leaf nodes, onderaan de cel)
            if (isLeaf) {
                const num = document.createElement('div');
                num.className = 'num-label';
                num.textContent = node['volgorde lbl'] || '';
                cellContent.appendChild(num);
            }

            th.appendChild(cellContent);
            tr.appendChild(th);
        });
        table.appendChild(tr);
    }

    // De onderste rij met letters (b|r|e)
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