class OpenHIEGame {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
        this.level1Answers = {};
        this.level2Answers = {};
        this.userId = null;
        this.gameStartTime = null;
        this.level1Score = 0;
        this.level2Score = 0;
        this.level1Percentage = 0;
        this.level2Percentage = 0;
        this.gameCompleted = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.updateUI();
        this.gameStartTime = new Date();
    }

    setUserId(userId) {
        this.userId = userId;
    }

    setupEventListeners() {
        const checkLevel1Btn = document.getElementById('check-level1');
        const checkLevel2Btn = document.getElementById('check-level2');
        const nextLevelBtn = document.getElementById('next-level-btn');
        const playAgainBtn = document.getElementById('play-again-btn');
        const modal = document.getElementById('feedback-modal');
        const closeBtn = document.querySelector('.close');

        checkLevel1Btn.addEventListener('click', () => this.checkLevel1());
        checkLevel2Btn.addEventListener('click', () => this.checkLevel2());
        nextLevelBtn.addEventListener('click', () => this.nextLevel());
        playAgainBtn.addEventListener('click', () => this.playAgain());
        
        closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    setupDragAndDrop() {
        this.setupLevel1DragDrop();
        this.setupLevel2DragDrop();
    }

    setupLevel1DragDrop() {
        const draggableItems = document.querySelectorAll('#level1 .draggable-item');
        const dropZones = document.querySelectorAll('#level1 .drop-area');

        draggableItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    service: item.dataset.service,
                    correctLayer: item.dataset.correctLayer,
                    text: item.textContent
                }));
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.parentElement.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', (e) => {
                if (!zone.contains(e.relatedTarget)) {
                    zone.parentElement.classList.remove('drag-over');
                }
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.parentElement.classList.remove('drag-over');
                
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                const layer = zone.parentElement.dataset.layer;
                
                this.level1Answers[data.service] = layer;
                
                const draggedElement = document.querySelector(`[data-service="${data.service}"]`);
                if (draggedElement && !draggedElement.classList.contains('placed')) {
                    draggedElement.classList.add('placed');
                    draggedElement.draggable = false;
                    
                    const clone = draggedElement.cloneNode(true);
                    clone.addEventListener('click', () => this.removeFromDropZone(clone, data.service, 'level1'));
                    zone.appendChild(clone);
                }
                
                this.updateCheckButton('level1');
            });
        });
    }

    setupLevel2DragDrop() {
        const useCaseItems = document.querySelectorAll('#level2 .use-case-item');
        const targetAreas = document.querySelectorAll('#level2 .target-area');

        useCaseItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    useCase: item.dataset.useCase,
                    correctService: item.dataset.correctService,
                    html: item.outerHTML
                }));
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });

        targetAreas.forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.parentElement.classList.add('drag-over');
            });

            area.addEventListener('dragleave', (e) => {
                if (!area.contains(e.relatedTarget)) {
                    area.parentElement.classList.remove('drag-over');
                }
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.parentElement.classList.remove('drag-over');
                
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                const service = area.parentElement.dataset.service;
                
                this.level2Answers[data.useCase] = service;
                
                const draggedElement = document.querySelector(`[data-use-case="${data.useCase}"]`);
                if (draggedElement && !draggedElement.classList.contains('placed')) {
                    draggedElement.classList.add('placed');
                    draggedElement.draggable = false;
                    
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.html;
                    const clone = tempDiv.firstChild;
                    clone.classList.add('placed');
                    clone.addEventListener('click', () => this.removeFromDropZone(clone, data.useCase, 'level2'));
                    area.appendChild(clone);
                }
                
                this.updateCheckButton('level2');
            });
        });
    }

    removeFromDropZone(element, identifier, level) {
        element.remove();
        
        if (level === 'level1') {
            delete this.level1Answers[identifier];
            const originalElement = document.querySelector(`#level1 [data-service="${identifier}"]`);
            if (originalElement) {
                originalElement.classList.remove('placed');
                originalElement.draggable = true;
            }
        } else {
            delete this.level2Answers[identifier];
            const originalElement = document.querySelector(`#level2 [data-use-case="${identifier}"]`);
            if (originalElement) {
                originalElement.classList.remove('placed');
                originalElement.draggable = true;
            }
        }
        
        this.updateCheckButton(level);
    }

    updateCheckButton(level) {
        const button = document.getElementById(`check-${level}`);
        const expectedAnswers = level === 'level1' ? 8 : 4;
        const currentAnswers = level === 'level1' ? 
            Object.keys(this.level1Answers).length : 
            Object.keys(this.level2Answers).length;
        
        button.disabled = currentAnswers < expectedAnswers;
    }

    checkLevel1() {
        const correctAnswers = {
            'shared-health-record': 'business-domain',
            'emr': 'point-of-service',
            'dhis2': 'point-of-service',
            'dhis2': 'point-of-service',
            'facility-registry': 'registry',
            'client-registry': 'registry',
            'lab-system': 'point-of-service',
            'product-catalogue': 'registry',
            'terminology-service': 'interoperability'
        };

        let correct = 0;
        let feedback = '<h3>Level 1 Results</h3><ul>';

        Object.keys(correctAnswers).forEach(service => {
            const userAnswer = this.level1Answers[service];
            const correctAnswer = correctAnswers[service];
            const isCorrect = userAnswer === correctAnswer;
            
            if (isCorrect) correct++;
            
            const serviceName = this.getServiceDisplayName(service);
            const layerName = this.getLayerDisplayName(correctAnswer);
            
            feedback += `<li class="${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}">
                ${serviceName}: ${isCorrect ? '✓' : '✗'} Should be in ${layerName}
            </li>`;

            const element = document.querySelector(`#level1 [data-service="${service}"]`);
            if (element) {
                element.classList.toggle('incorrect', !isCorrect);
            }
        });

        feedback += '</ul>';
        
        const percentage = Math.round((correct / 8) * 100);
        this.score += correct * 10;
        this.level1Score = correct * 10;
        this.level1Percentage = percentage;
        
        feedback += `<p><strong>Score: ${correct}/8 (${percentage}%)</strong></p>`;
        
        if (percentage >= 70) {
            feedback += '<p class="feedback-correct">Great job! You can proceed to Level 2.</p>';
            this.showModal(feedback, true);
        } else {
            feedback += '<p class="feedback-incorrect">You need at least 70% to proceed. Please try again!</p>';
            this.showModal(feedback, false);
        }
        
        this.updateUI();
    }

    checkLevel2() {
        const correctAnswers = {
            'patient-history': 'shared-health-record',
            'patient-tracking': 'client-registry',
            'facility-reporting': 'facility-registry',
            'terminology-mapping': 'terminology-service'
        };

        let correct = 0;
        let feedback = '<h3>Level 2 Results</h3><ul>';

        Object.keys(correctAnswers).forEach(useCase => {
            const userAnswer = this.level2Answers[useCase];
            const correctAnswer = correctAnswers[useCase];
            const isCorrect = userAnswer === correctAnswer;
            
            if (isCorrect) correct++;
            
            const useCaseName = this.getUseCaseDisplayName(useCase);
            const serviceName = this.getServiceDisplayName(correctAnswer);
            
            feedback += `<li class="${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}">
                ${useCaseName}: ${isCorrect ? '✓' : '✗'} Should map to ${serviceName}
            </li>`;

            const element = document.querySelector(`#level2 [data-use-case="${useCase}"]`);
            if (element) {
                element.classList.toggle('incorrect', !isCorrect);
            }
        });

        feedback += '</ul>';
        
        const percentage = Math.round((correct / 4) * 100);
        this.score += correct * 15;
        this.level2Score = correct * 15;
        this.level2Percentage = percentage;
        
        feedback += `<p><strong>Score: ${correct}/4 (${percentage}%)</strong></p>`;
        
        if (percentage >= 70) {
            this.gameCompleted = true;
            this.saveGameResult();
            
            feedback += '<div class="completion-message">';
            feedback += '<h3>🎉 Congratulations!</h3>';
            feedback += '<p>You have successfully completed the OpenHIE Education Game!</p>';
            feedback += `<p><strong>Final Score: ${this.score} points</strong></p>`;
            feedback += '<p>You now have a better understanding of OpenHIE components and their use cases.</p>';
            feedback += '</div>';
            this.showModal(feedback, false, true);
        } else {
            feedback += '<p class="feedback-incorrect">You need at least 70% to complete the game. Please try again!</p>';
            this.showModal(feedback, false);
        }
        
        this.updateUI();
    }

    getServiceDisplayName(service) {
        const names = {
            'shared-health-record': 'Shared Health Record',
            'emr': 'EMR',
            'dhis2': 'DHIS2',
            'facility-registry': 'Facility Registry',
            'client-registry': 'Client Registry',
            'lab-system': 'Lab System',
            'product-catalogue': 'Product Catalogue',
            'terminology-service': 'Terminology Service'
        };
        return names[service] || service;
    }

    getLayerDisplayName(layer) {
        const names = {
            'business-domain': 'Business Domain Services',
            'registry': 'Registry Services',
            'interoperability': 'Interoperability Service Layer',
            'point-of-service': 'Point of Service'
        };
        return names[layer] || layer;
    }

    getUseCaseDisplayName(useCase) {
        const names = {
            'patient-history': 'Patient Clinical History Tracking',
            'patient-tracking': 'Unique Patient Tracking',
            'facility-reporting': 'Facility Viral Load Reporting',
            'terminology-mapping': 'HIV Test Terminology Mapping'
        };
        return names[useCase] || useCase;
    }

    showModal(content, showNextButton = false, showPlayAgain = false) {
        const modal = document.getElementById('feedback-modal');
        const feedbackContent = document.getElementById('feedback-content');
        const nextButton = document.getElementById('next-level-btn');
        const playAgainButton = document.getElementById('play-again-btn');
        
        feedbackContent.innerHTML = content;
        nextButton.style.display = showNextButton ? 'block' : 'none';
        playAgainButton.style.display = showPlayAgain ? 'block' : 'none';
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('feedback-modal').style.display = 'none';
    }

    nextLevel() {
        this.currentLevel = 2;
        this.updateUI();
        this.closeModal();
        
        document.getElementById('level1').classList.remove('active');
        document.getElementById('level2').classList.add('active');
    }

    playAgain() {
        this.currentLevel = 1;
        this.score = 0;
        this.level1Answers = {};
        this.level2Answers = {};
        
        this.resetLevel1();
        this.resetLevel2();
        
        document.getElementById('level2').classList.remove('active');
        document.getElementById('level1').classList.add('active');
        
        this.updateUI();
        this.closeModal();
    }

    resetLevel1() {
        const dropAreas = document.querySelectorAll('#level1 .drop-area');
        dropAreas.forEach(area => {
            area.innerHTML = '';
        });
        
        const draggableItems = document.querySelectorAll('#level1 .draggable-item');
        draggableItems.forEach(item => {
            item.classList.remove('placed', 'incorrect');
            item.draggable = true;
        });
        
        document.getElementById('check-level1').disabled = true;
    }

    resetLevel2() {
        const targetAreas = document.querySelectorAll('#level2 .target-area');
        targetAreas.forEach(area => {
            area.innerHTML = '';
        });
        
        const useCaseItems = document.querySelectorAll('#level2 .use-case-item');
        useCaseItems.forEach(item => {
            item.classList.remove('placed', 'incorrect');
            item.draggable = true;
        });
        
        document.getElementById('check-level2').disabled = true;
    }

    updateUI() {
        document.getElementById('current-level').textContent = `Level ${this.currentLevel}`;
        document.getElementById('score').textContent = this.score;
    }

    async saveGameResult() {
        if (!this.userId || !window.gameAPI) {
            console.warn('User ID or API not available for saving results');
            return;
        }

        const completionTime = new Date() - this.gameStartTime;
        const result = {
            userId: this.userId,
            totalScore: this.score,
            level1Score: this.level1Score,
            level2Score: this.level2Score,
            level1Percentage: this.level1Percentage,
            level2Percentage: this.level2Percentage,
            completionTime: Math.round(completionTime / 1000), // in seconds
            gameCompleted: this.gameCompleted,
            level1Answers: this.level1Answers,
            level2Answers: this.level2Answers
        };

        try {
            await window.gameAPI.saveGameResult(result);
            console.log('Game result saved successfully');
        } catch (error) {
            console.error('Error saving game result:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize before starting the game
    setTimeout(() => {
        window.gameInstance = new OpenHIEGame();
    }, 1000);
});