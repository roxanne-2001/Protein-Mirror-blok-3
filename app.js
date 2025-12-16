console.log('=== APP.JS LOADED ===');

let proteinProducts = [];
let normalProducts = [];

function parseSimpleCSV(text) {
    const lines = text.trim().split('\n');
    const products = [];
    
    // Skip header (line 0), parse data lines
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Proper CSV parser that handles quoted fields with commas
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // Last field
        
        if (values.length >= 7) {
            products.push({
                'Naam': values[0],
                'Prijs': values[1],
                'Aanbieding': values[2] || '-',
                'Eiwit per 100g': values[3],
                'Koolhydraten per 100g': values[4],
                'Vetten per 100g': values[5],
                'Calorieën': values[6],
                'Link': values[7] || '',
                'Afbeelding': values[8] || ''
            });
        }
    }
    return products;
}

async function loadCSVData() {
    console.log('Loading CSV...');
    try {
        const response1 = await fetch('ah_proteine_producten.csv');
        const response2 = await fetch('ah_normale_producten.csv');
        
        proteinProducts = parseSimpleCSV(await response1.text());
        normalProducts = parseSimpleCSV(await response2.text());
        
        console.log('Loaded:', proteinProducts.length, normalProducts.length);
        
        const sel1 = document.getElementById('protein-select');
        const sel2 = document.getElementById('normal-select');
        
        proteinProducts.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = p.Naam;
            sel1.appendChild(opt);
        });
        
        normalProducts.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = p.Naam;
            sel2.appendChild(opt);
        });
        
        alert('Geladen: ' + proteinProducts.length + ' / ' + normalProducts.length);
    } catch (e) {
        alert('ERROR: ' + e.message);
        console.error(e);
    }
}

function compareProducts() {
    const i1 = document.getElementById('protein-select').value;
    const i2 = document.getElementById('normal-select').value;
    
    if (!i1 || !i2) return;
    
    const p1 = proteinProducts[i1];
    const p2 = normalProducts[i2];
    
    document.getElementById('comparison-container').classList.remove('hidden');
    document.getElementById('links-section').classList.remove('hidden');
    
    document.getElementById('protein-name').textContent = p1.Naam;
    document.getElementById('protein-price').textContent = p1.Prijs;
    document.getElementById('protein-eiwit').textContent = p1['Eiwit per 100g'];
    document.getElementById('protein-calories').textContent = p1['Calorieën'];
    document.getElementById('protein-vetten').textContent = p1['Vetten per 100g'];
    document.getElementById('protein-koolhydraten').textContent = p1['Koolhydraten per 100g'];
    
    document.getElementById('normal-name').textContent = p2.Naam;
    document.getElementById('normal-price').textContent = p2.Prijs;
    document.getElementById('normal-eiwit').textContent = p2['Eiwit per 100g'];
    document.getElementById('normal-calories').textContent = p2['Calorieën'];
    document.getElementById('normal-vetten').textContent = p2['Vetten per 100g'];
    document.getElementById('normal-koolhydraten').textContent = p2['Koolhydraten per 100g'];
    
    // Set product images
    if (p1.Afbeelding) {
        document.getElementById('protein-image').style.backgroundImage = `url('${p1.Afbeelding}')`;
    }
    if (p2.Afbeelding) {
        document.getElementById('normal-image').style.backgroundImage = `url('${p2.Afbeelding}')`;
    }
}

function clearComparison() {
    document.getElementById('protein-select').value = '';
    document.getElementById('normal-select').value = '';
    document.getElementById('comparison-container').classList.add('hidden');
    document.getElementById('links-section').classList.add('hidden');
}

function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const proteinSelect = document.getElementById('protein-select');
    const normalSelect = document.getElementById('normal-select');
    
    // Filter protein products
    const proteinOptions = proteinSelect.querySelectorAll('option:not(:first-child)');
    proteinOptions.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? '' : 'none';
    });
    
    // Filter normal products
    const normalOptions = normalSelect.querySelectorAll('option:not(:first-child)');
    normalOptions.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');
    loadCSVData();
    document.getElementById('protein-select').addEventListener('change', compareProducts);
    document.getElementById('normal-select').addEventListener('change', compareProducts);
    document.getElementById('search-input').addEventListener('input', filterProducts);
});
