class Auth {
    constructor() {
        this.msalConfig = {
            auth: {
                clientId: "YOUR_CLIENT_ID", // Replace with your Azure AD app client ID
                authority: "https://login.microsoftonline.com/common",
                redirectUri: window.location.origin
            },
            cache: {
                cacheLocation: "localStorage",
                storeAuthStateInCookie: false
            }
        };

        this.loginRequest = {
            scopes: ["User.Read"]
        };

        this.msalInstance = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.userId = null;
        
        this.initMSAL();
    }

    async initMSAL() {
        try {
            // Initialize MSAL
            this.msalInstance = new msal.PublicClientApplication(this.msalConfig);
            await this.msalInstance.initialize();
            
            // Handle redirect response
            const response = await this.msalInstance.handleRedirectPromise();
            if (response) {
                this.handleLoginSuccess(response);
            } else {
                // Check if user is already logged in
                const accounts = this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    this.msalInstance.setActiveAccount(accounts[0]);
                    this.currentUser = accounts[0];
                    this.isAuthenticated = true;
                    this.generateUserId();
                    this.showGameInterface();
                } else {
                    this.showLoginInterface();
                }
            }
        } catch (error) {
            console.error('MSAL initialization error:', error);
            this.showLoginInterface();
        }
    }

    async login() {
        try {
            await this.msalInstance.loginRedirect(this.loginRequest);
        } catch (error) {
            console.error('Login error:', error);
        }
    }

    async logout() {
        try {
            await this.msalInstance.logoutRedirect();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    handleLoginSuccess(response) {
        this.msalInstance.setActiveAccount(response.account);
        this.currentUser = response.account;
        this.isAuthenticated = true;
        this.generateUserId();
        this.showGameInterface();
    }

    generateUserId() {
        // Generate anonymous user ID based on email hash for analytics
        if (this.currentUser && this.currentUser.username) {
            // Create a hash of the email for anonymization
            const hash = this.hashString(this.currentUser.username);
            this.userId = 'user_' + hash;
        }
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    showLoginInterface() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('game-container').style.display = 'none';
    }

    showGameInterface() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        // Initialize game after successful login
        if (window.gameInstance) {
            window.gameInstance.setUserId(this.userId);
        }
    }

    getUserId() {
        return this.userId;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authInstance = new Auth();
});