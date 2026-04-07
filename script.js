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
        const title = document.createElement('h2');
        title.style.fontWeight = 'normal';
        title.textContent = `Tabel: ${tableId}`;
        container.appendChild(title);

        const wrapper = document.createElement('div');
        wrapper.className = 'header-container';
        
        const sorted = tablesMap[tableId].sort((a, b) => 
            (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
        );

        // Zoek de root-nodes (items zonder ouder in deze tabel)
        const roots = sorted.filter(item => {
            const code = item['logische volgorde'] || "";
            return !sorted.some(other => code.startsWith(other['logische volgorde'] + "."));
        });

        roots.forEach(root => {
            wrapper.appendChild(renderNode(root, sorted));
        });

        container.appendChild(wrapper);
    }
}

function renderNode(node, allItems) {
    const group = document.createElement('div');
    group.className = 'column-group';

    const cell = document.createElement('div');
    cell.className = 'header-cell';
    
    const isVertical = node['verticaal'] === true;
    const titleSpan = document.createElement('span');
    titleSpan.innerHTML = node['titel'] || node['lbl'] || '';
    if (isVertical) {
        titleSpan.className = 'vertical-text';
        cell.classList.add('has-vertical');
    }
    cell.appendChild(titleSpan);

    const code = node['logische volgorde'] || "";
    const children = allItems.filter(i => {
        const iCode = i['logische volgorde'] || "";
        return iCode.startsWith(code + ".") && iCode.split('.').length === code.split('.').length + 1;
    });

    if (children.length === 0) {
        // Onderste labels toevoegen
        const lbl = document.createElement('div');
        lbl.className = 'volgorde-lbl';
        lbl.textContent = node['volgorde lbl'] || '';
        cell.appendChild(lbl);

        const subType = node['sub']?.id;
        if (subType === 1351 || subType === 1352) {
            const subCont = document.createElement('div');
            subCont.className = 'sub-container';
            const letters = subType === 1351 ? ['b', 'r', 'e'] : ['f', 'c'];
            letters.forEach(l => {
                const div = document.createElement('div');
                div.className = 'sub-item';
                div.textContent = l;
                subCont.appendChild(div);
            });
            cell.appendChild(subCont);
        }
    }

    group.appendChild(cell);

    if (children.length > 0) {
        const childrenWrapper = document.createElement('div');
        childrenWrapper.className = 'children-container';
        children.forEach(child => {
            childrenWrapper.appendChild(renderNode(child, allItems));
        });
        group.appendChild(childrenWrapper);
    }

    return group;
}

window.onload = init;