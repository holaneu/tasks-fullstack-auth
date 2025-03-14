/**
 * Common Utility Functions
 */

// Show notification
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    if (!notification || !notificationMessage) return;

    notificationMessage.textContent = message;

    // Reset classes
    notification.classList.remove('hidden', 'error', 'show');

    // Add error class if needed
    if (isError) {
        notification.classList.add('error');
    }

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');

        // Hide after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 300);
        }, 3000);
    }, 10);
}

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login?auth=required';  // ✅ Correct Flask login route
        return false;
    }
    return true;
}

// Redirect if already authenticated
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = '/dashboard';  // ✅ Correct Flask dashboard route
        return true;
    }
    return false;
}

// Check URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const authRequired = params.get('auth') === 'required';
    const sessionExpired = params.get('session') === 'expired';
    const registrationSuccess = params.get('registered') === 'success';

    if (authRequired) {
        showNotification('Please login to access this page', true);
    }

    if (sessionExpired) {
        showNotification('Your session has expired. Please login again', true);
    }

    if (registrationSuccess) {
        showNotification('Registration successful! Please login');
    }
}

// Initialize page
function initPage() {
    // Check URL parameters for notifications
    getUrlParams();
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage);
