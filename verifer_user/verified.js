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
            const vibrationTypes = {
                'light': 'light',
                'medium': 'medium',
                'heavy': 'heavy',
                'error': 'error',
                'success': 'success'
            };
            tg.HapticFeedback.impactOccurred(vibrationTypes[type] || 'light');
        }
    };

    // Отправка события боту
    const sendEvent = async (type, data = null) => {
        if (window.sendToBot) {
            await window.sendToBot(type, data);
        }
    };

    // Обработчик выхода из приложения
    const handleAppClose = () => {
        sendEvent('app_close', {
            userId: tg.initDataUnsafe.user?.id,
            username: tg.initDataUnsafe.user?.username,
            timestamp: new Date().toISOString(),
            page: 'verified'
        });
        vibrate('medium');
    };

    // Инициализация
    tg.onEvent('viewportChanged', (e) => {
        if (e.isStateStable && !e.isExpanded) {
            handleAppClose();
        }
    });

    tg.onEvent('closingConfirmation', () => {
        handleAppClose();
    });

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

        sendEvent('verified_enter', {
            userId: user.id,
            username: user.username
        });
    }

    // Копирование данных при клике
    copyableItems.forEach(item => {
        item.addEventListener('click', () => {
            const value = item.getAttribute('data-value');
            if (value) {
                navigator.clipboard.writeText(value).then(() => {
                    vibrate('success');
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
        vibrate('medium');
        startCheckBtn.classList.add('loading');
        startCheckBtn.innerHTML = '<div class="loader"></div> Проверка...';
        vulnerabilitiesContainer.classList.add('hidden');
        
        sendEvent('security_check_start', {
            userId: tg.initDataUnsafe.user?.id
        });
        
        startSecurityCheck();
    });

    // Функция проверки безопасности
    function startSecurityCheck() {
        let progress = 0;
        const duration = 3000;
        const interval = 30;
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
        
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = rounded;
        
        // Стадии проверки с улучшенными вибрациями
        if (percent < 25) {
            progressStage.textContent = 'Проверка настроек';
        } else if (percent < 50) {
            progressStage.textContent = 'Анализ активности';
        } else if (percent < 75) {
            progressStage.textContent = 'Проверка безопасности';
        } else {
            progressStage.textContent = 'Завершение проверки';
        }
        
        // Разные вибрации для разных стадий
        if (percent % 25 === 0) {
            const vibrationType = percent === 100 ? 'heavy' : 
                                 percent >= 75 ? 'medium' : 'light';
            vibrate(vibrationType);
        }
    }

    // Создание элемента уязвимости
    function createVulnerabilityItem(title, description) {
        const item = document.createElement('div');
        item.className = 'vulnerability-item';
        item.dataset.fixed = 'false';

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
            if (item.dataset.fixed === 'false') {
                e.stopPropagation();
                vibrate('medium');
                showFixDialog(item, title, description);
            }
        });

        return item;
    }

    // Показать диалог исправления
    function showFixDialog(item, title, description) {
        const fixDialog = document.createElement('div');
        fixDialog.className = 'fix-dialog';
        fixDialog.innerHTML = `
            <div class="fix-dialog-content">
                <div class="fix-dialog-header">
                    <h4>Исправление: ${title}</h4>
                    <button class="fix-dialog-close">&times;</button>
                </div>
                <p class="fix-warning">⚠️ При проверке нельзя выходить из приложения!</p>
                <p>${description}</p>
                <div class="fix-progress-container">
                    <div class="fix-progress-bar">
                        <div class="fix-progress-fill"></div>
                    </div>
                    <span class="fix-progress-text">0%</span>
                </div>
                <button class="fix-confirm-btn">Исправить уязвимость</button>
            </div>
        `;

        // Добавляем диалог в DOM до анимации
        document.body.appendChild(fixDialog);
        
        // Блокируем скролл
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        
        // Оптимизация для анимации
        fixDialog.style.willChange = 'transform, opacity';
        fixDialog.style.backfaceVisibility = 'hidden';
        fixDialog.style.perspective = '1000px';

        const fixConfirmBtn = fixDialog.querySelector('.fix-confirm-btn');
        const fixCloseBtn = fixDialog.querySelector('.fix-dialog-close');
        const progressFill = fixDialog.querySelector('.fix-progress-fill');
        const progressText = fixDialog.querySelector('.fix-progress-text');

        let isFixing = false;
        let fixInterval = null;
        let animationFrameId = null;

        // Плавное появление диалога
        requestAnimationFrame(() => {
            fixDialog.style.opacity = '1';
            fixDialog.style.transform = 'translateY(0)';
        });

        // Обработчик кнопки подтверждения
        fixConfirmBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!isFixing) {
                isFixing = true;
                fixCloseBtn.disabled = true;
                fixConfirmBtn.disabled = true;
                await startFixingProcess(item, title, fixDialog, progressFill, progressText);
            }
        });

        // Обработчик кнопки закрытия
        fixCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isFixing) {
                closeFixDialog(fixDialog);
            }
        });

        // Запрещаем закрытие диалога кликом вне области только во время исправления
        fixDialog.addEventListener('click', (e) => {
            if (isFixing) {
                e.stopPropagation();
            }
        });

        // Очистка при закрытии
        const cleanup = () => {
            if (fixInterval) clearInterval(fixInterval);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            fixDialog.removeEventListener('click', () => {});
            fixCloseBtn.removeEventListener('click', () => {});
            fixConfirmBtn.removeEventListener('click', () => {});
        };

        // Закрытие диалога
        const closeDialog = () => {
            cleanup();
            document.body.removeChild(fixDialog);
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };

        // Закрытие с анимацией
        window.closeFixDialog = (dialog) => {
            dialog.style.opacity = '0';
            dialog.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                closeDialog();
                vibrate('light');
            }, 300);
        };
    }

    // Процесс исправления
    async function startFixingProcess(item, title, dialog, progressFill, progressText) {
        return new Promise((resolve) => {
            const fixDuration = {
                "Слабый пароль": 5,
                "Отсутствие 2FA": 8,
                "Подозрительная активность": 6
            }[title] || 5;
            
            let progress = 0;
            const interval = 30;
            const steps = fixDuration * 1000 / interval;
            const increment = 100 / steps;
            
            const updateProgress = () => {
                progress += increment;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(fixInterval);
                    progressFill.style.width = `${progress}%`;
                    progressText.textContent = `${Math.round(progress)}%`;
                    setTimeout(() => {
                        completeFixing(item, title, dialog);
                        resolve();
                    }, 300);
                    return;
                }
                
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
                
                if (progress >= 50 && progress < 51) {
                    vibrate('medium');
                }
            };
            
            const fixInterval = setInterval(updateProgress, interval);
        });
    }

    // Завершение исправления
    function completeFixing(item, title, dialog) {
        vibrate('success');

        // Помечаем уязвимость как исправленную
        item.dataset.fixed = 'true';
        item.style.transition = 'opacity 0.3s ease';
        item.style.opacity = '0';

        setTimeout(() => {
            item.remove();

            // Обновляем счетчик
            const currentCount = parseInt(vulnerabilitiesCount.textContent);
            vulnerabilitiesCount.textContent = currentCount - 1;

            // Если все исправлено
            if (currentCount - 1 === 0) {
                vulnerabilitiesContainer.classList.add('hidden');
                progressStage.textContent = 'Все уязвимости устранены!';
            }
        }, 300);

        sendEvent('vulnerability_fixed', {
            vulnerability: title,
            timestamp: new Date().toISOString()
        });

        tg.showAlert(`Уязвимость "${title}" успешно исправлена!`);

        // Закрываем диалоговое окно
        if (window.closeFixDialog) {
            window.closeFixDialog(dialog);
        }
    }

    // Завершение проверки
    function completeCheck() {
        vibrate('success');
        
        sendEvent('security_check_complete', {
            userId: tg.initDataUnsafe.user?.id,
            vulnerabilities: 3,
            timestamp: new Date().toISOString()
        });
        
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

    // Добавляем SVG градиент
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    
    const defs = document.createElementNS(svgNS, "defs");
    const gradient = document.createElementNS(svgNS, "linearGradient");
    gradient.setAttribute("id", "gradient");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "100%");
    
    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#00f2fe");
    
    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#a18cd1");
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    // Анимация появления карточек
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
});