// ===== HORROR ORACLE JAVASCRIPT =====
// This file connects the HTML frontend to the Python Flask backend

// Global variables
let currentMovie = null;
let currentMovieDetails = null; // NEW - Store full movie object for persistent buttons
let currentMovieStats = null;
let lastDisplayedMovie = null;
let userRating = 0;
let isLoading = false;

// API Base URL - adjust if needed
const API_BASE = 'http://localhost:5000';

// ===== DOM ELEMENTS =====
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const myListContainer = document.getElementById('my-list-container');
const recommendationsContainer = document.getElementById('recommendations-container');
const streamingContainer = document.getElementById('streaming-container');
const videoModal = document.getElementById('video-modal');
const videoIframe = document.getElementById('video-iframe');
const videoClose = document.querySelector('.video-close');

// ===== DYNAMIC BLOOD SHOP DATA GENERATOR =====
function generateBloodShopItems(movieTitle) {
    // Generate 15 dynamic items based on ANY movie title
    const dynamicItems = [
        {
            title: `${movieTitle} DVD Collection`,
            price: "$29.99",
            image: "https://m.media-amazon.com/images/I/81kQYvR3xCdL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+dvd`
        },
        {
            title: `${movieTitle} Blu-Ray 4K`,
            price: "$39.99",
            image: "https://m.media-amazon.com/images/I/91mFQZ2WNYL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+blu+ray+4k`
        },
        {
            title: `${movieTitle} Movie Poster`,
            price: "$24.99",
            image: "https://m.media-amazon.com/images/I/81ZSsUdkr7L._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+movie+poster`
        },
        {
            title: `${movieTitle} T-Shirt`,
            price: "$19.99",
            image: "https://m.media-amazon.com/images/I/81A9YgJAP8L._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+t+shirt`
        },
        {
            title: `${movieTitle} Action Figure`,
            price: "$34.99",
            image: "https://m.media-amazon.com/images/I/81gPmGYqo9L._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+action+figure`
        },
        {
            title: `${movieTitle} Mask Replica`,
            price: "$89.99",
            image: "https://m.media-amazon.com/images/I/81OzKxH1BYL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+mask+replica`
        },
        {
            title: `${movieTitle} Soundtrack Vinyl`,
            price: "$39.99",
            image: "https://m.media-amazon.com/images/I/81MPKKszMmL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+soundtrack+vinyl`
        },
        {
            title: `${movieTitle} VHS Collector's Edition`,
            price: "$149.99",
            image: "https://m.media-amazon.com/images/I/91mFQZ2WNYL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+vhs`
        },
        {
            title: `${movieTitle} Coffee Mug`,
            price: "$14.99",
            image: "https://m.media-amazon.com/images/I/71x5Qa-DXNL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+coffee+mug`
        },
        {
            title: `${movieTitle} Prop Replica`,
            price: "$69.99",
            image: "https://m.media-amazon.com/images/I/71ZgxBgRdjL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+prop+replica`
        },
        {
            title: `${movieTitle} Board Game`,
            price: "$59.99",
            image: "https://m.media-amazon.com/images/I/81jB3xKuUWL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+board+game`
        },
        {
            title: `${movieTitle} Hoodie`,
            price: "$49.99",
            image: "https://m.media-amazon.com/images/I/81A9YgJAP8L._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+hoodie`
        },
        {
            title: `${movieTitle} Pin Badge Set`,
            price: "$12.99",
            image: "https://m.media-amazon.com/images/I/61ggPCF6vYL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+pin+badge`
        },
        {
            title: `${movieTitle} Art Print`,
            price: "$34.99",
            image: "https://m.media-amazon.com/images/I/81ZSsUdkr7L._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+art+print`
        },
        {
            title: `${movieTitle} Collector's Box Set`,
            price: "$199.99",
            image: "https://m.media-amazon.com/images/I/81kQYvR3xCdL._AC_UL320_.jpg",
            buyLink: `https://www.amazon.com/s?k=${encodeURIComponent(movieTitle)}+collector+box+set`
        }
    ];
    
    return dynamicItems;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🩸 Horror Oracle Frontend Loading...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadTheaterReleases();
    loadDailyObscureGems();
    loadMyList();
    
    // Start blood effects
    startBloodEffects();
    
    console.log('✅ Horror Oracle Frontend Ready!');
});

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Chat input handling
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    sendBtn.addEventListener('click', sendMessage);
    
    // Video modal handling
    videoClose.addEventListener('click', closeVideoModal);
    videoModal.addEventListener('click', function(e) {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
    
    // Rating system
    setupRatingSystem();
    
    // Navigation buttons
    const newsBtn = document.getElementById('news-btn');
    const toggleReleasesBtn = document.getElementById('toggle-releases');
    const forumBtn = document.getElementById('forum-btn');
    
    if (newsBtn) newsBtn.addEventListener('click', () => showNotImplemented('Horror News'));
    if (toggleReleasesBtn) toggleReleasesBtn.addEventListener('click', toggleRecentReleases);
    if (forumBtn) forumBtn.addEventListener('click', () => showNotImplemented('Horror Forum'));
    
	// Info button
	const infoBtn = document.querySelector('.info-btn');
	if (infoBtn) infoBtn.addEventListener('click', showAboutModal);
	setupGenreButtons();
}

// ===== CHAT FUNCTIONALITY =====
async function sendMessage() {
    const query = userInput.value.trim();
    if (!query || isLoading) return;
    
    isLoading = true;
    
    // Add user message to chat
    addChatMessage('user', query);
    userInput.value = '';
    
    // Show loading indicator
    const loadingId = addChatMessage('bot', 'The Oracle is searching the depths of horror cinema...', null, true);
    
    try {
        const response = await fetch(`${API_BASE}/ask-oracle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        
        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        
        if (data.error) {
            addChatMessage('bot', `Error: ${data.error}`);
        } else {
            
// Add Oracle's response - prevent duplicates
  const isDuplicate = data.movie_details && 
                   data.movie_details.title &&
                   lastDisplayedMovie === data.movie_details.title;

if (!isDuplicate) {
    addChatMessage('bot', data.response, data.movie_details);
    lastDisplayedMovie = data.movie_details ? data.movie_details.title : null;
}
 
            
            // Update movie-specific sections
            if (data.movie_details && data.movie_details.title) {
                currentMovie = data.movie_details.title;
                currentMovieDetails = data.movie_details; // NEW - Save full movie details
                updateMovieSections(data.movie_details, data.recommendations);
                loadMovieStats(currentMovie);
            } else if (data.recommendations && data.recommendations.length > 0) {
                updateRecommendations(data.recommendations);
            }
        }
    } catch (error) {
        console.error('Chat error:', error);
        
        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        
        addChatMessage('bot', 'The spirits are restless... Please try again.');
    }
    
    isLoading = false;
}

function addChatMessage(type, message, movieDetails = null, isLoading = false) {
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-bubble ${type}-bubble`;
    messageDiv.id = messageId;
    
    let content = '';
    
    if (type === 'bot') {
        if (isLoading) {
            content = `
                <div class="flex items-center space-x-2">
                    <div class="skeleton-loading w-4 h-4 rounded-full"></div>
                    <span>${message}</span>
                </div>
            `;
        } else {
            content = `<p class="mb-2">${message}</p>`;
            
            // NEW - Use passed movieDetails OR stored currentMovieDetails
            const movieToDisplay = movieDetails || currentMovieDetails;
            
            // Add movie poster if available
            if (movieToDisplay && movieToDisplay.poster) {
                content += `
                    <div class="flex items-start space-x-3 mt-3">
                        <img src="${movieToDisplay.poster}" 
                             alt="${movieToDisplay.title}" 
                             class="movie-poster-inline w-24 h-36 object-cover rounded-lg border-2 border-red-600"
                             onerror="this.src='https://via.placeholder.com/100x150/000000/FF0000?text=No+Poster'">
                        <div class="flex-1">
                            <h3 class="text-white font-bold">${movieToDisplay.title}</h3>
                            ${movieToDisplay.year ? `<p class="text-gray-400 text-sm">${movieToDisplay.year}</p>` : ''}
                            ${movieToDisplay.director ? `<p class="text-gray-400 text-sm">Dir: ${movieToDisplay.director}</p>` : ''}
                            ${movieToDisplay.rating ? `<p class="text-yellow-400 text-sm">⭐ ${movieToDisplay.rating}</p>` : ''}
                        </div>
                    </div>
                `;
                
              }
                
                // Add action buttons - NOW WITH 5TH BUTTON
                if (movieToDisplay && movieToDisplay.title) {
                content += `

                    <div class="flex space-x-2 mt-3">
                        <button onclick="watchTrailer('${movieToDisplay.title}')" 
                                class="px-3 py-1 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition-colors">
                            🎬 Watch Trailer
                        </button>
                        <button onclick="tellMeMore('${movieToDisplay.title}')" 
                                class="px-3 py-1 bg-gray-600 text-white text-sm rounded-full hover:bg-gray-700 transition-colors">
                            📖 Tell Me More
                        </button>
                        <button onclick="addToMyList('${movieToDisplay.title}')" 
                                class="px-3 py-1 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 transition-colors">
                            ➕ Add to List
                        </button>
                        <button onclick="suggestSimilar('${movieToDisplay.title}')" 
                                class="px-3 py-1 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-colors">
                            ✨ Movies Like This
                        </button>
                        <button onclick="openBloodShop('${movieToDisplay.title}')" 
                                class="px-3 py-1 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition-colors">
                            🩸 Blood Shop
                        </button>
<button onclick="openBloodQuiz('${movieToDisplay.title}')" 
        class="px-3 py-1 bg-blue-900 text-white text-sm rounded-full hover:bg-blue-700 transition-colors">
    🩸 Blood Quiz
</button>

                    </div>
                `;
            }
        }
    } else {
        content = `<p>${message}</p>`;
    }
    
    messageDiv.innerHTML = content;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return messageId;
}

// ===== MOVIE-SPECIFIC ACTIONS =====
async function tellMeMore(movieTitle) {
    if (isLoading) return;
      
    const query = `Tell me more obscure details about ${movieTitle}`;
    userInput.value = query;
    await sendMessage();
}
// NEW FUNCTION - Suggest Similar Movies (FIXED)
async function suggestSimilar(movieTitle) {
    if (isLoading) return;
    
    // Get all recommendation cards
    const recContainer = document.getElementById('recommendations-container');
    const allRecs = recContainer.querySelectorAll('.rec-card');
    
    if (allRecs.length > 0) {
        // Get titles from recommendations
        for (let i = 0; i < allRecs.length; i++) {
            const recTitle = allRecs[i].querySelector('h4').textContent;
            
            // Skip if it's the same movie - get the NEXT one
            if (recTitle.toLowerCase() !== movieTitle.toLowerCase()) {
                // Found a DIFFERENT movie! Search for it
                userInput.value = recTitle;
                await sendMessage();
                return;
            }
        }
    }
    
    // Fallback: trigger a search query to get recommendations
    const query = `Show me movies similar to ${movieTitle}`;
    userInput.value = query;
    await sendMessage();
}

async function watchTrailer(movieTitle) {
    try {
        const response = await fetch(`${API_BASE}/get-trailer?title=${encodeURIComponent(movieTitle)}`);
        const data = await response.json();
        
        if (data.trailer_url) {
            showTrailer(data.trailer_url);
        } else {
            alert('Trailer not found for this movie.');
        }
    } catch (error) {
        console.error('Error loading trailer:', error);
        alert('Could not load trailer. Please try again.');
    }
}

// ===== BLOOD SHOP FUNCTIONALITY =====
function openBloodShop(movieTitle) {
    // Generate dynamic items based on movie
    const bloodShopItems = generateBloodShopItems(movieTitle);
    
    // Create modal backdrop
    const modal = document.createElement('div');
    modal.id = 'bloodShopModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
    modal.style.backdropFilter = 'blur(5px)';
    
    // Create modal content with horror theme
    modal.innerHTML = `
        <div class="bg-gradient-to-b from-gray-900 via-red-900 to-black border-4 border-red-800 rounded-lg max-w-6xl w-11/12 max-h-5/6 overflow-hidden shadow-2xl relative">
            <!-- Close button -->
            <button onclick="closeBloodShop()" 
                    class="absolute top-4 right-4 text-red-400 hover:text-red-200 text-3xl font-bold z-10 transition-colors">
                ✕
            </button>
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-red-800 to-black p-6 border-b-4 border-red-700">
                <h2 class="text-3xl font-bold text-red-400 text-center" style="text-shadow: 0 0 20px rgba(255, 0, 0, 0.8);">
                    🩸 BLOOD SHOP 🩸
                </h2>
                <p class="text-gray-300 text-center mt-2">Horror Collectibles Inspired by "${movieTitle}"</p>
            </div>
            
            <!-- Products Grid -->
            <div class="p-6 overflow-y-auto max-h-96" style="background-image: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23111\"/><path d=\"M10,10 L90,10 L90,90 L10,90 Z\" fill=\"none\" stroke=\"%23333\" stroke-width=\"2\"/><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"%23444\"/><circle cx=\"80\" cy=\"80\" r=\"2\" fill=\"%23444\"/></svg>');">
                <div class="grid grid-cols-3 md:grid-cols-5 gap-4">
                    ${bloodShopItems.map(item => `
                        <div class="bg-black bg-opacity-60 border-2 border-red-700 rounded-lg p-3 hover:border-red-500 transition-all duration-300 hover:shadow-lg hover:shadow-red-900/50">
                            <img src="${item.image}" 
                                 alt="${item.title}" 
                                 class="w-full h-32 object-cover rounded border border-red-600 mb-2"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhPUlJPUjwvdGV4dD48L3N2Zz4='">
                            
                            <h3 class="text-red-300 font-bold text-xs mb-1 line-clamp-2">${item.title}</h3>
                            <p class="text-red-400 font-bold text-sm mb-2">${item.price}</p>
                            
                            <a href="${item.buyLink}" 
                               target="_blank" 
                               class="block w-full bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded text-center transition-colors">
                                BUY NOW
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Footer -->
            <div class="bg-gradient-to-r from-black to-red-900 p-4 border-t-4 border-red-700 text-center">
                <p class="text-gray-400 text-sm">
                    ⚠️ WARNING: Items may contain traces of supernatural energy ⚠️
                </p>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeBloodShop();
        }
    });
}

function closeBloodShop() {
    const modal = document.getElementById('bloodShopModal');
    if (modal) {
        modal.remove();
    }
}

// ===== BLOOD QUIZ FUNCTIONALITY =====
let currentQuiz = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    category: 'general'
};

function openBloodQuiz(movieTitle) {
    const modal = document.createElement('div');
    modal.id = 'bloodQuizModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50';
    
    modal.innerHTML = `
        <div class="bg-gradient-to-b from-red-950 via-black to-red-950 border-4 border-red-800 rounded-lg max-w-2xl w-11/12 p-8 shadow-2xl relative">
            <button onclick="closeBloodQuiz()" 
                    class="absolute top-4 right-4 text-red-400 hover:text-white text-3xl font-bold transition-colors">
                ✕
            </button>
            
            <div class="text-center mb-6">
                <h2 class="text-4xl font-bold text-red-500 mb-2" style="text-shadow: 0 0 20px rgba(255, 0, 0, 0.8);">
                    🩸 BLOOD QUIZ 🩸
                </h2>
                <p class="text-gray-400">Test your horror knowledge... if you dare!</p>
            </div>
            
            <div id="quizContent" class="min-h-[300px]">
                <!-- Quiz content will be inserted here -->
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    startQuiz('general', movieTitle);
}

function closeBloodQuiz() {
    const modal = document.getElementById('bloodQuizModal');
    if (modal) {
        modal.remove();
        currentQuiz = {
            questions: [],
            currentQuestion: 0,
            score: 0,
            category: 'general'
        };
    }
}

function startQuiz(category, movieTitle = null) {
    currentQuiz.category = category;
    currentQuiz.currentQuestion = 0;
    currentQuiz.score = 0;
    currentQuiz.questions = getQuizQuestions(category, movieTitle);
    showQuestion();
}

function getQuizQuestions(category, movieTitle) {
    const questionPools = {
        general: [
            { q: "What year was The Exorcist released?", a: ["1973", "1975", "1971", "1969"], correct: 0 },
            { q: "Who directed Halloween (1978)?", a: ["Wes Craven", "John Carpenter", "Tobe Hooper", "George Romero"], correct: 1 },
            { q: "What is the name of the possessed doll in Child's Play?", a: ["Billy", "Tommy", "Chucky", "Johnny"], correct: 2 },
            { q: "In which film does 'They're here' appear?", a: ["The Shining", "Halloween", "Poltergeist", "The Ring"], correct: 2 },
            { q: "What is the name of the camp in Friday the 13th?", a: ["Camp Crystal Lake", "Camp Blackwater", "Camp Arawak", "Camp Redwood"], correct: 0 }
        ],
        slashers: [
            { q: "What mask does Jason wear?", a: ["William Shatner", "Hockey Mask", "Leather Face", "White Mask"], correct: 1 },
            { q: "How many kills in Friday the 13th (1980)?", a: ["8", "10", "12", "13"], correct: 1 },
            { q: "What's Michael Myers' middle name?", a: ["James", "Audrey", "Thomas", "Andrew"], correct: 1 },
            { q: "Who is Ghostface in the first Scream?", a: ["Billy", "Stu", "Billy & Stu", "Sidney"], correct: 2 },
            { q: "What weapon does Freddy Krueger use?", a: ["Machete", "Chainsaw", "Glove with Knives", "Axe"], correct: 2 }
        ],
        cult: [
            { q: "Who directed The Wicker Man (1973)?", a: ["Robin Hardy", "Nicolas Roeg", "Ken Russell", "Michael Reeves"], correct: 0 },
            { q: "What film features 'Heather, Heather, and Heather'?", a: ["The Craft", "Heathers", "Jennifer's Body", "Carrie"], correct: 1 },
            { q: "Complete: 'Shop smart, shop...'", a: ["K-Mart", "S-Mart", "E-Mart", "Q-Mart"], correct: 1 },
            { q: "What is the Tall Man's weapon in Phantasm?", a: ["Silver Sphere", "Chainsaw", "Hook", "Knife"], correct: 0 },
            { q: "Who made Suspiria (1977)?", a: ["Lucio Fulci", "Mario Bava", "Dario Argento", "Umberto Lenzi"], correct: 2 }
        ],
        eighties: [
            { q: "What year did Nightmare on Elm Street debut?", a: ["1982", "1984", "1986", "1988"], correct: 1 },
            { q: "Who played Pinhead in Hellraiser?", a: ["Doug Bradley", "Robert Englund", "Kane Hodder", "Tony Todd"], correct: 0 },
            { q: "The Thing (1982) is set where?", a: ["Alaska", "Canada", "Antarctica", "Greenland"], correct: 2 },
            { q: "What grows out of the drain in Poltergeist?", a: ["A Tree", "A Hand", "A Snake", "Hair"], correct: 0 },
            { q: "Return of the Living Dead introduced what zombie trait?", a: ["Running", "Talking", "Eating Brains", "Swimming"], correct: 2 }
        ],
        classics: [
            { q: "Who played Dracula in 1931?", a: ["Lon Chaney", "Boris Karloff", "Bela Lugosi", "Vincent Price"], correct: 2 },
            { q: "What year was Frankenstein released?", a: ["1929", "1931", "1933", "1935"], correct: 1 },
            { q: "Who directed Psycho?", a: ["William Castle", "Alfred Hitchcock", "Roger Corman", "James Whale"], correct: 1 },
            { q: "The Cabinet of Dr. Caligari is from which country?", a: ["USA", "UK", "France", "Germany"], correct: 3 },
            { q: "What was the first zombie film?", a: ["White Zombie", "I Walked with a Zombie", "Night of the Living Dead", "Dawn of the Dead"], correct: 0 }
        ],
        creatures: [
            { q: "What is the creature in The Descent?", a: ["Wendigos", "Crawlers", "Cave Dwellers", "Morlocks"], correct: 1 },
            { q: "Who directed The Host (2006)?", a: ["Park Chan-wook", "Bong Joon-ho", "Kim Ji-woon", "Na Hong-jin"], correct: 1 },
            { q: "What awakens the Graboids in Tremors?", a: ["Drilling", "Explosions", "Vibrations", "Heat"], correct: 2 },
            { q: "The Ritual features which creature?", a: ["Wendigo", "Jotunn", "Draugr", "Bergsra"], correct: 1 },
            { q: "What is the creature in Jeepers Creepers called?", a: ["The Creeper", "The Reaper", "The Keeper", "The Sleeper"], correct: 0 }
        ],
        possession: [
            { q: "What is Regan's imaginary friend called?", a: ["Mr. Howdy", "Captain Howdy", "Father Howdy", "Doctor Howdy"], correct: 1 },
            { q: "The demon in Insidious is from where?", a: ["Hell", "The Further", "The Upside Down", "The Dark Place"], correct: 1 },
            { q: "What starts the possession in Evil Dead?", a: ["Ouija Board", "Necronomicon", "Séance", "Mirror"], correct: 1 },
            { q: "Who directed The Conjuring?", a: ["James Wan", "Leigh Whannell", "Mike Flanagan", "Ari Aster"], correct: 0 },
            { q: "What does the Dybbuk Box contain?", a: ["A Spirit", "A Demon", "A Dybbuk", "A Soul"], correct: 2 }
        ],
        jhorror: [
            { q: "How many days to live after watching The Ring tape?", a: ["3", "5", "7", "13"], correct: 2 },
            { q: "What is the ghost called in The Grudge?", a: ["Sadako", "Kayako", "Tomie", "Yuki"], correct: 1 },
            { q: "Who directed the original Ringu?", a: ["Hideo Nakata", "Takashi Shimizu", "Takashi Miike", "Kiyoshi Kurosawa"], correct: 0 },
            { q: "What film features the Slit-Mouthed Woman?", a: ["Carved", "Cursed", "Scream", "Slash"], correct: 0 },
            { q: "Dark Water features what haunted object?", a: ["TV", "Phone", "Elevator", "Water Tank"], correct: 3 }
        ],
        impossible: [
            { q: "What was The Blair Witch Project's budget?", a: ["$22,000", "$60,000", "$100,000", "$250,000"], correct: 1 },
            { q: "How many gallons of blood in Evil Dead (1981)?", a: ["50", "100", "200", "300"], correct: 2 },
            { q: "What cereal appears in Halloween (1978)?", a: ["Cheerios", "Corn Flakes", "Lucky Charms", "Frosted Flakes"], correct: 1 },
            { q: "How long did The Exorcist's pea soup take to make?", a: ["2 days", "4 days", "7 days", "10 days"], correct: 0 },
            { q: "What was Jason's original name going to be?", a: ["Josh", "Jake", "Jerry", "Jack"], correct: 0 }
        ]
    };
    
    const pool = questionPools[category] || questionPools.general;
    return pool.sort(() => 0.5 - Math.random()).slice(0, 5);
}

function showQuestion() {
    const quizContent = document.getElementById('quizContent');
    if (!quizContent || currentQuiz.currentQuestion >= currentQuiz.questions.length) {
        showQuizResults();
        return;
    }
    
    const question = currentQuiz.questions[currentQuiz.currentQuestion];
    quizContent.innerHTML = `
        <div class="text-center mb-4">
            <p class="text-red-400 text-sm">Question ${currentQuiz.currentQuestion + 1} of 5</p>
        </div>
        <div class="mb-6">
            <h3 class="text-xl text-white font-bold mb-4">${question.q}</h3>
        </div>
        <div class="space-y-3">
            ${question.a.map((answer, index) => `
                <button onclick="checkAnswer(${index})" 
                        class="w-full p-3 bg-gray-800 hover:bg-red-900 text-white rounded-lg transition-colors border border-red-800 hover:border-red-500">
                    ${answer}
                </button>
            `).join('')}
        </div>
    `;
}

function checkAnswer(answerIndex) {
    const question = currentQuiz.questions[currentQuiz.currentQuestion];
    const isCorrect = answerIndex === question.correct;
    if (isCorrect) {
        currentQuiz.score++;
    } else {
        const wrongAudio = document.getElementById('wrongSound');
        if (wrongAudio) {
            try { wrongAudio.currentTime = 0; wrongAudio.play().catch(() => {}); } catch (e) {}
        }
        showMaskOverlay();
    }
    currentQuiz.currentQuestion++;
    setTimeout(() => showQuestion(), isCorrect ? 150 : 800);
}

function showMaskOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'mask-overlay';
    const mask = document.createElement('div');
    mask.className = 'mask';
    overlay.appendChild(mask);
    document.body.appendChild(overlay);
    const splatter = document.createElement('div');
    splatter.className = 'blood-splatter';
    splatter.style.left = (10 + Math.random() * 80) + 'vw';
    splatter.style.top = (10 + Math.random() * 20) + 'vh';
    document.body.appendChild(splatter);
    document.body.classList.add('flicker');
    setTimeout(() => document.body.classList.remove('flicker'), 400);
    setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (splatter.parentNode) splatter.parentNode.removeChild(splatter);
    }, 1300);
}

function showQuizResults() {
    const quizContent = document.getElementById('quizContent');
    if (!quizContent) return;
    
    let resultTitle = '';
    let resultMessage = '';
    
    switch(currentQuiz.score) {
        case 0:
            resultTitle = '💀 YOU DIED!';
            resultMessage = 'The killer got you in the first scene...';
            break;
        case 1:
            resultTitle = '🔪 YOU\'RE BLEEDING OUT!';
            resultMessage = 'Almost didn\'t make it to the sequel...';
            break;
        case 2:
            resultTitle = '🏃 YOU BARELY ESCAPED!';
            resultMessage = 'Close call... you\'ll have nightmares forever...';
            break;
        case 3:
            resultTitle = '🎭 YOU SURVIVED!';
            resultMessage = 'But you\'ll never be the same...';
            break;
        case 4:
            resultTitle = '👹 YOU\'RE THE FINAL GIRL/GUY!';
            resultMessage = 'Almost unstoppable!';
            break;
        case 5:
            resultTitle = '🩸 YOU\'RE THE KILLER!';
            resultMessage = 'Perfect horror knowledge... suspiciously perfect...';
            break;
    }
    
    quizContent.innerHTML = `
        <div class="text-center">
            <div class="mb-6">
                <h3 class="text-3xl font-bold text-red-500 mb-2" style="text-shadow: 0 0 15px rgba(255, 0, 0, 0.8);">
                    ${resultTitle}
                </h3>
                <p class="text-gray-300 text-lg mb-4">${resultMessage}</p>
                <div class="text-4xl font-bold text-yellow-400 mb-2">
                    ${currentQuiz.score}/5
                </div>
            </div>
            
            <div class="mb-6">
                <button onclick="closeBloodQuiz()" 
                        class="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-full font-bold transition-colors mb-4">
                    🎬 Back to Oracle
                </button>
            </div>
            
            <div class="border-t border-red-800 pt-4">
                <p class="text-red-400 mb-3 text-sm">Choose a category for a new quiz:</p>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="startQuiz('slashers')" 
                            class="px-3 py-2 bg-gray-800 hover:bg-red-900 text-white text-sm rounded transition-colors border border-red-800">
                        🔪 SLASHERS
                    </button>
                    <button onclick="startQuiz('cult')" 
                            class="px-3 py-2 bg-gray-800 hover:bg-red-900 text-white text-sm rounded transition-colors border border-red-800">
                        👹 CULT HORROR
                    </button>
                    <button onclick="startQuiz('eighties')" 
                            class="px-3 py-2 bg-gray-800 hover:bg-red-900 text-white text-sm rounded transition-colors border border-red-800">
                        📼 80's HORROR
                    </button>
                    <button onclick="startQuiz('classics')" 
                            class="px-3 py-2 bg-gray-800 hover:bg-red-900 text-white text-sm rounded transition-colors border border-red-800">
                        🦇 CLASSICS
                    </button>
                    <button onclick="startQuiz('creatures')" 
                            class="px-3 py-2 bg-gray-800 hover:bg-red-900 text-white text-sm rounded transition-colors border border-red-800">
                        🕷️ CREATURES
                    </button>
                    <button onclick="startQuiz('possession')" 
                            class="px-3 py-2 bg-gray-800 hover:bg-red-900 text-white text-sm rounded transition-colors border border-red-800">
                        😈 POSSESSION
                    </button>
                    <button onclick="startQuiz('jhorror')" 
                            class="px-3 py-2 bg-gray-800 hover:bg-red-900 text-white text-sm rounded transition-colors border border-red-800">
                        👻 J-HORROR
                    </button>
                    <button onclick="startQuiz('impossible')" 
                            class="px-3 py-2 bg-red-800 hover:bg-red-700 text-white text-sm rounded transition-colors border border-yellow-600 font-bold">
                        💀 IMPOSSIBLE
                    </button>
                </div>
            </div>
        </div>
    `;
}


function addToMyList(movieTitle) {
    let myList = JSON.parse(localStorage.getItem('horror-my-list') || '[]');
    
    if (!myList.includes(movieTitle)) {
        myList.push(movieTitle);
        localStorage.setItem('horror-my-list', JSON.stringify(myList));
        loadMyList();
        
        // Show confirmation
        showToast(`Added "${movieTitle}" to My List!`);
    } else {
        showToast(`"${movieTitle}" is already in your list!`);
    }
}

function loadMyList() {
    const myList = JSON.parse(localStorage.getItem('horror-my-list') || '[]');
    
    if (myList.length === 0) {
        myListContainer.innerHTML = '<li class="text-center text-gray-400 text-xs">Empty</li>';
    } else {
        myListContainer.innerHTML = myList.map(movie => 
            `<li class="text-gray-300 text-xs cursor-pointer hover:text-red-400 transition-colors" 
                 onclick="searchMovie('${movie}')">${movie}</li>`
        ).join('');
    }
}

function searchMovie(movieTitle) {
    userInput.value = movieTitle;
    sendMessage();
}

// ===== MOVIE SECTIONS UPDATES =====
function updateStreamingSection(movieDetails) {
    if (!movieDetails) return;
    
    const streamingHtml = `
        <div class="bg-gray-800 rounded-lg p-3 border border-gray-600">
            <div class="flex items-center space-x-3">
                ${movieDetails.poster ? 
                    `<img src="${movieDetails.poster}" 
                         alt="${movieDetails.title}" 
                         class="streaming-movie-poster"
                         onerror="this.src='https://via.placeholder.com/50x75/000000/FF0000?text=No+Poster'">` 
                    : ''}
                <div class="flex-1">
                    <h3 class="movie-title-streaming">${movieDetails.title}</h3>
                    ${movieDetails.year ? `<p class="text-gray-400 text-xs">${movieDetails.year}</p>` : ''}
                    
                    <div class="flex flex-wrap gap-1 mt-2">
                        <span class="streaming-tag streaming-netflix">Netflix</span>
                        <span class="streaming-tag streaming-prime">Prime Video</span>
                        <span class="streaming-tag streaming-shudder">Shudder</span>
                    </div>
                    
                    <button onclick="suggestSimilar('${movieDetails.title}')" 
                            class="w-full mt-2 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors">
                        🎬 Similar Movies
                    </button>
                </div>
            </div>
        </div>
    `;
    
    streamingContainer.innerHTML = streamingHtml;
}

function updateMovieSections(movieDetails, recommendations) {
    if (movieDetails) {
        updateStreamingSection(movieDetails);
    }
    if (recommendations) {
        updateRecommendations(recommendations);
    }
}

function updateRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
        recommendationsContainer.innerHTML = '<div class="text-center p-2"><p class="text-gray-400 text-xs">No recommendations available</p></div>';
        return;
    }
    
    const recsHtml = recommendations.map(rec => `
        <div class="rec-card p-2 cursor-pointer" onclick="searchMovie('${rec.title}')">
            <div class="flex items-center space-x-2">
                ${rec.poster ? 
                    `<img src="${rec.poster}" 
                         alt="${rec.title}" 
                         class="w-12 h-18 object-cover rounded border border-gray-600"
                         onerror="this.src='https://via.placeholder.com/48x72/000000/FF0000?text=No+Poster'">` 
                    : ''}
                <div class="flex-1 min-w-0">
                    <h4 class="text-white text-xs font-semibold truncate">${rec.title}</h4>
                    ${rec.year ? `<p class="text-gray-400 text-xs">${rec.year}</p>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    recommendationsContainer.innerHTML = recsHtml;
}

// ===== RATING SYSTEM =====
function setupRatingSystem() {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach((star, index) => {
        const rating = index + 1;
        
        star.addEventListener('mouseenter', function() {
            highlightStars(rating, 'hover');
        });
        
        star.addEventListener('mouseleave', function() {
            clearStarHighlight();
            if (userRating > 0) {
                highlightStars(userRating, 'filled');
            }
        });
        
        star.addEventListener('click', function() {
            userRating = rating;
            highlightStars(rating, 'filled');
            submitRating(rating);
        });
    });
}

function highlightStars(rating, className) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.classList.remove('filled', 'hover');
        if (index < rating) {
            star.classList.add(className);
            star.textContent = '★';
        } else {
            star.textContent = '☆';
        }
    });
}

function clearStarHighlight() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('hover');
    });
}

async function submitRating(rating) {
    if (!currentMovie) {
        showToast('Please search for a movie first!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/submit-rating`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                movie_title: currentMovie,
                rating: rating
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(`Error: ${data.error}`);
        } else {
            showToast('Rating submitted!');
            // Refresh movie stats
            loadMovieStats(currentMovie);
        }
    } catch (error) {
        console.error('Rating submission error:', error);
        showToast('Failed to submit rating');
    }
}

async function submitReview() {
    const reviewInput = document.getElementById('review-input');
    const reviewText = reviewInput.value.trim();
    
    if (!reviewText) {
        showToast('Please enter a review!');
        return;
    }
    
    if (!currentMovie) {
        showToast('Please search for a movie first!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/submit-review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                movie_title: currentMovie,
                review: reviewText
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(`Error: ${data.error}`);
        } else {
            showToast('Review submitted!');
            reviewInput.value = '';
            // Refresh movie stats
            loadMovieStats(currentMovie);
        }
    } catch (error) {
        console.error('Review submission error:', error);
        showToast('Failed to submit review');
    }
}

// ===== MOVIE STATS =====
async function loadMovieStats(movieTitle) {
    if (!movieTitle) return;
    
    try {
        const response = await fetch(`${API_BASE}/get-movie-stats?movie_title=${encodeURIComponent(movieTitle)}`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Stats error:', data.error);
            return;
        }
        
        currentMovieStats = data;
        updateStatsDisplay(movieTitle, data);
    } catch (error) {
        console.error('Error loading movie stats:', error);
    }
}

function updateStatsDisplay(movieTitle, stats) {
    // Show the stats section
    const currentMovieDisplay = document.getElementById('current-movie-display');
    const noMovieSelected = document.getElementById('no-movie-selected');
    
    if (currentMovieDisplay && noMovieSelected) {
        currentMovieDisplay.classList.remove('hidden');
        noMovieSelected.classList.add('hidden');
        
        // Update movie title
        const statsMovieTitle = document.getElementById('stats-movie-title');
        if (statsMovieTitle) {
            statsMovieTitle.textContent = movieTitle;
        }
        
        // Update community rating
        const communityStars = document.getElementById('community-stars');
        const ratingValue = document.getElementById('rating-value');
        const ratingCount = document.getElementById('rating-count');
        
        if (communityStars && ratingValue && ratingCount) {
            const rating = stats.rating.average;
            const filledStars = Math.floor(rating);
            const halfStar = rating % 1 >= 0.5;
            
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < filledStars) {
                    starsHtml += '⭐';
                } else if (i === filledStars && halfStar) {
                    starsHtml += '⭐';
                } else {
                    starsHtml += '☆';
                }
            }
            
            communityStars.textContent = starsHtml;
            ratingValue.textContent = rating.toFixed(1);
            ratingCount.textContent = `(${stats.rating.count} ratings)`;
        }
        
        // Update horror metrics
        if (stats.stats) {
            updateMetricBar('gore', stats.stats.gore);
            updateMetricBar('fear', stats.stats.fear * 10); // Convert 0-10 to percentage
            updateMetricBar('kill', Math.min(stats.stats.kills * 4, 100)); // Convert kills to percentage
        }
        
        // Update recent reviews
        updateRecentReviews(stats.reviews || []);
    }
}

function updateMetricBar(type, value) {
    const valueElement = document.getElementById(`${type}-value`);
    const barElement = document.getElementById(`${type}-bar`);
    
    if (valueElement && barElement) {
        if (type === 'fear') {
            valueElement.textContent = `${(value/10).toFixed(1)}/10`;
        } else if (type === 'kill') {
            valueElement.textContent = Math.round(value/4);
        } else {
            valueElement.textContent = `${Math.round(value)}%`;
        }
        
        barElement.style.width = `${Math.min(value, 100)}%`;
    }
}

function updateRecentReviews(reviews) {
    const recentReviews = document.getElementById('recent-reviews');
    
    if (!recentReviews) return;
    
    if (reviews.length === 0) {
        recentReviews.innerHTML = `
            <div class="review-item">
                <div class="review-text">No reviews yet. Be the first!</div>
            </div>
        `;
    } else {
        const reviewsHtml = reviews.map(review => `
            <div class="review-item">
                <div class="review-text">"${review.text}"</div>
                <div class="review-meta">by ${review.user} • ${formatDate(review.timestamp)}</div>
            </div>
        `).join('');
        
        recentReviews.innerHTML = reviewsHtml;
    }
}

// ===== THEATER RELEASES =====
async function loadTheaterReleases() {
    try {
        const response = await fetch(`${API_BASE}/theater-releases`);
        const data = await response.json();
        
        const theaterSection = document.getElementById('theater-section-dynamic');
        if (!theaterSection) return;
        
        if (data.releases && data.releases.length > 0) {
            const releasesHtml = `
                <h3 class="text-center text-sm font-bold text-white mb-2" style="text-shadow: 0 0 10px rgba(255, 0, 0, 0.8); animation: pulse 2s infinite;">🎬 NOW IN THEATERS 🎬</h3>
                ${data.releases.map(movie => `
                    <div class="theater-item" onclick="searchMovie('${movie.title}')">
                        ${movie.poster_path ? 
                            `<img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" 
                                 alt="${movie.title}" 
                                 class="theater-poster"
                                 onerror="this.src='https://via.placeholder.com/50x75/000000/FF0000?text=No+Poster'">` 
                            : ''}
                        <div class="theater-info">
                            <div class="theater-title">${movie.title}</div>
                            <div class="theater-date">${formatDate(movie.release_date)}</div>
                            ${movie.vote_average ? `<div class="theater-rating">⭐ ${movie.vote_average.toFixed(1)}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            `;
            
            theaterSection.innerHTML = releasesHtml;
        } else {
            theaterSection.innerHTML = `
                <h3 class="text-center text-sm font-bold text-white mb-2">🎬 NOW IN THEATERS 🎬</h3>
                <div class="text-center text-gray-400 text-xs">No current horror releases found</div>
            `;
        }
    } catch (error) {
        console.error('Error loading theater releases:', error);
        const theaterSection = document.getElementById('theater-section-dynamic');
        if (theaterSection) {
            theaterSection.innerHTML = `
                <h3 class="text-center text-sm font-bold text-white mb-2">🎬 NOW IN THEATERS 🎬</h3>
                <div class="text-center text-gray-400 text-xs">Unable to load theater releases</div>
            `;
        }
    }
}

// ===== OBSCURE GEMS =====
function loadDailyObscureGems() {
    const obscureGems = [
        {
            title: "Lake Mungo",
            year: "2008",
            poster: "https://picsum.photos/150/200?random=1",
            trailer: "https://www.youtube.com/embed/nAGZekCl8tA",
            amazon: "https://www.amazon.com/s?k=Lake+Mungo+DVD"
        },
        {
            title: "The House of the Devil", 
            year: "2009",
            poster: "https://picsum.photos/150/200?random=2",
            trailer: "https://www.youtube.com/embed/8Z_VkodeReY",
            amazon: "https://www.amazon.com/s?k=House+of+the+Devil+DVD"
        },
        {
            title: "Session 9",
            year: "2001", 
            poster: "https://picsum.photos/150/200?random=3",
            trailer: "https://www.youtube.com/embed/0yaq_mKG3b4",
            amazon: "https://www.amazon.com/s?k=Session+9+DVD"
        },
        {
            title: "The Blackcoat's Daughter",
            year: "2015",
            poster: "https://picsum.photos/150/200?random=4",
            trailer: "https://www.youtube.com/embed/8z_bSyOaZDA",
            amazon: "https://www.amazon.com/s?k=Blackcoats+Daughter+DVD"
        }
    ];
    
    // Pick 2 random gems for today
    const shuffled = obscureGems.sort(() => 0.5 - Math.random());
    const todaysGems = shuffled.slice(0, 2);
    
    const obscureGrid = document.querySelector('.obscure-movies-grid');
    if (obscureGrid) {
        obscureGrid.innerHTML = todaysGems.map(gem => `
            <div class="obscure-movie-item" data-trailer="${gem.trailer}">
                <img src="${gem.poster}" class="obscure-poster" alt="${gem.title}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2ZmMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhPUlJPUjwvdGV4dD48L3N2Zz4='">
                <iframe class="obscure-video" src="" frameborder="0" allowfullscreen></iframe>
                <div class="obscure-title">${gem.title}</div>
                <div class="obscure-year">${gem.year}</div>
                <a href="${gem.amazon}" target="_blank" class="dvd-link">Buy DVD</a>
            </div>
        `).join('');
        
        // Add click handlers for trailers
        document.querySelectorAll('.obscure-movie-item').forEach(item => {
            item.addEventListener('click', function() {
                const trailerUrl = this.dataset.trailer;
                if (trailerUrl) {
                    openVideoModal(trailerUrl);
                }
            });
        });
    }
}

// ===== VIDEO MODAL =====
function openVideoModal(videoUrl) {
    if (videoIframe && videoModal) {
        videoIframe.src = videoUrl;
        videoModal.style.display = 'flex';
    }
}

function closeVideoModal() {
    if (videoIframe && videoModal) {
        videoIframe.src = '';
        videoModal.style.display = 'none';
    }
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function showToast(message) {
    // Create simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Fade out after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function showNotImplemented(feature) {
    showToast(`${feature} coming soon!`);
}

function showAboutModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-900 border border-red-600 rounded-lg p-6 max-w-md text-center">
            <h2 class="text-red-500 text-2xl font-bold mb-4 nosifer">Horror Oracle</h2>
            <p class="text-gray-300 mb-4">Your gateway to the darkest depths of cinema. I possess knowledge of every horror film ever created.</p>
            <p class="text-gray-400 text-sm mb-4">Built with Flask, OpenAI, and a passion for horror movies.</p>
            <button onclick="this.parentElement.parentElement.remove()" 
                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function toggleRecentReleases() {
    showToast('Loading recent releases...');
    
    try {
        const response = await fetch(`${API_BASE}/recent-releases`);
        const data = await response.json();
        
        if (data.releases && data.releases.length > 0) {
            const message = `Recent Horror Releases:\n${data.releases.slice(0, 5).map(movie => 
                `• ${movie.title} (${formatDate(movie.release_date)})`
            ).join('\n')}`;
            
            addChatMessage('bot', message.replace(/\n/g, '<br>'));
        } else {
            addChatMessage('bot', 'No recent horror releases found.');
        }
    } catch (error) {
        console.error('Error loading recent releases:', error);
        showToast('Failed to load recent releases');
    }
}

// ===== BLOOD EFFECTS =====
function startBloodEffects() {
    // Initial burst and occasional cascades of 10 drops
    createBloodDrops(10);
    setInterval(() => createBloodDrops(10), 15000 + Math.random() * 30000); // Every 15-45 seconds
}

function createBloodDrops(count) {
    for (let i = 0; i < count; i++) {
        // Stagger each drop for a natural cascade
        setTimeout(createBloodDrop, i * (80 + Math.random() * 120));
    }
}

function createBloodDrop() {
    const drop = document.createElement('div');
    drop.className = 'blood-drop';
    
    // Random position at top of screen
    drop.style.left = Math.random() * 100 + 'vw';
    drop.style.width = (Math.random() * 10 + 5) + 'px';
    drop.style.height = (Math.random() * 15 + 10) + 'px';
    
    document.body.appendChild(drop);
    
    // Remove after animation
    setTimeout(() => {
        if (drop.parentNode) {
            drop.parentNode.removeChild(drop);
        }
    }, 7000);
}

// ===== TRAILER EMBED LOGIC =====
function showTrailer(youtubeUrl) {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) return alert('Trailer not found.');
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    const trailerContainer = document.getElementById('trailer-frame-container');
    const trailerIframe = document.getElementById('trailer-iframe');
    if(trailerIframe) {
        trailerIframe.src = embedUrl;
        trailerContainer.style.display = 'flex';
    }
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function hideTrailer() {
    const trailerContainer = document.getElementById('trailer-frame-container');
    const trailerIframe = document.getElementById('trailer-iframe');
    if(trailerIframe) trailerIframe.src = '';
    if(trailerContainer) trailerContainer.style.display = 'none';
}

// ===== GENRE BUTTON FUNCTIONALITY =====
function setupGenreButtons() {
    // Get all the red genre buttons
    const genreButtons = document.querySelectorAll('.horror-genre-tag');
    
    genreButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the text and convert to API format
            const genreText = this.textContent.trim();
            
            // Map button text to API genre names
            const genreMap = {
                'SLASHERS': 'slashers',
                'ZOMBIES': 'zombies', 
                'VAMPIRES': 'vampires',
                'GORE FESTS': 'gore-fests',
                'SUPERNATURAL': 'supernatural',
                'DEMONS': 'demons',
                'PSYCHO KILLERS': 'psycho-killers',
                'ALIEN HORROR': 'alien-horror',
                'CREATURE FEATURES': 'creature-features',
                'HAUNTED HOUSES': 'haunted-houses',
                'PSYCHOLOGICAL': 'psychological',
                'CULT HORROR': 'cult-horror'
            };
            
            // Clean the text (remove emojis and extra spaces)
            const cleanGenre = genreText.replace(/[^\w\s]/g, '').trim();
            const apiGenre = genreMap[cleanGenre];
            
            if (apiGenre) {
                // Add visual feedback
                this.classList.add('pulse-once');
                
                // Call the genre API
                fetchGenreMovie(apiGenre);
            }
        });
    });
}

async function fetchGenreMovie(genre) {
    if (isLoading) return;
    
    isLoading = true;
    
    // Show loading message
    const loadingId = addChatMessage('bot', `Summoning a ${genre.replace('-', ' ')} movie from the depths...`, null, true);
    
    try {
        const response = await fetch(`${API_BASE}/random-genre/${genre}`);
        const data = await response.json();
        
        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        
        if (data.error) {
            addChatMessage('bot', `Error: ${data.error}`);
        } else {
            // Add Oracle's response - prevent duplicates
            const isDuplicate = data.movie_details && 
                   data.movie_details.title &&
                   lastDisplayedMovie === data.movie_details.title;
            
            if (!isDuplicate) {
                addChatMessage('bot', data.response, data.movie_details);
                lastDisplayedMovie = data.movie_details ? data.movie_details.title : null;
            }
            
            // Update movie sections
            if (data.movie_details && data.movie_details.title) {
                currentMovie = data.movie_details.title;
                currentMovieDetails = data.movie_details;
                updateMovieSections(data.movie_details, data.recommendations);
                loadMovieStats(currentMovie);
            }
        }
    } catch (error) {
        console.error('Genre fetch error:', error);
        
        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        
        addChatMessage('bot', 'The spirits are restless... Please try again.');
    }
    
    isLoading = false;
}

// ===== PHASE 1: PERSONALIZATION FUNCTIONS =====

// PHASE 1: Handle genre click with tracking
async function handleGenreClick(genre) {
    // Get current user from localStorage
    const savedUser = localStorage.getItem('horrorUser');
    
    if (savedUser) {
        const userObject = JSON.parse(savedUser);
        
        // Track genre preference
        try {
            await fetch(`${API_BASE}/track-genre-preference`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    googleId: userObject.sub,
                    genre: genre
                })
            });
            
            // Reload profile and recommendations
            loadHorrorProfile(userObject.sub);
            loadPersonalizedRecommendations(userObject.sub);
        } catch (error) {
            console.error('Error tracking genre preference:', error);
        }
    }
    
    // Continue with existing genre functionality
    fetchGenreMovie(genre);
}

// PHASE 1: Load and display horror profile
async function loadHorrorProfile(googleId) {
    try {
        const response = await fetch(`${API_BASE}/get-horror-profile`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({googleId: googleId})
        });
        const data = await response.json();
        
        if (data.horror_profile) {
            // Show profile section
            const profileSection = document.getElementById('horror-profile-section');
            if (profileSection) {
                profileSection.classList.remove('hidden');
                
                // Set profile name
                const profileName = document.getElementById('profile-name');
                if (profileName) {
                    profileName.textContent = data.horror_profile;
                }
                
                // Set icon based on profile
                const profileIcons = {
                    "Slasher Fan": "🔪",
                    "Zombie Enthusiast": "🧟",
                    "Vampire Lover": "🧛",
                    "Gore Hound": "💉",
                    "Supernatural Seeker": "👻",
                    "Demon Hunter": "😈",
                    "Psycho Thriller Fan": "🔫",
                    "Sci-Fi Horror Fan": "👽",
                    "Monster Movie Buff": "🦖",
                    "Haunted House Explorer": "🏚️",
                    "Mind Bender": "🧠",
                    "Cult Classic Connoisseur": "🕯️",
                    "Horror Enthusiast": "🎃",
                    "New Horror Fan": "🎃"
                };
                
                const icon = profileIcons[data.horror_profile] || "🎃";
                const profileIcon = document.getElementById('profile-icon');
                if (profileIcon) {
                    profileIcon.textContent = icon;
                }
            }
            
            // Highlight favorite genre tag
            if (data.genre_searches) {
                reorderGenreTags(data.genre_searches);
            }
        }
    } catch (error) {
        console.error('Error loading horror profile:', error);
    }
}

// PHASE 1: Load personalized recommendations
async function loadPersonalizedRecommendations(googleId) {
    try {
        const response = await fetch(`${API_BASE}/get-personalized-recommendations`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({googleId: googleId})
        });
        const data = await response.json();
        
        if (data.recommendations && data.recommendations.length > 0) {
            // Update title to "FOR YOU"
            const recsTitle = document.getElementById('recommendations-title');
            if (recsTitle) {
                recsTitle.textContent = 'FOR YOU';
            }
            
            // Update subtitle
            const subtitle = document.getElementById('for-you-subtitle');
            if (subtitle) {
                subtitle.textContent = `Because you love ${data.based_on_genre}`;
                subtitle.classList.remove('hidden');
            }
            
            // Display recommendations
            updateRecommendations(data.recommendations);
        }
    } catch (error) {
        console.error('Error loading personalized recommendations:', error);
    }
}

// PHASE 1: Highlight favorite genre tag
function reorderGenreTags(genreSearches) {
    if (!genreSearches || Object.keys(genreSearches).length === 0) return;
    
    // Find top genre
    let topGenre = null;
    let maxCount = 0;
    for (const [genre, count] of Object.entries(genreSearches)) {
        if (count > maxCount) {
            maxCount = count;
            topGenre = genre;
        }
    }
    
    if (!topGenre) return;
    
    // Map genre names to button text
    const genreMap = {
        'slashers': 'SLASHERS',
        'zombies': 'ZOMBIES',
        'vampires': 'VAMPIRES',
        'gore-fests': 'GORE FESTS',
        'supernatural': 'SUPERNATURAL',
        'demons': 'DEMONS',
        'psycho-killers': 'PSYCHO KILLERS',
        'alien-horror': 'ALIEN HORROR',
        'creature-features': 'CREATURE FEATURES',
        'haunted-houses': 'HAUNTED HOUSES',
        'psychological': 'PSYCHOLOGICAL',
        'cult-horror': 'CULT HORROR'
    };
    
    const searchText = genreMap[topGenre];
    if (!searchText) return;
    
    // Find and highlight the tag
    const genreTags = document.querySelectorAll('.horror-genre-tag');
    genreTags.forEach(tag => {
        const tagText = tag.textContent.replace(/[^\w\s]/g, '').trim();
        if (tagText === searchText) {
            tag.classList.add('favorite');
        } else {
            tag.classList.remove('favorite');
        }
    });
}