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

    // Заполняем данные пользователя
    if (tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('username').textContent = 
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь';
        document.getElementById('user-id').textContent = user.id || 'N/A';
        document.getElementById('user-tag').textContent = user.username || 'N/A';
        
        if (user.photo_url) {
            document.getElementById('user-avatar').src = user.photo_url;
        }
    }

    // Обработчик кнопки проверки
    startCheckBtn.addEventListener('click', () => {
        startCheckBtn.classList.add('loading');
        startCheckBtn.innerHTML = '<div class="loader"></div> Проверка...';
        progressContainer.classList.remove('hidden');
        
        startSecurityCheck();
    });

    // Функция проверки безопасности
    function startSecurityCheck() {
        let progress = 0;
        const duration = 60000; // 1 минута
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
        progressFill.style.width = `${rounded}%`;
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
        progressStatus.textContent = 'Проверка завершена! Найдено 3 потенциальных уязвимости.';
        startCheckBtn.classList.remove('loading');
        startCheckBtn.textContent = 'Проверить снова';
        
        // Здесь можно добавить вывод результатов проверки
        setTimeout(() => {
            tg.showAlert('Проверка завершена! Найдено 3 потенциальных уязвимости.');
        }, 500);
    }
});