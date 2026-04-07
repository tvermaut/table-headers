async function init() {
    try {
        const response = await fetch('data.json');
        const rawData = await response.json();
        const rows = rawData.results || rawData;

        // 1. Groepeer op Tabel (field_3225)
        const tablesMap = {};
        rows.forEach(row => {
            const tableEntry = row['Tabel']?.[0];
            if (tableEntry) {
                if (!tablesMap[tableEntry.id]) tablesMap[tableEntry.id] = [];
                tablesMap[tableEntry.id].push(row);
            }
        });

        const container = document.getElementById('table-container');
        container.innerHTML = '';

        for (const tableId in tablesMap) {
            const h2 = document.createElement('h2');
            h2.textContent = `Tabel: ${tableId}`;
            container.appendChild(h2);
            
            const htmlTable = generateNestedHeader(tablesMap[tableId]);
            container.appendChild(htmlTable);
        }
    } catch (e) {
        console.error("Fout bij laden:", e);
    }
}

function generateNestedHeader(data) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');

    // 1. Sorteer data op de 'logische volgorde' string (AA.BB.CC.DD)
    // We splitsen op punten en vergelijken de numerieke segmenten
    const sortedData = data.sort((a, b) => {
        const partsA = (a['logische volgorde'] || "").split('.').map(Number);
        const partsB = (b['logische volgorde'] || "").split('.').map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            if ((partsA[i] || 0) !== (partsB[i] || 0)) {
                return (partsA[i] || 0) - (partsB[i] || 0);
            }
        }
        return 0;
    });

    // 2. Bepaal maximale diepte (aantal segmenten in AA.BB.CC.DD)
    let maxDepth = 0;
    sortedData.forEach(d => {
        const depth = (d['logische volgorde'] || "").split('.').length;
        if (depth > maxDepth) maxDepth = depth;
    });

    // 3. Bouw een matrix voor de header cellen [rij][kolom]
    const headerRows = Array.from({ length: maxDepth }, () => []);

    // Helper om te tellen hoeveel "leaf nodes" (eindpunten) onder een item vallen voor colspan
    function getLeafCount(item, allItems) {
        const itemCode = item['logische volgorde'];
        const children = allItems.filter(child => {
            const childCode = child['logische volgorde'];
            return childCode.startsWith(itemCode + ".") && childCode.split('.').length === itemCode.split('.').length + 1;
        });

        if (children.length === 0) return 1;
        return children.reduce((sum, child) => sum + getLeafCount(child, allItems), 0);
    }

    // 4. Verdeel de items over de rijen
    sortedData.forEach(item => {
        const code = item['logische volgombe'] || "";
        const level = code.split('.').length - 1;
        
        const cell = {
            label: item['titel'] || item['lbl'],
            colspan: getLeafCount(item, sortedData),
            isLeaf: !sortedData.some(other => other['logische volgorde'].startsWith(code + "."))
        };

        headerRows[level].push(cell);
    });

    // 5. Render de rijen naar HTML
    headerRows.forEach((rowCells, rowIndex) => {
        const tr = document.createElement('tr');
        rowCells.forEach(cell => {
            const th = document.createElement('th');
            th.textContent = cell.label;
            if (cell.colspan > 1) th.colSpan = cell.colspan;
            
            // Rowspan: als het een leaf is, moet hij doortrekken naar de bodem van de header
            if (cell.isLeaf && rowIndex < maxDepth - 1) {
                th.rowSpan = maxDepth - rowIndex;
            }
            tr.appendChild(th);
        });
        thead.appendChild(tr);
    });

    table.appendChild(thead);
    return table;
}

window.onload = init;
