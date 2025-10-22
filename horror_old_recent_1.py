from dotenv import load_dotenv
load_dotenv()

import os
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec
from urllib.parse import quote 
import sqlite3
import datetime
import random
from collections import defaultdict
import time

# ----- CONFIG -----
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY") 
OMDB_API_KEY = os.getenv("OMDB_API_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
INDEX_NAME = "horror-movies"
EMBED_MODEL = "text-embedding-3-small"

# ----- CLIENTS -----
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Pinecone initialization (newer API format)
if PINECONE_API_KEY:
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(INDEX_NAME)


else:
    index = None

# Connect to SQLite database
db_conn = sqlite3.connect('horror_movies.db', check_same_thread=False)
db_cursor = db_conn.cursor()


app = Flask(__name__, static_url_path="", static_folder=".")
CORS(app)

# ----- IN-MEMORY STORAGE FOR RATINGS AND REVIEWS -----
movie_ratings = defaultdict(list)
movie_reviews = defaultdict(list)
movie_stats = defaultdict(lambda: {
    "gore": 0,
    "fear": 0,
    "kills": 0
})

# Track conversation depth for "Tell Me More" variations
conversation_depth = defaultdict(int)

# Horror movie knowledge base for conversational responses
HORROR_KNOWLEDGE = {
    "bloodiest": [
        {"title": "Dead Alive (Braindead)", "year": "1992", "note": "300 liters of fake blood per minute in the final scene!"},
        {"title": "Evil Dead (2013)", "year": "2013", "note": "70,000 gallons of fake blood used"},
        {"title": "The Shining", "year": "1980", "note": "The elevator blood scene alone used 300 gallons"},
        {"title": "Terrifier 2", "year": "2022", "note": "People literally passed out in theaters from the gore"},
        {"title": "Tokyo Gore Police", "year": "2008", "note": "Japanese splatter at its finest"}
    ],
    "weirdest_kills": [
        {"title": "Final Destination 2", "kill": "Death by flying fence"},
        {"title": "Leprechaun", "kill": "Pogo stick murder"},
        {"title": "Jack Frost", "kill": "Carrot nose stabbing"},
        {"title": "The Happening", "kill": "Death by lawnmower"},
        {"title": "Thankskilling", "kill": "Turkey with a shotgun"}
    ],
    "nudity": [
        {"title": "Zombie Strippers", "year": "2008"},
        {"title": "Piranha 3D", "year": "2010"},
        {"title": "Species", "year": "1995"},
        {"title": "Lifeforce", "year": "1985"},
        {"title": "Return of the Living Dead", "year": "1985"}
    ],
    "zombies": [
        "Dawn of the Dead (1978 & 2004)", "28 Days Later", "Train to Busan", 
        "Shaun of the Dead", "Night of the Living Dead", "World War Z",
        "Zombieland", "The Return of the Living Dead", "Day of the Dead"
    ],
    "vampires": [
        "Let the Right One In", "Interview with the Vampire", "30 Days of Night",
        "Near Dark", "The Lost Boys", "Blade", "From Dusk Till Dawn",
        "What We Do in the Shadows", "Nosferatu", "Bram Stoker's Dracula"
    ],
    "slashers": [
        "Halloween", "Friday the 13th", "A Nightmare on Elm Street", "Scream",
        "Child's Play", "Texas Chainsaw Massacre", "Candyman", "I Know What You Did Last Summer"
    ]
}

# Predefined horror stats for popular movies
MOVIE_HORROR_STATS = {
    "saw": {"gore": 85, "fear": 7.5, "kills": 6},
    "the conjuring": {"gore": 20, "fear": 9.0, "kills": 2},
    "halloween": {"gore": 65, "fear": 8.0, "kills": 17},
    "scream": {"gore": 70, "fear": 7.0, "kills": 7},
    "friday the 13th": {"gore": 75, "fear": 7.5, "kills": 22},
    "nightmare on elm street": {"gore": 60, "fear": 8.5, "kills": 4},
    "the exorcist": {"gore": 30, "fear": 9.5, "kills": 2},
    "it": {"gore": 55, "fear": 8.0, "kills": 8},
    "hereditary": {"gore": 65, "fear": 9.0, "kills": 5},
    "midsommar": {"gore": 70, "fear": 8.0, "kills": 9},
    "the babadook": {"gore": 15, "fear": 8.5, "kills": 1},
    "get out": {"gore": 25, "fear": 7.5, "kills": 6},
    "a quiet place": {"gore": 30, "fear": 8.5, "kills": 3},
    "sinister": {"gore": 45, "fear": 9.0, "kills": 5},
    "insidious": {"gore": 20, "fear": 8.5, "kills": 2},
    "paranormal activity": {"gore": 10, "fear": 7.0, "kills": 1},
    "the descent": {"gore": 70, "fear": 8.5, "kills": 6},
    "texas chainsaw massacre": {"gore": 90, "fear": 8.0, "kills": 5},
    "evil dead": {"gore": 95, "fear": 7.5, "kills": 5},
    "terrifier": {"gore": 100, "fear": 8.0, "kills": 9},
    "hellraiser": {"gore": 85, "fear": 8.5, "kills": 4}
}

TELL_ME_MORE_PROMPTS = {
    1: """You are the Horror Oracle continuing a discussion about a horror movie. 
    The user wants to know more. Focus on behind-the-scenes trivia, production stories, or interesting facts about the cast.
    Start naturally - maybe with "Here's something wild..." or "Fun fact:" or "You know what's crazy?" or "The production story is insane..." 
    Keep it conversational and engaging. DON'T start with "Oh man" or similar phrases.""",
    
    2: """You are the Horror Oracle going deeper into horror movie discussion.
    Now discuss the film's influence on the genre, other movies it inspired, or its cultural impact.
    Start with varied phrases like "This movie actually changed everything..." or "What most people don't realize is..." 
    or "The legacy of this film..." or "After this came out..." Be natural and varied.""",
    
    3: """You are the Horror Oracle in deep discussion about a horror movie.
    Talk about controversial aspects, censorship issues, or different versions/cuts of the film.
    Start uniquely - "There's actually a darker version..." or "The censors went crazy over..." 
    or "In some countries..." or "The unrated cut shows..." Mix it up, be unpredictable.""",
    
    4: """You are the Horror Oracle sharing the deepest lore about a horror movie.
    Discuss fan theories, hidden meanings, or connections to other films.
    Begin differently each time - "Fans have this theory that..." or "If you look closely..." 
    or "The director confirmed that..." or "There's this Easter egg..." Keep it fresh and exciting."""
}

def get_conversational_prompt(query, is_tell_me_more=False, movie_title=None):
    """Get the appropriate conversational prompt based on context"""
    
    if is_tell_me_more and movie_title:
        depth_key = f"depth_{movie_title.lower()}"
        conversation_depth[depth_key] = (conversation_depth[depth_key] % 4) + 1
        current_depth = conversation_depth[depth_key]
        
        base_prompt = TELL_ME_MORE_PROMPTS.get(current_depth, TELL_ME_MORE_PROMPTS[1])
        return base_prompt + f"\n\nMovie being discussed: {movie_title}\nUser query: {query}"
    
    return """You are the Horror Oracle, a passionate horror movie expert who talks like a knowledgeable friend at a horror convention.

IMPORTANT PERSONALITY TRAITS:
- Speak conversationally, like you're chatting with a fellow horror fan
- Get genuinely excited about discussing horror movies
- Use phrases like "Dude, you HAVE to see...", "That movie is insane!", "I love that one!"
- Share your personal reactions: "That scene made me jump out of my seat!", "I couldn't sleep after watching that"
- Be enthusiastic but not overly formal

CONVERSATION STYLE:
- Start responses with casual acknowledgment: "Oh, you want the bloody stuff!", "Zombie movies? I got you covered!", "Weird kills? Buckle up!"
- Use first person: "I remember when I first saw...", "My favorite part is when..."
- Include reactions: "That movie is BRUTAL", "It's so messed up but in the best way"
- Add personal touches: "I watch this every Halloween", "Still gives me nightmares"

When answering questions about categories (bloodiest, weirdest, most nudity, etc):
- Don't just list movies, TALK about them
- Share WHY they fit the category
- Include fun facts or personal reactions
- Build excitement about the recommendations

Keep responses to 2-3 short paragraphs max, but make them engaging and conversational."""

def get_movie_details_from_apis(title):
    """Get movie details - check database first, then APIs"""
    cache_key = title.lower().strip()
    
    # STEP 1: Check SQLite database first
    try:
        # Try exact match first
        db_cursor.execute('''
            SELECT id, title, original_title, popularity 
            FROM movies 
            WHERE LOWER(title) = ? OR LOWER(original_title) = ?
            ORDER BY popularity DESC
            LIMIT 1
        ''', (cache_key, cache_key))
        
        db_result = db_cursor.fetchone()
        
        # If no exact match, try partial match
        if not db_result:
            db_cursor.execute('''
                SELECT id, title, original_title, popularity 
                FROM movies 
                WHERE LOWER(title) LIKE ? OR LOWER(original_title) LIKE ?
                ORDER BY popularity DESC
                LIMIT 1
            ''', (f'%{cache_key}%', f'%{cache_key}%'))
            db_result = db_cursor.fetchone()
        
        if db_result:
            movie_id = db_result[0]
            movie_title = db_result[1]
            print(f"✅ DATABASE HIT: {movie_title}")
            
            # Get full details from TMDB using the ID
            if TMDB_API_KEY:
                try:
                    detail_url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}&append_to_response=credits"
                    detail_response = requests.get(detail_url, timeout=3)
                    detail_data = detail_response.json()
                    
                    movie_details = {
                        "title": detail_data.get("title", movie_title),
                        "year": detail_data.get("release_date", "").split("-")[0] if detail_data.get("release_date") else None,
                        "poster": f"https://image.tmdb.org/t/p/w500{detail_data['poster_path']}" if detail_data.get("poster_path") else None,
                        "plot": detail_data.get("overview"),
                        "rating": str(detail_data.get("vote_average")),
                        "genres": ", ".join([g["name"] for g in detail_data.get("genres", [])]),
                        "director": None
                    }
                    
                    if detail_data.get("credits") and detail_data["credits"].get("crew"):
                        directors = [p["name"] for p in detail_data["credits"]["crew"] if p.get("job") == "Director"]
                        if directors:
                            movie_details["director"] = directors[0]
                    
                    return movie_details
                except Exception as e:
                    print(f"TMDB detail error: {e}")
    except Exception as e:
        print(f"Database error: {e}")
    
    # STEP 2: Not in database, fall back to original API method
    print(f"❌ DATABASE MISS: {title} (using APIs)")
    
    movie_details = {
        "title": title,
        "year": None,
        "director": None,
        "poster": None,
        "plot": None,
        "rating": None,
        "genres": "Horror"
    }
    
    # Try OMDB first
    if OMDB_API_KEY:
        try:
            omdb_url = f"http://www.omdbapi.com/?t={quote(title)}&apikey={OMDB_API_KEY}"
            omdb_response = requests.get(omdb_url, timeout=3)
            omdb_data = omdb_response.json()
            
            if omdb_data.get("Response") == "True":
                movie_details["title"] = omdb_data.get("Title", title)
                movie_details["year"] = omdb_data.get("Year")
                movie_details["director"] = omdb_data.get("Director")
                movie_details["poster"] = omdb_data.get("Poster") if omdb_data.get("Poster") != "N/A" else None
                movie_details["plot"] = omdb_data.get("Plot")
                movie_details["rating"] = omdb_data.get("imdbRating")
                movie_details["genres"] = omdb_data.get("Genre", "Horror")
                return movie_details
        except Exception as e:
            print(f"OMDB error: {e}")
    
    # Try TMDB as fallback
    if TMDB_API_KEY:
        try:
            search_url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={quote(title)}"
            search_response = requests.get(search_url, timeout=3)
            search_data = search_response.json()
            
            if search_data.get("results"):
                movie = search_data["results"][0]
                movie_id = movie["id"]
                
                detail_url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}&append_to_response=credits"
                detail_response = requests.get(detail_url, timeout=3)
                detail_data = detail_response.json()
                
                movie_details["title"] = detail_data.get("title", title)
                movie_details["year"] = detail_data.get("release_date", "").split("-")[0] if detail_data.get("release_date") else None
                movie_details["poster"] = f"https://image.tmdb.org/t/p/w500{detail_data['poster_path']}" if detail_data.get("poster_path") else None
                movie_details["plot"] = detail_data.get("overview")
                movie_details["rating"] = str(detail_data.get("vote_average"))
                movie_details["genres"] = ", ".join([g["name"] for g in detail_data.get("genres", [])])
                
                if detail_data.get("credits") and detail_data["credits"].get("crew"):
                    directors = [p["name"] for p in detail_data["credits"]["crew"] if p.get("job") == "Director"]
                    if directors:
                        movie_details["director"] = directors[0]
                
                return movie_details
        except Exception as e:
            print(f"TMDB error: {e}")
    
    return movie_details


def get_movie_recommendations(title):
    """Get similar movie recommendations with posters"""
    recommendations = []
    
    if TMDB_API_KEY:
        try:
            search_url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={quote(title)}"
            search_response = requests.get(search_url)
            search_data = search_response.json()
            
            if search_data.get("results"):
                movie_id = search_data["results"][0]["id"]
                
                rec_url = f"https://api.themoviedb.org/3/movie/{movie_id}/recommendations?api_key={TMDB_API_KEY}"
                rec_response = requests.get(rec_url)
                rec_data = rec_response.json()
                
                for movie in rec_data.get("results", [])[:5]:
                    rec = {
                        "title": movie.get("title"),
                        "year": movie.get("release_date", "").split("-")[0] if movie.get("release_date") else None,
                        "poster": f"https://image.tmdb.org/t/p/w200{movie['poster_path']}" if movie.get("poster_path") else None
                    }
                    recommendations.append(rec)
        except Exception as e:
            print(f"Error getting recommendations: {e}")
    
    return recommendations

def detect_query_type(query):
    """Detect what type of horror query this is"""
    query_lower = query.lower()
    
    if any(phrase in query_lower for phrase in ['tell me more', 'more details', 'more about', 'obscure details']):
        return 'tell_me_more'
    
    if any(word in query_lower for word in ['blood', 'bloody', 'bloodiest', 'gore', 'gory', 'goriest']):
        return 'bloodiest'
    elif any(word in query_lower for word in ['weird', 'bizarre', 'strange', 'crazy', 'kill', 'death']):
        return 'weird_kills'
    elif any(word in query_lower for word in ['nude', 'nudity', 'naked', 'sex']):
        return 'nudity'
    elif any(word in query_lower for word in ['zombie', 'undead', 'walking dead']):
        return 'zombies'
    elif any(word in query_lower for word in ['vampire', 'dracula', 'bloodsucker']):
        return 'vampires'
    elif any(word in query_lower for word in ['slasher', 'killer', 'masked']):
        return 'slashers'
    elif any(word in query_lower for word in ['recommend', 'suggest', 'similar', 'like']):
        return 'recommendation'
    elif any(word in query_lower for word in ['scary', 'scariest', 'terrifying', 'frightening']):
        return 'scariest'
    else:
        if len(query_lower.split()) <= 5:
            return 'specific_movie'
        return 'general'

def generate_conversational_response(query, query_type, movie_title=None):
    """Generate a conversational response based on query type"""
    
    is_tell_me_more = query_type == 'tell_me_more'
    
    if not client:
        if is_tell_me_more and movie_title:
            fallback_responses = [
                f"Here's something wild about {movie_title} - the practical effects were all done without CGI! They used gallons of corn syrup and food coloring for the blood.",
                f"Fun fact: {movie_title} was actually banned in several countries! The censors thought it was too intense for audiences.",
                f"You know what's crazy? The lead actor in {movie_title} did all their own stunts. No doubles, just pure dedication to the horror.",
                f"The production story is insane - they filmed {movie_title} in an actual abandoned location that locals claimed was haunted!",
                f"What most people don't realize is that {movie_title} inspired a whole wave of copycats. It basically created its own subgenre."
            ]
            depth_key = f"depth_{movie_title.lower()}"
            depth = conversation_depth.get(depth_key, 0) % len(fallback_responses)
            return fallback_responses[depth]
        elif query_type == 'bloodiest':
            return "You want the bloody stuff! Dead Alive (1992) is INSANE - they used 300 liters of fake blood per minute in the final scene! Evil Dead 2013 is also completely drenched in blood. And if you want something recent, Terrifier 2 made people literally pass out in theaters from the gore!"
        elif query_type == 'zombies':
            return "Zombie movies? I got you covered! Train to Busan is absolutely incredible - fast zombies and it'll make you cry. 28 Days Later changed the game with running zombies. And Dawn of the Dead (both versions) are must-watches. Shaun of the Dead if you want laughs with your zombies!"
        else:
            return "I love talking horror! What specifically are you in the mood for? Slashers, zombies, vampires, or something really messed up?"
    
    context = get_conversational_prompt(query, is_tell_me_more, movie_title)
    
    if query_type in ['bloodiest', 'weird_kills', 'nudity', 'zombies', 'vampires', 'slashers']:
        knowledge_data = HORROR_KNOWLEDGE.get(query_type.replace('weird_kills', 'weirdest_kills'), [])
        context += f"\n\nRelevant movies for this category: {json.dumps(knowledge_data)}"
    
    try:
        messages = [
            {"role": "system", "content": context},
            {"role": "user", "content": query}
        ]
        
        completion = client.chat.completions.create(
    model="gpt-4o-mini",  # 3x faster!
    messages=messages,
    temperature=0.9,
    max_tokens=200  # Shorter responses = faster
)
        
        return completion.choices[0].message.content
    except Exception as e:
        print(f"GPT error: {e}")
        if is_tell_me_more:
            return f"Here's a fascinating detail about {movie_title} - it's considered one of the most influential horror films of its era!"
        return "The spirits are disturbed, but I'd love to talk horror with you! What kind of scares are you looking for?"

@app.route("/")
def home():
    return send_from_directory(".", "index.html")

@app.route("/ask-oracle", methods=["POST"])
def ask_oracle():
    """Main endpoint for horror movie queries with conversational responses"""
    import time
    start_time = time.time()
    
    try:
        data = request.json
        query = data.get("query", "").strip()
        
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        print(f"🔍 Query: {query}")
        print(f"⏱️ START: {time.time() - start_time:.2f}s")
        
        query_type = detect_query_type(query)
        print(f"Query type: {query_type}")
        print(f"⏱️ After detect_query_type: {time.time() - start_time:.2f}s")
        
        movie_details = None
        recommendations = []
        
        movie_title = None
        if query_type == 'tell_me_more':
            query_lower = query.lower()
            for movie in ['saw', 'halloween', 'scream', 'the conjuring', 'the exorcist', 'insidious', 
                         'sinister', 'hereditary', 'midsommar', 'get out', 'friday the 13th',
                         'nightmare on elm street', 'texas chainsaw massacre', "child's play",
                         'evil dead', 'hellraiser', 'candyman']:
                if movie in query_lower:
                    movie_title = movie.title()
                    break
            
            if movie_title:
                print(f"⏱️ Before GPT: {time.time() - start_time:.2f}s")
                response = generate_conversational_response(query, query_type, movie_title)
                print(f"⏱️ After GPT: {time.time() - start_time:.2f}s")
                
                movie_details = get_movie_details_from_apis(movie_title)
                print(f"⏱️ After movie details: {time.time() - start_time:.2f}s")
                
                if movie_details:
                    #recommendations = get_movie_recommendations(movie_title)
                    #print(f"⏱️ After recommendations: {time.time() - start_time:.2f}s")
            else:
                response = generate_conversational_response(query, 'general')
        
        elif query_type == 'specific_movie':
            print(f"⏱️ Before get_movie_details: {time.time() - start_time:.2f}s")
            movie_details = get_movie_details_from_apis(query)
            print(f"⏱️ After get_movie_details: {time.time() - start_time:.2f}s")
            
            if movie_details and movie_details.get("title"):
   
                       else:
            print(f"⏱️ Before GPT: {time.time() - start_time:.2f}s")
            response = generate_conversational_response(query, query_type)
            print(f"⏱️ After GPT: {time.time() - start_time:.2f}s")
            
            if query_type in ['bloodiest', 'zombies', 'vampires', 'slashers']:
                category_movies = HORROR_KNOWLEDGE.get(query_type, [])
                if category_movies and isinstance(category_movies[0], dict):
                    sample_movie = category_movies[0]
                    movie_details = get_movie_details_from_apis(sample_movie.get('title', ''))
                elif category_movies:
                    sample_title = category_movies[0].split('(')[0].strip()
                    movie_details = get_movie_details_from_apis(sample_title)
                    if movie_details:
                        recommendations = get_movie_recommendations(sample_title)
        
        print(f"⏱️ TOTAL TIME: {time.time() - start_time:.2f}s")
        
        return jsonify({
            "response": response,
            "movie_details": movie_details,
            "recommendations": recommendations,
            "query_type": query_type
        })
        
    except Exception as e:
        print(f"Error in ask-oracle: {e}")
        print(f"⏱️ TOTAL TIME (with error): {time.time() - start_time:.2f}s")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error in ask-oracle: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/submit-rating", methods=["POST"])
def submit_rating():
    """Submit a rating for a movie"""
    try:
        data = request.json
        movie_title = data.get("movie_title")
        rating = data.get("rating")
        
        if not movie_title or rating is None:
            return jsonify({"error": "Movie title and rating required"}), 400
        
        if not 1 <= rating <= 5:
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
        movie_ratings[movie_title.lower()].append(rating)
        
        ratings_list = movie_ratings[movie_title.lower()]
        avg_rating = sum(ratings_list) / len(ratings_list)
        
        return jsonify({
            "average_rating": round(avg_rating, 1),
            "total_ratings": len(ratings_list),
            "message": "Rating submitted successfully!"
        })
        
    except Exception as e:
        print(f"Error submitting rating: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/submit-review", methods=["POST"])
def submit_review():
    """Submit a review for a movie"""
    try:
        data = request.json
        movie_title = data.get("movie_title")
        review_text = data.get("review")
        
        if not movie_title or not review_text:
            return jsonify({"error": "Movie title and review text required"}), 400
        
        if len(review_text) > 500:
            return jsonify({"error": "Review must be 500 characters or less"}), 400
        
        review = {
            "text": review_text,
            "timestamp": datetime.datetime.now().isoformat(),
            "user": "Anonymous"
        }
        
        movie_reviews[movie_title.lower()].append(review)
        if len(movie_reviews[movie_title.lower()]) > 10:
            movie_reviews[movie_title.lower()].pop(0)
        
        return jsonify({
            "message": "Review submitted successfully!",
            "total_reviews": len(movie_reviews[movie_title.lower()])
        })
        
    except Exception as e:
        print(f"Error submitting review: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/get-movie-stats", methods=["GET"])
def get_movie_stats():
    """Get community stats for a movie"""
    try:
        movie_title = request.args.get("movie_title", "").lower()
        
        if not movie_title:
            return jsonify({"error": "Movie title required"}), 400
        
        ratings_list = movie_ratings.get(movie_title, [])
        avg_rating = sum(ratings_list) / len(ratings_list) if ratings_list else 0
        
        reviews_list = movie_reviews.get(movie_title, [])
        
        stats = MOVIE_HORROR_STATS.get(movie_title, {
            "gore": random.randint(20, 95),
            "fear": round(random.uniform(5.0, 10.0), 1),
            "kills": random.randint(1, 25)
        })
        
        return jsonify({
            "rating": {
                "average": round(avg_rating, 1),
                "count": len(ratings_list)
            },
            "reviews": reviews_list[-5:],
            "stats": stats
        })
        
    except Exception as e:
        print(f"Error getting movie stats: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/theater-releases", methods=["GET"])
def theater_releases():
    """Get current horror movies in theaters with posters"""
    if not TMDB_API_KEY:
        return jsonify({"releases": []})
    
    try:
        today = datetime.datetime.now()
        four_weeks_ago = today - datetime.timedelta(days=28)
        
        url = f"https://api.themoviedb.org/3/discover/movie"
        params = {
            "api_key": TMDB_API_KEY,
            "with_genres": "27",
            "primary_release_date.gte": four_weeks_ago.strftime("%Y-%m-%d"),
            "primary_release_date.lte": today.strftime("%Y-%m-%d"),
            "sort_by": "popularity.desc",
            "page": 1,
            "region": "US"
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        releases = []
        for movie in data.get("results", [])[:5]:
            releases.append({
                "title": movie.get("title"),
                "release_date": movie.get("release_date"),
                "poster_path": movie.get("poster_path"),
                "vote_average": movie.get("vote_average", 0),
                "overview": movie.get("overview", "")[:150] + "..."
            })
        
        return jsonify({"releases": releases})
        
    except Exception as e:
        print(f"Error getting theater releases: {e}")
        return jsonify({"releases": []})

@app.route("/recent-releases", methods=["GET"])
def recent_releases():
    """Get recent horror movie releases with posters"""
    if not TMDB_API_KEY:
        return jsonify({"releases": []})
    
    try:
        today = datetime.datetime.now()
        three_months_ago = today - datetime.timedelta(days=90)
        
        url = f"https://api.themoviedb.org/3/discover/movie"
        params = {
            "api_key": TMDB_API_KEY,
            "with_genres": "27",
            "primary_release_date.gte": three_months_ago.strftime("%Y-%m-%d"),
            "primary_release_date.lte": today.strftime("%Y-%m-%d"),
            "sort_by": "primary_release_date.desc",
            "page": 1
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        releases = []
        for movie in data.get("results", [])[:10]:
            releases.append({
                "title": movie.get("title"),
                "release_date": movie.get("release_date"),
                "poster_path": movie.get("poster_path"),
                "overview": movie.get("overview", "")[:150] + "..."
            })
        
        return jsonify({"releases": releases})
        
    except Exception as e:
        print(f"Error getting recent releases: {e}")
        return jsonify({"releases": []})

@app.route("/random-genre/<genre>", methods=["GET"])
def random_genre(genre):
    """Get a random movie from a specific horror genre"""
    try:
        # Genre mappings to match your button names
        genre_movies = {
            "slashers": [
                "Halloween", "Friday the 13th", "A Nightmare on Elm Street", "Scream",
                "Child's Play", "Texas Chainsaw Massacre", "Candyman", "I Know What You Did Last Summer",
                "Black Christmas", "My Bloody Valentine", "Sleepaway Camp", "The Burning"
            ],
            "zombies": [
                "Dawn of the Dead", "28 Days Later", "Train to Busan", "Shaun of the Dead",
                "Night of the Living Dead", "World War Z", "Zombieland", "Return of the Living Dead",
                "Day of the Dead", "28 Weeks Later", "Dead Snow", "Rec"
            ],
            "vampires": [
                "Let the Right One In", "Interview with the Vampire", "30 Days of Night",
                "Near Dark", "The Lost Boys", "Blade", "From Dusk Till Dawn",
                "What We Do in the Shadows", "Nosferatu", "Bram Stoker's Dracula", "Fright Night"
            ],
            "gore-fests": [
                "Evil Dead", "Dead Alive", "Terrifier", "Saw", "Hostel", "The Green Inferno",
                "Tokyo Gore Police", "Machine Girl", "Braindead", "Bad Taste", "Dead Snow"
            ],
            "supernatural": [
                "The Conjuring", "Insidious", "Sinister", "The Babadook", "Hereditary",
                "The Exorcist", "Poltergeist", "The Ring", "The Grudge", "Paranormal Activity"
            ],
            "demons": [
                "The Exorcist", "Hellraiser", "Evil Dead", "The Conjuring", "Insidious",
                "Sinister", "Drag Me to Hell", "The Possession", "Demons", "Night of the Demons"
            ],
            "psycho-killers": [
                "Psycho", "The Silence of the Lambs", "American Psycho", "Henry: Portrait of a Serial Killer",
                "Maniac", "The Strangers", "You're Next", "The Purge", "Funny Games"
            ],
            "alien-horror": [
                "Alien", "The Thing", "Invasion of the Body Snatchers", "They Live",
                "Event Horizon", "Life", "The Faculty", "Attack the Block", "Color Out of Space"
            ],
            "creature-features": [
                "The Descent", "Tremors", "Jeepers Creepers", "Dog Soldiers", "The Ritual",
                "Crawl", "Alligator", "Jaws", "The Host", "Cloverfield", "A Quiet Place"
            ],
            "haunted-houses": [
                "The Haunting", "House on Haunted Hill", "The Amityville Horror", "Poltergeist",
                "The Changeling", "Hell House LLC", "Sinister", "Insidious", "The Conjuring"
            ],
            "psychological": [
                "The Babadook", "Black Swan", "Shutter Island", "The Others", "Rosemary's Baby",
                "Don't Look Now", "The Machinist", "Jacob's Ladder", "Mulholland Drive"
            ],
            "cult-horror": [
                "The Wicker Man", "Rosemary's Baby", "Midsommar", "The Witch", "Apostle",
                "Kill List", "Red State", "Martha Marcy May Marlene", "The Invitation"
            ]
        }
        
        # Get movies for the requested genre
        movies = genre_movies.get(genre.lower(), [])
        
        if not movies:
            return jsonify({"error": f"Genre '{genre}' not found"}), 404
        
        # Pick a random movie
        import random
        selected_movie = random.choice(movies)
        
        # Get movie details
        movie_details = get_movie_details_from_apis(selected_movie)
        recommendations = []
        
        if movie_details and movie_details.get("title"):
            recommendations = get_movie_recommendations(movie_details["title"])
        
        # Generate a response about the genre and movie
        genre_responses = {
            "slashers": f"SLASHER PICK: {selected_movie}! Classic masked killer mayhem with plenty of creative kills.",
            "zombies": f"ZOMBIE PICK: {selected_movie}! Brain-munching undead action at its finest.",
            "vampires": f"VAMPIRE PICK: {selected_movie}! Bloodsucking terror from the children of the night.",
            "gore-fests": f"GORE FEST: {selected_movie}! Prepare for gallons of blood and extreme violence.",
            "supernatural": f"SUPERNATURAL: {selected_movie}! Ghostly encounters and paranormal terror.",
            "demons": f"DEMONIC: {selected_movie}! Hell's minions bring pure evil to Earth.",
            "psycho-killers": f"PSYCHO KILLER: {selected_movie}! Human monsters are the scariest of all.",
            "alien-horror": f"ALIEN HORROR: {selected_movie}! Terror from beyond the stars.",
            "creature-features": f"CREATURE FEATURE: {selected_movie}! Monsters, beasts, and things that go bump.",
            "haunted-houses": f"HAUNTED HOUSE: {selected_movie}! Spooky dwellings with dark secrets.",
            "psychological": f"PSYCHOLOGICAL: {selected_movie}! Mind-bending terror that gets under your skin.",
            "cult-horror": f"CULT HORROR: {selected_movie}! Religious fanatics and occult nightmares."
        }
        
        response_text = genre_responses.get(genre.lower(), f"Horror pick: {selected_movie}!")
        
        return jsonify({
            "response": response_text,
            "movie_details": movie_details,
            "recommendations": recommendations,
            "query_type": "genre_selection",
            "genre": genre
        })
        
    except Exception as e:
        print(f"Error in random-genre: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/get-trailer", methods=["GET"])
def get_trailer():
    """Get YouTube trailer URL for a movie"""
    try:
        movie_title = request.args.get("title", "").strip()
        
        if not movie_title or not TMDB_API_KEY:
            return jsonify({"error": "Missing title or TMDB API key"}), 400
        
        search_url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={quote(movie_title)}"
        search_response = requests.get(search_url)
        search_data = search_response.json()
        
        if not search_data.get("results"):
            return jsonify({"error": "Movie not found"}), 404
        
        movie_id = search_data["results"][0]["id"]
        
        videos_url = f"https://api.themoviedb.org/3/movie/{movie_id}/videos?api_key={TMDB_API_KEY}"
        videos_response = requests.get(videos_url)
        videos_data = videos_response.json()
        
        for video in videos_data.get("results", []):
            if video.get("site") == "YouTube" and video.get("type") == "Trailer":
                youtube_url = f"https://www.youtube.com/watch?v={video['key']}"
                return jsonify({"trailer_url": youtube_url})
        
        return jsonify({"error": "No trailer found"}), 404
        
    except Exception as e:
        print(f"Trailer error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/quiz")
def quiz():
    movie = request.args.get("movie", "unknown")
    prompt = f"""
    Write 10 multiple-choice trivia questions about the horror movie '{movie}'.
    Format as JSON:
    [
      {{ "question": "Question text", "options": ["A","B","C","D"], "answer": "A" }},
      ...
    ]
    """
    resp = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800
    )
    import json
    try:
        data = json.loads(resp["choices"][0]["message"]["content"])
    except Exception:
        data = {"error": "format error"}
    return jsonify({"movie": movie, "questions": data})


if __name__ == "__main__":
    print("\n" + "="*50)
    print("🩸 HORROR ORACLE AWAKENING... 🩸")
    print("="*50)
    print(f"📊 Server running on http://localhost:5000")
    print(f"🎬 OMDB API: {'CONNECTED' if OMDB_API_KEY else 'MISSING - Limited functionality'}")
    print(f"🎥 TMDB API: {'CONNECTED' if TMDB_API_KEY else 'MISSING - No posters/recommendations'}")
    print(f"🧠 OpenAI: {'CONNECTED' if OPENAI_API_KEY else 'MISSING - Using fallback responses'}")
    print(f"📦 Pinecone: {'CONNECTED' if index else 'DISCONNECTED'}")
    print("="*50 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True)