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
            const title = document.createElement('h2');
            title.textContent = `Tabel: ${tableId}`;
            container.appendChild(title);
            container.appendChild(generateTable(tablesMap[tableId]));
        }
    } catch (e) {
        console.error("Fout bij laden:", e);
    }
}

function generateTable(items) {
    // 1. Sorteer op logische volgorde (AA.BB.CC.DD)
    const sorted = items.sort((a, b) => {
        const aVal = a['logische volgorde'] || "";
        const bVal = b['logische volgorde'] || "";
        return aVal.localeCompare(bVal, undefined, {numeric: true, sensitivity: 'base'});
    });

    const table = document.createElement('table');
    const thead = document.createElement('thead');

    // 2. Hulpunctie: telt hoeveel 'bladeren' (kolommen zonder kinderen) onder dit item vallen
    function countLeaves(parentCode) {
        // Een leaf is een item dat GEEN ander item heeft dat begint met zijn eigen code + "."
        const children = sorted.filter(i => (i['logische volgorde'] || "").startsWith(parentCode + "."));
        
        if (children.length === 0) return 1;

        // Tel alleen de items die zelf geen kinderen meer hebben binnen deze selectie
        const leavesUnderneath = sorted.filter(i => {
            const code = i['logische volgorde'] || "";
            const isDescendant = code.startsWith(parentCode + ".");
            const hasNoOwnChildren = !sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
            return isDescendant && hasNoOwnChildren;
        });

        return leavesUnderneath.length || 1;
    }

    // 3. Bepaal max diepte
    const depths = sorted.map(i => (i['logische volgorde'] || "").split('.').length);
    const maxDepth = Math.max(...depths);

    // 4. Maak rijen
    for (let d = 1; d <= maxDepth; d++) {
        const tr = document.createElement('tr');
        
        // Pak alle items die op dit niveau zitten
        const levelItems = sorted.filter(i => (i['logische volgorde'] || "").split('.').length === d);

        levelItems.forEach(item => {
            const code = item['logische volgorde'] || "";
            const th = document.createElement('th');
            th.textContent = item['titel'] || item['lbl'];

            // Bereken breedte (colspan)
            const leaves = countLeaves(code);
            if (leaves > 1) th.colSpan = leaves;

            // Bereken hoogte (rowspan): als dit item geen kinderen heeft, moet hij de rest van de rijen vullen
            const hasChildren = sorted.some(other => (other['logische volgorde'] || "").startsWith(code + "."));
            if (!hasChildren && d < maxDepth) {
                th.rowSpan = (maxDepth - d) + 1;
            }

            tr.appendChild(th);
        });
        thead.appendChild(tr);
    }

    table.appendChild(thead);
    return table;
}

window.onload = init;