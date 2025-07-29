# OpenHIE Education Game - Setup Instructions

## Overview
This interactive educational game teaches users about OpenHIE (Open Health Information Exchange) components through drag-and-drop gameplay. It includes Microsoft 365 authentication and comprehensive analytics tracking.

## Features
- **Microsoft 365 Authentication**: Secure login with Azure AD
- **Two-Level Gameplay**: Progressive learning from basic components to real-world use cases
- **Anonymous Analytics**: Track user performance without exposing personal information
- **Admin Dashboard**: Comprehensive analytics with charts, leaderboards, and export functionality
- **Responsive Design**: Works on desktop and mobile devices

## Files Structure
```
/openhie-education-game/
├── index.html              # Main game interface
├── admin.html              # Analytics dashboard
├── styles.css              # Main game styling
├── admin-styles.css        # Admin dashboard styling
├── script.js               # Game logic and functionality
├── auth.js                 # Microsoft 365 authentication
├── api.js                  # Data storage and analytics API
├── admin.js                # Admin dashboard functionality
└── README_SETUP.md         # This setup guide
```

## Setup Instructions

### 1. Azure AD App Registration
Before the game can authenticate users, you need to register an application in Azure Active Directory:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Configure:
   - **Name**: OpenHIE Education Game
   - **Supported account types**: Accounts in any organizational directory
   - **Redirect URI**: Web - `http://localhost:8000` (or your domain)
5. After registration, note the **Application (client) ID**
6. Go to "Authentication" and enable "Access tokens" and "ID tokens"

### 2. Update Configuration
Edit `auth.js` and replace `YOUR_CLIENT_ID` with your actual Azure AD application client ID:

```javascript
this.msalConfig = {
    auth: {
        clientId: "your-actual-client-id-here", // Replace this
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin
    },
    // ... rest of config
};
```

### 3. Deployment Options

#### Option A: Local Development
1. Open terminal in the project directory
2. Start a local web server:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```
3. Open `http://localhost:8000` in your browser
4. Access admin dashboard at `http://localhost:8000/admin.html`

#### Option B: Web Server Deployment
1. Upload all files to your web server
2. Ensure HTTPS is enabled (required for Microsoft 365 authentication)
3. Update the redirect URI in Azure AD to match your domain
4. Access the game at your domain URL

### 4. Data Storage Configuration

#### Current Setup (LocalStorage)
By default, the game uses browser localStorage for demonstration purposes. This means:
- Data is stored locally in each user's browser
- Admin dashboard shows data from the current browser only
- Data is not shared across users or devices

#### Production Setup (Optional)
For production use with shared analytics, you'll need to:

1. **Set up a backend API** (Node.js, PHP, Python, etc.) that provides:
   - `POST /api/results` - Save game results
   - `GET /api/analytics` - Retrieve analytics data

2. **Update api.js configuration**:
   ```javascript
   constructor() {
       this.baseUrl = 'https://your-api-domain.com';
       this.useLocalStorage = false; // Change to false
       // ... rest of constructor
   }
   ```

3. **Database Schema Example**:
   ```sql
   CREATE TABLE game_results (
       id VARCHAR(50) PRIMARY KEY,
       user_id VARCHAR(100) NOT NULL,
       total_score INT NOT NULL,
       level1_score INT,
       level2_score INT,
       level1_percentage INT,
       level2_percentage INT,
       completion_time INT,
       game_completed BOOLEAN,
       level1_answers JSON,
       level2_answers JSON,
       timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

## Game Mechanics

### Level 1: Service Layer Matching
Users drag OpenHIE services to their correct architectural layers:
- **Business Domain Services**: Shared Health Record
- **Registry Services**: Facility Registry, Client Registry, Product Catalogue
- **Interoperability Service Layer**: Terminology Service
- **Point of Service**: EMR, DHIS2, Lab System

### Level 2: Use Case Mapping
Users match real-world scenarios to appropriate OpenHIE services:
1. Patient clinical history tracking → Shared Health Record
2. Unique patient tracking across facilities → Client Registry
3. Facility viral load reporting identification → Facility Registry
4. HIV test terminology mapping → Terminology Service

### Scoring System
- Level 1: 10 points per correct answer (max 80 points)
- Level 2: 15 points per correct answer (max 60 points)
- Total possible score: 140 points
- Minimum 70% required to advance between levels

## Admin Dashboard Features

### Analytics Available
- **Summary Cards**: Total players, completed games, averages, highest scores
- **Visual Charts**: Performance distribution, score distribution
- **Detailed Leaderboard**: Ranked by total score with completion details
- **Performance Metrics**: Level-specific pass rates and averages
- **Data Export**: CSV download of all results

### Dashboard Access
- Navigate to `/admin.html` (no authentication required as requested)
- Auto-refreshes every 30 seconds
- Manual refresh and export buttons available

## Security & Privacy

### User Privacy
- User emails are hashed for anonymous tracking
- Display names show as "User 1", "User 2", etc.
- No personal information is stored or displayed
- Each user gets a unique anonymous identifier

### Authentication Security
- Uses Microsoft's official MSAL library
- Secure token handling and storage
- Automatic token refresh
- Follows OAuth 2.0 + OpenID Connect standards

## Troubleshooting

### Authentication Issues
1. **"Login failed"**: Check client ID configuration
2. **"Redirect mismatch"**: Ensure redirect URI matches Azure AD settings
3. **"Not authorized"**: Verify Azure AD app permissions

### Game Issues
1. **Drag and drop not working**: Ensure modern browser support
2. **Data not saving**: Check browser console for errors
3. **Charts not loading**: Verify Chart.js CDN connection

### Admin Dashboard Issues
1. **No data showing**: Check if any games have been completed
2. **Charts not rendering**: Ensure Chart.js library is loaded
3. **Export not working**: Check browser popup blocker settings

## Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Support
For technical support or questions about the OpenHIE Education Game, please refer to the game's documentation or contact the Digital Health and Data Analytics Directorate at EGPAF.