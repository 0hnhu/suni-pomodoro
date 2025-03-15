document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const timerDisplay = document.getElementById('timer');
    const timerLabel = document.getElementById('timerLabel');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressInput = document.getElementById('progressInput');
    const summaryList = document.getElementById('summaryList');
    const todaySessionsEl = document.getElementById('todaySessions');
    const totalMinutesEl = document.getElementById('totalMinutes');
    const dayTimeline = document.getElementById('dayTimeline');
    
    // Timer variables
    let timer;
    let timeLeft = 25 * 60; // 25 minutes in seconds
    let isRunning = false;
    let currentMode = 'focus'; // 'focus', 'break'
    
    // Stats and data
    let stats = {
        todaySessions: 0,
        totalMinutes: 0
    };
    
    let accomplishments = [];
    let sessionHistory = []; // To track completed sessions
    
    // Load data from localStorage
    const loadData = () => {
        const savedStats = localStorage.getItem('pomodoroStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
            updateStatsDisplay();
        }
        
        const savedAccomplishments = localStorage.getItem('pomodoroAccomplishments');
        if (savedAccomplishments) {
            accomplishments = JSON.parse(savedAccomplishments);
            displayAccomplishments();
        }
    };
    
    // Save data to localStorage
    const saveData = () => {
        localStorage.setItem('pomodoroStats', JSON.stringify(stats));
        localStorage.setItem('pomodoroAccomplishments', JSON.stringify(accomplishments));
    };
    
    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Update timer display
    const updateTimerDisplay = () => {
        timerDisplay.textContent = formatTime(timeLeft);
        document.title = `${formatTime(timeLeft)} - Sana`;
    };
    
    // Update mode label
    const updateModeLabel = () => {
        if (currentMode === 'focus') {
            timerLabel.textContent = 'focus time';
            timerLabel.style.color = 'var(--text-secondary)';
            document.documentElement.style.setProperty('--timer-color', '#ff6b8b');
            timerDisplay.style.color = '#ff6b8b';
        } else {
            timerLabel.textContent = 'break time';
            timerLabel.style.color = 'var(--text-secondary)';
            document.documentElement.style.setProperty('--timer-color', '#30d158');
            timerDisplay.style.color = '#30d158';
        }
    };
    
    // Add a segment to the timeline
    const addTimelineSegment = (type, durationMinutes) => {
        // Create the segment
        const segment = document.createElement('div');
        segment.className = `timeline-segment ${type}`;
        
        // Calculate width based on duration (as a percentage of a standard 12-hour day)
        // This approach makes each 25-min focus session about 3.5% of the timeline
        const percentWidth = (durationMinutes / (12 * 60)) * 100;
        segment.style.width = `${percentWidth}%`;
        
        // Add to timeline
        dayTimeline.appendChild(segment);
        
        // Save to session history
        sessionHistory.push({
            type,
            durationMinutes,
            timestamp: new Date().toISOString()
        });
        
        // Save to localStorage
        localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
    };
    
    // Load the timeline from localStorage
    const loadTimeline = () => {
        const savedHistory = localStorage.getItem('sessionHistory');
        
        if (savedHistory) {
            // Parse the saved data
            const historyData = JSON.parse(savedHistory);
            const today = new Date().toLocaleDateString();
            
            // Filter for today's sessions
            const todayHistory = historyData.filter(item => {
                const itemDate = new Date(item.timestamp).toLocaleDateString();
                return itemDate === today;
            });
            
            // If we have today's history, display it
            if (todayHistory.length > 0) {
                sessionHistory = todayHistory;
                
                // Render the timeline segments
                dayTimeline.innerHTML = ''; // Clear any existing segments
                
                todayHistory.forEach(session => {
                    const segment = document.createElement('div');
                    segment.className = `timeline-segment ${session.type}`;
                    
                    // Calculate width
                    const percentWidth = (session.durationMinutes / (12 * 60)) * 100;
                    segment.style.width = `${percentWidth}%`;
                    
                    dayTimeline.appendChild(segment);
                });
            } else {
                // No sessions today, start with empty array
                sessionHistory = [];
            }
        }
    };
    
    // Start timer
    const startTimer = () => {
        if (isRunning) return;
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                isRunning = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                
                // Play sound
                const audio = new Audio('https://soundbible.com/mp3/Service-Bell-Help-Daniel_Simon.mp3');
                audio.play().catch(e => console.log('Audio play error:', e));
                
                // Show browser notification if permission granted
                if (Notification.permission === 'granted') {
                    new Notification('sana', {
                        body: `${currentMode === 'focus' ? 'focus time' : 'break'} is over!`,
                        icon: 'https://img.icons8.com/ios-filled/50/000000/tomato.png'
                    });
                }
                
                // Add to timeline based on current mode
                if (currentMode === 'focus') {
                    addTimelineSegment('focus', 25); // Add 25-min focus segment
                    
                    // Save accomplishments if focus mode completed
                    const text = progressInput.value.trim();
                    if (text) {
                        saveAccomplishment(text);
                        
                        // Add celebration animation
                        const confetti = document.createElement('div');
                        confetti.className = 'confetti-container';
                        document.body.appendChild(confetti);
                        setTimeout(() => {
                            document.body.removeChild(confetti);
                        }, 3000);
                    }
                    
                    // Update stats
                    stats.todaySessions++;
                    stats.totalMinutes += 25; // Assuming 25-minute sessions
                    updateStatsDisplay();
                    saveData();
                    
                    // Switch to break mode
                    currentMode = 'break';
                    timeLeft = 5 * 60; // 5-minute break
                } else {
                    addTimelineSegment('break', 5); // Add 5-min break segment
                    
                    // Switch back to focus mode
                    currentMode = 'focus';
                    timeLeft = 25 * 60; // 25-minute focus
                    progressInput.value = ''; // Clear input for new session
                }
                
                updateModeLabel();
                updateTimerDisplay();
            }
        }, 1000);
    };
    
    // Pause timer
    const pauseTimer = () => {
        if (!isRunning) return;
        
        clearInterval(timer);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    };
    
    // Reset timer
    const resetTimer = () => {
        pauseTimer();
        
        if (currentMode === 'focus') {
            timeLeft = 25 * 60; // 25-minute focus
        } else {
            timeLeft = 5 * 60; // 5-minute break
        }
        
        updateTimerDisplay();
    };
    
    // Save an accomplishment
    const saveAccomplishment = (text) => {
        const now = new Date();
        const accomplishment = {
            text,
            timestamp: now.toISOString(),
            date: now.toLocaleDateString()
        };
        
        accomplishments.unshift(accomplishment);
        saveData();
        displayAccomplishments();
    };
    
    // Display accomplishments in the summary list
    const displayAccomplishments = () => {
        // Get today's date
        const today = new Date().toLocaleDateString();
        
        // Filter accomplishments for today
        const todayItems = accomplishments.filter(item => item.date === today);
        
        if (todayItems.length === 0) {
            summaryList.innerHTML = '<div class="summary-item">no accomplishments recorded today. complete a focus session to start tracking!</div>';
        } else {
            summaryList.innerHTML = '';
            todayItems.forEach((item, index) => {
                const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const itemEl = document.createElement('div');
                itemEl.className = 'summary-item';
                itemEl.innerHTML = `
                    <div class="summary-date">${time}</div>
                    <div class="summary-text">${item.text}</div>
                `;
                
                summaryList.appendChild(itemEl);
            });
        }
    };
    
    // Update stats display
    const updateStatsDisplay = () => {
        todaySessionsEl.textContent = stats.todaySessions;
        totalMinutesEl.textContent = stats.totalMinutes;
    };
    
    // Check for a new day
    const checkNewDay = () => {
        const lastDate = localStorage.getItem('pomodoroLastDate');
        const today = new Date().toLocaleDateString();
        
        if (lastDate !== today) {
            // Reset today's sessions
            stats.todaySessions = 0;
            updateStatsDisplay();
            
            // Clear the timeline for the new day
            sessionHistory = [];
            dayTimeline.innerHTML = '';
            
            saveData();
            localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
            
            // Save today's date
            localStorage.setItem('pomodoroLastDate', today);
        }
    };
    
    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // Event listeners
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // Initialize
    loadData();
    checkNewDay();
    updateTimerDisplay();
    updateModeLabel();
    displayAccomplishments();
    loadTimeline();
});