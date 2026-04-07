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

            // CORRECTIE: De filter-logica voor root-nodes (geen 'otherCode' error meer)
            const roots = sortedItems.filter(item => {
                const code = item['logische volgorde'] || "";
                return !sortedItems.some(other => {
                    const otherC = other['logische volgorde'] || "";
                    return code.startsWith(otherC + ".") && code !== otherC;
                });
            });

            const title = document.createElement('h2');
            title.textContent = `Tabel: ${tableId}`;
            container.appendChild(title);

            // Container voor de eigenlijke header-blokken
            const wrapper = document.createElement('div');
            wrapper.className = 'header-container';
            roots.forEach(root => wrapper.appendChild(renderNode(root, sortedItems)));
            container.appendChild(wrapper);

            // De sub-row voor b|r|e en f|c (onder de laatste lijn)
            const subRow = document.createElement('div');
            subRow.className = 'sub-row-container';
            subRow.style.borderLeft = '1px solid #555';
            subRow.style.display = 'flex';
            subRow.style.width = '100%';

            // Alle leaf-nodes (kolommen zonder kinderen)
            const leafNodes = sortedItems.filter(i => 
                !sortedItems.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + "."))
            );

            leafNodes.forEach(node => {
                const subCol = document.createElement('div');
                subCol.className = 'sub-column';
                subCol.style.flex = "1";
                subCol.style.display = "flex";
                subCol.style.borderRight = "1px solid #555";
                
                const subType = node['sub']?.id;
                const letters = subType === 1351 ? ['b', 'r', 'e'] : (subType === 1352 ? ['f', 'c'] : [null]);

                letters.forEach(l => {
                    const div = document.createElement('div');
                    div.className = 'sub-item';
                    div.style.flex = "1";
                    div.style.textAlign = "center";
                    div.style.fontSize = "10px";
                    div.style.lineHeight = "18px";
                    if (letters.length > 1 && l !== letters[letters.length - 1]) {
                        div.style.borderRight = "1px solid #555";
                    }
                    div.innerHTML = l || '&nbsp;';
                    subCol.appendChild(div);
                });
                subRow.appendChild(subCol);
            });
            container.appendChild(subRow);
        }
    } catch (e) {
        console.error("Fout in init:", e);
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

    // Het volgorde nummer (volgorde lbl) onderin de cel
    const lbl = document.createElement('div');
    lbl.className = 'volgorde-lbl';
    lbl.textContent = node['volgorde lbl'] || '';
    cell.appendChild(lbl);

    group.appendChild(cell);

    if (children.length > 0) {
        const childrenWrapper = document.createElement('div');
        childrenWrapper.className = 'children-container';
        childrenWrapper.style.display = 'flex';
        children.forEach(child => childrenWrapper.appendChild(renderNode(child, allItems)));
        group.appendChild(childrenWrapper);
    }

    return group;
}

window.onload = init;