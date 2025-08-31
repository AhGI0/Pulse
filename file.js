        // Initialize data storage
        let wellbeingData = JSON.parse(localStorage?.getItem('wellbeingData')) || {
            checkins: [],
            metrics: {
                mood: [7, 6, 8, 7, 6, 9, 7],
                energy: [6, 5, 7, 6, 5, 8, 6],
                focus: [8, 7, 9, 8, 7, 9, 8],
                stress: [4, 5, 3, 4, 6, 2, 4],
                hours: [8, 9, 7, 8, 10, 6, 8]
            },
            lastWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        };

        // Form handling
        document.getElementById('checkinForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const checkin = {
                date: new Date().toISOString().split('T')[0],
                mood: parseInt(formData.get('mood')),
                energy: parseInt(formData.get('energy')),
                focus: parseInt(formData.get('focus')),
                stress: parseInt(formData.get('stress')),
                hoursWorked: parseFloat(formData.get('hoursWorked')),
                sleepHours: parseFloat(formData.get('sleepHours')),
                wins: formData.get('wins'),
                challenges: formData.get('challenges')
            };

            wellbeingData.checkins.push(checkin);
            updateMetrics(checkin);
            saveData();
            updateDashboard();
            
            // Show success message
            alert('✅ Check-in saved successfully!');
            
            // Reset form
            e.target.reset();
            updateRangeDisplays();
        });

        // Range input displays
        function updateRangeDisplays() {
            document.getElementById('moodValue').textContent = document.getElementById('mood').value;
            document.getElementById('energyValue').textContent = document.getElementById('energy').value;
            document.getElementById('focusValue').textContent = document.getElementById('focus').value;
            document.getElementById('stressValue').textContent = document.getElementById('stress').value;
        }

        // Add event listeners for range inputs
        ['mood', 'energy', 'focus', 'stress'].forEach(id => {
            document.getElementById(id).addEventListener('input', updateRangeDisplays);
        });

        // Update metrics with new data
        function updateMetrics(checkin) {
            // Add new data point and keep last 7 days
            wellbeingData.metrics.mood.push(checkin.mood);
            wellbeingData.metrics.energy.push(checkin.energy);
            wellbeingData.metrics.focus.push(checkin.focus);
            wellbeingData.metrics.stress.push(checkin.stress);
            wellbeingData.metrics.hours.push(checkin.hoursWorked);

            // Keep only last 7 entries
            Object.keys(wellbeingData.metrics).forEach(key => {
                if (wellbeingData.metrics[key].length > 7) {
                    wellbeingData.metrics[key] = wellbeingData.metrics[key].slice(-7);
                }
            });
        }

        // Save data to localStorage
        function saveData() {
            try {
                if (typeof(Storage) !== "undefined") {
                    localStorage.setItem('wellbeingData', JSON.stringify(wellbeingData));
                }
            } catch (e) {
                console.log('Storage not available, data will not persist');
            }
        }

        // Tab switching
        function switchTab(tabName) {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Reinitialize charts when switching tabs
            setTimeout(initializeCharts, 100);
        }

        // Update dashboard metrics
        function updateDashboard() {
            const metrics = wellbeingData.metrics;
            
            // Calculate averages
            const avgMood = (metrics.mood.reduce((a, b) => a + b, 0) / metrics.mood.length).toFixed(1);
            const avgEnergy = (metrics.energy.reduce((a, b) => a + b, 0) / metrics.energy.length).toFixed(1);
            const avgFocus = (metrics.focus.reduce((a, b) => a + b, 0) / metrics.focus.length).toFixed(1);
            const avgStress = (metrics.stress.reduce((a, b) => a + b, 0) / metrics.stress.length).toFixed(1);
            const totalHours = metrics.hours.reduce((a, b) => a + b, 0).toFixed(1);

            // Update display
            document.getElementById('currentMood').textContent = avgMood;
            document.getElementById('currentEnergy').textContent = avgEnergy;
            document.getElementById('currentFocus').textContent = avgFocus;
            document.getElementById('currentStress').textContent = avgStress;
            document.getElementById('weeklyHours').textContent = totalHours;

            // Update burnout risk
            updateBurnoutRisk(avgStress, totalHours / 7);
            
            // Update suggestions
            updateSuggestions(avgMood, avgEnergy, avgStress, totalHours / 7);
        }

        // Update burnout risk visualization
        function updateBurnoutRisk(stress, avgDailyHours) {
            let risk = 0;
            
            // Calculate risk based on stress and hours
            if (stress > 7) risk += 30;
            else if (stress > 5) risk += 15;
            
            if (avgDailyHours > 10) risk += 40;
            else if (avgDailyHours > 8) risk += 20;
            
            // Add other factors
            const recentCheckins = wellbeingData.checkins.slice(-7);
            const lowSleepDays = recentCheckins.filter(c => c.sleepHours < 6).length;
            risk += lowSleepDays * 10;

            risk = Math.min(risk, 100); // Cap at 100%
            
            // Update progress ring
            const ring = document.getElementById('burnoutRing');
            const circumference = 283; // 2 * PI * 45
            const offset = circumference - (risk / 100) * circumference;
            ring.style.strokeDashoffset = offset;
            
            // Update risk color
            if (risk < 30) {
                ring.style.stroke = '#27ae60';
                document.querySelector('#personal .card:nth-child(3) h3 .status-indicator').className = 'status-indicator status-good';
            } else if (risk < 60) {
                ring.style.stroke = '#f39c12';
                document.querySelector('#personal .card:nth-child(3) h3 .status-indicator').className = 'status-indicator status-warning';
            } else {
                ring.style.stroke = '#e74c3c';
                document.querySelector('#personal .card:nth-child(3) h3 .status-indicator').className = 'status-indicator status-risk';
            }
        }

        // Update personalized suggestions
        function updateSuggestions(mood, energy, stress, avgHours) {
            const suggestions = [];
            
            if (avgHours > 9) {
                suggestions.push({
                    icon: '⏰',
                    title: 'Work-Life Balance',
                    text: `You're averaging ${avgHours.toFixed(1)} hours/day. Consider setting boundaries and taking scheduled breaks.`
                });
            }
            
            if (stress > 6) {
                suggestions.push({
                    icon: '🧘',
                    title: 'Stress Management',
                    text: 'Your stress levels are elevated. Try deep breathing exercises or a 10-minute walk between tasks.'
                });
            }
            
            if (energy < 5) {
                suggestions.push({
                    icon: '⚡',
                    title: 'Energy Boost',
                    text: 'Low energy detected. Consider checking your sleep schedule, hydration, and nutrition.'
                });
            }
            
            if (mood < 6) {
                suggestions.push({
                    icon: '🌟',
                    title: 'Mood Enhancement',
                    text: 'Your mood has been lower than usual. Consider connecting with your support network or taking time for activities you enjoy.'
                });
            }
            
            // Update suggestions display
            const suggestionsList = document.getElementById('suggestionsList');
            if (suggestions.length > 0) {
                suggestionsList.innerHTML = suggestions.map(s => 
                    `<div class="suggestion-item">
                        <strong>${s.icon} ${s.title}:</strong> ${s.text}
                    </div>`
                ).join('');
            }
        }

        // Initialize charts
        function initializeCharts() {
            // Trend Chart
            const trendCtx = document.getElementById('trendChart');
            if (trendCtx && !trendCtx.chart) {
                trendCtx.chart = new Chart(trendCtx, {
                    type: 'line',
                    data: {
                        labels: wellbeingData.lastWeek,
                        datasets: [
                            {
                                label: 'Mood',
                                data: wellbeingData.metrics.mood,
                                borderColor: '#667eea',
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'Energy',
                                data: wellbeingData.metrics.energy,
                                borderColor: '#f093fb',
                                backgroundColor: 'rgba(240, 147, 251, 0.1)',
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'Focus',
                                data: wellbeingData.metrics.focus,
                                borderColor: '#4facfe',
                                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'Stress',
                                data: wellbeingData.metrics.stress,
                                borderColor: '#ff6b6b',
                                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                tension: 0.4,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 10,
                                grid: {
                                    color: 'rgba(0,0,0,0.1)'
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(0,0,0,0.1)'
                                }
                            }
                        },
                        elements: {
                            point: {
                                radius: 4,
                                hoverRadius: 6
                            }
                        }
                    }
                });
            }

            // Balance Chart (Doughnut)
            const balanceCtx = document.getElementById('balanceChart');
            if (balanceCtx && !balanceCtx.chart) {
                const totalHours = wellbeingData.metrics.hours.reduce((a, b) => a + b, 0);
                const workHours = totalHours;
                const sleepHours = 7 * 7; // Assuming 7 hours sleep per day
                const otherHours = (24 * 7) - workHours - sleepHours;

                balanceCtx.chart = new Chart(balanceCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Work', 'Sleep', 'Personal Time'],
                        datasets: [{
                            data: [workHours, sleepHours, otherHours],
                            backgroundColor: [
                                '#ff6b6b',
                                '#4ecdc4',
                                '#45b7d1'
                            ],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                            }
                        }
                    }
                });
            }

            // Monthly Chart
            const monthlyCtx = document.getElementById('monthlyChart');
            if (monthlyCtx && !monthlyCtx.chart) {
                monthlyCtx.chart = new Chart(monthlyCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                        datasets: [
                            {
                                label: 'Tasks Completed',
                                data: [18, 22, 25, 23],
                                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                                borderRadius: 5
                            },
                            {
                                label: 'Hours Worked',
                                data: [42, 45, 48, 43],
                                backgroundColor: 'rgba(240, 147, 251, 0.8)',
                                borderRadius: 5
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0,0,0,0.1)'
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(0,0,0,0.1)'
                                }
                            }
                        }
                    }
                });
            }
        }

        // Simulate real-time updates
        function simulateRealTimeUpdates() {
            setInterval(() => {
                // Simulate random metric updates
                const randomMetric = Math.random();
                if (randomMetric < 0.1) { // 10% chance to update
                    // Update a random metric slightly
                    const metrics = ['mood', 'energy', 'focus', 'stress'];
                    const randomIndex = Math.floor(Math.random() * metrics.length);
                    const metric = metrics[randomIndex];
                    const currentValue = wellbeingData.metrics[metric][wellbeingData.metrics[metric].length - 1];
                    const change = (Math.random() - 0.5) * 2; // -1 to +1 change
                    const newValue = Math.max(1, Math.min(10, currentValue + change));
                    
                    wellbeingData.metrics[metric][wellbeingData.metrics[metric].length - 1] = Math.round(newValue);
                    
                    updateDashboard();
                    
                    // Update chart if it exists
                    const trendChart = document.getElementById('trendChart')?.chart;
                    if (trendChart) {
                        trendChart.data.datasets.forEach((dataset, index) => {
                            if (dataset.label.toLowerCase() === metric) {
                                dataset.data = wellbeingData.metrics[metric];
                            }
                        });
                        trendChart.update();
                    }
                }
            }, 30000); // Update every 30 seconds
        }

        // Generate dynamic insights
        function generateInsights() {
            const checkins = wellbeingData.checkins.slice(-7); // Last 7 days
            const insights = [];

            // Analyze patterns
            const avgMood = wellbeingData.metrics.mood.reduce((a, b) => a + b, 0) / wellbeingData.metrics.mood.length;
            const avgEnergy = wellbeingData.metrics.energy.reduce((a, b) => a + b, 0) / wellbeingData.metrics.energy.length;
            const avgStress = wellbeingData.metrics.stress.reduce((a, b) => a + b, 0) / wellbeingData.metrics.stress.length;
            const avgHours = wellbeingData.metrics.hours.reduce((a, b) => a + b, 0) / wellbeingData.metrics.hours.length;

            // Mood-Energy correlation
            if (avgMood > 7 && avgEnergy > 7) {
                insights.push("🌟 You're in a great flow state! Your high mood and energy levels suggest optimal performance.");
            } else if (avgMood < 5 && avgEnergy < 5) {
                insights.push("⚠️ Both mood and energy are low. Consider taking a break or adjusting your workload.");
            }

            // Work pattern analysis
            if (avgHours > 9) {
                insights.push("📊 You're working long hours consistently. Consider if this is sustainable long-term.");
            } else if (avgHours < 6) {
                insights.push("⏱️ Your work hours are on the lower side. Are you being as productive as you'd like?");
            }

            // Stress pattern
            const stressTrend = wellbeingData.metrics.stress.slice(-3); // Last 3 days
            const isStressIncreasing = stressTrend.every((val, i) => i === 0 || val >= stressTrend[i-1]);
            if (isStressIncreasing && avgStress > 6) {
                insights.push("📈 Stress levels are trending upward. Time for proactive stress management.");
            }

            return insights;
        }

        // Add notification system
        function checkForAlerts() {
            const lastCheckin = wellbeingData.checkins[wellbeingData.checkins.length - 1];
            const alerts = [];

            // Check for high stress
            if (lastCheckin && lastCheckin.stress >= 8) {
                alerts.push({
                    type: 'warning',
                    message: 'High stress level detected. Consider taking a break.'
                });
            }

            // Check for overwork
            if (lastCheckin && lastCheckin.hoursWorked >= 12) {
                alerts.push({
                    type: 'danger',
                    message: 'Working 12+ hours detected. Please prioritize rest.'
                });
            }

            // Check for insufficient sleep
            if (lastCheckin && lastCheckin.sleepHours < 5) {
                alerts.push({
                    type: 'warning',
                    message: 'Low sleep hours may impact tomorrow\'s performance.'
                });
            }

            // Display alerts
            displayAlerts(alerts);
        }

        function displayAlerts(alerts) {
            const existingAlerts = document.getElementById('alertsContainer');
            if (existingAlerts) {
                existingAlerts.remove();
            }

            if (alerts.length > 0) {
                const alertsContainer = document.createElement('div');
                alertsContainer.id = 'alertsContainer';
                alertsContainer.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    max-width: 350px;
                `;

                alerts.forEach((alert, index) => {
                    const alertDiv = document.createElement('div');
                    alertDiv.style.cssText = `
                        background: ${alert.type === 'danger' ? '#e74c3c' : '#f39c12'};
                        color: white;
                        padding: 15px;
                        border-radius: 10px;
                        margin-bottom: 10px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                        animation: slideIn 0.5s ease-out;
                    `;
                    alertDiv.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>${alert.message}</span>
                            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
                        </div>
                    `;
                    alertsContainer.appendChild(alertDiv);

                    // Auto-remove after 10 seconds
                    setTimeout(() => {
                        if (alertDiv.parentElement) {
                            alertDiv.remove();
                        }
                    }, 10000);
                });

                document.body.appendChild(alertsContainer);
            }
        }

        // Add CSS animation for alerts
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Export data functionality
        function exportData() {
            const dataStr = JSON.stringify(wellbeingData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `wellbeing-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }

        // Add export button to header
        function addExportButton() {
            const exportBtn = document.createElement('button');
            exportBtn.textContent = '📊 Export Data';
            exportBtn.className = 'btn';
            exportBtn.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                font-size: 0.9rem;
            `;
            exportBtn.onclick = exportData;
            document.querySelector('.header').style.position = 'relative';
            document.querySelector('.header').appendChild(exportBtn);
        }

        // Initialize everything when page loads
        document.addEventListener('DOMContentLoaded', function() {
            updateRangeDisplays();
            updateDashboard();
            setTimeout(initializeCharts, 100);
            simulateRealTimeUpdates();
            addExportButton();
            
            // Generate and display initial insights
            const insights = generateInsights();
            console.log('Current insights:', insights);
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        switchTab('personal');
                        break;
                    case '2':
                        e.preventDefault();
                        switchTab('team');
                        break;
                    case '3':
                        e.preventDefault();
                        switchTab('analytics');
                        break;
                    case 's':
                        e.preventDefault();
                        document.getElementById('checkinForm').scrollIntoView();
                        break;
                }
            }
        });

        // Add tooltips for better UX
        function addTooltips() {
            const tooltips = {
                'mood': 'Rate your overall emotional state today',
                'energy': 'How energized do you feel physically and mentally?',
                'focus': 'How well were you able to concentrate on tasks?',
                'stress': 'Rate your stress and pressure levels',
                'hoursWorked': 'Total hours spent on work-related activities',
                'sleepHours': 'Hours of sleep you got last night'
            };

            Object.keys(tooltips).forEach(id => {
                const element = document.querySelector(`label[for="${id}"]`);
                if (element) {
                    element.title = tooltips[id];
                    element.style.cursor = 'help';
                }
            });
        }

        // Initialize tooltips
        setTimeout(addTooltips, 100);