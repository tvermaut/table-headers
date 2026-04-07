async function init() {
    // We laden de statische JSON die door GitHub Actions is gegenereerd
    const response = await fetch('data.json');
    const rawData = await response.json();
    const rows = rawData;

    // 1. Groepeer kolommen per 'Tabel' (field_3225)
    const tablesMap = {};
    rows.forEach(row => {
        const tableInfo = row['Tabel'][0]; // Neem de eerste gekoppelde tabel
        if (tableInfo) {
            if (!tablesMap[tableInfo.id]) tablesMap[tableInfo.id] = [];
            tablesMap[tableInfo.id].push(row);
        }
    });

    const container = document.getElementById('table-container');

    // 2. Bouw voor elke tabel in de data een HTML tabel
    for (const tableId in tablesMap) {
        const tableRows = tablesMap[tableId];
        const h2 = document.createElement('h2');
        h2.textContent = `Tabel ID: ${tableId}`;
        container.appendChild(h2);
        
        const htmlTable = buildComplexHeader(tableRows);
        container.appendChild(htmlTable);
    }
}

function buildComplexHeader(nodes) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    
    // Identificeer de boomstructuur
    const idMap = {};
    nodes.forEach(n => { idMap[n.id] = { ...n, children: [], width: 0, depth: 0 }; });
    
    const roots = [];
    nodes.forEach(n => {
        // Controleer Ouder kolom 1 (field_3227)
        const parentId = n['Ouder kolom 1']?.[0]?.id;
        if (parentId && idMap[parentId]) {
            idMap[parentId].children.push(idMap[n.id]);
        } else {
            roots.push(idMap[n.id]);
        }
    });

    // Bereken breedte (colspan) en diepte (rowspan) recursief
    function calculateMetrics(node, depth) {
        node.depth = depth;
        if (node.children.length === 0) {
            node.width = 1;
            return 1;
        }
        node.width = node.children.reduce((acc, child) => acc + calculateMetrics(child, depth + 1), 0);
        return node.width;
    }
    roots.forEach(r => calculateMetrics(r, 0));

    // Maak rijen voor de header (max 4 diep op basis van je Ouder 1,2,3 velden)
    const maxDepth = 4;
    const grid = Array.from({ length: maxDepth }, () => []);

    function fillGrid(node, d) {
        grid[d].push(node);
        node.children.forEach(c => fillGrid(c, d + 1));
    }
    roots.sort((a,b) => a['volgnr. log.'] - b['volgnr. log.']).forEach(r => fillGrid(r, 0));

    // Bouw de HTML rijen
    grid.forEach((rowNodes, d) => {
        if (rowNodes.length === 0) return;
        const tr = document.createElement('tr');
        tr.className = `header-row-${d}`;
        rowNodes.forEach(node => {
            const th = document.createElement('th');
            th.textContent = node.titel || node.lbl;
            if (node.width > 1) th.colSpan = node.width;
            
            // Als het een blad-node is (geen kinderen), moet hij verticaal stretchen
            if (node.children.length === 0 && d < maxDepth - 1) {
                th.rowSpan = maxDepth - d;
            }
            tr.appendChild(th);
        });
        thead.appendChild(tr);
    });

    table.appendChild(thead);
    return table;
}

init();
