/**
 * API Configuration and Helper Functions
 */

// API Base URL - Change this to your backend URL if needed
const API_BASE_URL = '/api'; // Use relative path if on same domain

// API Endpoints
const API = {
    login: `${API_BASE_URL}/login`,
    register: `${API_BASE_URL}/register`,
    profile: `${API_BASE_URL}/profile`,
    tasks: `${API_BASE_URL}/tasks`
};

// Helper function for API requests
async function apiRequest(url, method = 'GET', data = null) {
    // Get authentication token if available
    const token = localStorage.getItem('token');

    // Request options
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Add authorization header if token exists
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add body if data exists
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        // Handle unauthorized (token expired or invalid)
        if (response.status === 401 && token) {
            // Clear local storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            window.location.href = '/login?session=expired';
            return null;
        }

        // Parse JSON response
        const responseData = await response.json();

        // If backend sends a redirect URL, navigate there
        if (response.ok && responseData.redirect_url) {
            window.location.href = responseData.redirect_url;
        }

        return {
            ok: response.ok,
            status: response.status,
            data: responseData
        };
    } catch (error) {
        console.error('API request error:', error);
        return {
            ok: false,
            status: 500,
            data: { msg: 'Network or server error' }
        };
    }
}
