# Google OAuth Integration Guide

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure consent screen
6. Create OAuth 2.0 Client ID for Web application
7. Add authorized redirect URIs:
   - `http://localhost:5176`
   - `http://localhost:3001/api/auth/google/callback`

### 2. Install Dependencies

```bash
npm install google-auth-library
```

### 3. Backend Setup

Update `server.js`:

```javascript
const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const client = new OAuth2Client(CLIENT_ID);

// Google login endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    // Check if user exists
    let user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [payload.email]
    );

    if (user.rows.length === 0) {
      // Create new user
      const result = await pool.query(
        `INSERT INTO users (email, full_name, avatar_url, auth_provider)
         VALUES ($1, $2, $3, 'google') RETURNING *`,
        [payload.email, payload.name, payload.picture]
      );
      user = result;
    }

    const token = generateToken(user.rows[0]);
    res.json({ user: user.rows[0], token });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
```

### 4. Frontend Setup

Update `src/pages/LoginWithGoogle.tsx`:

```typescript
const handleGoogleLogin = async () => {
  try {
    // Load Google API
    window.gapi.load('auth2', () => {
      window.gapi.auth2.init({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
      }).then(() => {
        const authInstance = window.gapi.auth2.getAuthInstance();
        authInstance.signIn().then((googleUser) => {
          const idToken = googleUser.getAuthResponse().id_token;
          
          // Send to backend
          fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: idToken }),
          })
          .then(res => res.json())
          .then(data => {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            onSuccess(data.user);
          });
        });
      });
    });
  } catch (error) {
    console.error('Google login error:', error);
    alert('Đăng nhập thất bại');
  }
};
```

### 5. Add Google API Script

Add to `index.html`:

```html
<script src="https://apis.google.com/js/platform.js" async defer></script>
<meta name="google-signin-client_id" content="YOUR_GOOGLE_CLIENT_ID">
```

## Environment Variables

Create `.env` file:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

## Testing

1. Start backend: `node server.js`
2. Start frontend: `npm run dev`
3. Navigate to login page
4. Click "Login with Google"
5. Authorize the application
6. Redirect to dashboard

## Security Notes

- Never expose CLIENT_SECRET on frontend
- Always verify tokens on backend
- Store OAuth tokens securely
- Implement token refresh
- Use HTTPS in production

## Current Status

✅ UI for Google login created
⏳ Backend OAuth integration pending
⏳ Google API client setup pending
⏳ Token generation pending
