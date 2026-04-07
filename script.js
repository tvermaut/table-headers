/**
 * Haalt de data op uit het door GitHub Actions gegenereerde JSON bestand
 * en bouwt de hiërarchische tabel-header op.
 */
async function init() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("Kon data.json niet laden.");
        
        const rows = await response.json();
        const data = rows.results || rows;

        // Groepeer data per Tabel ID (field_3225)
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
            // Sorteer alle items voor deze tabel op logische volgorde (AA.BB.CC.DD)
            const sortedItems = tablesMap[tableId].sort((a, b) => {
                const aVal = a['logische volgorde'] || "";
                const bVal = b['logische volgorde'] || "";
                return aVal.localeCompare(bVal, undefined, {numeric: true, sensitivity: 'base'});
            });

            // Vind de hoofd-items (roots)
            const roots = sortedItems.filter(item => {
                const code = item['logische volgorde'] || "";
                return !sortedItems.some(other => {
                    const otherCode = other['logische volgorde'] || "";
                    return code.startsWith(otherCode + ".") && code !== otherCode;
                });
            });

            // UI Opbouw
            const title = document.createElement('h2');
            title.textContent = `Tabel: ${tableId}`;
            container.appendChild(title);

            const wrapper = document.createElement('div');
            wrapper.className = 'header-container';

            roots.forEach(root => {
                wrapper.appendChild(renderNode(root, sortedItems));
            });

            container.appendChild(wrapper);
        }
    } catch (e) {
        console.error("Fout bij initialisatie:", e);
    }
}

/**
 * Recursieve functie om een kolom (of groep kolommen) te renderen
 */
function renderNode(node, allItems) {
    const group = document.createElement('div');
    group.className = 'column-group';

    const cell = document.createElement('div');
    cell.className = 'header-cell';

    // 1. Titel Area
    const titleArea = document.createElement('div');
    titleArea.className = 'title-area';
    
    const titleSpan = document.createElement('span');
    titleSpan.innerHTML = node['titel'] || node['lbl'] || '';
    
    if (node['verticaal'] === true) {
        titleSpan.className = 'vertical-text';
    }
    
    titleArea.appendChild(titleSpan);
    cell.appendChild(titleArea);

    // Zoek directe kinderen
    const currentCode = node['logische volgorde'] || "";
    const children = allItems.filter(i => {
        const iCode = i['logische volgorde'] || "";
        return iCode.startsWith(currentCode + ".") && iCode.split('.').length === currentCode.split('.').length + 1;
    });

    // 2. Footer Area (alleen voor 'leaf' nodes die geen kinderen hebben)
    if (children.length === 0) {
        const footerArea = document.createElement('div');
        footerArea.className = 'footer-area';

        // Het volgorde label (nummer)
        const lbl = document.createElement('div');
        lbl.className = 'volgorde-lbl';
        lbl.textContent = node['volgorde lbl'] || '';
        footerArea.appendChild(lbl);

        // De sub-segmentatie (b|r|e of f|c)
        const subType = node['sub']?.id;
        const subCont = document.createElement('div');
        subCont.className = 'sub-container';

        if (subType === 1351) { // b|r|e
            ['b', 'r', 'e'].forEach(letter => {
                const div = document.createElement('div');
                div.className = 'sub-item';
                div.textContent = letter;
                subCont.appendChild(div);
            });
            footerArea.appendChild(subCont);
        } else if (subType === 1352) { // f|c
            ['f', 'c'].forEach(letter => {
                const div = document.createElement('div');
                div.className = 'sub-item';
                div.textContent = letter;
                subCont.appendChild(div);
            });
            footerArea.appendChild(subCont);
        } else {
            // Placeholder om de lijn en hoogte intact te houden
            const spacer = document.createElement('div');
            spacer.className = 'empty-sub';
            footerArea.appendChild(spacer);
        }
        cell.appendChild(footerArea);
    }

    group.appendChild(cell);

    // 3. Kinderen renderen
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

// Start het script
window.onload = init;