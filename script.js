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

        const div = document.createElement('div');
        div.className = 'table-container';
        const htmlTable = renderRowBasedTable(tables[id].rows);
        div.appendChild(htmlTable);
        container.appendChild(div);
        
        scaleTable(htmlTable);
    }
}

function renderRowBasedTable(items) {
    const sorted = items.sort((a, b) => (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true}));
    const leafNodes = sorted.filter(i => !sorted.some(other => other['logische volgorde'].startsWith(i['logische volgorde'] + ".")));

    // Helper: Tel regels tekst
    const countLines = (txt) => (txt || "").split(/<br\s*\/?>/i).length;

    // 1. Bereken de benodigde rijen per kolom-tak
    const colStats = leafNodes.map(leaf => {
        const parts = leaf['logische volgorde'].split('.');
        let totalRows = 0;
        const stack = [];

        parts.forEach((p, idx) => {
            const code = parts.slice(0, idx + 1).join('.');
            const node = sorted.find(n => n['logische volgorde'] === code);
            if (node) {
                const lines = node['verticaal'] ? 8 : countLines(node['titel'] || node['lbl']);
                const isGroup = sorted.some(other => other['logische volgorde'].startsWith(code + "."));
                
                // Elke node krijgt lines + 1 (marge)
                // Als het een groep is komt daar de accolade rij bij (+1)
                const nodeRows = lines + 1 + (isGroup ? 1 : 0);
                totalRows += nodeRows;
                stack.push({ node, lines, nodeRows, isGroup });
            }
        });
        return { leaf, totalRows, stack };
    });

    const maxHeaderRows = Math.max(...colStats.map(s => s.totalRows));
    const table = document.createElement('table');
    
    // We maken colgroups voor de breedte
    const colgroup = document.createElement('colgroup');
    leafNodes.forEach(leaf => {
        const subId = leaf['sub']?.id;
        const width = subId === 1351 ? 3 : (subId === 1352 ? 2 : 1);
        for(let i=0; i<width; i++) {
            const col = document.createElement('col');
            col.style.width = (100 / colStats.reduce((a,b) => a + (b.leaf['sub']?.id === 1351 ? 3 : (b.leaf['sub']?.id === 1352 ? 2 : 1)), 0)) + "%";
            colgroup.appendChild(col);
        }
    });
    table.appendChild(colgroup);

    // 2. We bouwen de rijen. Dit is abstracter: we vullen een grid-matrix
    // Omdat we rowspan/colspan gebruiken, vullen we de rijen per niveau
    const levels = Math.max(...sorted.map(i => i['logische volgorde'].split('.').length));
    
    for (let l = 1; l <= levels; l++) {
        const tr = document.createElement('tr');
        const nodesAtLevel = sorted.filter(n => n['logische volgorde'].split('.').length === l);
        
        nodesAtLevel.forEach(node => {
            const th = document.createElement('th');
            const code = node['logische volgorde'];
            const isGroup = sorted.some(other => other['logische volgorde'].startsWith(code + "."));
            const isLeaf = !isGroup;

            // Colspan berekenen
            const nodeLeaves = leafNodes.filter(leaf => leaf['logische volgorde'].startsWith(code));
            th.colSpan = nodeLeaves.reduce((sum, leaf) => {
                const sub = leaf['sub']?.id;
                return sum + (sub === 1351 ? 3 : (sub === 1352 ? 2 : 1));
            }, 0);

            // Rowspan berekenen op basis van onze "regel-wiskunde"
            const lines = node['verticaal'] ? 8 : countLines(node['titel'] || node['lbl']);
            th.rowSpan = lines + 1; 

            // Als dit een leaf is die eerder stopt, trekken we hem door naar de nummers
            if (isLeaf) {
                // Hoeveel rijen blijven er over tot de maxHeaderRows?
                const currentStackHeight = colStats.find(s => s.leaf === node).totalRows;
                th.rowSpan += (maxHeaderRows - currentStackHeight);
            }

            const content = document.createElement('div');
            content.style.padding = "4px 0";
            content.innerHTML = node['titel'] || node['lbl'];
            if (node['verticaal']) content.className = "vertical-text";
            
            th.appendChild(content);
            tr.appendChild(th);
        });
        table.appendChild(tr);

        // Accolade rij toevoegen direct onder groepen op dit niveau
        const trAcc = document.createElement('tr');
        nodesAtLevel.forEach(node => {
            if (sorted.some(other => other['logische volgorde'].startsWith(node['logische volgorde'] + "."))) {
                const tdAcc = document.createElement('td');
                tdAcc.className = "accolade-cell";
                tdAcc.colSpan = nodeLeavesCount(node, sorted, leafNodes); 
                trAcc.appendChild(tdAcc);
            }
        });
        if (trAcc.children.length > 0) table.appendChild(trAcc);
    }

    // Nummers-rij
    const trNum = document.createElement('tr');
    leafNodes.forEach(leaf => {
        const td = document.createElement('td');
        td.className = "num-cell num-row-cell";
        const sub = leaf['sub']?.id;
        td.colSpan = (sub === 1351 ? 3 : (sub === 1352 ? 2 : 1));
        td.textContent = leaf['volgorde lbl'];
        trNum.appendChild(td);
    });
    table.appendChild(trNum);

    // Letters-rij
    const trLet = document.createElement('tr');
    leafNodes.forEach(leaf => {
        const sub = leaf['sub']?.id;
        const letters = sub === 1351 ? ['b','r','e'] : (sub === 1352 ? ['f','c'] : [null]);
        letters.forEach(l => {
            const td = document.createElement('td');
            td.className = "sub-cell";
            td.innerHTML = l || "&nbsp;";
            trLet.appendChild(td);
        });
    });
    table.appendChild(trLet);

    return table;
}

function nodeLeavesCount(node, all, leaves) {
    const code = node['logische volgorde'];
    const nodeLeaves = leaves.filter(l => l['logische volgorde'].startsWith(code));
    return nodeLeaves.reduce((sum, leaf) => {
        const sub = leaf['sub']?.id;
        return sum + (sub === 1351 ? 3 : (sub === 1352 ? 2 : 1));
    }, 0);
}

function scaleTable(table) {
    const wrapper = table.parentElement;
    let fs = 12;
    table.style.fontSize = fs + "px";
    while (table.scrollWidth > wrapper.clientWidth && fs > 7) {
        fs -= 0.5;
        table.style.fontSize = fs + "px";
    }
}

window.onload = init;