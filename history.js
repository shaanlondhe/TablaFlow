// Get practice data from localStorage
function getPracticeData() {
    const exercises = JSON.parse(localStorage.getItem('exercises') || '{}');
    const practiceData = {};

    // Calculate total practice time for each day
    Object.entries(exercises).forEach(([date, dayExercises]) => {
        practiceData[date] = dayExercises.reduce((total, exercise) => {
            return total + (exercise.practiceTime || 0);
        }, 0);
    });

    return practiceData;
}

// Format minutes into hours and minutes
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

// Initialize today's stats
function initTodayStats() {
    const practiceData = getPracticeData();
    const today = new Date().toISOString().split('T')[0];
    const todayMinutes = practiceData[today] || 0;
    
    // Update stats
    document.querySelector('.practice-time .stat-value').textContent = formatTime(todayMinutes);
    document.querySelector('.stat-time').textContent = `Last updated at ${new Date().toLocaleTimeString()}`;

    // Create today's chart
    const ctx = document.getElementById('todayChart').getContext('2d');
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                data: hours.map(() => Math.random() * 30), // Example data
                backgroundColor: '#38A169',
                borderRadius: 4,
                barThickness: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            }
        }
    });
}

// Initialize practice chart
function initPracticeChart() {
    const practiceData = getPracticeData();
    const dates = Object.keys(practiceData).sort();
    const last30Days = dates.slice(-30);
    
    const ctx = document.getElementById('practiceChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last30Days.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })),
            datasets: [{
                data: last30Days.map(date => practiceData[date] || 0),
                backgroundColor: '#38A169',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatTime(value)
                    }
                }
            }
        }
    });
}

// Initialize monthly goal chart
function initMonthlyGoalChart() {
    const ctx = document.getElementById('monthlyGoalChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [75, 25],
                backgroundColor: ['#38A169', '#EDF2F7'],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update trends
function updateTrends() {
    const practiceData = getPracticeData();
    const dates = Object.keys(practiceData).sort();
    
    // Calculate weekly averages
    const weeks = {};
    dates.forEach(date => {
        const week = new Date(date).getWeek();
        if (!weeks[week]) weeks[week] = [];
        weeks[week].push(practiceData[date]);
    });

    const weeklyAverages = Object.values(weeks).map(week => 
        week.reduce((sum, val) => sum + val, 0) / week.length
    );

    // Update practice time trend
    const lastWeekAvg = weeklyAverages[weeklyAverages.length - 1];
    const prevWeekAvg = weeklyAverages[weeklyAverages.length - 2];
    const trend = lastWeekAvg > prevWeekAvg ? 'more' : 'less';
    document.getElementById('practiceTimeTrend').textContent = 
        `On average, you practiced ${trend} over the past 5 weeks`;

    // Update consistency trend
    const thisWeek = dates.slice(-7);
    const practiceDays = thisWeek.filter(date => practiceData[date] > 0).length;
    document.getElementById('consistencyTrend').textContent = 
        `You practiced on ${practiceDays} out of 7 days this week`;

    // Update goal trend
    const weeklyGoal = 420; // 7 hours per week
    const weeklyTotal = thisWeek.reduce((sum, date) => sum + (practiceData[date] || 0), 0);
    const goalProgress = Math.round((weeklyTotal / weeklyGoal) * 100);
    document.getElementById('goalTrend').textContent = 
        `You're ${goalProgress}% towards your weekly goal`;
}

// Initialize time range toggles
function initTimeRangeToggles() {
    document.querySelectorAll('.time-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            document.querySelectorAll('.time-toggle').forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');
            // TODO: Update chart based on selected range
        });
    });
}

// Helper function to get week number
Date.prototype.getWeek = function() {
    const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initTodayStats();
    initPracticeChart();
    initMonthlyGoalChart();
    updateTrends();
    initTimeRangeToggles();
}); 