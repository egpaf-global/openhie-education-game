class GameAPI {
    constructor() {
        this.baseUrl = window.location.origin;
        this.resultsEndpoint = '/api/results';
        this.analyticsEndpoint = '/api/analytics';
        
        // For development/demo purposes, we'll use localStorage
        // In production, replace with actual API calls
        this.useLocalStorage = true;
    }

    async saveGameResult(result) {
        if (this.useLocalStorage) {
            return this.saveToLocalStorage(result);
        } else {
            return this.saveToAPI(result);
        }
    }

    async getAnalytics() {
        if (this.useLocalStorage) {
            return this.getFromLocalStorage();
        } else {
            return this.getFromAPI();
        }
    }

    saveToLocalStorage(result) {
        try {
            const existingResults = JSON.parse(localStorage.getItem('gameResults') || '[]');
            
            // Add timestamp and unique ID
            const resultWithMetadata = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                ...result
            };
            
            existingResults.push(resultWithMetadata);
            localStorage.setItem('gameResults', JSON.stringify(existingResults));
            
            return Promise.resolve({ success: true, id: resultWithMetadata.id });
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return Promise.reject(error);
        }
    }

    getFromLocalStorage() {
        try {
            const results = JSON.parse(localStorage.getItem('gameResults') || '[]');
            
            // Process results for analytics
            const analytics = this.processResults(results);
            
            return Promise.resolve(analytics);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return Promise.reject(error);
        }
    }

    async saveToAPI(result) {
        try {
            const response = await fetch(`${this.baseUrl}${this.resultsEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(result)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving to API:', error);
            throw error;
        }
    }

    async getFromAPI() {
        try {
            const response = await fetch(`${this.baseUrl}${this.analyticsEndpoint}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching from API:', error);
            throw error;
        }
    }

    processResults(results) {
        // Sort by total score descending
        const sortedResults = results.sort((a, b) => b.totalScore - a.totalScore);
        
        // Group and anonymize
        const processedResults = sortedResults.map((result, index) => ({
            rank: index + 1,
            userId: result.userId,
            displayName: `User ${index + 1}`,
            totalScore: result.totalScore,
            level1Score: result.level1Score,
            level2Score: result.level2Score,
            level1Percentage: result.level1Percentage,
            level2Percentage: result.level2Percentage,
            completionTime: result.completionTime,
            timestamp: result.timestamp,
            gameCompleted: result.gameCompleted
        }));

        // Calculate summary statistics
        const summary = {
            totalPlayers: results.length,
            completedGames: results.filter(r => r.gameCompleted).length,
            averageScore: results.length > 0 ? 
                Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length) : 0,
            averageLevel1Score: results.length > 0 ? 
                Math.round(results.reduce((sum, r) => sum + (r.level1Percentage || 0), 0) / results.length) : 0,
            averageLevel2Score: results.length > 0 ? 
                Math.round(results.reduce((sum, r) => sum + (r.level2Percentage || 0), 0) / results.length) : 0,
            highestScore: results.length > 0 ? Math.max(...results.map(r => r.totalScore)) : 0,
            lastUpdated: new Date().toISOString()
        };

        return {
            summary,
            results: processedResults
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Clear all results (for testing/admin purposes)
    clearResults() {
        if (this.useLocalStorage) {
            localStorage.removeItem('gameResults');
            return Promise.resolve({ success: true });
        } else {
            // Implement API call to clear results
            return Promise.resolve({ success: true });
        }
    }
}

// Initialize API instance
window.gameAPI = new GameAPI();