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

        const outerWrapper = document.createElement('div');
        outerWrapper.className = 'table-wrapper';

        const htmlTable = renderPerfectTable(tables[id].rows);
        outerWrapper.appendChild(htmlTable);
        container.appendChild(outerWrapper);

        // Schalen op basis van breedte-invulling
        fillTableWidth(htmlTable);
    }
}

function renderPerfectTable(items) {
    const sorted = items.sort((a, b) => 
        (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
    );

    const leafNodes = sorted.filter(i => !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + ".")));
    const maxLevel = Math.max(...sorted.map(i => i['logische volgorde'].split('.').length));

    const table = document.createElement('table');

    const getLeafUnits = (node) => {
        const subId = node['sub']?.id;
        return (subId === 1351) ? 3 : (subId === 1352 ? 2 : 1);
    };

    const totalUnits = leafNodes.reduce((sum, leaf) => sum + getLeafUnits(leaf), 0);

    const colgroup = document.createElement('colgroup');
    leafNodes.forEach(leaf => {
        const units = getLeafUnits(leaf);
        for(let i=0; i<units; i++) {
            const col = document.createElement('col');
            col.style.width = (100 / totalUnits) + "%";
            colgroup.appendChild(col);
        }
    });
    table.appendChild(colgroup);

    for (let level = 1; level <= maxLevel; level++) {
        const tr = document.createElement('tr');
        const nodesAtLevel = sorted.filter(n => n['logische volgorde'].split('.').length === level);
        
        nodesAtLevel.forEach(node => {
            const th = document.createElement('th');
            const code = node['logische volgorde'];
            const isLeaf = !sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
            
            const leavesUnderNode = leafNodes.filter(l => l['logische volgorde'].startsWith(code));
            th.colSpan = leavesUnderNode.reduce((sum, leaf) => sum + getLeafUnits(leaf), 0);
            
            if (isLeaf) {
                th.rowSpan = (maxLevel - level) + 1;
                th.classList.add('no-border-bottom');
            } else {
                th.classList.add('no-border-bottom');
            }

            const titleDiv = document.createElement('div');
            titleDiv.className = 'title-cell';
            const span = document.createElement('span');
            span.innerHTML = node['titel'] || node['lbl'];
            
            if (node['verticaal']) {
                span.className = 'vertical-text';
            } else {
                span.className = 'horizontal-text';
            }
            
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

    // Nummers en Letters toevoegen (zoals voorheen)
    const numTr = document.createElement('tr');
    leafNodes.forEach(node => {
        const th = document.createElement('th');
        th.className = 'num-row-cell no-border-top';
        th.colSpan = getLeafUnits(node);
        th.textContent = node['volgorde lbl'] || '';
        numTr.appendChild(th);
    });
    table.appendChild(numTr);

    const subTr = document.createElement('tr');
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

    return table;
}

function fillTableWidth(table) {
    const wrapper = table.parentElement;
    let baseFontSize = 14; // We mikken op een groter font als basis
    table.style.fontSize = baseFontSize + "px";

    // Voor de verticale teksten: we begrenzen deze op de celbreedte
    const verticalSpans = table.querySelectorAll('.vertical-text');
    verticalSpans.forEach(span => {
        const cell = span.closest('th');
        let vFontSize = baseFontSize;
        span.style.fontSize = vFontSize + "px";
        
        // Verklein alleen als de breedte van de gedraaide tekst (offsetHeight) de cel ontgroeit
        while (span.offsetHeight > (cell.clientWidth - 4) && vFontSize > 7) {
            vFontSize -= 0.5;
            span.style.fontSize = vFontSize + "px";
        }
    });

    // Voor de tabel als geheel: als hij tóch te breed is voor het window, font verlagen
    while (table.scrollWidth > wrapper.clientWidth && baseFontSize > 8) {
        baseFontSize -= 0.5;
        table.style.fontSize = baseFontSize + "px";
        // Update ook de verticale teksten mee
        verticalSpans.forEach(s => s.style.fontSize = (parseFloat(s.style.fontSize) - 0.5) + "px");
    }
}

window.onload = init;
window.onresize = () => document.querySelectorAll('table').forEach(fillTableWidth);