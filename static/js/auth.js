/**
 * Authentication Functions
 */

// Check if user is already authenticated and redirect if needed
document.addEventListener('DOMContentLoaded', () => {
    redirectIfAuthenticated();

    // Get forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Add event listeners to forms if they exist
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Disable form
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    try {
        const response = await apiRequest(API.login, 'POST', { email, password });

        if (response.ok) {
            // Save token and user name
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('userName', response.data.user_name);

            // Redirect handled by backend
        } else {
            showNotification(response.data.msg || 'Login failed. Please check your credentials.', true);
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again later.', true);
    } finally {
        // Re-enable form
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
}

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (password.length < 8) {
        showNotification('Password must be at least 8 characters long', true);
        return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';

    try {
        const response = await apiRequest(API.register, 'POST', { name, email, password });

        if (response.ok) {
            showNotification(response.data.message, false);

            // ✅ Redirect only if backend provides a URL
            if (response.data.redirect_url) {
                setTimeout(() => {
                    window.location.href = response.data.redirect_url;
                }, 1500);  // Delay to show success message
            }
        } else {
            showNotification(response.data.error || 'Registration failed. Please try again.', true);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again later.', true);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
    }
}

