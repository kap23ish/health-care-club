document.addEventListener('DOMContentLoaded', function() {
    // Splash Screen Timer
    const splashScreen = document.getElementById('splash-screen');
    
    // Hide splash screen after 4 seconds
    setTimeout(function() {
        splashScreen.style.opacity = '0';
        setTimeout(function() {
            splashScreen.style.display = 'none';
        }, 500);
    }, 4000);
    
    // DOM Elements
    const waterBox = document.getElementById('water-box');
    const mineralsBox = document.getElementById('minerals-box');
    const vitaminsBox = document.getElementById('vitamins-box');
    const aiCoachButton = document.getElementById('ai-coach-button');
    const calendarModal = document.getElementById('calendar-modal');
    const aiCoachModal = document.getElementById('ai-coach-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const calendarTitle = document.getElementById('calendar-title');
    const habitCalendar = document.getElementById('habit-calendar');
    const currentMonthElement = document.getElementById('current-month');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const chatInput = document.getElementById('chat-input');
    const sendMessageButton = document.getElementById('send-message');
    const chatMessages = document.getElementById('chat-messages');
    const waterGlasses = document.querySelectorAll('.water-glass');
    const waterCount = document.querySelector('.water-count');
    const viewCalendarBtn = document.querySelector('.view-calendar-btn');
    const waterProgressBar = document.getElementById('water-progress');
    const mineralCheckboxes = document.querySelectorAll('.mineral-checkbox input');
    const vitaminCheckboxes = document.querySelectorAll('.vitamin-checkbox input');
    const mineralItems = document.querySelectorAll('.mineral-item');
    const mineralInfos = document.querySelectorAll('.mineral-info');
    const toggleMineralsBtn = document.querySelector('.toggle-minerals-btn');
    const additionalMinerals = document.querySelectorAll('.additional-mineral');

    // Calendar Variables
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedHabit = '';
    let habitData = {
        water: {},
        minerals: {},
        vitamins: {}
    };
    
    // Water tracking variables
    let waterGlassCount = 0;
    let todayDateKey = getTodayDateKey();

    // Minerals tracking
    let mineralsData = {};
    const mineralNames = [
        'calcium', 'iron', 'magnesium', 'zinc', 'potassium',
        'selenium', 'copper', 'iodine', 'manganese', 'phosphorus'
    ];
    
    // Vitamins tracking
    let vitaminsData = {};

    // Load data from localStorage if available
    loadHabitData();
    loadWaterData();
    loadMineralsData();
    loadVitaminsData();
    
    // Initialize mineral info tooltips
    initializeMineralInfo();
    
    // Initialize toggle minerals button
    initializeToggleMineralsButton();

    // Event Listeners
    viewCalendarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCalendar('water', 'Water Intake');
    });
    
    mineralsBox.addEventListener('click', () => openCalendar('minerals', 'Minerals Intake'));
    vitaminsBox.addEventListener('click', () => openCalendar('vitamins', 'Vitamins Intake'));
    aiCoachButton.addEventListener('click', openAICoach);
    
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });

    prevMonthButton.addEventListener('click', () => navigateMonth(-1));
    nextMonthButton.addEventListener('click', () => navigateMonth(1));
    
    sendMessageButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Water glass click events
    waterGlasses.forEach(glass => {
        glass.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering the waterBox click event
            const glassIndex = parseInt(this.getAttribute('data-index'));
            toggleWaterGlass(glassIndex);
        });
    });

    // Mineral checkbox events
    mineralCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation(); // Prevent triggering the mineralsBox click event
            e.preventDefault(); // Prevent default behavior
            const mineralId = this.id;
            const mineralItem = this.closest('.mineral-item');
            
            // Add animation effect
            if (this.checked) {
                mineralItem.style.backgroundColor = 'rgba(155, 89, 182, 0.2)';
                setTimeout(() => {
                    mineralItem.style.backgroundColor = '';
                }, 500);
                
                // Show a congratulatory message
                showMineralCompletionMessage(mineralId);
            }
            
            saveMineralStatus(mineralId, this.checked);
            
            // Update the calendar if this mineral is completed
            updateMineralCalendar();
        });
    });
    
    // Vitamin checkbox events
    vitaminCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation(); // Prevent triggering the vitaminsBox click event
            e.preventDefault(); // Prevent default behavior
            const vitaminId = this.id;
            saveVitaminStatus(vitaminId, this.checked);
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === calendarModal) {
            closeModals();
        }
        if (event.target === aiCoachModal) {
            closeModals();
        }
    });

    // Functions
    function openCalendar(habit, title) {
        selectedHabit = habit;
        calendarTitle.textContent = title + ' Calendar';
        calendarModal.style.display = 'block';
        renderCalendar();
    }

    function openAICoach() {
        aiCoachModal.style.display = 'block';
        // Add glow effect animation
        const glowEffect = document.querySelector('.glow-effect');
        glowEffect.style.opacity = '0.8';
        setTimeout(() => {
            glowEffect.style.opacity = '0';
        }, 1000);
    }

    function closeModals() {
        calendarModal.style.display = 'none';
        aiCoachModal.style.display = 'none';
    }

    function renderCalendar() {
        // Clear previous calendar
        habitCalendar.innerHTML = '';

        // Set current month display
        const monthNames = ['January', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Adjust month index if it's February (index 1)
        let displayMonth = currentMonth;
        if (currentMonth >= 1) { // February or later
            displayMonth = currentMonth + 1; // Skip February
            if (displayMonth > 11) {
                displayMonth = 0; // Wrap around to January
            }
        }
        
        currentMonthElement.textContent = `${monthNames[displayMonth]} ${currentYear}`;

        // Add day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            habitCalendar.appendChild(dayHeader);
        });

        // Get first day of month and total days
        const firstDay = new Date(currentYear, displayMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, displayMonth + 1, 0).getDate();

        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            habitCalendar.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = day;

            // Check if this day has been completed
            const dateKey = `${currentYear}-${displayMonth + 1}-${day}`;
            if (habitData[selectedHabit][dateKey]) {
                dayElement.classList.add('completed');
            }

            // Add click event to toggle completion
            dayElement.addEventListener('click', () => toggleHabitCompletion(day));
            
            habitCalendar.appendChild(dayElement);
        }

        // Auto-advance to next two months if needed
        checkAndAdvanceCalendar();
    }

    function toggleHabitCompletion(day) {
        // Adjust month index if it's February (index 1)
        let displayMonth = currentMonth;
        if (currentMonth >= 1) { // February or later
            displayMonth = currentMonth + 1; // Skip February
            if (displayMonth > 11) {
                displayMonth = 0; // Wrap around to January
            }
        }
        
        const dateKey = `${currentYear}-${displayMonth + 1}-${day}`;
        
        // Toggle completion status
        if (habitData[selectedHabit][dateKey]) {
            delete habitData[selectedHabit][dateKey];
        } else {
            habitData[selectedHabit][dateKey] = true;
        }

        // Save data
        saveHabitData();
        
        // Re-render calendar
        renderCalendar();
    }

    function navigateMonth(direction) {
        currentMonth += direction;
        
        // Skip February (month index 1)
        if (currentMonth === 1) {
            currentMonth += direction; // Skip to March or January
        }
        
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        
        renderCalendar();
    }

    function checkAndAdvanceCalendar() {
        // Get current date
        const now = new Date();
        const currentRealMonth = now.getMonth();
        const currentRealYear = now.getFullYear();
        
        // Calculate difference in months
        const monthDiff = (currentYear - currentRealYear) * 12 + (currentMonth - currentRealMonth);
        
        // If we're viewing a calendar from more than 2 months ago, advance to current month
        if (monthDiff < 0 && Math.abs(monthDiff) >= 2) {
            currentMonth = currentRealMonth;
            // Skip February if current month is February
            if (currentMonth === 1) {
                currentMonth = 2; // Move to March
            }
            currentYear = currentRealYear;
            renderCalendar();
        }
    }

    function saveHabitData() {
        localStorage.setItem('habitData', JSON.stringify(habitData));
    }

    function loadHabitData() {
        const savedData = localStorage.getItem('habitData');
        if (savedData) {
            habitData = JSON.parse(savedData);
        }
    }

    // Water glass functions
    function toggleWaterGlass(index) {
        // If clicking on a glass that's already filled, fill all glasses up to that index
        // If clicking on an empty glass, fill all glasses up to and including that index
        if (index <= waterGlassCount) {
            // User is clicking on an already filled glass or earlier, so set count to index-1
            waterGlassCount = index - 1;
        } else {
            // User is clicking on a new glass, so set count to that index
            waterGlassCount = index;
        }

        // Update the UI
        updateWaterGlassesUI();
        
        // Save the water count for today
        saveWaterData();
    }

    function updateWaterGlassesUI() {
        // Update all glasses based on current count
        waterGlasses.forEach(glass => {
            const glassIndex = parseInt(glass.getAttribute('data-index'));
            if (glassIndex <= waterGlassCount) {
                glass.classList.add('filled');
            } else {
                glass.classList.remove('filled');
            }
        });

        // Update the counter text
        waterCount.textContent = `${waterGlassCount}/9 glasses`;
        
        // Update the progress bar
        const progressPercentage = (waterGlassCount / 9) * 100;
        waterProgressBar.style.width = `${progressPercentage}%`;
    }

    function saveWaterData() {
        // Save water count for today
        const waterData = JSON.parse(localStorage.getItem('waterData') || '{}');
        waterData[todayDateKey] = waterGlassCount;
        localStorage.setItem('waterData', JSON.stringify(waterData));
    }

    function loadWaterData() {
        const waterData = JSON.parse(localStorage.getItem('waterData') || '{}');
        // Check if we have data for today
        if (waterData[todayDateKey] !== undefined) {
            waterGlassCount = waterData[todayDateKey];
            updateWaterGlassesUI();
        }
    }

    // Minerals functions
    function saveMineralStatus(mineralId, isChecked) {
        // Get current minerals data
        const mineralsData = JSON.parse(localStorage.getItem('mineralsData') || '{}');
        
        // If we don't have data for today, create an empty object
        if (!mineralsData[todayDateKey]) {
            mineralsData[todayDateKey] = {};
        }
        
        // Save the status of this mineral
        mineralsData[todayDateKey][mineralId] = isChecked;
        
        // Save to localStorage
        localStorage.setItem('mineralsData', JSON.stringify(mineralsData));
    }

    function loadMineralsData() {
        const mineralsData = JSON.parse(localStorage.getItem('mineralsData') || '{}');
        
        // Check if we have data for today
        if (mineralsData[todayDateKey]) {
            // Update checkboxes based on saved data
            mineralCheckboxes.forEach(checkbox => {
                if (mineralsData[todayDateKey][checkbox.id] !== undefined) {
                    checkbox.checked = mineralsData[todayDateKey][checkbox.id];
                    
                    // Apply visual effect to checked items
                    if (checkbox.checked) {
                        const mineralItem = checkbox.closest('.mineral-item');
                        mineralItem.style.backgroundColor = 'rgba(155, 89, 182, 0.1)';
                    }
                }
            });
        }
    }
    
    function updateMineralCalendar() {
        // Check if all minerals are checked for today
        let allMineralsChecked = true;
        const requiredMinerals = mineralNames.map(name => `${name}-check`);
        
        requiredMinerals.forEach(mineralId => {
            const checkbox = document.getElementById(mineralId);
            if (checkbox && !checkbox.checked) {
                allMineralsChecked = false;
            }
        });
        
        // If all minerals are checked, mark today as completed in the calendar
        if (allMineralsChecked) {
            habitData.minerals[todayDateKey] = true;
            saveHabitData();
        } else {
            // If not all minerals are checked but the day was previously marked as completed, unmark it
            if (habitData.minerals[todayDateKey]) {
                delete habitData.minerals[todayDateKey];
                saveHabitData();
            }
        }
    }

    // Vitamins functions
    function saveVitaminStatus(vitaminId, isChecked) {
        // Get current vitamins data
        const vitaminsData = JSON.parse(localStorage.getItem('vitaminsData') || '{}');
        
        // If we don't have data for today, create an empty object
        if (!vitaminsData[todayDateKey]) {
            vitaminsData[todayDateKey] = {};
        }
        
        // Save the status of this vitamin
        vitaminsData[todayDateKey][vitaminId] = isChecked;
        
        // Save to localStorage
        localStorage.setItem('vitaminsData', JSON.stringify(vitaminsData));
    }

    function loadVitaminsData() {
        const vitaminsData = JSON.parse(localStorage.getItem('vitaminsData') || '{}');
        
        // Check if we have data for today
        if (vitaminsData[todayDateKey]) {
            // Update checkboxes based on saved data
            vitaminCheckboxes.forEach(checkbox => {
                if (vitaminsData[todayDateKey][checkbox.id] !== undefined) {
                    checkbox.checked = vitaminsData[todayDateKey][checkbox.id];
                }
            });
        }
    }

    function getTodayDateKey() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;

        // Add user message to chat
        addMessageToChat(message, 'user');
        
        // Clear input
        chatInput.value = '';
        
        // Get AI response
        setTimeout(() => {
            const response = getAIResponse(message);
            addMessageToChat(response, 'ai');
        }, 500);
    }

    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message;
        
        messageElement.appendChild(messageContent);
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getAIResponse(message) {
        // Enhanced health-related responses with focus on addressing problems
        const healthResponses = {
            water: [
                "I understand it can be challenging to drink enough water. Try setting reminders on your phone, using a marked water bottle, or adding natural flavors like lemon or cucumber. What specific difficulty are you having with drinking water?",
                "If you're struggling to drink water, try connecting it with existing habits - drink a glass after brushing teeth or before each meal. Would you like more practical tips to increase your water intake?",
                "Many people find it hard to stay hydrated. Instead of focusing on 8 glasses, start with small increases - just one extra glass today. Have you tried tracking your water intake in this app?"
            ],
            exercise: [
                "Finding it hard to exercise regularly? Start with just 5-10 minutes of activity you enjoy. Even short walks count! What type of movement would feel good to you right now?",
                "Exercise doesn't have to mean intense workouts. Dancing, gardening, or taking the stairs all count. What's one small active change you could make to your routine today?",
                "If you're struggling with motivation to exercise, try scheduling it like any other appointment or finding an accountability partner. What's been your biggest barrier to staying active?"
            ],
            nutrition: [
                "Eating healthier doesn't mean changing everything at once. Could you add one extra vegetable to your day? Small changes are more sustainable than complete diet overhauls.",
                "If you're finding it difficult to eat well, try meal prepping on weekends or keeping healthy snacks visible and accessible. What specific nutrition challenges are you facing?",
                "Many people struggle with nutrition. Instead of focusing on foods to avoid, can you think of nutritious foods you actually enjoy? Let's start by adding those more frequently."
            ],
            sleep: [
                "Having trouble sleeping? Try creating a consistent bedtime routine and limiting screen time an hour before bed. What part of sleep is most challenging for you?",
                "Poor sleep can be frustrating. Consider your sleep environment - is your room dark, quiet, and cool? Sometimes small adjustments to your space can make a big difference.",
                "If you're struggling with sleep, tracking your habits might help identify patterns. Are you consuming caffeine late in the day or exercising close to bedtime?"
            ],
            vitamins: [
                "If you're concerned about vitamin intake, focus first on whole foods. The vitamins section in this app can help you track which food sources you're consuming. Which vitamins are you most concerned about?",
                "Struggling to get enough vitamins? Try adding a colorful variety of fruits and vegetables to your meals. The more colors on your plate, the wider range of nutrients you're likely getting.",
                "Many people find it challenging to get all their vitamins from food. Which specific vitamins are you concerned about, and would you like some easy food suggestions?"
            ],
            minerals: [
                "If you're having trouble getting enough minerals, small additions like seeds on salads or yogurt can help. The minerals tracker in this app can guide you. Which minerals are you most concerned about?",
                "Mineral deficiencies are common. Try incorporating more whole foods like beans, nuts, and leafy greens. Have you checked which minerals you might be missing in your diet?",
                "If you're finding it difficult to get enough minerals, consider how you prepare foods - cooking in cast iron can add iron, and adding lemon to spinach helps with iron absorption. What specific minerals are you concerned about?"
            ],
            stress: [
                "Stress management is essential for overall health. Even 5 minutes of deep breathing or meditation can make a difference. What specific stressors are you dealing with right now?",
                "If you're feeling stressed, try the 5-5-5 technique: breathe in for 5 seconds, hold for 5, and exhale for 5. Would you like more simple stress reduction techniques?",
                "Many people are dealing with high stress levels. Physical activity, even just a short walk, can help reduce stress hormones. What stress management strategies have worked for you in the past?"
            ],
            motivation: [
                "Motivation fluctuates naturally. Instead of waiting for motivation, try building small habits that don't require much willpower. What health habit would you like to make easier?",
                "If you're struggling with motivation, try setting very small, specific goals - like drinking one extra glass of water or taking a 5-minute walk. What tiny step could you take today?",
                "Many people find motivation challenging. Consider your 'why' - the deeper reason you want to be healthier. Connecting to this purpose can help during difficult times. What's your main reason for wanting to improve your health?"
            ]
        };

        // Check for problem-related keywords
        const problemKeywords = ["problem", "difficult", "struggle", "hard", "can't", "cannot", "trouble", "help", "how do I", "how to"];
        const messageLower = message.toLowerCase();
        let isProblemQuestion = problemKeywords.some(keyword => messageLower.includes(keyword));
        
        // Default response if no specific health topic is detected
        let response = "I'm here to help with your health journey. Could you tell me more about what specific health area you're interested in or struggling with?";

        // Check for health-related keywords in the message
        for (const [topic, responses] of Object.entries(healthResponses)) {
            if (messageLower.includes(topic)) {
                // If it's a problem question, prioritize responses that address challenges
                if (isProblemQuestion) {
                    response = responses[0]; // First response in each category addresses problems
                } else {
                    // Randomly select a response from the topic
                    response = responses[Math.floor(Math.random() * responses.length)];
                }
                break;
            }
        }
        
        // If it's a problem question but no specific health topic was found
        if (isProblemQuestion && response === "I'm here to help with your health journey. Could you tell me more about what specific health area you're interested in or struggling with?") {
            response = "I understand you're facing a challenge. To provide the most helpful advice, could you share which specific health habit you're struggling with? Is it related to water, nutrition, exercise, sleep, or something else?";
        }

        return response;
    }

    // Initialize toggle minerals button
    function initializeToggleMineralsButton() {
        if (toggleMineralsBtn) {
            toggleMineralsBtn.addEventListener('click', function() {
                const isShowing = toggleMineralsBtn.textContent === 'Show Less Minerals';
                
                additionalMinerals.forEach(mineral => {
                    if (isShowing) {
                        mineral.style.display = 'none';
                        toggleMineralsBtn.textContent = 'Show More Minerals';
                    } else {
                        mineral.style.display = 'flex';
                        toggleMineralsBtn.textContent = 'Show Less Minerals';
                    }
                });
            });
        }
    }
    
    // Initialize mineral info tooltips
    function initializeMineralInfo() {
        // Add event listeners for mineral items
        mineralItems.forEach(item => {
            // Check if we're on mobile
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                // On mobile, use tap/click to show info
                item.addEventListener('click', function(e) {
                    // Don't show tooltip if this is an additional mineral that's hidden
                    if (item.classList.contains('additional-mineral') && 
                        item.style.display === 'none') {
                        return;
                    }
                    
                    e.stopPropagation(); // Prevent calendar from opening
                    
                    // Hide all other tooltips first
                    mineralItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            const otherInfo = otherItem.querySelector('.mineral-info');
                            if (otherInfo) {
                                otherInfo.style.opacity = '0';
                                otherInfo.style.visibility = 'hidden';
                            }
                        }
                    });
                    
                    // Toggle this tooltip
                    const info = this.querySelector('.mineral-info');
                    if (info) {
                        if (info.style.visibility === 'visible') {
                            info.style.opacity = '0';
                            info.style.visibility = 'hidden';
                        } else {
                            info.style.opacity = '1';
                            info.style.visibility = 'visible';
                            
                            // Auto-hide after 3 seconds
                            setTimeout(() => {
                                info.style.opacity = '0';
                                info.style.visibility = 'hidden';
                            }, 3000);
                        }
                    }
                });
                
                // Add tap event to checkboxes to prevent tooltip from showing
                const checkbox = item.querySelector('.mineral-checkbox');
                if (checkbox) {
                    checkbox.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                }
            } else {
                // On desktop, use hover
                item.addEventListener('mouseenter', function() {
                    const info = this.querySelector('.mineral-info');
                    if (info) {
                        info.style.opacity = '1';
                        info.style.visibility = 'visible';
                    }
                });
                
                item.addEventListener('mouseleave', function() {
                    const info = this.querySelector('.mineral-info');
                    if (info) {
                        info.style.opacity = '0';
                        info.style.visibility = 'hidden';
                    }
                });
            }
        });
        
        // Add window resize listener to update behavior
        window.addEventListener('resize', function() {
            // Reinitialize on resize
            initializeMineralInfo();
        });
    }
    
    // Show mineral completion message
    function showMineralCompletionMessage(mineralId) {
        const mineralName = mineralId.replace('-check', '');
        const capitalizedName = mineralName.charAt(0).toUpperCase() + mineralName.slice(1);
        
        // Create a floating message
        const message = document.createElement('div');
        message.className = 'floating-message';
        message.textContent = `Great! You've consumed ${capitalizedName} today!`;
        
        // Add the message to the minerals box
        mineralsBox.appendChild(message);
        
        // Animate and remove after animation
        setTimeout(() => {
            message.classList.add('show');
            
            setTimeout(() => {
                message.classList.remove('show');
                setTimeout(() => {
                    message.remove();
                }, 500);
            }, 2000);
        }, 100);
    }

    // Health Tips with categories
    const healthTips = {
        hydration: [
            "Start your day with a glass of water to boost metabolism and energy levels.",
            "Keep a water bottle with you to stay hydrated throughout the day.",
            "Drink water before, during, and after exercise for optimal performance.",
            "Add lemon or cucumber to your water for a refreshing twist."
        ],
        exercise: [
            "Take short breaks every hour to stretch and move around.",
            "Take the stairs instead of the elevator when possible.",
            "Go for a 15-minute walk during your lunch break.",
            "Try a quick 5-minute workout between meetings."
        ],
        nutrition: [
            "Include a variety of colorful vegetables in your meals for better nutrition.",
            "Include protein in every meal to maintain muscle mass.",
            "Practice mindful eating by chewing slowly and savoring each bite.",
            "Prepare healthy snacks in advance to avoid unhealthy choices."
        ],
        sleep: [
            "Get 7-8 hours of sleep for optimal health and recovery.",
            "Create a relaxing bedtime routine to improve sleep quality.",
            "Keep your bedroom cool and dark for better sleep.",
            "Avoid screens at least 1 hour before bedtime."
        ],
        stress: [
            "Practice deep breathing for 5 minutes to reduce stress.",
            "Get outside for at least 15 minutes of sunlight daily.",
            "Try meditation or mindfulness exercises.",
            "Take regular breaks to clear your mind."
        ]
    };

    const achievements = [
        { id: 'water-master', name: 'Hydration Hero', icon: 'fa-tint', description: 'Drink 9 glasses of water for 7 days straight' },
        { id: 'mineral-master', name: 'Mineral Master', icon: 'fa-tablets', description: 'Complete all minerals for 5 days' },
        { id: 'vitamin-master', name: 'Vitamin Victor', icon: 'fa-capsules', description: 'Complete all vitamins for 5 days' },
        { id: 'streak-master', name: 'Streak Star', icon: 'fa-fire', description: 'Maintain a 14-day streak' },
        { id: 'perfect-day', name: 'Perfect Day', icon: 'fa-star', description: 'Achieve 100% health score' },
        { id: 'early-bird', name: 'Early Bird', icon: 'fa-sun', description: 'Complete all tasks before 10 AM' },
        { id: 'weekend-warrior', name: 'Weekend Warrior', icon: 'fa-calendar-check', description: 'Maintain perfect health score over the weekend' },
        { id: 'monthly-master', name: 'Monthly Master', icon: 'fa-calendar-alt', description: 'Achieve 80% health score for an entire month' }
    ];

    // Initialize health score and achievements
    function initializeHealthScore() {
        updateHealthScore();
        updateAchievements();
        updateDailyTip();
        updateProgressStats();
        initializeWeeklyReport();
    }

    function updateHealthScore() {
        const waterScore = Math.min((waterGlassCount / 9) * 30, 30);
        const mineralsScore = calculateMineralsScore();
        const vitaminsScore = calculateVitaminsScore();
        
        const totalScore = Math.round(waterScore + mineralsScore + vitaminsScore);
        
        document.getElementById('health-score').textContent = totalScore;
        document.getElementById('water-score').textContent = Math.round(waterScore);
        document.getElementById('minerals-score').textContent = Math.round(mineralsScore);
        document.getElementById('vitamins-score').textContent = Math.round(vitaminsScore);
    }

    function calculateMineralsScore() {
        let checkedCount = 0;
        mineralCheckboxes.forEach(checkbox => {
            if (checkbox.checked) checkedCount++;
        });
        return (checkedCount / mineralCheckboxes.length) * 30;
    }

    function calculateVitaminsScore() {
        let checkedCount = 0;
        vitaminCheckboxes.forEach(checkbox => {
            if (checkbox.checked) checkedCount++;
        });
        return (checkedCount / vitaminCheckboxes.length) * 40;
    }

    function updateAchievements() {
        const badgesContainer = document.getElementById('badges-container');
        badgesContainer.innerHTML = '';
        
        achievements.forEach(achievement => {
            const badge = document.createElement('div');
            badge.className = 'badge';
            if (isAchievementEarned(achievement.id)) {
                badge.classList.add('earned');
            }
            
            badge.innerHTML = `
                <i class="fas ${achievement.icon}"></i>
                <span>${achievement.name}</span>
            `;
            
            badgesContainer.appendChild(badge);
        });
    }

    function isAchievementEarned(achievementId) {
        const earnedAchievements = JSON.parse(localStorage.getItem('earnedAchievements') || '[]');
        return earnedAchievements.includes(achievementId);
    }

    function updateDailyTip() {
        const categories = Object.keys(healthTips);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const tips = healthTips[randomCategory];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        const tipElement = document.getElementById('daily-tip');
        tipElement.textContent = randomTip;
        
        // Add category icon based on the tip
        const tipCard = document.querySelector('.tip-card');
        const icon = tipCard.querySelector('i');
        icon.className = 'fas ' + getCategoryIcon(randomCategory);
    }

    function getCategoryIcon(category) {
        const icons = {
            hydration: 'fa-tint',
            exercise: 'fa-running',
            nutrition: 'fa-apple-alt',
            sleep: 'fa-moon',
            stress: 'fa-heart'
        };
        return icons[category] || 'fa-lightbulb';
    }

    function updateProgressStats() {
        const streak = calculateStreak();
        const weeklyAverage = calculateWeeklyAverage();
        const bestDay = calculateBestDay();
        const achievementCount = calculateAchievementCount();
        const monthlyProgress = calculateMonthlyProgress();
        const weekendProgress = calculateWeekendProgress();
        
        document.getElementById('current-streak').textContent = `${streak} days`;
        document.getElementById('weekly-average').textContent = `${weeklyAverage}%`;
        document.getElementById('best-day').textContent = `${bestDay}%`;
        document.getElementById('achievement-count').textContent = `${achievementCount}/${achievements.length}`;
    }

    function calculateStreak() {
        let streak = 0;
        let currentDate = new Date();
        let waterData = JSON.parse(localStorage.getItem('waterData') || '{}');
        
        while (true) {
            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
            if (waterData[dateKey] >= 9) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    function calculateWeeklyAverage() {
        let totalScore = 0;
        let count = 0;
        let currentDate = new Date();
        
        for (let i = 0; i < 7; i++) {
            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
            const waterData = JSON.parse(localStorage.getItem('waterData') || '{}');
            const mineralsData = JSON.parse(localStorage.getItem('mineralsData') || '{}');
            const vitaminsData = JSON.parse(localStorage.getItem('vitaminsData') || '{}');
            
            const waterScore = (waterData[dateKey] || 0) / 9 * 30;
            const mineralsScore = calculateMineralsScoreForDate(dateKey, mineralsData);
            const vitaminsScore = calculateVitaminsScoreForDate(dateKey, vitaminsData);
            
            totalScore += waterScore + mineralsScore + vitaminsScore;
            count++;
            
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return Math.round(totalScore / count);
    }

    function calculateBestDay() {
        let bestScore = 0;
        let waterData = JSON.parse(localStorage.getItem('waterData') || '{}');
        let mineralsData = JSON.parse(localStorage.getItem('mineralsData') || '{}');
        let vitaminsData = JSON.parse(localStorage.getItem('vitaminsData') || '{}');
        
        Object.keys(waterData).forEach(dateKey => {
            const waterScore = (waterData[dateKey] || 0) / 9 * 30;
            const mineralsScore = calculateMineralsScoreForDate(dateKey, mineralsData);
            const vitaminsScore = calculateVitaminsScoreForDate(dateKey, vitaminsData);
            
            const totalScore = waterScore + mineralsScore + vitaminsScore;
            bestScore = Math.max(bestScore, totalScore);
        });
        
        return Math.round(bestScore);
    }

    function calculateAchievementCount() {
        const earnedAchievements = JSON.parse(localStorage.getItem('earnedAchievements') || '[]');
        return earnedAchievements.length;
    }

    function calculateMineralsScoreForDate(dateKey, mineralsData) {
        if (!mineralsData[dateKey]) return 0;
        
        let checkedCount = 0;
        mineralCheckboxes.forEach(checkbox => {
            if (mineralsData[dateKey][checkbox.id]) checkedCount++;
        });
        
        return (checkedCount / mineralCheckboxes.length) * 30;
    }

    function calculateVitaminsScoreForDate(dateKey, vitaminsData) {
        if (!vitaminsData[dateKey]) return 0;
        
        let checkedCount = 0;
        vitaminCheckboxes.forEach(checkbox => {
            if (vitaminsData[dateKey][checkbox.id]) checkedCount++;
        });
        
        return (checkedCount / vitaminCheckboxes.length) * 40;
    }

    // Weekly Report Chart
    function initializeWeeklyReport() {
        const prevWeekButton = document.getElementById('prev-week');
        const nextWeekButton = document.getElementById('next-week');
        let currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        
        updateWeeklyReport(currentWeekStart);
        
        prevWeekButton.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            updateWeeklyReport(currentWeekStart);
        });
        
        nextWeekButton.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            updateWeeklyReport(currentWeekStart);
        });
    }

    function updateWeeklyReport(weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        document.getElementById('week-start').textContent = formatDate(weekStart);
        
        const chartData = generateChartData(weekStart, weekEnd);
        updateChart(chartData);
        updateReportSummary(chartData);
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function generateChartData(weekStart, weekEnd) {
        const data = [];
        let currentDate = new Date(weekStart);
        
        while (currentDate <= weekEnd) {
            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
            const waterData = JSON.parse(localStorage.getItem('waterData') || '{}');
            const mineralsData = JSON.parse(localStorage.getItem('mineralsData') || '{}');
            const vitaminsData = JSON.parse(localStorage.getItem('vitaminsData') || '{}');
            
            const waterScore = (waterData[dateKey] || 0) / 9 * 30;
            const mineralsScore = calculateMineralsScoreForDate(dateKey, mineralsData);
            const vitaminsScore = calculateVitaminsScoreForDate(dateKey, vitaminsData);
            
            data.push({
                date: formatDate(currentDate),
                score: waterScore + mineralsScore + vitaminsScore
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return data;
    }

    function updateChart(data) {
        const chartContainer = document.getElementById('weekly-chart');
        chartContainer.innerHTML = '';
        
        const maxScore = Math.max(...data.map(d => d.score));
        const barWidth = 100 / data.length;
        
        data.forEach(item => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.width = `${barWidth}%`;
            bar.style.height = `${(item.score / maxScore) * 100}%`;
            bar.style.backgroundColor = `hsl(${(item.score / maxScore) * 120}, 70%, 50%)`;
            bar.title = `${item.date}: ${Math.round(item.score)}%`;
            
            chartContainer.appendChild(bar);
        });
    }

    function updateReportSummary(data) {
        const scores = data.map(d => d.score);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        
        document.getElementById('most-improved').textContent = 
            `From ${Math.round(minScore)}% to ${Math.round(maxScore)}%`;
        
        const areasToFocus = [];
        if (maxScore < 100) areasToFocus.push('Overall Health Score');
        if (waterGlassCount < 9) areasToFocus.push('Water Intake');
        if (calculateMineralsScore() < 30) areasToFocus.push('Minerals');
        if (calculateVitaminsScore() < 40) areasToFocus.push('Vitamins');
        
        document.getElementById('areas-to-focus').textContent = 
            areasToFocus.join(', ') || 'Great job! Keep it up!';
    }

    // Add event listeners for updating health score
    waterGlasses.forEach(glass => {
        glass.addEventListener('click', function(e) {
            e.stopPropagation();
            const glassIndex = parseInt(this.getAttribute('data-index'));
            toggleWaterGlass(glassIndex);
            updateHealthScore();
            checkAchievements();
        });
    });

    mineralCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
            const mineralId = this.id;
            saveMineralStatus(mineralId, this.checked);
            updateHealthScore();
            checkAchievements();
        });
    });

    vitaminCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
            const vitaminId = this.id;
            saveVitaminStatus(vitaminId, this.checked);
            updateHealthScore();
            checkAchievements();
        });
    });

    function checkAchievements() {
        const earnedAchievements = JSON.parse(localStorage.getItem('earnedAchievements') || '[]');
        
        achievements.forEach(achievement => {
            if (!earnedAchievements.includes(achievement.id)) {
                if (isAchievementEarned(achievement.id)) {
                    earnedAchievements.push(achievement.id);
                    showAchievementNotification(achievement);
                }
            }
        });
        
        localStorage.setItem('earnedAchievements', JSON.stringify(earnedAchievements));
        updateAchievements();
        updateProgressStats();
    }

    function showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <i class="fas ${achievement.icon}"></i>
            <div class="notification-content">
                <h3>New Achievement!</h3>
                <p>${achievement.name}</p>
                <small>${achievement.description}</small>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 3000);
        }, 100);
    }

    function calculateMonthlyProgress() {
        let totalScore = 0;
        let count = 0;
        let currentDate = new Date();
        let firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        while (currentDate >= firstDayOfMonth) {
            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
            const waterData = JSON.parse(localStorage.getItem('waterData') || '{}');
            const mineralsData = JSON.parse(localStorage.getItem('mineralsData') || '{}');
            const vitaminsData = JSON.parse(localStorage.getItem('vitaminsData') || '{}');
            
            const waterScore = (waterData[dateKey] || 0) / 9 * 30;
            const mineralsScore = calculateMineralsScoreForDate(dateKey, mineralsData);
            const vitaminsScore = calculateVitaminsScoreForDate(dateKey, vitaminsData);
            
            totalScore += waterScore + mineralsScore + vitaminsScore;
            count++;
            
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return Math.round(totalScore / count);
    }

    function calculateWeekendProgress() {
        let totalScore = 0;
        let count = 0;
        let currentDate = new Date();
        
        // Go back up to 4 weekends
        for (let i = 0; i < 4; i++) {
            while (currentDate.getDay() !== 0) {
                currentDate.setDate(currentDate.getDate() - 1);
            }
            
            const saturday = new Date(currentDate);
            saturday.setDate(saturday.getDate() - 1);
            
            const saturdayKey = `${saturday.getFullYear()}-${saturday.getMonth() + 1}-${saturday.getDate()}`;
            const sundayKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
            
            const waterData = JSON.parse(localStorage.getItem('waterData') || '{}');
            const mineralsData = JSON.parse(localStorage.getItem('mineralsData') || '{}');
            const vitaminsData = JSON.parse(localStorage.getItem('vitaminsData') || '{}');
            
            const saturdayScore = calculateDayScore(saturdayKey, waterData, mineralsData, vitaminsData);
            const sundayScore = calculateDayScore(sundayKey, waterData, mineralsData, vitaminsData);
            
            totalScore += saturdayScore + sundayScore;
            count += 2;
            
            currentDate.setDate(currentDate.getDate() - 7);
        }
        
        return Math.round(totalScore / count);
    }

    function calculateDayScore(dateKey, waterData, mineralsData, vitaminsData) {
        const waterScore = (waterData[dateKey] || 0) / 9 * 30;
        const mineralsScore = calculateMineralsScoreForDate(dateKey, mineralsData);
        const vitaminsScore = calculateVitaminsScoreForDate(dateKey, vitaminsData);
        return waterScore + mineralsScore + vitaminsScore;
    }

    // Initialize all new features
    initializeHealthScore();

    // Initialize calendar on load
    renderCalendar();
}); 