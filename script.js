async function init() {
    const response = await fetch('data.json');
    const rows = await response.json();
    const data = rows.results || rows;

    const tablesMap = {};
    data.forEach(row => {
        const t = row['Tabel']?.[0];
        if (t) {
            if (!tablesMap[t.id]) tablesMap[t.id] = [];
            tablesMap[t.id].push(row);
        }
    });

    const container = document.getElementById('table-container');
    container.innerHTML = '';

    for (const tableId in tablesMap) {
        container.appendChild(generateTable(tablesMap[tableId], tableId));
    }
}

function generateTable(items, tableId) {
    const sorted = items.sort((a, b) => (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true}));
    
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    
    const depths = sorted.map(i => (i['logische volgorde'] || "").split('.').length);
    const maxDepth = Math.max(...depths);

    // Helper om bladeren te tellen
    function countLeaves(parentCode) {
        const descendants = sorted.filter(i => (i['logische volgorde'] || "").startsWith(parentCode + "."));
        if (descendants.length === 0) return 1;
        return sorted.filter(i => {
            const c = i['logische volgorde'] || "";
            return c.startsWith(parentCode + ".") && !sorted.some(o => (o['logische volgorde'] || "").startsWith(c + "."));
        }).length || 1;
    }

    // 1. De Reguliere Header Lagen
    for (let d = 1; d <= maxDepth; d++) {
        const tr = document.createElement('tr');
        const levelItems = sorted.filter(i => (i['logische volgorde'] || "").split('.').length === d);

        levelItems.forEach(item => {
            const th = document.createElement('th');
            const isVertical = item['verticaal'] === true; // Check de nieuwe boolean kolom

            const span = document.createElement('span');
            span.textContent = item['titel'] || item['lbl'] || '';
            
            if (isVertical) {
                span.className = 'vertical-text';
                th.classList.add('has-vertical');
            }
            
            th.appendChild(span);

            const code = item['logische volgorde'] || "";

            // Volgorde LBL onderin (alleen bij leaf nodes of op het laagste niveau van dit item)
            const isLeaf = !sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
            if (isLeaf) {
                const lbl = document.createElement('span');
                lbl.className = 'volgorde-lbl';
                lbl.textContent = item['volgorde lbl'] || '';
                th.appendChild(lbl);
            }

            const leaves = countLeaves(code);
            if (leaves > 1) th.colSpan = leaves;
            if (isLeaf && d < maxDepth) th.rowSpan = (maxDepth - d) + 1;

            tr.appendChild(th);
        });
        thead.appendChild(tr);
    }

    // 2. De Extra Sub-rij (b|r|e of f|c)
    const subTr = document.createElement('tr');
    subTr.className = 'sub-row';

    // We lopen alleen langs de leaf-nodes om de sub-verdeling te maken
    const leafNodes = sorted.filter(i => !sorted.some(other => (other['logische volgorde'] || "").startsWith((i['logische volgorde'] || "") + ".")));

    leafNodes.forEach(item => {
        const th = document.createElement('th');
        const subType = item['sub']?.id; // 1351 = b|r|e, 1352 = f|c
        
        const container = document.createElement('div');
        container.className = 'sub-split-container';

        if (subType === 1351) {
            ['b', 'r', 'e'].forEach(letter => {
                const div = document.createElement('div');
                div.className = 'sub-split-item';
                div.textContent = letter;
                container.appendChild(div);
            });
        } else if (subType === 1352) {
            ['f', 'c'].forEach(letter => {
                const div = document.createElement('div');
                div.className = 'sub-split-item';
                div.textContent = letter;
                container.appendChild(div);
            });
        } else {
            // Lege cel als er geen sub-selectie is
            container.innerHTML = '&nbsp;';
        }

        th.appendChild(container);
        subTr.appendChild(th);
    });

    thead.appendChild(subTr);
    table.appendChild(thead);
    return table;
}

window.onload = init;