async function init() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const rows = data.results || data;

        const tablesMap = {};
        rows.forEach(row => {
            const t = row['Tabel']?.[0];
            if (t) {
                if (!tablesMap[t.id]) tablesMap[t.id] = [];
                tablesMap[t.id].push(row);
            }
        });

        const container = document.getElementById('table-container');
        container.innerHTML = '';

        for (const tableId in tablesMap) {
            const sortedItems = tablesMap[tableId].sort((a, b) => 
                (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
            );

            const roots = sortedItems.filter(item => {
                const code = item['logische volgorde'] || "";
                return !sortedItems.some(other => {
                    const oC = other['logische volgorde'] || "";
                    return code.startsWith(oC + ".") && code !== oC;
                });
            });

            const title = document.createElement('h2');
            title.textContent = `Tabel: ${tableId}`;
            container.appendChild(title);

            // De nieuwe Wrapper die alles bij elkaar houdt
            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'table-wrapper';

            const headerContainer = document.createElement('div');
            headerContainer.className = 'header-container';
            roots.forEach(root => headerContainer.appendChild(renderNode(root, sortedItems)));
            tableWrapper.appendChild(headerContainer);

            // Sub-row toevoegen binnen de wrapper
            tableWrapper.appendChild(renderSubRow(sortedItems));
            
            container.appendChild(tableWrapper);
        }
    } catch (e) {
        console.error("Fout:", e);
    }
}

function renderNode(node, allItems) {
    const group = document.createElement('div');
    group.className = 'column-group';

    const cell = document.createElement('div');
    cell.className = 'header-cell';
    
    const code = node['logische volgorde'] || "";
    const children = allItems.filter(i => {
        const iC = i['logische volgorde'] || "";
        return iC.startsWith(code + ".") && iC.split('.').length === code.split('.').length + 1;
    });

    // Bepaal of het een leaf of een groep is voor de accolade-logica
    if (children.length > 0) {
        cell.classList.add('is-group');
    } else {
        cell.classList.add('is-leaf');
    }

    const titleArea = document.createElement('div');
    titleArea.className = 'title-area';
    const span = document.createElement('span');
    span.innerHTML = node['titel'] || node['lbl'] || '';
    if (node['verticaal'] === true) span.className = 'vertical-text';
    titleArea.appendChild(span);
    cell.appendChild(titleArea);

    const lbl = document.createElement('div');
    lbl.className = 'volgorde-lbl';
    lbl.textContent = node['volgorde lbl'] || '';
    cell.appendChild(lbl);

    group.appendChild(cell);

    if (children.length > 0) {
        const childrenWrapper = document.createElement('div');
        childrenWrapper.className = 'children-container';
        children.forEach(child => childrenWrapper.appendChild(renderNode(child, allItems)));
        group.appendChild(childrenWrapper);
    }

    return group;
}

function renderSubRow(allItems) {
    const subRow = document.createElement('div');
    subRow.className = 'sub-row-container';

    const leafNodes = allItems.filter(i => 
        !allItems.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + "."))
    );

    leafNodes.forEach(node => {
        const subCol = document.createElement('div');
        subCol.className = 'sub-column';
        
        const subType = node['sub']?.id;
        const letters = subType === 1351 ? ['b', 'r', 'e'] : (subType === 1352 ? ['f', 'c'] : [null]);

        letters.forEach(l => {
            const div = document.createElement('div');
            div.className = 'sub-item';
            div.innerHTML = l || '&nbsp;';
            subCol.appendChild(div);
        });
        subRow.appendChild(subCol);
    });
    return subRow;
}

window.onload = init;