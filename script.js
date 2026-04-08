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

        adjustTableScale(htmlTable);
    }
}

function renderPerfectTable(items) {
    const sorted = items.sort((a, b) => 
        (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
    );

    const leafNodes = sorted.filter(i => !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + ".")));
    const maxLevel = Math.max(...sorted.map(i => i['logische volgorde'].split('.').length));

    const table = document.createElement('table');

    // Bereken totale breedte-units
    const getLeafWidth = (node) => {
        const subId = node['sub']?.id;
        return (subId === 1351) ? 3 : (subId === 1352 ? 2 : 1);
    };

    const totalWidthUnits = leafNodes.reduce((sum, leaf) => sum + getLeafWidth(leaf), 0);

    // Stel de breedte van de kolommen in via <colgroup>
    const colgroup = document.createElement('colgroup');
    leafNodes.forEach(leaf => {
        const subId = leaf['sub']?.id;
        const letters = (subId === 1351) ? 3 : (subId === 1352 ? 2 : 1);
        for(let i=0; i<letters; i++) {
            const col = document.createElement('col');
            col.style.width = (100 / totalWidthUnits) + "%";
            colgroup.appendChild(col);
        }
    });
    table.appendChild(colgroup);

    const getWidth = (node) => {
        const code = node['logische volgorde'];
        const nodeLeaves = leafNodes.filter(l => l['logische volgorde'].startsWith(code));
        return nodeLeaves.reduce((sum, leaf) => sum + getLeafWidth(leaf), 0);
    };

    for (let level = 1; level <= maxLevel; level++) {
        const tr = document.createElement('tr');
        const nodesAtLevel = sorted.filter(n => n['logische volgorde'].split('.').length === level);
        
        nodesAtLevel.forEach(node => {
            const th = document.createElement('th');
            const code = node['logische volgorde'];
            const isLeaf = !sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
            
            th.colSpan = getWidth(node);
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

    // Rij: Nummers
    const numTr = document.createElement('tr');
    leafNodes.forEach(node => {
        const th = document.createElement('th');
        th.className = 'num-row-cell no-border-top';
        th.colSpan = getLeafWidth(node);
        th.textContent = node['volgorde lbl'] || '';
        numTr.appendChild(th);
    });
    table.appendChild(numTr);

    // Rij: Letters
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

    return table;
}

function adjustTableScale(table) {
    const maxWidth = window.innerWidth - 60;
    let currentFontSize = 12;
    table.style.fontSize = currentFontSize + "px";

    // Verklein font-size tot de tabel fysiek binnen het scherm past
    while (table.scrollWidth > table.parentElement.clientWidth && currentFontSize > 6) {
        currentFontSize -= 0.2;
        table.style.fontSize = currentFontSize + "px";
    }
}

window.onload = init;
window.onresize = () => document.querySelectorAll('table').forEach(adjustTableScale);