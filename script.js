async function init() {
    try {
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
            const sortedItems = tablesMap[tableId].sort((a, b) => 
                (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
            );

            const roots = sortedItems.filter(item => {
                const code = item['logische volgorde'] || "";
                return !sortedItems.some(other => code.startsWith(other['logische volgorde'] + ".") && code !== otherCode);
            });

            const title = document.createElement('h2');
            title.textContent = `Tabel: ${tableId}`;
            container.appendChild(title);

            const wrapper = document.createElement('div');
            wrapper.className = 'header-container';
            roots.forEach(root => wrapper.appendChild(renderNode(root, sortedItems)));
            container.appendChild(wrapper);

            // Voeg de allerlaatste rij toe voor de sub-aanduidingen (b|r|e etc)
            const subRow = document.createElement('div');
            subRow.className = 'sub-row-container';
            subRow.style.borderLeft = '1px solid #555';

            // We halen alle leaf-nodes op in de juiste volgorde
            const leafNodes = sortedItems.filter(i => 
                !sortedItems.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + "."))
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
            container.appendChild(subRow);
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

    const titleArea = document.createElement('div');
    titleArea.className = 'title-area';
    const span = document.createElement('span');
    span.innerHTML = node['titel'] || node['lbl'] || '';
    if (node['verticaal'] === true) span.className = 'vertical-text';
    titleArea.appendChild(span);
    cell.appendChild(titleArea);

    const code = node['logische volgorde'] || "";
    const children = allItems.filter(i => {
        const iCode = i['logische volgorde'] || "";
        return iCode.startsWith(code + ".") && iCode.split('.').length === code.split('.').length + 1;
    });

    // Het nummer (volgorde lbl) plaatsen we ALTIJD onderin de cel, 
    // ook als de cel een groep is die meerdere rijen overspant.
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

window.onload = init;