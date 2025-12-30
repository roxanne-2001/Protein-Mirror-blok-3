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
        <button onclick="checkQuizAnswer(${index})" class="quiz-btn flex-1 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-primary hover:text-white transition-colors">
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

// Load products when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready - loading trending products');
    loadTrendingProducts();
    initQuiz();
});
