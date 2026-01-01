console.log('=== HOME.JS LOADED ===');

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const products = [];
    
    // Parse header
    const header = lines[0].split(',').map(h => h.trim());
    
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
            products.push({
                'Naam': values[0] || '',
                'Prijs': values[1] || '',
                'Aanbieding': values[2] || '-',
                'Eiwit per 100g': values[3] || '',
                'Koolhydraten per 100g': values[4] || '',
                'Vetten per 100g': values[5] || '',
                'Calorieën': values[6] || '',
                'Link': values[7] || '',
                'Afbeelding': values[8] || ''
            });
        }
    }

    return products;
}

function getProductImageUrl(product) {
    // First, try to use the Afbeelding field if it exists
    if (product.Afbeelding && product.Afbeelding.trim()) {
        let image = product.Afbeelding.replace(/^"+|"+$/g, "").trim(); // Remove quotes
        
        // Clean up the URL like in Zoekpagina.html
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
    
    // Fallback placeholder
    return '';
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
        // Load the combined CSV file with images
        const response = await fetch('alle_producten_samengevoegd.csv');
        const allProducts = parseCSV(await response.text());
        
        console.log('Loaded products:', allProducts.length);
        console.log('First product:', allProducts[0]); // Debug log
        
        // Filter products from Albert Heijn only (AH links have working images)
        const ahProducts = allProducts.filter(p => {
            const hasAHLink = p.Link && p.Link.includes('ah.nl');
            const hasImage = p.Afbeelding && p.Afbeelding.trim();
            return hasAHLink && hasImage;
        });
        
        // Filter high protein and normal protein AH products
        const highProteinProducts = ahProducts.filter(p => {
            const protein = parseFloat(p['Eiwit per 100g']);
            return !isNaN(protein) && protein >= 8;
        });
        
        const normalProteinProducts = ahProducts.filter(p => {
            const protein = parseFloat(p['Eiwit per 100g']);
            return !isNaN(protein) && protein >= 3 && protein < 8;
        });
        
        console.log('High protein AH products:', highProteinProducts.length);
        console.log('Normal protein AH products:', normalProteinProducts.length);
        
        // Select 2 high protein and 2 normal protein products
        const selectedProducts = [
            ...highProteinProducts.slice(0, 2),
            ...normalProteinProducts.slice(0, 2)
        ];
        
        console.log('Selected products:', selectedProducts);
        displayProducts(selectedProducts);
    } catch (e) {
        console.error('Error loading products:', e);
    }
}

async function loadRecommendedProducts() {
    console.log('Loading recommended products...');
    
    try {
        // Load the combined CSV file with images
        const response = await fetch('alle_producten_samengevoegd.csv');
        const allProducts = parseCSV(await response.text());
        
        console.log('Loaded products for recommendations:', allProducts.length);
        
        // Filter high protein products from Albert Heijn only (AH links have working images)
        const highProteinProducts = allProducts.filter(p => {
            const protein = parseFloat(p['Eiwit per 100g']);
            const hasAHLink = p.Link && p.Link.includes('ah.nl');
            const hasImage = p.Afbeelding && p.Afbeelding.trim();
            return !isNaN(protein) && protein >= 10 && hasAHLink && hasImage;
        });
        
        // Select 3 random high protein products for recommendations
        const shuffled = highProteinProducts.sort(() => 0.5 - Math.random());
        const selectedProducts = shuffled.slice(0, 3);
        
        console.log('Selected AH products:', selectedProducts);
        displayRecommendedProducts(selectedProducts);
    } catch (e) {
        console.error('Error loading recommended products:', e);
    }
}

function displayRecommendedProducts(products) {
    const container = document.getElementById('recommended-products-container');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing content
    
    const badges = [
        { text: '98% Match', color: 'primary', bgColor: 'primary/10', textColor: 'primary' },
        { text: 'Similar', color: 'blue-500', bgColor: 'blue-500/10', textColor: 'blue-500' },
        { text: 'Try New', color: 'orange-500', bgColor: 'orange-500/10', textColor: 'orange-500' }
    ];
    
    products.forEach((product, index) => {
        const protein = parseFloat(product['Eiwit per 100g']);
        const imageUrl = getProductImageUrl(product);
        const badge = badges[index] || badges[0];
        
        const isBestMatch = index === 0;
        const borderClass = isBestMatch ? 'border-primary/40' : 'border-slate-200 dark:border-slate-800';
        
        const productCard = `
            <div class="snap-center shrink-0 flex w-[260px] bg-white p-2.5 rounded-xl shadow-sm border ${borderClass} relative overflow-hidden group hover:shadow-md transition-all">
                ${isBestMatch ? '<div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-3xl -mr-2 -mt-2"></div>' : ''}
                <div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                    ${imageUrl 
                        ? `<img src="${imageUrl}" alt="${product.Naam}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                           <div class="absolute inset-0 items-center justify-center text-xs text-slate-400" style="display:none;">Geen afbeelding</div>`
                        : `<div class="absolute inset-0 flex items-center justify-center text-xs text-slate-400">Geen afbeelding</div>`
                    }
                </div>
                <div class="flex flex-col justify-center ml-3 flex-1 min-w-0 z-10">
                    <div class="flex items-center gap-1 mb-1">
                        <span class="text-[10px] font-bold text-${badge.textColor} bg-${badge.bgColor} px-1.5 py-0.5 rounded uppercase tracking-wide">${badge.text}</span>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900 truncate">${product.Naam}</h3>
                    <div class="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        ${isBestMatch ? '<span class="material-symbols-outlined text-[14px] text-primary">check_circle</span><span>Fits your goal</span>' : `<span>${product['Eiwit per 100g']} eiwit</span>`}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += productCard;
    });
}

function displayProducts(products) {
    const container = document.getElementById('trending-products-grid');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing content
    
    products.forEach(product => {
        const protein = parseFloat(product['Eiwit per 100g']);
        const score = calculateProteinScore(product['Eiwit per 100g']).toFixed(1);
        const imageUrl = getProductImageUrl(product);
        
        // Determine badge color based on protein content
        let badgeClass = 'bg-primary';
        let iconClass = 'text-primary';
        
        if (protein < 7) {
            badgeClass = 'bg-yellow-400 text-slate-900';
            iconClass = 'text-yellow-500';
        }
        
        const productCard = `
            <div class="group flex flex-col gap-2 rounded-xl bg-surface-light dark:bg-surface-dark p-3 shadow-sm border border-slate-200 dark:border-slate-800">
                <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-white">
                    ${imageUrl 
                        ? `<img src="${imageUrl}" alt="${product.Naam}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                           <div class="absolute inset-0 items-center justify-center text-xs text-slate-400" style="display:none;">Geen afbeelding</div>`
                        : `<div class="absolute inset-0 flex items-center justify-center text-xs text-slate-400">Geen afbeelding</div>`
                    }
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

// Quiz functionality
const quizQuestions = [
    {
        question: "Wat heeft meer eiwit per 100g?",
        options: [
            { text: "Kip", protein: "31g", correct: true },
            { text: "Tofu", protein: "8g", correct: false }
        ],
        explanation: "Kip bevat ongeveer 31g eiwit per 100g, terwijl tofu ongeveer 8g eiwit per 100g heeft."
    },
    {
        question: "Welk zuivelproduct heeft meer eiwit per 100g?",
        options: [
            { text: "Griekse yoghurt", protein: "10g", correct: true },
            { text: "Gewone yoghurt", protein: "4g", correct: false }
        ],
        explanation: "Griekse yoghurt bevat ongeveer 10g eiwit per 100g, terwijl gewone yoghurt ongeveer 4g heeft."
    },
    {
        question: "Welke peulvrucht heeft meer eiwit per 100g gekookt?",
        options: [
            { text: "Kikkererwten", protein: "9g", correct: false },
            { text: "Linzen", protein: "9g", correct: true }
        ],
        explanation: "Beide hebben ongeveer 9g eiwit per 100g gekookt, maar linzen hebben iets meer (9g vs 8.9g)."
    },
    {
        question: "Wat heeft meer eiwit per 100g?",
        options: [
            { text: "Zalm", protein: "25g", correct: true },
            { text: "Ei", protein: "13g", correct: false }
        ],
        explanation: "Zalm bevat ongeveer 25g eiwit per 100g, terwijl eieren ongeveer 13g per 100g hebben."
    },
    {
        question: "Welke noot heeft meer eiwit per 100g?",
        options: [
            { text: "Amandelen", protein: "21g", correct: true },
            { text: "Walnoten", protein: "15g", correct: false }
        ],
        explanation: "Amandelen bevatten ongeveer 21g eiwit per 100g, walnoten ongeveer 15g per 100g."
    },
    {
        question: "Wat heeft meer eiwit per 100g?",
        options: [
            { text: "Quinoa (gekookt)", protein: "4g", correct: false },
            { text: "Volkoren pasta (gekookt)", protein: "5g", correct: true }
        ],
        explanation: "Volkoren pasta heeft ongeveer 5g eiwit per 100g gekookt, quinoa ongeveer 4g per 100g gekookt."
    }
];

let currentQuizQuestion = 0;
let quizScore = 0;
let quizAnswered = false;

function initQuiz() {
    currentQuizQuestion = 0;
    quizScore = 0;
    quizAnswered = false;
    displayQuizQuestion();
}

function displayQuizQuestion() {
    if (currentQuizQuestion >= quizQuestions.length) {
        showQuizResults();
        return;
    }

    const question = quizQuestions[currentQuizQuestion];
    const questionEl = document.getElementById('quiz-question');
    const progressEl = document.getElementById('quiz-progress');
    const buttonsContainer = document.getElementById('quiz-buttons-container');
    const feedbackEl = document.getElementById('quiz-feedback');

    questionEl.textContent = question.question;
    progressEl.textContent = `${currentQuizQuestion + 1}/6`;
    feedbackEl.classList.add('hidden');
    quizAnswered = false;

    // Create buttons
    buttonsContainer.innerHTML = question.options.map((option, index) => `
        <button onclick="checkQuizAnswer(${index})" class="quiz-btn flex-1 py-2 px-3 rounded-lg bg-white border-2 border-slate-300 text-slate-900 text-xs font-semibold hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm">
            ${option.text}<br><span class="text-[10px] opacity-70">(${option.protein})</span>
        </button>
    `).join('');
}

function checkQuizAnswer(selectedIndex) {
    if (quizAnswered) return;
    
    quizAnswered = true;
    const question = quizQuestions[currentQuizQuestion];
    const selectedOption = question.options[selectedIndex];
    const buttons = document.querySelectorAll('.quiz-btn');
    const feedbackEl = document.getElementById('quiz-feedback');

    // Disable all buttons and remove hover effects
    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        btn.classList.remove('hover:bg-primary', 'hover:text-white');
        
        // Show correct answer
        if (question.options[idx].correct) {
            btn.classList.add('bg-green-500', 'text-white');
        } else if (idx === selectedIndex && !selectedOption.correct) {
            btn.classList.add('bg-red-500', 'text-white');
        }
    });

    // Update score
    if (selectedOption.correct) {
        quizScore++;
    }

    // Show feedback
    feedbackEl.classList.remove('hidden');
    const icon = selectedOption.correct ? '✅' : '❌';
    const colorClass = selectedOption.correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    feedbackEl.innerHTML = `${icon} <span class="${colorClass}">${question.explanation}</span>`;

    // Move to next question after 3 seconds
    setTimeout(() => {
        currentQuizQuestion++;
        displayQuizQuestion();
    }, 3000);
}

function showQuizResults() {
    const questionEl = document.getElementById('quiz-question');
    const progressEl = document.getElementById('quiz-progress');
    const buttonsContainer = document.getElementById('quiz-buttons-container');
    const feedbackEl = document.getElementById('quiz-feedback');

    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
    let message = '';
    let emoji = '';

    if (percentage === 100) {
        message = 'Perfect! Je bent een eiwit expert! 🏆';
        emoji = '🎉';
    } else if (percentage >= 80) {
        message = 'Geweldig! Je weet veel over eiwitten!';
        emoji = '⭐';
    } else if (percentage >= 60) {
        message = 'Goed gedaan! Je kent je eiwitten redelijk goed!';
        emoji = '👍';
    } else if (percentage >= 40) {
        message = 'Niet slecht, maar er is ruimte voor verbetering!';
        emoji = '📚';
    } else {
        message = 'Blijf leren over eiwitten!';
        emoji = '💪';
    }

    questionEl.textContent = 'Quiz Voltooid!';
    progressEl.textContent = `${quizScore}/${quizQuestions.length}`;
    
    buttonsContainer.innerHTML = `
        <button onclick="initQuiz()" class="flex-1 py-2 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-[#3d5e7a] transition-colors">
            Opnieuw spelen
        </button>
    `;

    feedbackEl.classList.remove('hidden');
    feedbackEl.innerHTML = `
        <div class="text-center">
            <div class="text-2xl mb-2">${emoji}</div>
            <div class="font-bold text-primary text-lg mb-1">Score: ${quizScore}/6 (${percentage}%)</div>
            <div class="text-slate-600 dark:text-slate-400">${message}</div>
        </div>
    `;
}

// Daily Tips with matching images
const dailyTips = [
    {
        text: "Amandelen bevatten meer eiwit per portie dan walnoten.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbW-LDwWpQFC4h6ErOgYKNkpG93fJFUcbnIwTmvNltdLBqlySWglcc32idpzyHHgXz-pYIU4TpwNyWWeeGH37-XM2iPO-U-hUzlrsvfZD8Owk1FEu2YKe6-quH2v4X2Wgnb2YmNDYv7HzmakD8rUJodVPmpuWYBImBv4-RcMJFcuxc0FEwK4zd7iWXBbJun55pg7sLbcZtoKTPw-ovZ5UhleFN3sQFSF8ePOKcF4ywE4ZGvnacnDEUoSuBjSwBU1NdDK2iUWIniyGw"
    },
    {
        text: "Griekse yoghurt heeft ongeveer 10g eiwit per 100g, terwijl gewone yoghurt ongeveer 4g heeft.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCSAyGLkakBERWPIz9Tmn80Y2rOF62uW14o7mhUc3f-zEOxb2fLaXNINCH2vpzumlaaHKmgiJNHCjBykCBvSfSZu-CVHepK4mtaJYe70gtyQHgZl7FJk8-qck7hGxF-FEJbtcVgA4uY33lgiVpv2AnffGivDm4F8Cx2IkWn3z-3FvRoDpuWHd_o1j8iffDHFdUiyAPMzHfKEbfRpja1ghZSvZAOy9gfoHC3egnTOLqZl1tdSrynoRZ9Zd_IPnh-cxefDsaMY9biy8x_"
    },
    {
        text: "Quinoa is een van de weinige plantaardige eiwitbronnen die alle 9 essentiële aminozuren bevat.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcGt0QK4E9LPjC1mAsJbbeenqR3Icxdm4AbVgTp-0O_vWVks5VRAhYVcKPE55nHFVAlyWvX0VsdkZ7Nn6uhDmr-Ck45dNGPy5AsmK6bVg_64Cu7PhtMF332oOvWz0Q3BzGnPedWDw9P_jdcbsbB5icyD5OpUm3mNJWC28MDk2QxVPctd4IwsIUNE6KLVg4uiwBOAWOHnFI-x-ofs66kr-UKv5dPZ09KTKLarNMcS1LmVK6qh2I3umPJKf4Vn0_1rZ58y_LiijkW_2H"
    },
    {
        text: "Eieren bevatten alle essentiële aminozuren en zijn een van de meest complete eiwitbronnen.",
        image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop"
    },
    {
        text: "Linzen bevatten ongeveer 9g eiwit per 100g gekookt en zijn rijk aan vezels.",
        image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop"
    },
    {
        text: "Kip bevat ongeveer 31g eiwit per 100g, wat het een uitstekende magere eiwitbron maakt.",
        image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=300&fit=crop"
    },
    {
        text: "Tofu bevat ongeveer 8g eiwit per 100g en is een goede plantaardige eiwitbron.",
        image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop"
    },
    {
        text: "Kikkererwten bevatten ongeveer 9g eiwit per 100g gekookt en zijn veelzijdig te gebruiken.",
        image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=300&fit=crop"
    },
    {
        text: "Zalm bevat niet alleen 25g eiwit per 100g, maar ook gezonde omega-3 vetzuren.",
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop"
    },
    {
        text: "Cottage cheese bevat ongeveer 11g eiwit per 100g en is laag in vet.",
        image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=300&fit=crop"
    },
    {
        text: "Pompoenpitten bevatten ongeveer 19g eiwit per 100g en zijn rijk aan mineralen.",
        image: "https://images.unsplash.com/photo-1605522561233-768ad7a8fabf?w=400&h=300&fit=crop"
    },
    {
        text: "Edamame (jonge sojabonen) bevat ongeveer 11g eiwit per 100g.",
        image: "https://images.unsplash.com/photo-1609501676725-7186f017a4b0?w=400&h=300&fit=crop"
    },
    {
        text: "Tempeh bevat ongeveer 19g eiwit per 100g en is fermenteerd, wat het gemakkelijker verteerbaar maakt.",
        image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&h=300&fit=crop"
    },
    {
        text: "Pinda's bevatten ongeveer 26g eiwit per 100g, maar let op de calorieën.",
        image: "https://images.unsplash.com/photo-1596097639286-bcf52b5b2e3e?w=400&h=300&fit=crop"
    },
    {
        text: "Magere melk bevat ongeveer 3.4g eiwit per 100ml en is een goede bron van calcium.",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop"
    }
];

function loadRandomTip() {
    const tipElement = document.getElementById('daily-tip');
    const tipImageElement = document.getElementById('daily-tip-image');
    
    if (tipElement && tipImageElement) {
        const randomTip = dailyTips[Math.floor(Math.random() * dailyTips.length)];
        tipElement.textContent = randomTip.text;
        tipImageElement.style.backgroundImage = `url('${randomTip.image}')`;
    }
}

// Load products when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready - loading trending products');
    loadTrendingProducts();
    loadRecommendedProducts();
    initQuiz();
    loadRandomTip();
});

