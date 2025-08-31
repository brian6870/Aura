// aura-app.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // API base URL - change this to your Flask server address
    const API_BASE_URL = 'http://localhost:5000';

    // DOM elements
    const notesInput = document.getElementById('notes-input');
    const generateBtn = document.getElementById('generate-btn');
    const saveBtn = document.getElementById('save-btn');
    const clearBtn = document.getElementById('clear-btn');
    const clearCardsBtn = document.getElementById('clear-cards-btn');
    const loadBtn = document.getElementById('load-btn');
    const exportBtn = document.getElementById('export-btn');
    const flashcardsContainer = document.getElementById('flashcards-container');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const savedFlashcardsContainer = document.getElementById('saved-flashcards');
    const emptyState = document.getElementById('empty-state');
    const pdfUpload = document.getElementById('pdf-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadSection = document.getElementById('upload-section');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const deleteFileBtn = document.getElementById('delete-file-btn');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const flashcardCount = document.getElementById('flashcard-count');
    const userAvatar = document.getElementById('user-avatar');
    const userDropdown = document.getElementById('user-dropdown');
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Current flashcards in memory
    let currentFlashcards = [];
    let currentPdfFile = null;
    let currentUser = null;
    
    // Function to get Google token from localStorage
    function getGoogleToken() {
        return localStorage.getItem('googleToken');
    }

    // Function to set Google token in localStorage
    function setGoogleToken(token) {
        localStorage.setItem('googleToken', token);
    }

    // Function to remove Google token from localStorage
    function removeGoogleToken() {
        localStorage.removeItem('googleToken');
    }

    // Function to verify Google token with backend
    async function verifyGoogleToken(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token })
            });
            
            if (!response.ok) {
                throw new Error('Token verification failed');
            }
            
            const data = await response.json();
            return data.user;
        } catch (error) {
            console.error('Token verification error:', error);
            removeGoogleToken();
            return null;
        }
    }

    // Modified checkAuthStatus function
    async function checkAuthStatus() {
        const token = getGoogleToken();
        if (token) {
            const user = await verifyGoogleToken(token);
            if (user) {
                currentUser = user.email;
                userInfo.innerHTML = `<i class="fas fa-user-circle"></i><span>${user.email}</span>`;
                loginBtn.style.display = 'none';
                logoutBtn.style.display = 'flex';
                showNotification(`Welcome back, ${user.email}!`, 'success');
            } else {
                currentUser = null;
                userInfo.innerHTML = `<i class="fas fa-user-circle"></i><span>Not logged in</span>`;
                loginBtn.style.display = 'flex';
                logoutBtn.style.display = 'none';
            }
        } else {
            currentUser = null;
            userInfo.innerHTML = `<i class="fas fa-user-circle"></i><span>Not logged in</span>`;
            loginBtn.style.display = 'flex';
            logoutBtn.style.display = 'none';
        }
    }
    
    // Initialize Google Sign-In
    function initializeGoogleSignIn() {
        google.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google Client ID
            callback: handleGoogleSignIn
        });
    }
    
    // Handle Google Sign-In
    function handleGoogleSignIn(response) {
        const token = response.credential;
        setGoogleToken(token);
        checkAuthStatus();
    }
    
    // Show notification function
    function showNotification(message, type = 'info') {
        notification.className = 'notification ' + type;
        notificationText.textContent = message;
        
        // Set appropriate icon
        const icon = notification.querySelector('i');
        if (type === 'success') {
            icon.className = 'fas fa-check-circle';
        } else if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle';
        } else {
            icon.className = 'fas fa-info-circle';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Update flashcard count
    function updateFlashcardCount() {
        flashcardCount.textContent = `${currentFlashcards.length} flashcards`;
    }
    
    // Flip flashcard function
    function flipFlashcard(element) {
        element.classList.toggle('flipped');
    }
    
    // Render flashcards to the container
    function renderFlashcards(flashcards) {
        // Hide empty state if we have flashcards
        if (flashcards.length > 0) {
            emptyState.style.display = 'none';
        } else {
            emptyState.style.display = 'block';
            updateFlashcardCount();
            return;
        }
        
        flashcardsContainer.innerHTML = '';
        
        flashcards.forEach((card, index) => {
            const flashcardElement = document.createElement('div');
            flashcardElement.className = `flashcard ${card.isSummary ? 'summary-card' : ''} card-transition`;
            flashcardElement.style.animationDelay = `${index * 0.1}s`;
            flashcardElement.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <div class="card-counter">${index + 1}</div>
                        <p>${card.question}</p>
                    </div>
                    <div class="flashcard-back">
                        <div class="card-counter">${index + 1}</div>
                        <p>${card.answer}</p>
                    </div>
                </div>
            `;
            flashcardElement.addEventListener('click', () => flipFlashcard(flashcardElement));
            flashcardsContainer.appendChild(flashcardElement);
        });
        
        updateFlashcardCount();
    }
    
    // Clear input text
    clearBtn.addEventListener('click', function() {
        notesInput.value = '';
        showNotification('Input cleared.', 'info');
    });
    
    // Delete uploaded PDF file
    deleteFileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        currentPdfFile = null;
        pdfUpload.value = '';
        fileInfo.classList.remove('show');
        fileName.textContent = 'No file selected';
        fileSize.textContent = '';
        showNotification('PDF file removed.', 'info');
    });
    
    // Update progress bar
    function updateProgress(value) {
        progress.style.width = `${value}%`;
    }
    
    // Generate flashcards from input using Flask API
    async function generateFlashcards() {
        let notes = notesInput.value.trim();
        
        // If we have a PDF file but no text input, extract from PDF
        if (currentPdfFile && !notes) {
            try {
                const formData = new FormData();
                formData.append('pdf', currentPdfFile);
                
                generateBtn.innerHTML = '<div class="loader"></div> Extracting text...';
                generateBtn.disabled = true;
                progressBar.style.display = 'block';
                updateProgress(30);
                
                const token = getGoogleToken();
                const response = await fetch(`${API_BASE_URL}/extract-text`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                notes = data.text;
                notesInput.value = notes;
                updateProgress(60);
                showNotification('Text extracted from PDF successfully!', 'success');
            } catch (error) {
                console.error('Error:', error);
                showNotification('Failed to extract text from PDF.', 'error');
                generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Flashcards';
                generateBtn.disabled = false;
                progressBar.style.display = 'none';
                return;
            }
        }
        
        if (!notes) {
            showNotification('Please enter some study notes or upload a PDF first!', 'error');
            return;
        }
        
        // Show loading state
        generateBtn.innerHTML = '<div class="loader"></div> Generating...';
        generateBtn.disabled = true;
        updateProgress(80);
        
        try {
            const token = getGoogleToken();
            // Call Flask backend to generate flashcards
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ notes: notes })
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            currentFlashcards = data.flashcards;
            renderFlashcards(currentFlashcards);
            updateProgress(100);
            
            setTimeout(() => {
                progressBar.style.display = 'none';
                showNotification(`Generated ${currentFlashcards.length} flashcards successfully!`, 'success');
            }, 500);
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to generate flashcards. Please try again.', 'error');
            progressBar.style.display = 'none';
        } finally {
            // Reset button state
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Flashcards';
            generateBtn.disabled = false;
        }
    }
    
    // Save flashcards to backend using Flask API
    async function saveFlashcards() {
        if (currentFlashcards.length === 0) {
            showNotification('No flashcards to save!', 'error');
            return;
        }
        
        if (!currentUser) {
            showNotification('Please log in to save flashcards.', 'error');
            return;
        }
        
        // Show loading state
        saveBtn.innerHTML = '<div class="loader"></div> Saving...';
        saveBtn.disabled = true;
        
        try {
            const token = getGoogleToken();
            // Call Flask backend to save flashcards
            const response = await fetch(`${API_BASE_URL}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    flashcards: currentFlashcards
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            showNotification(`Saved ${currentFlashcards.length} flashcards successfully!`, 'success');
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to save flashcards.', 'error');
        } finally {
            // Reset button state
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Flashcards';
            saveBtn.disabled = false;
        }
    }
    
    // Load saved flashcards from backend using Flask API
    async function loadFlashcards() {
        if (!currentUser) {
            showNotification('Please log in to load your flashcards.', 'error');
            return;
        }
        
        // Show loading state
        loadBtn.innerHTML = '<div class="loader"></div> Loading...';
        loadBtn.disabled = true;
        savedFlashcardsContainer.innerHTML = '<p>Loading...</p>';
        
        try {
            const token = getGoogleToken();
            // Call Flask backend to get saved flashcards
            const response = await fetch(`${API_BASE_URL}/flashcards`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (data.flashcards && data.flashcards.length > 0) {
                savedFlashcardsContainer.innerHTML = '';
                data.flashcards.forEach(flashcard => {
                    const item = document.createElement('div');
                    item.className = 'saved-item';
                    item.innerHTML = `
                        <span>${flashcard.question.substring(0, 50)}${flashcard.question.length > 50 ? '...' : ''}</span>
                        <button class="load-item-btn" data-id="${flashcard.id}">Load</button>
                    `;
                    item.querySelector('.load-item-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        currentFlashcards = [{ question: flashcard.question, answer: flashcard.answer }];
                        renderFlashcards(currentFlashcards);
                        showNotification('Flashcard loaded!', 'success');
                    });
                    savedFlashcardsContainer.appendChild(item);
                });
            } else {
                savedFlashcardsContainer.innerHTML = '<p>No saved flashcards found.</p>';
            }
            
            showNotification('Flashcards loaded successfully!', 'success');
        } catch (error) {
            console.error('Error:', error);
            savedFlashcardsContainer.innerHTML = '<p>Error loading flashcards.</p>';
            showNotification('Failed to load flashcards.', 'error');
        } finally {
            // Reset button state
            loadBtn.innerHTML = '<i class="fas fa-download"></i> Load Saved Flashcards';
            loadBtn.disabled = false;
        }
    }
    
    // Export flashcards
    function exportFlashcards() {
        if (currentFlashcards.length === 0) {
            showNotification('No flashcards to export!', 'error');
            return;
        }
        
        const exportData = JSON.stringify(currentFlashcards, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aura-flashcards.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Flashcards exported successfully!', 'success');
    }
    
    
                // Clear all flashcards 
    function clearAllFlashcards() {
        if (currentFlashcards.length === 0) {
            showNotification('No flashcards to clear!', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to clear all flashcards?')) {
            currentFlashcards = [];
            // Clear the flashcards container and show empty state
            flashcardsContainer.innerHTML = '';
            emptyState.style.display = 'block';
            updateFlashcardCount();
            showNotification('All flashcards cleared.', 'info');
        }
    } 
    
    // Handle PDF upload
    function handlePdfUpload(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // Check if file is PDF
            if (file.type !== 'application/pdf') {
                showNotification('Please upload a PDF file.', 'error');
                return;
            }
            
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showNotification('File size must be less than 10MB.', 'error');
                return;
            }
            
            currentPdfFile = file;
            
            // Display file info
            fileName.textContent = file.name;
            fileSize.textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
            fileInfo.classList.add('show');
            
            showNotification(`PDF file "${file.name}" selected. Click "Generate Flashcards" to extract content.`, 'success');
        }
    }
    
    // Handle drag over for PDF upload
    function handleDragOver(e) {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    }
    
    // Handle drag leave for PDF upload
    function handleDragLeave() {
        uploadSection.classList.remove('dragover');
    }
    
    // Handle drop for PDF upload
    function handleDrop(e) {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            
            // Check if file is PDF
            if (file.type !== 'application/pdf') {
                showNotification('Please upload a PDF file.', 'error');
                return;
            }
            
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showNotification('File size must be less than 10MB.', 'error');
                return;
            }
            
            currentPdfFile = file;
            
            // Display file info
            fileName.textContent = file.name;
            fileSize.textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
            fileInfo.classList.add('show');
            
            showNotification(`PDF file "${file.name}" selected. Click "Generate Flashcards" to extract content.`, 'success');
        }
    }
    
    // Login function
    function login() {
        google.accounts.id.prompt();
    }
    
    
            // Modified logout function
    function logout() {
        removeGoogleToken();
        currentUser = null;
        checkAuthStatus();
        showNotification('You have been logged out.', 'info');
        
        // Redirect to index.html after a short delay
        setTimeout(() => {
            window.location.href = 'http://127.0.0.1:5501/index%20.html';
        }, 1000);
    }
    
    // Set up event listeners
    function setupEventListeners() {
        if (generateBtn) generateBtn.addEventListener('click', generateFlashcards);
        if (saveBtn) saveBtn.addEventListener('click', saveFlashcards);
        if (clearBtn) clearBtn.addEventListener('click', function() {
            notesInput.value = '';
            showNotification('Input cleared.', 'info');
        });
        if (clearCardsBtn) clearCardsBtn.addEventListener('click', clearAllFlashcards);
        if (loadBtn) loadBtn.addEventListener('click', loadFlashcards);
        if (exportBtn) exportBtn.addEventListener('click', exportFlashcards);
        if (uploadBtn) uploadBtn.addEventListener('click', function() {
            pdfUpload.click();
        });
        if (pdfUpload) pdfUpload.addEventListener('change', handlePdfUpload);
        if (deleteFileBtn) deleteFileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            currentPdfFile = null;
            pdfUpload.value = '';
            fileInfo.classList.remove('show');
            fileName.textContent = 'No file selected';
            fileSize.textContent = '';
            showNotification('PDF file removed.', 'info');
        });
        if (uploadSection) {
            uploadSection.addEventListener('dragover', handleDragOver);
            uploadSection.addEventListener('dragleave', handleDragLeave);
            uploadSection.addEventListener('drop', handleDrop);
        }
        if (userAvatar) {
            userAvatar.addEventListener('click', function() {
                userDropdown.classList.toggle('show');
            });
        }
        if (loginBtn) {
            loginBtn.addEventListener('click', login);
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
    
    // Initialize the application
    function init() {
        setupEventListeners();
        renderFlashcards(currentFlashcards);
        checkAuthStatus();
        initializeGoogleSignIn();
    }
    
    // Start the application
    init();
});