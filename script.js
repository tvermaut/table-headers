async function init() {
    const res = await fetch('data.json');
    const data = await res.json();
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
}

function renderTableStack(items, target, tid) {
    const sorted = items.sort((a, b) => (a['logische volgorde'] || "").localeCompare(b['logische volgorde'] || "", undefined, {numeric: true}));
    
    // 1. Vind de onderste elementen (de kolommen met de nummers)
    const leafNodes = sorted.filter(i => 
        !sorted.some(other => (other['logische volgorde'] || "").startsWith(i['logische volgorde'] + "."))
    );

    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';

    leafNodes.forEach(leaf => {
        const stack = document.createElement('div');
        stack.className = 'column-stack';

        // STAP 1: De letters (b|r|e) - helemaal onderaan
        const subType = leaf['sub']?.id;
        if (subId === 1351 || subId === 1352) {
            const subDiv = document.createElement('div');
            subDiv.className = 'sub-row';
            const letters = (subId === 1351) ? ['b','r','e'] : ['f','c'];
            letters.forEach(l => {
                const span = document.createElement('div');
                span.className = 'sub-letter';
                span.textContent = l;
                subDiv.appendChild(span);
            });
            stack.appendChild(subDiv);
        }

        // STAP 2: Het nummer (de basis van de stack)
        const numBlock = document.createElement('div');
        numBlock.className = 'header-block stack-base';
        numBlock.textContent = leaf['volgorde lbl'] || '';
        stack.appendChild(numBlock);

        // STAP 3: De hiërarchie omhoog bouwen
        const parts = (leaf['logische volgorde'] || "").split('.');
        // We lopen van de leaf naar de root (bijv. 01.2.3 -> 01.2 -> 01)
        for (let i = parts.length; i > 0; i--) {
            const currentCode = parts.slice(0, i).join('.');
            const node = sorted.find(n => n['logische volgorde'] === currentCode);
            
            if (node) {
                const block = document.createElement('div');
                block.className = 'header-block';
                
                // Alleen de titel van de leaf zelf (de onderste) of groepen
                const span = document.createElement('span');
                span.innerHTML = node['titel'] || node['lbl'];
                if (node['verticaal']) span.className = 'vertical-text';
                block.appendChild(span);

                // Als dit een ouder is, voeg de accolade toe
                if (i < parts.length) {
                    block.classList.add('has-accolade');
                }

                stack.appendChild(block);
            }
        }
        headerRow.appendChild(stack);
    });

    const h2 = document.createElement('h2');
    h2.textContent = `Tabel: ${tid}`;
    target.appendChild(h2);
    target.appendChild(headerRow);
}

window.onload = init;