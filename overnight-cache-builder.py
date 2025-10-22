"""
DAVE'S SCREAMING OFFICIAL LLM CHATBOT
Overnight Cache Builder Script
Run this before bed to cache thousands of horror movies!
"""

from dotenv import load_dotenv
load_dotenv()

import os
import json
import requests
import time
import pickle
from urllib.parse import quote
from datetime import datetime

# API Keys
OMDB_API_KEY = os.getenv("OMDB_API_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# Cache storage
CACHE_FILE = "movie_cache.pkl"
movie_cache = {}

# Load existing cache if it exists
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, 'rb') as f:
        movie_cache = pickle.load(f)
        print(f"📦 Loaded existing cache with {len(movie_cache)} movies")

def save_cache():
    """Save cache to file"""
    with open(CACHE_FILE, 'wb') as f:
        pickle.dump(movie_cache, f)
    print(f"💾 Saved cache with {len(movie_cache)} movies")

def get_movie_details(title):
    """Get movie details from APIs"""
    cache_key = title.lower().strip()
    
    # Skip if already cached
    if cache_key in movie_cache:
        return "Already cached"
    
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
            omdb_response = requests.get(omdb_url, timeout=5)
            omdb_data = omdb_response.json()
            
            if omdb_data.get("Response") == "True":
                movie_details["title"] = omdb_data.get("Title", title)
                movie_details["year"] = omdb_data.get("Year")
                movie_details["director"] = omdb_data.get("Director")
                movie_details["poster"] = omdb_data.get("Poster") if omdb_data.get("Poster") != "N/A" else None
                movie_details["plot"] = omdb_data.get("Plot")
                movie_details["rating"] = omdb_data.get("imdbRating")
                movie_details["genres"] = omdb_data.get("Genre", "Horror")
                
                # Cache it
                movie_cache[cache_key] = movie_details
                return "Cached from OMDB"
        except Exception as e:
            pass
    
    # Try TMDB as fallback
    if TMDB_API_KEY:
        try:
            search_url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={quote(title)}"
            search_response = requests.get(search_url, timeout=5)
            search_data = search_response.json()
            
            if search_data.get("results"):
                movie = search_data["results"][0]
                movie_id = movie["id"]
                
                detail_url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}&append_to_response=credits"
                detail_response = requests.get(detail_url, timeout=5)
                detail_data = detail_response.json()
                
                movie_details["title"] = detail_data.get("title", title)
                movie_details["year"] = detail_data.get("release_date", "").split("-")[0] if detail_data.get("release_date") else None
                movie_details["poster"] = f"https://image.tmdb.org/t/p/w500{detail_data['poster_path']}" if detail_data.get("poster_path") else None
                movie_details["plot"] = detail_data.get("overview")
                movie_details["rating"] = str(detail_data.get("vote_average"))
                movie_details["genres"] = ", ".join([g["name"] for g in detail_data.get("genres", [])])
                
                # Cache it
                movie_cache[cache_key] = movie_details
                return "Cached from TMDB"
        except Exception as e:
            pass
    
    return "Not found"

# Top horror movies to cache (add more!)
HORROR_MOVIES = [
    # Classic Horror
    "The Exorcist", "The Shining", "Psycho", "The Texas Chain Saw Massacre",
    "Halloween", "A Nightmare on Elm Street", "Friday the 13th", "Hellraiser",
    "Child's Play", "Candyman", "The Thing", "Alien", "The Omen", "Carrie",
    "Rosemary's Baby", "The Birds", "Jaws", "The Silence of the Lambs",
    
    # Modern Horror (2000s)
    "The Ring", "The Grudge", "Saw", "Hostel", "28 Days Later", "Dawn of the Dead",
    "The Descent", "Paranormal Activity", "Cloverfield", "Let the Right One In",
    "The Orphanage", "[REC]", "The Mist", "1408", "Trick 'r Treat",
    
    # Recent Horror (2010s-2020s)
    "The Conjuring", "Insidious", "Sinister", "It", "It Chapter Two",
    "Get Out", "Us", "Hereditary", "Midsommar", "The Witch", "The Babadook",
    "It Follows", "A Quiet Place", "A Quiet Place Part II", "The Invisible Man",
    "Ready or Not", "Malignant", "The Black Phone", "Smile", "Pearl", "X",
    "Barbarian", "Nope", "M3GAN", "Cocaine Bear", "Scream", "Scream VI",
    
    # Zombie Movies
    "Night of the Living Dead", "Dawn of the Dead", "Day of the Dead",
    "Return of the Living Dead", "Zombieland", "Zombieland: Double Tap",
    "World War Z", "Train to Busan", "Shaun of the Dead", "28 Weeks Later",
    "The Girl with All the Gifts", "Cargo", "Dead Snow", "Fido",
    
    # Vampire Movies
    "Dracula", "Nosferatu", "Interview with the Vampire", "Blade",
    "From Dusk Till Dawn", "30 Days of Night", "What We Do in the Shadows",
    "Only Lovers Left Alive", "Let Me In", "Byzantium", "The Lost Boys",
    "Near Dark", "Fright Night", "Bram Stoker's Dracula",
    
    # Slasher Films
    "Scream 2", "Scream 3", "Scream 4", "Scream 5",
    "I Know What You Did Last Summer", "Urban Legend", "Valentine",
    "Happy Death Day", "Happy Death Day 2U", "Freaky", "Fear Street Part One",
    "Fear Street Part Two", "Fear Street Part Three", "The Strangers",
    
    # Supernatural Horror
    "The Conjuring 2", "The Conjuring 3", "Annabelle", "Annabelle Creation",
    "The Nun", "The Curse of La Llorona", "Lights Out", "Don't Breathe",
    "Don't Breathe 2", "Evil Dead", "Evil Dead Rise", "Ouija", "Oculus",
    "The Woman in Black", "Mama", "As Above So Below", "The Autopsy of Jane Doe",
    
    # Gore/Extreme
    "Terrifier", "Terrifier 2", "The Green Inferno", "Martyrs", "High Tension",
    "Inside", "Frontier(s)", "The Hills Have Eyes", "Wrong Turn",
    "The Human Centipede", "Cannibal Holocaust", "Bone Tomahawk",
    
    # Creature Features
    "The Host", "The Ritual", "Crawl", "47 Meters Down", "The Meg",
    "Underwater", "Life", "The Relic", "Deep Rising", "Tremors",
    "Gremlins", "Critters", "Attack the Block", "Slither",
    
    # Psychological Horror
    "Black Swan", "Shutter Island", "The Machinist", "American Psycho",
    "The Sixth Sense", "The Others", "Don't Look Now", "Jacob's Ladder",
    "The Invitation", "Coherence", "The Killing of a Sacred Deer",
    
    # Found Footage
    "The Blair Witch Project", "Paranormal Activity 2", "Paranormal Activity 3",
    "V/H/S", "V/H/S/2", "The Visit", "Unfriended", "Host", "Searching",
    "Missing", "Dashcam", "Deadstream", "Gonjiam: Haunted Asylum",
    
    # International Horror
    "The Wailing", "I Saw the Devil", "A Tale of Two Sisters", "Audition",
    "Ringu", "Ju-On", "Dark Water", "Pulse", "One Missed Call",
    "The Eye", "Shutter", "Goodnight Mommy", "Raw", "Titane",
    
    # Comedy Horror
    "Tucker and Dale vs Evil", "What We Do in the Shadows", "Ready or Not",
    "The Menu", "Bodies Bodies Bodies", "Werewolves Within", "Willy's Wonderland",
    "The Babysitter", "Little Monsters", "Scouts Guide to the Zombie Apocalypse",
    
    # Anthology Horror
    "Tales from the Crypt", "Tales from the Hood", "Trick 'r Treat",
    "The ABCs of Death", "Southbound", "The Mortuary Collection",
    
    # Add more movies here!
    # Goal: Add enough to reach 500-1000 movies
]

def main():
    """Run the overnight cache builder"""
    print("🩸 DAVE'S SCREAMING OFFICIAL - OVERNIGHT CACHE BUILDER 🩸")
    print("="*50)
    print(f"Starting cache build at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Movies to cache: {len(HORROR_MOVIES)}")
    print(f"Estimated time: {len(HORROR_MOVIES) * 2 / 60:.1f} minutes")
    print("="*50)
    
    success_count = 0
    already_cached = 0
    not_found = 0
    
    for i, movie in enumerate(HORROR_MOVIES, 1):
        print(f"\n[{i}/{len(HORROR_MOVIES)}] Processing: {movie}")
        
        result = get_movie_details(movie)
        
        if result == "Already cached":
            print(f"  ✅ Already in cache")
            already_cached += 1
        elif result == "Not found":
            print(f"  ❌ Not found in APIs")
            not_found += 1
        else:
            print(f"  ✅ {result}")
            success_count += 1
            
            # Save every 10 movies
            if success_count % 10 == 0:
                save_cache()
        
        # Rate limiting - adjust as needed
        time.sleep(2)  # 2 seconds between requests
        
        # Progress update every 25 movies
        if i % 25 == 0:
            elapsed = i * 2 / 60
            remaining = (len(HORROR_MOVIES) - i) * 2 / 60
            print(f"\n📊 PROGRESS: {i}/{len(HORROR_MOVIES)} movies")
            print(f"   Time elapsed: {elapsed:.1f} minutes")
            print(f"   Time remaining: {remaining:.1f} minutes")
    
    # Final save
    save_cache()
    
    # Summary
    print("\n" + "="*50)
    print("🎉 CACHE BUILD COMPLETE!")
    print(f"✅ Newly cached: {success_count}")
    print(f"📦 Already cached: {already_cached}")
    print(f"❌ Not found: {not_found}")
    print(f"💾 Total in cache: {len(movie_cache)}")
    print(f"Finished at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50)

if __name__ == "__main__":
    main()