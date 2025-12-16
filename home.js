console.log('=== HOME.JS LOADED ===');

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
                'Link': values[7] || ''
            });
        }
    }
    return products;
}

function getProductImageUrl(productLink) {
    // Extract product ID from AH link and create image URL
    if (!productLink) return '';
    
    const match = productLink.match(/product\/(wi\d+)/);
    if (match && match[1]) {
        const productId = match[1];
        return `https://static.ah.nl/image-optimization/static/product/${productId}_40x40_JPG.JPG?quality=90&width=300`;
    }
    
    // Fallback placeholder
    return 'https://via.placeholder.com/300?text=No+Image';
}

function calculateProteinScore(proteinPer100g) {
    // Extract numeric value from string like "11 g"
    const protein = parseFloat(proteinPer100g);
    if (isNaN(protein)) return 5;
    
    // Score based on protein content (higher is better)
    if (protein >= 15) return 9.5 + (Math.random() * 0.5);
    if (protein >= 10) return 8.5 + (Math.random() * 0.8);
    if (protein >= 6) return 7.0 + (Math.random() * 0.5);
    return 5.0 + (Math.random() * 1.5);
}

async function loadTrendingProducts() {
    console.log('Loading trending products...');
    
    try {
        // Load both CSV files
        const [proteinResponse, normalResponse] = await Promise.all([
            fetch('ah_proteine_producten.csv'),
            fetch('ah_normale_producten.csv')
        ]);
        
        const proteinProducts = parseSimpleCSV(await proteinResponse.text());
        const normalProducts = parseSimpleCSV(await normalResponse.text());
        
        console.log('Loaded products:', proteinProducts.length, normalProducts.length);
        
        // Select 2 protein products and 2 normal products
        const selectedProtein = [
            proteinProducts[0], // Philadelphia protein cottage cheese
            proteinProducts[3]  // AH Protein pudding karamelsmaak
        ];
        
        const selectedNormal = [
            normalProducts[7],  // De Zaanse Hoeve Yoghurt Griekse stijl 10% vet
            normalProducts[1]   // Almhof Roomyoghurt perzik maracuja
        ];
        
        // Combine and display
        const allSelected = [...selectedProtein, ...selectedNormal];
        displayProducts(allSelected);
        
    } catch (e) {
        console.error('Error loading products:', e);
    }
}

function displayProducts(products) {
    const container = document.getElementById('trending-products-grid');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing content
    
    products.forEach(product => {
        const protein = parseFloat(product['Eiwit per 100g']);
        const score = calculateProteinScore(product['Eiwit per 100g']).toFixed(1);
        const imageUrl = getProductImageUrl(product.Link);
        
        // Determine badge color based on protein content
        let badgeClass = 'bg-primary';
        let iconClass = 'text-primary';
        
        if (protein < 7) {
            badgeClass = 'bg-yellow-400 text-slate-900';
            iconClass = 'text-yellow-500';
        }
        
        const productCard = `
            <div class="group flex flex-col gap-2 rounded-xl bg-surface-light dark:bg-surface-dark p-3 shadow-sm border border-slate-200 dark:border-slate-800">
                <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <div class="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style='background-image: url("${imageUrl}");'></div>
                    <div class="absolute top-2 right-2 ${badgeClass} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">${score}/10</div>
                </div>
                <div>
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-slate-900 dark:text-white text-sm font-bold line-clamp-1">${product.Naam}</h3>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined ${iconClass} text-[16px]">fitness_center</span>
                        <p class="text-slate-600 dark:text-slate-400 text-xs font-medium">${product['Eiwit per 100g']} Protein</p>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += productCard;
    });
}

// Load products when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready - loading trending products');
    loadTrendingProducts();
});
