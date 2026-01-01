console.log('=== APP.JS LOADED - VERSION 5.2 ===');

let allProducts = [];
let proteinProducts = [];
let normalProducts = [];

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const products = [];
    
    // Skip header (line 0), parse data lines
    for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        // If line starts with quote, extract the main content
        if (line.startsWith('"')) {
            // Find the closing quote of the entire record
            const endQuoteIndex = line.lastIndexOf('"');
            if (endQuoteIndex > 0) {
                line = line.substring(1, endQuoteIndex);
            }
        }
        
        // Now parse CSV fields, handling double quotes for nested quotes
        const values = [];
        let current = '';
        let inQuotes = false;
        let prevChar = '';
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"' && prevChar === '"') {
                // Double quote - keep one quote
                current += char;
                prevChar = '';
                continue;
            } else if (char === '"') {
                inQuotes = !inQuotes;
                prevChar = char;
                continue;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
                prevChar = char;
                continue;
            }
            
            current += char;
            prevChar = char;
        }
        
        values.push(current.trim()); // Last field
        
        // Create product object if we have enough fields
        if (values.length >= 7) {
            const product = {
                'Naam': values[0] || '',
                'Prijs': values[1] || '',
                'Aanbieding': values[2] || '-',
                'Eiwit per 100g': values[3] || '',
                'Koolhydraten per 100g': values[4] || '',
                'Vetten per 100g': values[5] || '',
                'Calorieën': values[6] || '',
                'Link': values[7] || '',
                'Afbeelding': values[8] || ''
            };
            
            products.push(product);
            
            // Debug first product
            if (products.length === 1) {
                console.log('=== FIRST PRODUCT PARSED - VERSION 3.0 ===');
                console.log('Naam:', product.Naam);
                console.log('Prijs:', product.Prijs);
                console.log('Aanbieding:', product.Aanbieding);
                console.log('Eiwit:', product['Eiwit per 100g']);
                console.log('Koolhydraten:', product['Koolhydraten per 100g']);
                console.log('Vetten:', product['Vetten per 100g']);
                console.log('Calorieën:', product['Calorieën']);
                console.log('Link:', product.Link);
                console.log('Afbeelding:', product.Afbeelding);
            }
        }
    }

    return products;
}

function getProteinValue(proteinString) {
    // Extract numeric value from "10.0 g" or "10 g"
    const match = proteinString.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
}

function getProductImageUrl(product) {
    // First, try to use the Afbeelding field if it exists
    if (product.Afbeelding && product.Afbeelding.trim()) {
        let image = product.Afbeelding.replace(/^"+|"+$/g, "").trim(); // Remove quotes
        
        // Clean up the URL
        const marker = "fileType=binary";
        if (image.includes(marker)) {
            image = image.substring(0, image.indexOf(marker) + marker.length);
        }
        
        return image;
    }
    
    // Fallback: Extract product ID from AH link and create image URL
    const productLink = product.Link;
    if (!productLink) return '';
    
    const match = productLink.match(/product\/(wi\d+)/);
    if (match && match[1]) {
        const productId = match[1];
        return `https://static.ah.nl/image-optimization/static/product/${productId}_40x40_JPG.JPG?quality=90&width=300`;
    }
    
    return '';
}

async function loadCSVData() {
    console.log('🔄 Loading CSV data...');
    
    try {
        const response = await fetch('alle_producten_samengevoegd.csv');
        
        if (!response.ok) {
            throw new Error('CSV file not found - Status: ' + response.status);
        }
        
        const csvText = await response.text();
        console.log('✅ CSV loaded successfully, size:', csvText.length);
        
        allProducts = parseCSV(csvText);
        console.log('✅ Parsed', allProducts.length, 'total products');
        
        if (allProducts.length === 0) {
            alert('ERROR: Geen producten gevonden in CSV!');
            return;
        }
        
        console.log('First product:', allProducts[0]);
        
        // Split into protein (>=8g) and normal (<8g)
        proteinProducts = allProducts.filter(p => {
            const protein = getProteinValue(p['Eiwit per 100g']);
            return protein >= 8;
        });
        
        normalProducts = allProducts.filter(p => {
            const protein = getProteinValue(p['Eiwit per 100g']);
            return protein < 8 && protein > 0;
        });
        
        console.log('✅ Protein products (>=8g):', proteinProducts.length);
        console.log('✅ Normal products (<8g):', normalProducts.length);
        
        // NOW add to dropdowns
        const sel1 = document.getElementById('protein-select');
        const sel2 = document.getElementById('normal-select');
        
        if (!sel1 || !sel2) {
            console.error('❌ ERROR: Dropdowns niet gevonden!');
            alert('ERROR: Dropdowns niet gevonden! sel1=' + sel1 + ', sel2=' + sel2);
            return;
        }
        
        console.log('✅ Dropdowns found, sel1 has', sel1.options.length, 'options');
        console.log('Adding protein products...');
        
        let addedCount = 0;
        proteinProducts.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            const productName = p.Naam || 'Onbekend product';
            opt.textContent = productName.length > 60 ? productName.substring(0, 60) + '...' : productName;
            sel1.appendChild(opt);
            addedCount++;
            if (i < 3) console.log(`  ${i}: ${productName}`);
        });
        console.log(`✅ Added ${addedCount} protein products, sel1 now has`, sel1.options.length, 'options');
        
        addedCount = 0;
        normalProducts.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            const productName = p.Naam || 'Onbekend product';
            opt.textContent = productName.length > 60 ? productName.substring(0, 60) + '...' : productName;
            sel2.appendChild(opt);
            addedCount++;
            if (i < 3) console.log(`  ${i}: ${productName}`);
        });
        console.log(`✅ Added ${addedCount} normal products, sel2 now has`, sel2.options.length, 'options');
        
        console.log('✅ ALL DONE!');
    } catch (e) {
        console.error('❌ ERROR:', e);
        alert('ERROR bij laden CSV: ' + e.message + '\n\nCheck console voor details.');
    }
}

function getProductImageUrl(product) {
    // First, try to use the Afbeelding field if it exists
    if (product.Afbeelding && product.Afbeelding.trim()) {
        let image = product.Afbeelding.replace(/^"+|"+$/g, "").trim(); // Remove quotes
        
        // Clean up the URL
        const marker = "fileType=binary";
        if (image.includes(marker)) {
            image = image.substring(0, image.indexOf(marker) + marker.length);
        }
        
        return image;
    }
    
    // Fallback: Extract product ID from AH link and create image URL
    const productLink = product.Link;
    if (!productLink) return '';
    
    const match = productLink.match(/product\/(wi\d+)/);
    if (match && match[1]) {
        const productId = match[1];
        return `https://static.ah.nl/image-optimization/static/product/${productId}_40x40_JPG.JPG?quality=90&width=300`;
    }
    
    return '';
}

function compareProducts() {
    const i1 = document.getElementById('protein-select').value;
    const i2 = document.getElementById('normal-select').value;
    
    if (!i1 || !i2) return;
    
    const p1 = proteinProducts[i1];
    const p2 = normalProducts[i2];
    
    console.log('Comparing products:', p1, p2);
    
    document.getElementById('comparison-container').classList.remove('hidden');
    document.getElementById('links-section').classList.remove('hidden');
    
    // Set product data
    document.getElementById('protein-name').textContent = p1.Naam || '-';
    document.getElementById('protein-price').textContent = p1.Prijs || '-';
    document.getElementById('protein-eiwit').textContent = p1['Eiwit per 100g'] || '-';
    document.getElementById('protein-calories').textContent = p1['Calorieën'] || '-';
    document.getElementById('protein-vetten').textContent = p1['Vetten per 100g'] || '-';
    document.getElementById('protein-koolhydraten').textContent = p1['Koolhydraten per 100g'] || '-';
    
    document.getElementById('normal-name').textContent = p2.Naam || '-';
    document.getElementById('normal-price').textContent = p2.Prijs || '-';
    document.getElementById('normal-eiwit').textContent = p2['Eiwit per 100g'] || '-';
    document.getElementById('normal-calories').textContent = p2['Calorieën'] || '-';
    document.getElementById('normal-vetten').textContent = p2['Vetten per 100g'] || '-';
    document.getElementById('normal-koolhydraten').textContent = p2['Koolhydraten per 100g'] || '-';
    
    // Set product images
    const p1ImageUrl = getProductImageUrl(p1);
    const p2ImageUrl = getProductImageUrl(p2);
    
    console.log('Product 1 image URL:', p1ImageUrl);
    console.log('Product 2 image URL:', p2ImageUrl);
    
    const proteinImageEl = document.getElementById('protein-image');
    const normalImageEl = document.getElementById('normal-image');
    
    if (p1ImageUrl) {
        proteinImageEl.style.backgroundImage = `url('${p1ImageUrl}')`;
        proteinImageEl.style.backgroundSize = 'cover';
        proteinImageEl.style.backgroundPosition = 'center';
    } else {
        proteinImageEl.style.backgroundImage = '';
        proteinImageEl.style.backgroundColor = '#e2e8f0';
    }
    
    if (p2ImageUrl) {
        normalImageEl.style.backgroundImage = `url('${p2ImageUrl}')`;
        normalImageEl.style.backgroundSize = 'cover';
        normalImageEl.style.backgroundPosition = 'center';
    } else {
        normalImageEl.style.backgroundImage = '';
        normalImageEl.style.backgroundColor = '#e2e8f0';
    }
    
    // Set product links
    document.getElementById('protein-link').href = p1.Link || '#';
    document.getElementById('normal-link').href = p2.Link || '#';
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
    console.log('✅ DOM ready - starting initialization');
    
    const proteinSelect = document.getElementById('protein-select');
    const normalSelect = document.getElementById('normal-select');
    const searchInput = document.getElementById('search-input');
    
    console.log('Found elements:');
    console.log('  protein-select:', proteinSelect);
    console.log('  normal-select:', normalSelect);
    console.log('  search-input:', searchInput);
    
    if (!proteinSelect || !normalSelect) {
        console.error('❌ CRITICAL: Select elements not found!');
        alert('ERROR: Dropdowns niet gevonden in DOM!');
        return;
    }
    
    console.log('Adding event listeners...');
    proteinSelect.addEventListener('change', compareProducts);
    normalSelect.addEventListener('change', compareProducts);
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    console.log('✅ Event listeners added');
    
    console.log('Starting CSV load...');
    loadCSVData();
});
