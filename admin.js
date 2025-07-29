class AdminDashboard {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refresh-btn');
        const exportBtn = document.getElementById('export-btn');
        
        refreshBtn.addEventListener('click', () => this.refreshData());
        exportBtn.addEventListener('click', () => this.exportData());
    }

    async loadData() {
        try {
            this.showLoading();
            const analytics = await window.gameAPI.getAnalytics();
            this.updateSummaryCards(analytics.summary);
            this.updateLeaderboard(analytics.results);
            this.updateCharts(analytics.results);
            this.updateAnalyticsCards(analytics.summary, analytics.results);
            this.updateLastUpdated();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Failed to load analytics data');
        }
    }

    async refreshData() {
        await this.loadData();
        this.showRefreshSuccess();
    }

    updateSummaryCards(summary) {
        document.getElementById('total-players').textContent = summary.totalPlayers;
        document.getElementById('completed-games').textContent = summary.completedGames;
        document.getElementById('average-score').textContent = summary.averageScore;
        document.getElementById('highest-score').textContent = summary.highestScore;
    }

    updateLeaderboard(results) {
        const tbody = document.getElementById('leaderboard-tbody');
        
        if (results.length === 0) {
            tbody.innerHTML = '<tr class="loading-row"><td colspan="8">No data available</td></tr>';
            return;
        }

        tbody.innerHTML = results.map(result => {
            const rankClass = this.getRankClass(result.rank);
            const status = result.gameCompleted ? 'completed' : 'incomplete';
            const statusText = result.gameCompleted ? 'Completed' : 'Incomplete';
            
            return `
                <tr>
                    <td>
                        <span class="rank-badge ${rankClass}">${result.rank}</span>
                    </td>
                    <td><strong>${result.displayName}</strong></td>
                    <td><span class="score-value">${result.totalScore}</span></td>
                    <td>
                        <span class="percentage-value ${this.getPercentageClass(result.level1Percentage)}">
                            ${result.level1Percentage}%
                        </span>
                    </td>
                    <td>
                        <span class="percentage-value ${this.getPercentageClass(result.level2Percentage)}">
                            ${result.level2Percentage || 'N/A'}%
                        </span>
                    </td>
                    <td>${this.formatTime(result.completionTime)}</td>
                    <td>
                        <span class="status-badge status-${status}">${statusText}</span>
                    </td>
                    <td>${this.formatDate(result.timestamp)}</td>
                </tr>
            `;
        }).join('');
    }

    updateCharts(results) {
        this.createPerformanceChart(results);
        this.createScoreDistributionChart(results);
    }

    createPerformanceChart(results) {
        const ctx = document.getElementById('performance-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        const level1Data = results.map(r => r.level1Percentage);
        const level2Data = results.filter(r => r.level2Percentage !== null).map(r => r.level2Percentage);

        this.charts.performance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Level 1 Average', 'Level 2 Average'],
                datasets: [{
                    label: 'Average Performance (%)',
                    data: [
                        level1Data.length > 0 ? Math.round(level1Data.reduce((a, b) => a + b, 0) / level1Data.length) : 0,
                        level2Data.length > 0 ? Math.round(level2Data.reduce((a, b) => a + b, 0) / level2Data.length) : 0
                    ],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)'
                    ],
                    borderColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(118, 75, 162, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createScoreDistributionChart(results) {
        const ctx = document.getElementById('score-distribution-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.scoreDistribution) {
            this.charts.scoreDistribution.destroy();
        }

        // Create score ranges
        const ranges = ['0-20', '21-40', '41-60', '61-80', '81-100', '101+'];
        const counts = [0, 0, 0, 0, 0, 0];

        results.forEach(result => {
            const score = result.totalScore;
            if (score <= 20) counts[0]++;
            else if (score <= 40) counts[1]++;
            else if (score <= 60) counts[2]++;
            else if (score <= 80) counts[3]++;
            else if (score <= 100) counts[4]++;
            else counts[5]++;
        });

        this.charts.scoreDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ranges,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(255, 205, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateAnalyticsCards(summary, results) {
        // Level 1 Performance
        document.getElementById('level1-avg').textContent = `${summary.averageLevel1Score}%`;
        const level1PassRate = results.length > 0 ? 
            Math.round((results.filter(r => r.level1Percentage >= 70).length / results.length) * 100) : 0;
        document.getElementById('level1-pass-rate').textContent = `${level1PassRate}%`;

        // Level 2 Performance
        document.getElementById('level2-avg').textContent = `${summary.averageLevel2Score}%`;
        const level2Attempts = results.filter(r => r.level2Percentage !== null).length;
        const level2PassRate = level2Attempts > 0 ? 
            Math.round((results.filter(r => r.level2Percentage >= 70).length / level2Attempts) * 100) : 0;
        document.getElementById('level2-pass-rate').textContent = `${level2PassRate}%`;

        // Completion Statistics
        const completionRate = results.length > 0 ? 
            Math.round((summary.completedGames / summary.totalPlayers) * 100) : 0;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        
        const avgTime = results.filter(r => r.completionTime).length > 0 ?
            results.filter(r => r.completionTime).reduce((sum, r) => sum + r.completionTime, 0) / 
            results.filter(r => r.completionTime).length : 0;
        document.getElementById('avg-completion-time').textContent = this.formatTime(avgTime);
    }

    getRankClass(rank) {
        if (rank === 1) return 'rank-1';
        if (rank === 2) return 'rank-2';
        if (rank === 3) return 'rank-3';
        return 'rank-other';
    }

    getPercentageClass(percentage) {
        if (percentage >= 90) return 'percentage-excellent';
        if (percentage >= 80) return 'percentage-good';
        if (percentage >= 70) return 'percentage-fair';
        return 'percentage-poor';
    }

    formatTime(seconds) {
        if (!seconds) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateLastUpdated() {
        const now = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('last-updated').textContent = now;
    }

    showLoading() {
        const elements = document.querySelectorAll('.card-value, .metric-value');
        elements.forEach(el => el.classList.add('loading'));
    }

    hideLoading() {
        const elements = document.querySelectorAll('.loading');
        elements.forEach(el => {
            el.classList.remove('loading');
            el.classList.add('data-updated');
            setTimeout(() => el.classList.remove('data-updated'), 300);
        });
    }

    showRefreshSuccess() {
        const refreshBtn = document.getElementById('refresh-btn');
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<span class="icon">✅</span> Updated!';
        refreshBtn.style.background = 'linear-gradient(135deg, #51cf66, #40c057)';
        
        setTimeout(() => {
            refreshBtn.innerHTML = originalText;
            refreshBtn.style.background = '';
        }, 2000);
    }

    showError(message) {
        const tbody = document.getElementById('leaderboard-tbody');
        tbody.innerHTML = `<tr class="loading-row"><td colspan="8" style="color: #ff6b6b;">${message}</td></tr>`;
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (this.autoRefreshEnabled) {
                this.loadData();
            }
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async exportData() {
        try {
            const analytics = await window.gameAPI.getAnalytics();
            const csv = this.convertToCSV(analytics.results);
            this.downloadCSV(csv, 'openhie-game-analytics.csv');
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data');
        }
    }

    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = [
            'Rank', 'Player', 'Total Score', 'Level 1 Score', 'Level 2 Score',
            'Level 1 Percentage', 'Level 2 Percentage', 'Completion Time',
            'Status', 'Date'
        ];

        const rows = data.map(item => [
            item.rank,
            item.displayName,
            item.totalScore,
            item.level1Score,
            item.level2Score || 'N/A',
            item.level1Percentage,
            item.level2Percentage || 'N/A',
            this.formatTime(item.completionTime),
            item.gameCompleted ? 'Completed' : 'Incomplete',
            this.formatDate(item.timestamp)
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});