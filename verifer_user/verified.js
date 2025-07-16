document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.setHeaderColor('#060137');
    tg.setBackgroundColor('#060137');

    // Элементы DOM
    const startCheckBtn = document.getElementById('start-check');
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    const progressStage = document.getElementById('progress-stage');
    const vulnerabilitiesContainer = document.getElementById('vulnerabilities');
    const vulnerabilitiesList = document.getElementById('vulnerabilities-list');
    const vulnerabilitiesCount = document.getElementById('vulnerabilities-count');
    const copyableItems = document.querySelectorAll('.copyable');

    // Вибрация
    const vibrate = (type = 'light') => {
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred(type);
        }
    };

    // Заполняем данные пользователя
    if (tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('username').textContent = 
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь';
        document.getElementById('user-id').textContent = user.id || 'N/A';
        document.getElementById('user-id-container').setAttribute('data-value', user.id || '');
        document.getElementById('user-tag').textContent = user.username || 'N/A';
        document.getElementById('user-tag-container').setAttribute('data-value', user.username || '');
        
        if (user.photo_url) {
            document.getElementById('user-avatar').src = user.photo_url;
        }

        if (window.sendToBot) {
            window.sendToBot('verified_enter', {
                userId: user.id,
                username: user.username
            });
        }
    }

    // Копирование данных при клике
    copyableItems.forEach(item => {
        item.addEventListener('click', () => {
            const value = item.getAttribute('data-value');
            if (value) {
                navigator.clipboard.writeText(value).then(() => {
                    vibrate('light');
                    const originalText = item.querySelector('.meta-value').textContent;
                    item.querySelector('.meta-value').textContent = 'Скопировано!';
                    setTimeout(() => {
                        item.querySelector('.meta-value').textContent = originalText;
                    }, 2000);
                });
            }
        });
    });

    // Обработчик кнопки проверки
    startCheckBtn.addEventListener('click', () => {
        startCheckBtn.classList.add('loading');
        startCheckBtn.innerHTML = '<div class="loader"></div> Проверка...';
        vulnerabilitiesContainer.classList.add('hidden');
        
        if (window.sendToBot) {
            window.sendToBot('security_check_start', {
                userId: tg.initDataUnsafe.user?.id
            });
        }
        
        startSecurityCheck();
    });

    // Функция проверки безопасности
    function startSecurityCheck() {
        let progress = 0;
        const duration = 30000; // 3 секунды для демонстрации
        const interval = 30; // Обновление каждые 30мс
        const steps = duration / interval;
        const increment = 100 / steps;
        
        const checkInterval = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(checkInterval);
                setTimeout(completeCheck, 300);
            }
            
            updateProgress(progress);
        }, interval);
    }

    // Обновление прогресс-бара
    function updateProgress(percent) {
        const rounded = Math.round(percent);
        
        // Анимация заполнения
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = rounded;
        
        // Стадии проверки
        if (percent < 25) {
            progressStage.textContent = 'Проверка настроек';
        } else if (percent < 50) {
            progressStage.textContent = 'Анализ активности';
        } else if (percent < 75) {
            progressStage.textContent = 'Проверка безопасности';
        } else {
            progressStage.textContent = 'Завершение проверки';
        }
        
        // Вибрация при переходе между стадиями
        if (percent % 25 === 0) {
            vibrate('light');
        }
    }

    // Функция для создания элемента уязвимости
    function createVulnerabilityItem(title, description) {
        const item = document.createElement('div');
        item.className = 'vulnerability-item';
        
        item.innerHTML = `
            <div class="vulnerability-header">
                <h4 class="vulnerability-title">${title}</h4>
                <span class="toggle-icon">▼</span>
            </div>
            <div class="vulnerability-details">
                <p>${description}</p>
                <button class="fix-btn">Исправить</button>
            </div>
        `;
        
        // Обработчик клика для раскрытия/скрытия деталей
        const header = item.querySelector('.vulnerability-header');
        const details = item.querySelector('.vulnerability-details');
        const icon = item.querySelector('.toggle-icon');
        
        header.addEventListener('click', (e) => {
            details.classList.toggle('active');
            icon.textContent = details.classList.contains('active') ? '▲' : '▼';
            vibrate('light');
        });
        
        // Обработчик кнопки "Исправить"
        const fixBtn = item.querySelector('.fix-btn');
        fixBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            vibrate('medium');
            tg.showAlert(`Попытка исправить: ${title}`);
        });
        
        return item;
    }

    // Завершение проверки
    function completeCheck() {
        vibrate('heavy');
        
        if (window.sendToBot) {
            window.sendToBot('security_check_complete', {
                userId: tg.initDataUnsafe.user?.id,
                vulnerabilities: 3
            });
        }
        
        showVulnerabilities();
        
        progressStage.textContent = 'Проверка завершена!';
        startCheckBtn.classList.remove('loading');
        startCheckBtn.textContent = 'Проверить снова';
        
        tg.showAlert('Проверка завершена! Найдено 3 потенциальных уязвимости.');
    }

    // Показать список уязвимостей
    function showVulnerabilities() {
        vulnerabilitiesList.innerHTML = '';
        
        const vulnerabilities = [
            {
                title: "Слабый пароль",
                description: "Ваш пароль может быть легко взломан. Рекомендуем использовать комбинацию букв, цифр и специальных символов длиной не менее 12 знаков."
            },
            {
                title: "Отсутствие 2FA",
                description: "Двухфакторная аутентификация не включена. Это значительно повышает риск взлома вашего аккаунта. Включите 2FA в настройках безопасности."
            },
            {
                title: "Подозрительная активность",
                description: "Обнаружены необычные действия в вашем аккаунте за последние 30 дней. Рекомендуем сменить пароль и проверить историю входов."
            }
        ];
        
        vulnerabilities.forEach(vuln => {
            vulnerabilitiesList.appendChild(createVulnerabilityItem(vuln.title, vuln.description));
        });
        
        vulnerabilitiesCount.textContent = vulnerabilities.length;
        vulnerabilitiesContainer.classList.remove('hidden');
    }
});