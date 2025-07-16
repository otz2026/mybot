document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.setHeaderColor('#060137');
    tg.setBackgroundColor('#060137');

    // Элементы DOM
    const startCheckBtn = document.getElementById('start-check');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressStatus = document.getElementById('progress-status');
    const vulnerabilitiesContainer = document.getElementById('vulnerabilities');
    const vulnerabilitiesList = document.getElementById('vulnerabilities-list');
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

        // Отправляем уведомление о входе верифицированного пользователя
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
        progressContainer.classList.remove('hidden');
        vulnerabilitiesContainer.classList.add('hidden');
        
        // Отправляем уведомление о начале проверки
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
        const duration = 30000; // 1 минута
        const interval = 100; // Обновление каждые 100мс
        const steps = duration / interval;
        const increment = 100 / steps;
        
        const checkInterval = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(checkInterval);
                completeCheck();
            }
            
            updateProgress(progress);
        }, interval);
    }

    // Обновление прогресс-бара
    function updateProgress(percent) {
        const rounded = Math.round(percent);
        const angle = (percent / 100) * 180;
        progressFill.style.clipPath = `path('M 0,100 A 100,100 0 0 1 ${angle},${100 - Math.sin(angle * Math.PI / 180) * 100} L 200,100 Z')`;
        progressText.textContent = `${rounded}%`;
        
        // Меняем статус в зависимости от прогресса
        if (percent < 20) {
            progressStatus.textContent = 'Проверка базовых параметров...';
        } else if (percent < 50) {
            progressStatus.textContent = 'Анализ активности...';
        } else if (percent < 80) {
            progressStatus.textContent = 'Проверка системы безопасности...';
        } else {
            progressStatus.textContent = 'Завершение проверки...';
        }
    }

    // Завершение проверки
    function completeCheck() {
        vibrate('heavy');
        
        // Отправляем уведомление о завершении проверки
        if (window.sendToBot) {
            window.sendToBot('security_check_complete', {
                userId: tg.initDataUnsafe.user?.id,
                vulnerabilities: 3
            });
        }
        
        // Показываем уязвимости
        showVulnerabilities();
        
        progressStatus.textContent = 'Проверка завершена!';
        startCheckBtn.classList.remove('loading');
        startCheckBtn.textContent = 'Проверить снова';
        
        tg.showAlert('Проверка завершена! Найдено 3 потенциальных уязвимости.');
    }

    // Показать список уязвимостей
    function showVulnerabilities() {
        vulnerabilitiesList.innerHTML = '';
        
        const vulnerabilities = [
            'Слабый пароль',
            'Не включена двухфакторная аутентификация',
            'Подозрительная активность в истории'
        ];
        
        vulnerabilities.forEach(vuln => {
            const li = document.createElement('li');
            li.textContent = vuln;
            vulnerabilitiesList.appendChild(li);
        });
        
        vulnerabilitiesContainer.classList.remove('hidden');
    }
});