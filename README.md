# Aura - AI Flashcard Generator
URGENT UODATE :If you you dont see the signin with google option please refresh the page to load the feature 

**Live App:**  
[http://aura-flashcardgenerator-3579.up.railway.app](http://aura-flashcardgenerator-3579.up.railway.app)

---
For android users you can download the apk version of Aura

## Overview

Aura is a modern, AI-powered flashcard generator that helps you study smarter. Instantly turn your notes or PDF documents into interactive flashcards using advanced AI models. Save, load, and export your flashcards, and support the project through optional donations. here is the link to our pitch deck https://www.canva.com/design/DAGxqwWm8MA/6BQrdLBtpkCwZw_PMX0K5w/edit?utm_content=DAGxqwWm8MA&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

---

## Features

- **AI Flashcard Generation:** Paste notes or upload a PDF to generate flashcards using Groq AI.
- **Google Login:** Secure, one-click sign-in with Google.
- **Save & Load:** Store your flashcards in your account and retrieve them anytime.
- **Export:** Download flashcards as a JSON file.
- **Donations:** Support Aura’s development via IntaSend.
- **Modern UI:** Clean, responsive interface.

---

## How It Works

### 1. Sign In

- Visit [the app](http://aura-flashcardgenerator-3579.up.railway.app).
- Click the **Google Sign-In** button.
- After signing in, you’ll be redirected to the main dashboard.

### 2. Generate Flashcards

- **Paste Notes:** Enter your study notes in the text area.
- **Or Upload PDF:** Upload a PDF to extract text.
- Click **Generate Flashcards** to create cards from your content.

### 3. Save & Load

- Click **Save Flashcards** to store your cards (requires login).
- Use **Load Saved Flashcards** to retrieve your saved cards.

### 4. Export

- Click **Export** to download your flashcards as a JSON file.

### 5. Donations

- On the login page, you’ll find donation options.
- Donate securely via IntaSend to support Aura.

---

## For New Users

1. Go to [http://aura-flashcardgenerator-3579.up.railway.app](http://aura-flashcardgenerator-3579.up.railway.app)
2. Sign in with your Google account.
3. Paste notes or upload a PDF, then click **Generate Flashcards**.
4. Save, load, or export your flashcards as needed.

---

## Project Structure

- `app.py` - Flask backend
- `Aura.html`, `Aura.css`, `aura.js` - Main app frontend
- `index.html`, `loginpage.js`, `loginpage.css` - Login and donation page
- `requirements.txt` - Python dependencies
- `run_waitress.py`, `run_waitress_advanced.py` - Production server scripts

---

## Modifying the Project

1. **Clone the repository:**
    ```sh
    git clone <your-repo-url>
    cd Aura
    ```
2. **Install dependencies:**
    ```sh
    pip install --upgrade pip
    pip install -r requirements.txt
    ```
3. **Set up environment variables:**  
   Create a `.env` file with your Supabase, Groq, and Google OAuth credentials.
4. **Run the app locally:**
    ```sh
    python app.py
    ```
5. **Frontend:**  
   Edit `Aura.html`, `Aura.css`, or `aura.js` for UI changes.
6. **Backend:**  
   Edit `app.py` for API or logic changes.
7. **Pull Requests:**  
   Open a pull request describing your changes.

---

## Donations

Aura is free to use. If you find it helpful, please consider donating via IntaSend on the login page. Your support helps keep Aura running and improving!

---

## License

This project is for educational purposes.

---

**Enjoy using Aura! If you have suggestions or want to contribute, open
