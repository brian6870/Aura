// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize IntaSend
    const intaSend = new window.IntaSend({
        publicAPIKey: "ISPubKey_test_91ffc81a-8ac4-419e-8008-7091caa8d73f",
        live: false // Set to true when going live
    });
    
    // DOM Elements
    const donateButton = document.getElementById('donateButton');
    const loadingElement = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const paymentSuccess = document.getElementById('paymentSuccess');
    const closeSuccess = document.getElementById('closeSuccess');
    const amountOptions = document.querySelectorAll('.amount-option');
    const googleLoginContainer = document.getElementById('googleLoginContainer');
    
    // State variables
    let selectedAmount = 10; // Default amount
    let isLoggedIn = false; // Track login state
    
    // Get current domain for redirects
    const currentDomain = window.location.origin;
    
    // Handle Google Sign-In
    window.handleGoogleSignIn = function(response) {
        showLoading('Logging you in...');
        
        const credential = response.credential;
        
        // Store the token in localStorage
        localStorage.setItem('googleToken', credential);
        
        // Redirect to Aura.html after successful login
        setTimeout(() => {
            hideLoading();
            window.location.href = `${currentDomain}/Aura.html`;
        }, 1500);
    };
    
    // Handle Google Sign-In errors
    window.handleGoogleSignInError = function(error) {
        hideLoading();
        showError('Google login failed. Please try again.');
        console.error('Google Sign-In error:', error);
    };
    
    // Configure Google Sign-In
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "443413171725-tn4qbjbdojgpsu74u24aab62cark5pb2.apps.googleusercontent.com",
            callback: window.handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        
        // Render the Google Sign-In button
        if (googleLoginContainer) {
            google.accounts.id.renderButton(
                googleLoginContainer,
                { 
                    theme: "filled_blue", 
                    size: "large", 
                    width: "100%",
                    text: "signin_with",
                    shape: "rectangular",
                    logo_alignment: "left"
                }
            );
        }
    }
    
    // Amount selection
    if (amountOptions.length > 0) {
        amountOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                amountOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update selected amount
                selectedAmount = parseInt(option.getAttribute('data-amount'));
                
                // Update the IntaSend button amount
                if (donateButton) {
                    donateButton.setAttribute('data-amount', selectedAmount);
                }
            });
        });
    }
    
    // Donation button click handler
    if (donateButton) {
        donateButton.addEventListener('click', () => {
            showLoading('Processing your donation...');
            
            // Process payment with IntaSend (anonymous donation)
            intaSend.pay({
                amount: selectedAmount,
                currency: "USD",
                customer: {
                    email: "anonymous@donor.com", // Anonymous donation
                    first_name: "Anonymous",
                    last_name: "Donor"
                }
            });
        });
    }
    
    // Close success modal
    if (closeSuccess) {
        closeSuccess.addEventListener('click', () => {
            hideModal(paymentSuccess);
            
            // If user is logged in, redirect to Aura page
            if (isLoggedIn) {
                window.location.href = `${currentDomain}/Aura.html`;
            }
        });
    }
    
    // IntaSend event listeners
    intaSend
        .on("COMPLETE", (results) => {
            console.log("Payment completed successfully", results);
            hideLoading();
            showModal(paymentSuccess);
            
            // Record donation (you would send this to your backend)
            recordDonation(results, selectedAmount);
        })
        .on("FAILED", (results) => {
            console.log("Payment failed", results);
            hideLoading();
            showError('Payment failed. Please try again.');
        })
        .on("IN-PROGRESS", (results) => {
            console.log("Payment in progress", results);
            if (loadingText) {
                loadingText.textContent = "Payment processing...";
            }
        });
    
    // Record donation function
    function recordDonation(paymentResults, amount) {
        // This is where you would send donation data to your backend
        console.log(`Recording anonymous donation of $${amount}`, paymentResults);
        
        // Example: Send to backend API
        /*
        fetch('/api/donations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                paymentDetails: paymentResults,
                anonymous: true
            })
        })
        .then(response => response.json())
        .then(data => console.log('Donation recorded:', data))
        .catch(error => console.error('Error recording donation:', error));
        */
    }
    
    // Utility functions
    function showLoading(message = 'Processing...') {
        if (loadingText) {
            loadingText.textContent = message;
        }
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
        }
    }
    
    function hideLoading() {
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    }
    
    function showError(message) {
        if (errorText) {
            errorText.textContent = message;
        }
        if (errorMessage) {
            errorMessage.classList.remove('hidden');
        }
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            if (errorMessage) {
                errorMessage.classList.add('hidden');
            }
        }, 5000);
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg max-w-md z-50 ${
            type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 
            type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
            'bg-blue-100 border border-blue-400 text-blue-700'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    ${type === 'success' ? 
                        '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>' :
                    type === 'error' ?
                        '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>' :
                        '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>'
                    }
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    function showModal(modal) {
        if (!modal) return;
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
    
    function hideModal(modal) {
        if (!modal) return;
        
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
});