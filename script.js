document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const timerDisplay = document.getElementById('timer');
    const timerLabel = document.getElementById('timerLabel');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressInput = document.getElementById('progressInput');
    const todaySessionsEl = document.getElementById('todaySessions');
    const totalMinutesEl = document.getElementById('totalMinutes');
    const dayTimeline = document.getElementById('dayTimeline');
    const historyToggle = document.getElementById('historyToggle');
    const historyPanel = document.getElementById('historyPanel');
    const appWrapper = document.querySelector('.app-wrapper');

    historyToggle.addEventListener('click', () => {
        historyToggle.classList.toggle('active');
        historyPanel.classList.toggle('active');
        appWrapper.classList.toggle('history-active');
        
        if (historyPanel.classList.contains('active')) {
            updateVerticalTimeline(); // Update timeline content when opened
        }
    });

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
        try {
            // Load stats
            const savedStats = localStorage.getItem('pomodoroStats');
            if (savedStats) {
                stats = JSON.parse(savedStats);
                console.log("Loaded stats:", stats);
                updateStatsDisplay();
            }
            
            // Load accomplishments
            const savedAccomplishments = localStorage.getItem('pomodoroAccomplishments');
            if (savedAccomplishments) {
                accomplishments = JSON.parse(savedAccomplishments);
                console.log("Loaded accomplishments:", accomplishments.length);
            }
            
            // Load session history (this will display the timeline)
            loadTimeline();
        } catch (e) {
            console.error("Error loading data:", e);
        }
    };
    
    // Function to update vertical timeline in history panel
    const updateVerticalTimeline = () => {
        // Get the container
        const verticalTimeline = document.getElementById('verticalTimeline');
        
        if (accomplishments.length === 0) {
            verticalTimeline.innerHTML = '<div class="timeline-empty">no history yet. complete focus sessions to build your timeline!</div>';
            return;
        }
        
        // Group accomplishments by date
        const groupedByDate = {};
        accomplishments.forEach(acc => {
            // Use timestamp for more reliable grouping
            const dateKey = new Date(acc.timestamp).toLocaleDateString('en-US');
            
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(acc);
        });
        
        // Clear existing timeline
        verticalTimeline.innerHTML = '';
        
        // Get dates and sort them in descending order (newest first)
        const dates = Object.keys(groupedByDate).sort((a, b) => {
            // Convert date strings to Date objects for comparison
            return new Date(b) - new Date(a);
        });
        
        // Format date nicely
        const formatDate = (dateStr) => {
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    return 'recent'; // Fallback for invalid dates
                }
                
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (date.toDateString() === today.toDateString()) {
                    return 'today';
                } else if (date.toDateString() === yesterday.toDateString()) {
                    return 'yesterday';
                } else {
                    return date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                }
            } catch (e) {
                console.error('Date formatting error:', e);
                return 'recent'; // Fallback for any errors
            }
        };
        
        // Build the timeline HTML
        dates.forEach(date => {
            const dayElement = document.createElement('div');
            dayElement.className = 'timeline-day';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'timeline-day-header';
            dateHeader.textContent = formatDate(date);
            dayElement.appendChild(dateHeader);
            
            // Sort sessions by time (newest first)
            const sortedSessions = groupedByDate[date].sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            // Add each session
            sortedSessions.forEach(session => {
                const sessionElement = document.createElement('div');
                sessionElement.className = 'timeline-session';
                
                let sessionTime;
                try {
                    sessionTime = new Date(session.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                    
                    if (sessionTime === "Invalid Date") {
                        sessionTime = "recent";
                    }
                } catch (e) {
                    console.error('Time formatting error:', e);
                    sessionTime = "recent";
                }
                
                const sessionHeader = document.createElement('div');
                sessionHeader.className = 'timeline-session-header';
                sessionHeader.textContent = sessionTime;
                sessionElement.appendChild(sessionHeader);
                
                const sessionContent = document.createElement('div');
                sessionContent.className = 'timeline-session-content';
                sessionContent.textContent = session.text;
                sessionElement.appendChild(sessionContent);
                
                dayElement.appendChild(sessionElement);
            });
            
            verticalTimeline.appendChild(dayElement);
        });
    };

    // Save data to localStorage
    const saveData = () => {
        localStorage.setItem('pomodoroStats', JSON.stringify(stats));
        localStorage.setItem('pomodoroAccomplishments', JSON.stringify(accomplishments));
        // We also need to save the session history
        localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
        console.log('Data saved. Stats:', stats, 'Sessions:', sessionHistory.length);
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
        document.title = `${formatTime(timeLeft)} - suni pomodoro`;
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
        saveData(); // This will now save the session history too
    };
    
    // Load the timeline from localStorage
    const loadTimeline = () => {
        console.log("Loading timeline...");
        dayTimeline.innerHTML = ''; // Clear any existing segments
        
        try {
            const savedHistory = localStorage.getItem('sessionHistory');
            if (!savedHistory) {
                console.log("No session history found");
                return;
            }
            
            const historyData = JSON.parse(savedHistory);
            if (!Array.isArray(historyData) || historyData.length === 0) {
                console.log("Empty session history");
                return;
            }
            
            console.log("Loaded session history:", historyData.length, "items");
            
            // Only show today's sessions on the timeline
            const today = new Date().toLocaleDateString();
            const todayHistory = historyData.filter(item => {
                if (!item || !item.timestamp) return false;
                try {
                    const itemDate = new Date(item.timestamp).toLocaleDateString();
                    return itemDate === today;
                } catch (e) {
                    console.error("Error filtering session:", e);
                    return false;
                }
            });
            
            if (todayHistory.length === 0) {
                console.log("No sessions for today");
                return;
            }
            
            // Save the filtered history and render it
            sessionHistory = todayHistory;
            console.log("Today's sessions:", sessionHistory.length);
            
            // Render the timeline segments
            sessionHistory.forEach(session => {
                if (!session || !session.type) return;
                
                const segment = document.createElement('div');
                segment.className = `timeline-segment ${session.type}`;
                
                // Calculate width based on duration
                const durationMinutes = session.durationMinutes || 25;
                const percentWidth = (durationMinutes / (12 * 60)) * 100;
                segment.style.width = `${percentWidth}%`;
                
                dayTimeline.appendChild(segment);
            });
            
            // Make sure stats are consistent with the session history
            const focusSessions = sessionHistory.filter(s => s.type === 'focus').length;
            if (focusSessions > 0 && stats.todaySessions === 0) {
                stats.todaySessions = focusSessions;
                stats.totalMinutes = focusSessions * 25;
                updateStatsDisplay();
                saveData();
            }
        } catch (e) {
            console.error("Error loading timeline:", e);
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
                    new Notification('suni', {
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
            date: now.toLocaleDateString('en-US') // Use consistent locale
        };
        
        accomplishments.unshift(accomplishment);
        saveData();
        updateVerticalTimeline();
    };
    
    // Update stats display
    const updateStatsDisplay = () => {
        todaySessionsEl.textContent = stats.todaySessions;
        totalMinutesEl.textContent = stats.totalMinutes;
    };
    
    const checkNewDay = () => {
        const lastDate = localStorage.getItem('pomodoroLastDate');
        const today = new Date().toLocaleDateString('en-US'); // Use consistent locale
        
        console.log("Checking day: Last saved date:", lastDate, "Today:", today);
        
        if (lastDate && lastDate !== today) {
            console.log("New day detected, resetting today's stats");
            // Reset today's sessions
            stats.todaySessions = 0;
            updateStatsDisplay();
            
            // Clear the timeline for the new day
            sessionHistory = [];
            dayTimeline.innerHTML = '';
            
            saveData();
            
            // Save today's date
            localStorage.setItem('pomodoroLastDate', today);
        } else {
            // Same day, make sure the date is saved
            localStorage.setItem('pomodoroLastDate', today);
            console.log("Same day detected, preserving data");
        }
    };
    
    
// Add this function to your script.js file or run in console
window.createWeekOfData = function() {
    console.log("Creating one week of realistic data...");
    
    // Clear existing data
    sessionHistory = [];
    dayTimeline.innerHTML = '';
    accomplishments = [];
    
    // Project categories with tasks
    const projectTasks = {
        design: [
            "Designed wireframes for homepage",
            "Created mockups for mobile app",
            "Updated design system documentation",
            "Finalized color palette for rebrand",
            "Created icon set for navigation",
            "Designed email newsletter template",
            "Made revisions based on client feedback"
        ],
        development: [
            "Fixed CSS compatibility issues in Safari",
            "Implemented responsive layout fixes",
            "Refactored authentication module",
            "Optimized image loading performance",
            "Added form validation",
            "Integrated payment gateway",
            "Fixed mobile navigation bugs"
        ],
        marketing: [
            "Created content for newsletter",
            "Drafted social media campaign posts",
            "Analyzed last campaign metrics",
            "Updated content calendar",
            "Prepared presentation for client",
            "Researched competitor strategies", 
            "Wrote case study for recent project"
        ],
        research: [
            "Conducted user interviews",
            "Analyzed survey results",
            "Created user personas",
            "Tested prototype with users",
            "Compiled research findings report",
            "Planned next round of testing",
            "Reviewed analytics data"
        ]
    };
    
    // Get all project types
    const projectTypes = Object.keys(projectTasks);
    
    // Current date/time
    const now = new Date();
    const today = now.toLocaleDateString('en-US');
    
    // Create a week of history (today + 6 previous days)
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        days.push(date);
    }

    // Add these functions to your script.js file

// Add this at the very end of your script.js file

// Direct mobile timer function
window.mobileStartTimer = function() {
    console.log("Mobile start timer triggered");
    
    // Get DOM elements
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    // Set up variables if they don't exist
    window.timeLeft = window.timeLeft || 25 * 60;
    window.isRunning = window.isRunning || false;
    
    // Don't start if already running
    if (window.isRunning) return;
    
    // Update UI
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    window.isRunning = true;
    
    // Start a reliable interval timer
    if (window.mobileTimer) clearInterval(window.mobileTimer);
    
    window.mobileTimer = setInterval(function() {
      window.timeLeft--;
      
      // Format time
      const mins = Math.floor(window.timeLeft / 60);
      const secs = window.timeLeft % 60;
      const displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      // Update display
      timerDisplay.textContent = displayTime;
      
      // Check if timer is done
      if (window.timeLeft <= 0) {
        clearInterval(window.mobileTimer);
        window.isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        // Handle session completion
        const timerComplete = new CustomEvent('timerComplete');
        document.dispatchEvent(timerComplete);
      }
    }, 1000);
  };
  
  window.mobilePauseTimer = function() {
    console.log("Mobile pause timer triggered");
    
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (!window.isRunning) return;
    
    clearInterval(window.mobileTimer);
    window.isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  };
  
  window.mobileResetTimer = function() {
    console.log("Mobile reset timer triggered");
    
    const timerDisplay = document.getElementById('timer');
    
    // First pause if running
    if (window.isRunning) {
      window.mobilePauseTimer();
    }
    
    // Reset to 25 minutes
    window.timeLeft = 25 * 60;
    timerDisplay.textContent = "25:00";
  };
  
  // Listen for timer completion to trigger normal app functions
  document.addEventListener('timerComplete', function() {
    // Get stats elements
    const todaySessionsEl = document.getElementById('todaySessions');
    const totalMinutesEl = document.getElementById('totalMinutes');
    
    // Get current values
    const currentSessions = parseInt(todaySessionsEl.textContent) || 0;
    const currentMinutes = parseInt(totalMinutesEl.textContent) || 0;
    
    // Update stats
    todaySessionsEl.textContent = (currentSessions + 1).toString();
    totalMinutesEl.textContent = (currentMinutes + 25).toString();
    
    // Add timeline segment
    const dayTimeline = document.getElementById('dayTimeline');
    const segment = document.createElement('div');
    segment.className = "timeline-segment focus";
    segment.style.width = "3.5%";
    dayTimeline.appendChild(segment);
    
    // Save to localStorage (if available)
    try {
      const stats = {
        todaySessions: currentSessions + 1,
        totalMinutes: currentMinutes + 25
      };
      localStorage.setItem('pomodoroStats', JSON.stringify(stats));
    } catch (e) {
      console.error("Error saving stats:", e);
    }
  });
  // Add handler for session complete
  window.handleSessionComplete = function() {
    // Current stats
    const todaySessionsEl = document.getElementById('todaySessions');
    const totalMinutesEl = document.getElementById('totalMinutes');
    
    // Update stats
    const currentSessions = parseInt(todaySessionsEl.textContent) || 0;
    const currentMinutes = parseInt(totalMinutesEl.textContent) || 0;
    
    todaySessionsEl.textContent = currentSessions + 1;
    totalMinutesEl.textContent = currentMinutes + 25;
    
    // Save to localStorage
    const stats = {
      todaySessions: currentSessions + 1,
      totalMinutes: currentMinutes + 25
    };
    
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
    
    // Add segment to timeline
    const dayTimeline = document.getElementById('dayTimeline');
    const segment = document.createElement('div');
    segment.className = "timeline-segment focus";
    segment.style.width = "3.5%"; // 25min as percentage of 12-hour day
    dayTimeline.appendChild(segment);
    
    // If we had session history, we'd update it here
    console.log("Session completed and recorded");
  };
    
    // Days are now in reverse order (today is first)
    
    // Today's history - for timeline
    let todayHistory = [];
    
    // Generate realistic sessions for each day
    days.forEach((day, dayIndex) => {
        const isToday = dayIndex === 0;
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const dateStr = day.toLocaleDateString('en-US');
        
        // Fewer sessions on weekends
        let sessionsForDay;
        if (isWeekend) {
            // 0-3 sessions on weekends (sometimes none)
            sessionsForDay = Math.floor(Math.random() * 4);
            // 70% chance of no sessions on weekends
            if (Math.random() < 0.7 && !isToday) {
                sessionsForDay = 0;
            }
        } else {
            // 3-7 sessions on weekdays
            sessionsForDay = Math.floor(Math.random() * 5) + 3;
        }
        
        // For today, ensure at least 5 sessions
        if (isToday) {
            sessionsForDay = Math.max(sessionsForDay, 5);
        }
        
        // Pick a main project focus for the day
        const mainProject = projectTypes[Math.floor(Math.random() * projectTypes.length)];
        let tasksForDay = [...projectTasks[mainProject]];
        
        // Maybe add 1-2 tasks from another project (30% chance)
        if (Math.random() < 0.3 && sessionsForDay > 3) {
            const secondProject = projectTypes.filter(p => p !== mainProject)[
                Math.floor(Math.random() * (projectTypes.length - 1))
            ];
            tasksForDay = [...tasksForDay, ...projectTasks[secondProject].slice(0, 2)];
        }
        
        // Shuffle tasks
        tasksForDay.sort(() => Math.random() - 0.5);
        
        if (sessionsForDay === 0) {
            console.log(`No sessions for ${dateStr} (weekend)`);
            return;
        }
        
        console.log(`Creating ${sessionsForDay} sessions for ${dateStr}`);
        
        // Create a starting time between 8-10am
        let startHour = 8 + Math.floor(Math.random() * 2);
        let startMinute = Math.floor(Math.random() * 60);
        
        let currentTime = new Date(day);
        currentTime.setHours(startHour, startMinute, 0, 0);
        
        // Generate each session
        for (let i = 0; i < sessionsForDay; i++) {
            // Don't go past 6pm
            if (currentTime.getHours() >= 18) {
                break;
            }
            
            // Create focus session
            const focusStart = new Date(currentTime);
            
            // Add task accomplishment
            const taskText = i < tasksForDay.length ? 
                tasksForDay[i] : 
                `Worked on ${mainProject} tasks`;
            
            accomplishments.push({
                text: taskText,
                timestamp: focusStart.toISOString(),
                date: dateStr
            });
            
            // If today, add to session history for timeline
            if (isToday) {
                todayHistory.push({
                    type: 'focus',
                    durationMinutes: 25,
                    timestamp: focusStart.toISOString()
                });
            }
            
            // Move forward 25 minutes
            currentTime.setTime(currentTime.getTime() + 25 * 60 * 1000);
            
            // Add break (except after last session)
            if (i < sessionsForDay - 1) {
                if (isToday) {
                    todayHistory.push({
                        type: 'break',
                        durationMinutes: 5,
                        timestamp: currentTime.toISOString()
                    });
                }
                
                // Move forward 5 minutes
                currentTime.setTime(currentTime.getTime() + 5 * 60 * 1000);
                
                // Add variable break time between pomodoros
                const breakType = Math.random();
                let breakTime;
                
                if (breakType > 0.8) {
                    // Long break (15-30 min) - 20% chance
                    breakTime = Math.floor(Math.random() * 15) + 15;
                } else {
                    // Regular short break (5-15 min) - 80% chance
                    breakTime = Math.floor(Math.random() * 10) + 5;
                }
                
                currentTime.setTime(currentTime.getTime() + breakTime * 60 * 1000);
                
                // Maybe add a lunch break around noon (60-90 min)
                if (currentTime.getHours() === 12 && currentTime.getMinutes() < 30 && Math.random() < 0.8) {
                    currentTime.setTime(currentTime.getTime() + (Math.floor(Math.random() * 30) + 60) * 60 * 1000);
                }
            }
        }
    });
    
    // Sort accomplishments (newest first)
    accomplishments.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Update session history with today's sessions
    sessionHistory = todayHistory;
    
    // Update stats
    stats.todaySessions = todayHistory.filter(s => s.type === 'focus').length;
    stats.totalMinutes = stats.todaySessions * 25;
    
    // Save data
    saveData();
    localStorage.setItem('pomodoroLastDate', today);
    
    // Update UI
    updateStatsDisplay();
    renderTimeline();
    updateVerticalTimeline();
    
    console.log(`Created realistic week of data with ${accomplishments.length} total sessions`);
    console.log(`Today: ${stats.todaySessions} sessions, ${stats.totalMinutes} minutes`);
    
    return `Created a realistic week of data with ${accomplishments.length} sessions across 7 days`;
};
    
    // Render the timeline
    const renderTimeline = () => {
        // Clear the timeline
        dayTimeline.innerHTML = '';
        
        // Render each segment
        sessionHistory.forEach(session => {
            const segment = document.createElement('div');
            segment.className = `timeline-segment ${session.type}`;
            
            // Calculate width based on duration
            const durationMinutes = session.durationMinutes || 25;
            const percentWidth = (durationMinutes / (12 * 60)) * 100;
            segment.style.width = `${percentWidth}%`;
            
            dayTimeline.appendChild(segment);
        });
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
    updateVerticalTimeline();
    
    // Ensure timeline is displayed
    renderTimeline();
    
    console.log("App initialized successfully");
});