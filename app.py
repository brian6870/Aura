import os
import json
import PyPDF2
import io
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import requests
from datetime import datetime
import jwt
from functools import wraps
from supabase import create_client, Client
from groq import Groq
from openai import OpenAI
import json

# Load environment variables FIRST
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-secret-key-for-development')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size

# Get environment variables with better error handling
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

# Debug print to check environment variables
print("Environment variables loaded:")
print(f"SUPABASE_URL: {'Set' if SUPABASE_URL else 'Not set'}")
print(f"SUPABASE_KEY: {'Set' if SUPABASE_KEY else 'Not set'}")
print(f"GOOGLE_CLIENT_ID: {GOOGLE_CLIENT_ID}")
print(f"GROQ_API_KEY: {'Set' if GROQ_API_KEY else 'Not set'}")

# Initialize Supabase client only if variables are available
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase client initialized successfully!")
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        supabase = None
else:
    print("Warning: Supabase environment variables not set. Database features will be disabled.")

# Initialize Groq client
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("Groq client initialized successfully!")
    except Exception as e:
        print(f"Error initializing Groq client: {e}")
        groq_client = None
else:
    print("Warning: GROQ_API_KEY not set. AI features will be disabled.")

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            if token.startswith('Bearer '):
                token = token[7:]
                
            decoded_token = jwt.decode(token, options={"verify_signature": False})
            
            if decoded_token.get('aud') != GOOGLE_CLIENT_ID:
                return jsonify({'error': 'Invalid token audience'}), 401
                
            request.user_email = decoded_token.get('email')
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': f'Token verification failed: {str(e)}'}), 401
            
        return f(*args, **kwargs)
    return decorated

# Extract text from PDF
def extract_text_from_pdf(pdf_file):
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file.read()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

# Create fallback flashcards
def create_fallback_flashcards(notes):
    sentences = [s.strip() for s in notes.split('.') if s.strip()]
    flashcards = []
    
    # Create 5 regular flashcards
    for i in range(min(5, len(sentences))):
        flashcards.append({
            'question': f'Question about: {sentences[i][:50]}...',
            'answer': f'Detailed information: {sentences[i]}',
            'isSummary': False
        })
    
    # Add summary flashcard
    summary_text = " ".join(sentences[:3]) if sentences else "No content available"
    flashcards.append({
        'question': 'Summary of Key Concepts',
        'answer': f'This topic covers: {summary_text[:200]}...',
        'isSummary': True
    })
    
    return flashcards

# Generate flashcards using Groq
def generate_flashcards_with_ai(notes):
    if not groq_client:
        print("Groq client not available - using fallback")
        return create_fallback_flashcards(notes)
    
    try:
        # Prepare the prompt for the model
        prompt = f"""Create 5-7 high-quality educational flashcards from the following text. 
Return ONLY a valid JSON array with no additional text.

Requirements:
- Create clear questions and detailed answers
- Include one summary flashcard with "isSummary": true
- Format: [{{"question": "...", "answer": "...", "isSummary": boolean}}]

Text: {notes[:2000]}

Return ONLY the JSON array:"""

        # Make API call to Groq
        completion = groq_client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False
        )

        # Get the response content
        generated_text = completion.choices[0].message.content
        
        # Clean and parse the response
        try:
            # Extract JSON from the response
            json_str = generated_text.strip()
            
            # Parse JSON
            flashcards = json.loads(json_str)
            
            # Validate structure
            valid_flashcards = []
            for card in flashcards:
                if isinstance(card, dict) and 'question' in card and 'answer' in card:
                    valid_flashcards.append({
                        'question': card['question'],
                        'answer': card['answer'],
                        'isSummary': card.get('isSummary', False)
                    })
            
            if valid_flashcards:
                print(f"Successfully generated {len(valid_flashcards)} flashcards using Groq")
                return valid_flashcards
            else:
                raise ValueError("No valid flashcards in response")
                
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing AI response: {e}")
            print(f"Raw response: {generated_text}")
            return create_fallback_flashcards(notes)
            
    except Exception as e:
        print(f"Groq API request failed: {e}")
        return create_fallback_flashcards(notes)

# Serve index.html as the root page
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Serve other HTML files
@app.route('/<path:path>')
def serve_static(path):
    if path.endswith('.html'):
        return send_from_directory('.', path)
    return send_from_directory('.', path)

# Routes
@app.route('/api')
def api_index():
    return jsonify({
        "message": "Aura Flashcard Generator API",
        "status": "running",
        "database": "connected" if supabase else "disabled",
        "ai_service": "available (Groq - Llama 3 70B)" if groq_client else "disabled"
    })

@app.route('/api/verify-token', methods=['POST'])
def verify_token():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    token = data.get('token')
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    try:
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        
        if decoded_token.get('aud') != GOOGLE_CLIENT_ID:
            return jsonify({'error': 'Invalid token audience'}), 401
            
        user_info = {
            'email': decoded_token.get('email'),
            'name': decoded_token.get('name'),
            'picture': decoded_token.get('picture')
        }
        
        return jsonify({'user': user_info})
        
    except Exception as e:
        return jsonify({'error': f'Token verification failed: {str(e)}'}), 401

@app.route('/api/extract-text', methods=['POST'])
@token_required
def extract_text():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400
    
    pdf_file = request.files['pdf']
    if pdf_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if pdf_file and pdf_file.filename.endswith('.pdf'):
        text = extract_text_from_pdf(pdf_file)
        if text:
            return jsonify({'text': text})
        else:
            return jsonify({'error': 'Failed to extract text from PDF'}), 500
    else:
        return jsonify({'error': 'Invalid file type. Please upload a PDF'}), 400

@app.route('/api/generate', methods=['POST'])
@token_required
def generate_flashcards():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    notes = data.get('notes', '')
    
    if not notes:
        return jsonify({'error': 'No notes provided'}), 400
    
    flashcards = generate_flashcards_with_ai(notes)
    return jsonify({'flashcards': flashcards})

@app.route('/api/save', methods=['POST'])
@token_required
def save_flashcards():
    if not supabase:
        return jsonify({'error': 'Database not configured. Please check your Supabase credentials.'}), 500
        
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    flashcards = data.get('flashcards', [])
    
    if not flashcards:
        return jsonify({'error': 'No flashcards to save'}), 400
    
    try:
        valid_flashcards = [card for card in flashcards if not card.get('isSummary', False)]
        
        flashcard_data = []
        for card in valid_flashcards:
            flashcard_data.append({
                'question': card['question'],
                'answer': card['answer'],
                'user_email': request.user_email,
                'is_summary': False
            })
        
        result = supabase.table('flashcards').insert(flashcard_data).execute()
        
        return jsonify({'message': f'Successfully saved {len(valid_flashcards)} flashcards'})
        
    except Exception as e:
        print(f"Error saving flashcards: {e}")
        return jsonify({'error': 'Failed to save flashcards'}), 500

@app.route('/api/flashcards', methods=['GET'])
@token_required
def get_flashcards():
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500
        
    try:
        result = supabase.table('flashcards') \
            .select('id, question, answer') \
            .eq('user_email', request.user_email) \
            .order('created_at', desc=True) \
            .execute()
        
        return jsonify({'flashcards': result.data})
        
    except Exception as e:
        print(f"Error retrieving flashcards: {e}")
        return jsonify({'error': 'Failed to retrieve flashcards'}), 500

@app.route('/api/export', methods=['GET'])
@token_required
def export_flashcards():
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500
        
    try:
        result = supabase.table('flashcards') \
            .select('question, answer') \
            .eq('user_email', request.user_email) \
            .order('created_at', desc=True) \
            .execute()
        
        json_data = json.dumps(result.data, indent=2)
        
        return send_file(
            io.BytesIO(json_data.encode('utf-8')),
            mimetype='application/json',
            as_attachment=True,
            download_name=f'aura-flashcards-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'
        )
        
    except Exception as e:
        print(f"Error exporting flashcards: {e}")
        return jsonify({'error': 'Failed to export flashcards'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.now().isoformat(),
        'database': 'connected' if supabase else 'disconnected',
        'ai_service': 'available (Groq - Llama 3 70B)' if groq_client else 'disabled'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
