// Exercise Store with localStorage persistence
const exerciseStore = {
    exercises: JSON.parse(localStorage.getItem('exercises') || '{}'),
    bpmHistory: JSON.parse(localStorage.getItem('bpmHistory') || '{}'),

    getDateKey(date) {
        return new Date(date).toISOString().split('T')[0];
    },

    addExercise(date, text) {
        const key = this.getDateKey(date);
        if (!this.exercises[key]) {
            this.exercises[key] = [];
        }
        const exercise = {
            id: Date.now(),
            text: text,
            description: '',
            bpm: 60,
            isPlaying: false,
            practiceTime: 0 // Time in minutes
        };
        this.exercises[key].push(exercise);
        this.save();
        return exercise;
    },

    updateBPM(date, id, bpm) {
        const key = this.getDateKey(date);
        if (this.exercises[key]) {
            const exercise = this.exercises[key].find(ex => ex.id === id);
            if (exercise) {
                // Store BPM history
                const historyKey = `${exercise.text}-${id}`;
                if (!this.bpmHistory[historyKey]) {
                    this.bpmHistory[historyKey] = [];
                }
                this.bpmHistory[historyKey].push({
                    date: key,
                    bpm: bpm
                });
                
                exercise.bpm = bpm;
                this.save();
                this.saveBPMHistory();
            }
        }
    },

    getBPMHistory(exerciseText, id) {
        const historyKey = `${exerciseText}-${id}`;
        return this.bpmHistory[historyKey] || [];
    },

    getExercises(date) {
        const key = this.getDateKey(date);
        return this.exercises[key] || [];
    },

    updateExercise(date, id, updates) {
        const key = this.getDateKey(date);
        if (this.exercises[key]) {
            const index = this.exercises[key].findIndex(ex => ex.id === id);
            if (index !== -1) {
                this.exercises[key][index] = { ...this.exercises[key][index], ...updates };
                this.save();
            }
        }
    },

    deleteExercise(date, id) {
        const key = this.getDateKey(date);
        if (this.exercises[key]) {
            this.exercises[key] = this.exercises[key].filter(ex => ex.id !== id);
            this.save();
        }
    },

    save() {
        localStorage.setItem('exercises', JSON.stringify(this.exercises));
    },

    saveBPMHistory() {
        localStorage.setItem('bpmHistory', JSON.stringify(this.bpmHistory));
    }
};

// State management
const state = {
    currentDate: new Date(),
    currentView: 'weekly',
    
    setDate(date) {
        this.currentDate = new Date(date);
    },
    
    setView(view) {
        this.currentView = view;
    },
    
    getWeekDates() {
        const current = new Date(this.currentDate);
        const currentDay = current.getDay();
        const diff = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(current);
        monday.setDate(current.getDate() - diff);
        
        const days = [];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            days.push({
                name: dayNames[i],
                date: new Date(date)
            });
        }
        return days;
    },
    
    getMonthDates() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const dates = [];
        
        // Add empty slots for days before the first of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            dates.push(null);
        }
        
        // Add all days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            dates.push(new Date(year, month, i));
        }
        
        // Add empty slots to complete the grid
        while (dates.length % 7 !== 0) {
            dates.push(null);
        }
        
        return dates;
    }
};

// Function to format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

// Update header text based on current view
function updateHeaderText() {
    const header = document.querySelector('.week-navigation h2');
    switch (state.currentView) {
        case 'daily':
            header.textContent = formatDate(state.currentDate);
            break;
        case 'weekly':
            const weekDates = state.getWeekDates();
            header.textContent = `${formatDate(weekDates[0].date).split(',')[0]} — ${formatDate(weekDates[6].date).split(',')[0]}`;
            break;
        case 'monthly':
            header.textContent = state.currentDate.toLocaleDateString('en-US', { 
                month: 'long',
                year: 'numeric'
            });
            break;
    }
}

// Create exercise element
function createExerciseElement(date, exercise) {
    const div = document.createElement('div');
    div.className = 'exercise';
    div.innerHTML = `
        <div class="exercise-main">
            <button class="time-tracker" aria-label="Set practice time">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span class="practice-time">${exercise.practiceTime ? formatPracticeTime(exercise.practiceTime) : '—'}</span>
            </button>
            <div class="exercise-title-container">
                <label class="exercise-text">${exercise.text}</label>
                <button class="description-toggle" aria-label="Edit description">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
            </div>
            <input type="text" class="edit-input" value="${exercise.text}">
            <div class="exercise-actions">
                <button class="toggle-metronome" aria-label="Toggle metronome section">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 3L4 20h16L12 3z"/>
                        <line x1="12" y1="9" x2="12" y2="14"/>
                        <line x1="12" y1="14" x2="16" y2="14"/>
                    </svg>
                </button>
                <button class="delete-exercise" aria-label="Delete exercise">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="exercise-description collapsed">
            <textarea class="description-input" placeholder="Add a more detailed description...">${exercise.description || ''}</textarea>
            <div class="description-actions">
                <button class="save-description">Save</button>
                <button class="cancel-description">Cancel</button>
            </div>
        </div>
        <div class="exercise-bpm collapsed">
            <div class="bpm-controls">
                <button class="bpm-adjust" data-adjust="-5">-5</button>
                <button class="bpm-adjust" data-adjust="-1">-</button>
                <span class="bpm-display">${exercise.bpm} BPM</span>
                <button class="bpm-adjust" data-adjust="1">+</button>
                <button class="bpm-adjust" data-adjust="5">+5</button>
                <button class="metronome-toggle" aria-label="Toggle metronome">
                    <svg class="play-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <svg class="pause-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                        <line x1="6" y1="4" x2="6" y2="20"></line>
                        <line x1="18" y1="4" x2="18" y2="20"></line>
                    </svg>
                </button>
            </div>
            <div class="bpm-progress">
                <canvas class="bpm-chart" width="200" height="50"></canvas>
            </div>
        </div>
    `;

    // Add toggle metronome section functionality
    const toggleBtn = div.querySelector('.toggle-metronome');
    const bpmSection = div.querySelector('.exercise-bpm');
    
    toggleBtn.addEventListener('click', () => {
        bpmSection.classList.toggle('collapsed');
        toggleBtn.classList.toggle('active');
    });

    // Add click-to-edit functionality
    const label = div.querySelector('.exercise-text');
    const editInput = div.querySelector('.edit-input');

    label.addEventListener('click', () => {
        div.classList.add('editing');
        editInput.value = label.textContent;
        editInput.focus();
    });

    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && editInput.value.trim()) {
            exerciseStore.updateExercise(date, exercise.id, { text: editInput.value.trim() });
            renderCalendar();
        } else if (e.key === 'Escape') {
            div.classList.remove('editing');
        }
    });

    editInput.addEventListener('blur', () => {
        if (editInput.value.trim() && editInput.value !== label.textContent) {
            exerciseStore.updateExercise(date, exercise.id, { text: editInput.value.trim() });
            renderCalendar();
        } else {
            div.classList.remove('editing');
        }
    });

    div.querySelector('.delete-exercise').addEventListener('click', () => {
        if (exercise.isPlaying) {
            metronome.stop();
        }
        div.style.opacity = '0';
        setTimeout(() => {
            exerciseStore.deleteExercise(date, exercise.id);
            renderCalendar();
        }, 200);
    });

    // Add BPM control listeners
    const bpmDisplay = div.querySelector('.bpm-display');
    div.querySelectorAll('.bpm-adjust').forEach(button => {
        button.addEventListener('click', () => {
            const adjustment = parseInt(button.dataset.adjust);
            const newBPM = Math.max(30, Math.min(300, exercise.bpm + adjustment));
            exerciseStore.updateBPM(date, exercise.id, newBPM);
            if (exercise.isPlaying) {
                metronome.setBPM(newBPM);
            }
            renderCalendar();
        });
    });

    // Update metronome toggle
    const metronomeButton = div.querySelector('.metronome-toggle');
    const playIcon = metronomeButton.querySelector('.play-icon');
    const pauseIcon = metronomeButton.querySelector('.pause-icon');

    if (exercise.isPlaying) {
        metronomeButton.classList.add('active');
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    }

    metronomeButton.addEventListener('click', () => {
        exercise.isPlaying = !exercise.isPlaying;
        metronomeButton.classList.toggle('active');
        
        if (exercise.isPlaying) {
            metronome.start(exercise.bpm);
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            metronome.stop();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
        exerciseStore.save();
    });

    // Draw BPM progress chart
    const canvas = div.querySelector('.bpm-chart');
    const ctx = canvas.getContext('2d');
    const bpmHistory = exerciseStore.getBPMHistory(exercise.text, exercise.id);
    
    if (bpmHistory.length > 0) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set font for axis labels
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#718096';
        
        // Calculate chart dimensions
        const PADDING = 25; // Left padding for y-axis
        const chartWidth = canvas.width - PADDING;
        const chartHeight = canvas.height - 5; // Small bottom padding
        
        const maxBPM = Math.max(...bpmHistory.map(h => h.bpm));
        const minBPM = Math.min(...bpmHistory.map(h => h.bpm));
        const range = maxBPM - minBPM;
        
        // Draw y-axis labels (3 points: min, mid, max)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(maxBPM.toString(), PADDING - 5, 5);
        ctx.fillText(Math.round((maxBPM + minBPM) / 2).toString(), PADDING - 5, chartHeight / 2);
        ctx.fillText(minBPM.toString(), PADDING - 5, chartHeight - 5);
        
        // Draw the line graph
        ctx.strokeStyle = '#38A169';
        ctx.lineWidth = 2;
        ctx.beginPath();
        bpmHistory.forEach((history, index) => {
            const x = PADDING + (index / (bpmHistory.length - 1)) * chartWidth;
            const y = 5 + ((maxBPM - history.bpm) / range) * (chartHeight - 10);
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    // Add time tracker functionality
    const timeTracker = div.querySelector('.time-tracker');
    const timeDisplay = timeTracker.querySelector('.practice-time');

    timeTracker.addEventListener('click', () => {
        // Create time input popup
        const popup = document.createElement('div');
        popup.className = 'time-input-popup';
        popup.innerHTML = `
            <div class="time-input-container">
                <div class="time-input-group">
                    <input type="number" class="hours-input" value="${Math.floor(exercise.practiceTime / 60)}" min="0" max="24">
                    <label>hrs</label>
                </div>
                <div class="time-input-group">
                    <input type="number" class="minutes-input" value="${exercise.practiceTime % 60}" min="0" max="59">
                    <label>min</label>
                </div>
                <div class="time-input-actions">
                    <button class="save-time">Save</button>
                    <button class="cancel-time">Cancel</button>
                </div>
            </div>
        `;

        // Position popup
        const rect = timeTracker.getBoundingClientRect();
        popup.style.position = 'absolute';
        popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
        popup.style.left = `${rect.left + window.scrollX}px`;

        // Add event listeners
        document.body.appendChild(popup);
        
        const saveBtn = popup.querySelector('.save-time');
        const cancelBtn = popup.querySelector('.cancel-time');
        const hoursInput = popup.querySelector('.hours-input');
        const minutesInput = popup.querySelector('.minutes-input');

        saveBtn.addEventListener('click', () => {
            const hours = parseInt(hoursInput.value) || 0;
            const minutes = parseInt(minutesInput.value) || 0;
            const totalMinutes = (hours * 60) + minutes;
            
            exercise.practiceTime = totalMinutes;
            exerciseStore.updateExercise(date, exercise.id, { practiceTime: totalMinutes });
            timeDisplay.textContent = formatPracticeTime(totalMinutes);
            popup.remove();
        });

        cancelBtn.addEventListener('click', () => popup.remove());

        // Close popup when clicking outside
        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target) && !timeTracker.contains(e.target)) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        });
    });

    // Add description toggle functionality
    const descriptionToggle = div.querySelector('.description-toggle');
    const descriptionSection = div.querySelector('.exercise-description');
    const descriptionInput = div.querySelector('.description-input');
    const saveDescriptionBtn = div.querySelector('.save-description');
    const cancelDescriptionBtn = div.querySelector('.cancel-description');
    
    descriptionToggle.addEventListener('click', () => {
        descriptionSection.classList.toggle('collapsed');
        descriptionToggle.classList.toggle('active');
        if (!descriptionSection.classList.contains('collapsed')) {
            descriptionInput.focus();
        }
    });

    saveDescriptionBtn.addEventListener('click', () => {
        exercise.description = descriptionInput.value.trim();
        exerciseStore.updateExercise(date, exercise.id, { description: exercise.description });
        descriptionSection.classList.add('collapsed');
        descriptionToggle.classList.remove('active');
    });

    cancelDescriptionBtn.addEventListener('click', () => {
        descriptionInput.value = exercise.description;
        descriptionSection.classList.add('collapsed');
        descriptionToggle.classList.remove('active');
    });

    return div;
}

// Add exercise functionality
function setupExerciseInput(container, date) {
    const addButton = container.querySelector('.add-exercise');
    const exercisesDiv = container.querySelector('.exercises');

    // Add existing exercises
    exerciseStore.getExercises(date).forEach(exercise => {
        const exerciseEl = createExerciseElement(date, exercise);
        exercisesDiv.insertBefore(exerciseEl, addButton);
    });

    addButton.addEventListener('click', () => {
        addButton.classList.add('typing');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'exercise-input';
        input.placeholder = 'Type exercise and press Enter';
        exercisesDiv.insertBefore(input, addButton);
        input.focus();

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                const exercise = exerciseStore.addExercise(date, input.value.trim());
                renderCalendar(); // Re-render to update all views
            } else if (e.key === 'Escape') {
                input.remove();
                addButton.classList.remove('typing');
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.contains(input)) {
                    input.remove();
                    addButton.classList.remove('typing');
                }
            }, 100);
        });
    });
}

// Create view containers
function createDayCard(date, isMonthly = false) {
    const card = document.createElement('div');
    card.className = isMonthly ? 'monthly-day' : 'day-card';
    
    if (!date) {
        card.className += ' empty';
        return card;
    }

    card.innerHTML = `
        ${isMonthly ? 
            `<div class="date">${date.getDate()}</div>` :
            `<h3>${date.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
             <p class="date">${formatDate(date)}</p>`
        }
        <div class="exercises">
            <button class="add-exercise">Add exercise</button>
        </div>
    `;

    setupExerciseInput(card, date);
    return card;
}

// Render calendar
function renderCalendar() {
    const container = document.querySelector('.view-container');
    container.innerHTML = '';

    const view = document.createElement('div');
    view.className = `${state.currentView}-view view-panel`;

    switch (state.currentView) {
        case 'daily':
            view.appendChild(createDayCard(state.currentDate));
            break;

        case 'weekly':
            view.className = 'calendar-grid';
            state.getWeekDates().forEach(day => {
                view.appendChild(createDayCard(day.date));
            });
            break;

        case 'monthly':
            view.className = 'monthly-grid';
            state.getMonthDates().forEach(date => {
                view.appendChild(createDayCard(date, true));
            });
            break;
    }

    container.appendChild(view);
    updateHeaderText();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameters for initial view
    const urlParams = new URLSearchParams(window.location.search);
    const initialView = urlParams.get('view');
    if (initialView) {
        state.setView(initialView);
        document.querySelectorAll('.view-toggle').forEach(toggle => {
            toggle.classList.remove('active');
            if (toggle.dataset.view === initialView) {
                toggle.classList.add('active');
            }
        });
    }

    // View toggles
    document.querySelectorAll('.view-toggle').forEach(toggle => {
        if (toggle.dataset.view === state.currentView) {
            toggle.classList.add('active');
        }
        toggle.addEventListener('click', () => {
            document.querySelectorAll('.view-toggle').forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');
            state.setView(toggle.dataset.view);
            renderCalendar();
        });
    });

    // Navigation
    document.querySelector('.nav-arrow.prev').addEventListener('click', () => {
        switch (state.currentView) {
            case 'daily':
                state.currentDate.setDate(state.currentDate.getDate() - 1);
                break;
            case 'weekly':
                state.currentDate.setDate(state.currentDate.getDate() - 7);
                break;
            case 'monthly':
                state.currentDate.setMonth(state.currentDate.getMonth() - 1);
                break;
        }
        renderCalendar();
    });

    document.querySelector('.nav-arrow.next').addEventListener('click', () => {
        switch (state.currentView) {
            case 'daily':
                state.currentDate.setDate(state.currentDate.getDate() + 1);
                break;
            case 'weekly':
                state.currentDate.setDate(state.currentDate.getDate() + 7);
                break;
            case 'monthly':
                state.currentDate.setMonth(state.currentDate.getMonth() + 1);
                break;
        }
        renderCalendar();
    });

    renderCalendar();
});

// Add metronome class after the exerciseStore
class Metronome {
    constructor() {
        this.audioContext = null;
        this.nextNoteTime = 0.0;
        this.timerID = null;
        this.isPlaying = false;
        this.currentBPM = 60;
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.currentBPM;
        this.nextNoteTime += secondsPerBeat;
    }

    scheduleNote(time) {
        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        osc.frequency.value = 1000;
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(envelope);
        envelope.connect(this.audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.03);
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = window.setTimeout(() => this.scheduler(), 25.0);
    }

    start(bpm) {
        this.initAudioContext();
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentBPM = bpm;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        window.clearTimeout(this.timerID);
    }

    setBPM(bpm) {
        this.currentBPM = bpm;
    }
}

// Create a single metronome instance
const metronome = new Metronome();

// Add helper function to format practice time
function formatPracticeTime(minutes) {
    if (minutes === 0) return '—';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
} 