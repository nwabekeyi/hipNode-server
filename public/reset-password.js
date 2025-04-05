// Extract the token from the URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Handle form submission
document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const password = document.getElementById('password').value;
  const messageDiv = document.getElementById('message');

  if (!token) {
    messageDiv.textContent = 'Token is missing in the URL.';
    messageDiv.className = 'error';
    return;
  }

  try {
    const response = await fetch(`https://hipnode-server.onrender.com/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    // Display success message
    messageDiv.textContent = data.message;
    messageDiv.className = 'message';

    // Redirect to login page after 2 seconds
    setTimeout(() => {
      window.location.href = 'http://localhost:5173/login';
    }, 5000);

  } catch (error) {
    // Display error message
    messageDiv.textContent = error.message || 'An error occurred. Please try again.';
    messageDiv.className = 'error';
  }
});