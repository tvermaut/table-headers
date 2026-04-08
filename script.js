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
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        
        const h2 = document.createElement('h2');
        h2.style.fontWeight = 'normal';
        h2.textContent = tables[id].name || `Tabel ${id}`;
        wrapper.appendChild(h2);

        const htmlTable = renderPerfectTable(tables[id].rows);
        wrapper.appendChild(htmlTable);
        container.appendChild(wrapper);

        // Pas schaling toe nadat de tabel in de DOM staat
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

    const getWidth = (node) => {
        const code = node['logische volgorde'];
        const nodeLeaves = leafNodes.filter(l => l['logische volgorde'].startsWith(code));
        return nodeLeaves.reduce((sum, leaf) => {
            const sub = leaf['sub']?.id;
            return sum + (sub === 1351 ? 3 : (sub === 1352 ? 2 : 1));
        }, 0);
    };

    for (let level = 1; level <= maxLevel; level++) {
        const tr = document.createElement('tr');
        const nodesAtLevel = sorted.filter(n => n['logische volgorde'].split('.').length === level);
        
        nodesAtLevel.forEach(node => {
            const th = document.createElement('th');
            const code = node['logische volgorde'];
            const isLeaf = !sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
            
            th.colSpan = getWidth(node);
            if (isLeaf) th.rowSpan = (maxLevel - level) + 1;
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

    // Zone: Kolomnummers (Geen bovenlijn, Bold)
    const numTr = document.createElement('tr');
    leafNodes.forEach(node => {
        const th = document.createElement('th');
        th.className = 'num-row-cell no-border-top';
        th.colSpan = (node['sub']?.id === 1351) ? 3 : (node['sub']?.id === 1352 ? 2 : 1);
        th.textContent = node['volgorde lbl'] || '';
        numTr.appendChild(th);
    });
    table.appendChild(numTr);

    // Zone: Sub-letters
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

/**
 * Verkleint de font-size van de tabel als deze breder is dan het scherm.
 * Voegt ook ruimere padding toe als er plek genoeg is.
 */
function adjustTableScale(table) {
    const maxWidth = window.innerWidth - 40; // 20px marge aan weerszijden
    let currentFontSize = 12; // Start font-size in pixels
    table.style.fontSize = currentFontSize + "px";

    // Stap 1: Check of we extra padding kunnen veroorloven
    if (table.offsetWidth < maxWidth * 0.8) {
        table.classList.add('has-space');
    }

    // Stap 2: Verklein font-size tot het past (tot minimaal 8px)
    while (table.offsetWidth > maxWidth && currentFontSize > 8) {
        currentFontSize -= 0.5;
        table.style.fontSize = currentFontSize + "px";
    }
}

window.onload = init;
// Herschaal bij window resize
window.onresize = () => {
    document.querySelectorAll('table').forEach(adjustTableScale);
};