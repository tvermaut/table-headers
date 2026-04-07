async function init() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const items = data.results || data;

        const tablesMap = {};
        items.forEach(r => {
            const tid = r['Tabel']?.[0]?.id;
            if (tid) (tablesMap[tid] = tablesMap[tid] || []).push(r);
        });

        const container = document.getElementById('table-container');
        container.innerHTML = '';

        for (const tid in tablesMap) {
            renderTableStack(tablesMap[tid], container, tid);
        }
    } catch (e) {
        console.error("Fout bij laden:", e);
    }
}

function renderTableStack(items, target, tid) {
    // Sorteer op logische volgorde (01, 01.1, etc.)
    const sorted = items.sort((a, b) => 
        (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true})
    );
    
    // Vind de leaf-nodes (de kolommen die daadwerkelijk nummers hebben)
    const leafNodes = sorted.filter(i => 
        !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + "."))
    );

    const title = document.createElement('h2');
    title.textContent = `Tabel: ${tid}`;
    target.appendChild(title);

    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';

    leafNodes.forEach(leaf => {
        const stack = document.createElement('div');
        stack.className = 'column-stack';

        // 1. Onderste laag: b|r|e of f|c
        const subType = leaf['sub']?.id;
        if (subType === 1351 || subType === 1352) {
            const subDiv = document.createElement('div');
            subDiv.className = 'sub-row';
            const letters = (subType === 1351) ? ['b','r','e'] : ['f','c'];
            letters.forEach(l => {
                const div = document.createElement('div');
                div.className = 'sub-letter';
                div.textContent = l;
                subDiv.appendChild(div);
            });
            stack.appendChild(subDiv);
        }

        // 2. Basis laag: Het kolomnummer (volgorde lbl)
        const numBlock = document.createElement('div');
        numBlock.className = 'header-block stack-base';
        numBlock.textContent = leaf['volgorde lbl'] || '';
        stack.appendChild(numBlock);

        // 3. Hiërarchie omhoog bouwen (ouders opzoeken)
        const parts = (leaf['logische volgorde'] || "").split('.');
        
        // We lopen van de diepste code naar de root (bijv. 01.2.3 -> 01.2 -> 01)
        for (let i = parts.length; i > 0; i--) {
            const currentCode = parts.slice(0, i).join('.');
            const node = sorted.find(n => n['logische volgorde'] === currentCode);
            
            if (node) {
                const block = document.createElement('div');
                block.className = 'header-block';
                
                const span = document.createElement('span');
                span.innerHTML = node['titel'] || node['lbl'] || '';
                if (node['verticaal']) span.className = 'vertical-text';
                block.appendChild(span);

                // Als dit een ouder is (niet de leaf zelf), krijgt hij een accolade
                if (i < parts.length) {
                    block.classList.add('has-accolade');
                }

                stack.appendChild(block);
            }
        }
        headerRow.appendChild(stack);
    });

    target.appendChild(headerRow);
}

window.onload = init;