// purchase.js - Обработчик покупки подписки с модальным окном
// ВЕРСИЯ 26 - Добавлен логотип ЮКассы, чекбокс политики и модальное окно политики

// Проверка загрузки
console.log('🔄 purchase.js v=29 loaded - Using Edge Function for subscription polling');
console.log('🔧 purchase.js начинает загрузку...');

// Supabase API Key для Edge Functions (специально для платежей)
const PURCHASE_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbmtndGVzemd0cGpldGhwZnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNTczMDAsImV4cCI6MjA4NDgzMzMwMH0.vxPSCs5M7N7i0J0wGtH1eZqTDNEF3LonlZU3TFvSAwc';

// Глобальные переменные для модального окна
let emailModal = null;
let emailModalInput = null;
let emailModalError = null;
let emailModalPrivacyCheckbox = null;
let privacyModal = null;
let currentUser = null;

/**
 * Инициализация модального окна email
 */
function initEmailModal() {
    console.log('🔧 Инициализация email modal...');

    emailModal = document.getElementById('email-modal');
    emailModalInput = document.getElementById('email-modal-input');
    emailModalError = document.getElementById('email-modal-error');

    if (!emailModal) {
        console.error('❌ Email modal не найден');
        return;
    }

    console.log('✅ Email modal найден');

    // Закрытие по клику на фон
    emailModal.addEventListener('click', (e) => {
        if (e.target === emailModal) {
            closeEmailModal();
        }
    });

    // Кнопка "Отмена"
    const cancelBtn = document.getElementById('email-modal-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEmailModal);
    }

    // Кнопка отмены в состоянии ошибки
    const cancelErrorBtn = document.getElementById('email-modal-cancel-error');
    if (cancelErrorBtn) {
        cancelErrorBtn.addEventListener('click', closeEmailModal);
    }

    // Кнопка "Купить" (подтвердить email)
    const confirmBtn = document.getElementById('email-modal-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmEmailPurchase);
    }

    // Enter в поле input
    if (emailModalInput) {
        emailModalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmEmailPurchase();
            }
        });
    }

    // Кнопка "Попробовать снова"
    const retryBtn = document.getElementById('email-modal-retry');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            showEmailInputState();
        });
    }

    // Кнопка "Закрыть" (успех)
    const closeSuccessBtn = document.getElementById('email-modal-close-success');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            closeEmailModal();
            // Закрываем приветственный экран после успешной покупки
            closeWelcomeScreen();
        });
    }

    // Инициализация чекбокса политики конфиденциальности
    emailModalPrivacyCheckbox = document.getElementById('email-modal-privacy-checkbox');
    privacyModal = document.getElementById('privacy-modal');

    // Обработчик клика на ссылку политики конфиденциальности
    const privacyLink = document.getElementById('email-modal-privacy-link');
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            openPrivacyModal();
        });
    }

    // Закрытие модального окна политики конфиденциальности
    const privacyCloseBtn = document.getElementById('privacy-modal-close');
    if (privacyCloseBtn && privacyModal) {
        privacyCloseBtn.addEventListener('click', closePrivacyModal);

        // Закрытие по клику на фон
        privacyModal.addEventListener('click', (e) => {
            if (e.target === privacyModal) {
                closePrivacyModal();
            }
        });
    }

    console.log('✅ Email modal обработчики добавлены');
}

/**
 * Показать модальное окно
 */
function showEmailModal() {
    // Инициализируем модал, если ещё не инициализирован
    if (!emailModal) {
        initEmailModal();
    }

    if (!emailModal) {
        console.error('❌ Email modal не инициализирован');
        return;
    }

    // Сбрасываем состояние
    showEmailInputState();
    if (emailModalInput) {
        emailModalInput.value = '';
        emailModalInput.classList.remove('error');
    }
    if (emailModalError) {
        emailModalError.textContent = '';
    }

    // Показываем модал
    emailModal.classList.add('show');

    // Фокус на input
    setTimeout(() => {
        if (emailModalInput) {
            emailModalInput.focus();
        }
    }, 100);

    console.log('📧 Email modal открыт');
}

/**
 * Закрыть модальное окно
 */
function closeEmailModal() {
    if (!emailModal) return;

    emailModal.classList.remove('show');
    console.log('📧 Email modal закрыт');

    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
}

/**
 * Открыть модальное окно политики конфиденциальности
 */
function openPrivacyModal() {
    if (!privacyModal) return;

    privacyModal.classList.add('active');
    console.log('📄 Privacy modal открыт');

    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
}

/**
 * Закрыть модальное окно политики конфиденциальности
 */
function closePrivacyModal() {
    if (!privacyModal) return;

    privacyModal.classList.remove('active');
    console.log('📄 Privacy modal закрыт');

    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
}

/**
 * Показать состояние ввода email
 */
function showEmailInputState() {
    if (!emailModal) return;
    hideAllModalBodies();
    const inputBody = document.getElementById('email-modal-body-input');
    if (inputBody) {
        inputBody.classList.remove('email-modal-body-hidden');
    }
}

/**
 * Показать состояние загрузки
 */
function showEmailLoadingState() {
    if (!emailModal) return;
    hideAllModalBodies();
    const loadingBody = document.getElementById('email-modal-body-loading');
    if (loadingBody) {
        loadingBody.classList.remove('email-modal-body-hidden');
    }
}

/**
 * Показать состояние успеха
 */
function showEmailSuccessState(email) {
    if (!emailModal) return;
    hideAllModalBodies();
    const successBody = document.getElementById('email-modal-body-success');
    if (successBody) {
        successBody.classList.remove('email-modal-body-hidden');
    }

    const emailDisplay = document.getElementById('email-modal-email-display');
    if (emailDisplay) {
        emailDisplay.textContent = `Чек отправлен на: ${email}`;
    }
}

/**
 * Показать состояние ошибки
 */
function showEmailErrorState(message) {
    // Инициализируем модал, если ещё не инициализирован
    if (!emailModal) {
        initEmailModal();
    }

    // Если модал всё ещё не найден - выходим
    if (!emailModal) {
        console.error('❌ Email modal не доступен');
        return;
    }

    hideAllModalBodies();
    const errorBody = document.getElementById('email-modal-body-error');
    if (errorBody) {
        errorBody.classList.remove('email-modal-body-hidden');
    }

    const errorText = document.getElementById('email-modal-error-text');
    if (errorText) {
        errorText.textContent = message;
    }
}

/**
 * Скрыть все body модального окна
 */
function hideAllModalBodies() {
    if (!emailModal) return;

    const bodies = emailModal.querySelectorAll('.email-modal-body');
    bodies.forEach(body => {
        body.classList.add('email-modal-body-hidden');
    });
}

/**
 * Валидация email
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Подтверждение email и выполнение покупки
 */
async function confirmEmailPurchase() {
    if (!emailModalInput) return;

    const email = emailModalInput.value.trim();

    // Валидация
    if (!email) {
        showInputError('Введите email');
        return;
    }

    if (!validateEmail(email)) {
        showInputError('Некорректный формат email');
        return;
    }

    // Проверка чекбокса политики конфиденциальности
    if (emailModalPrivacyCheckbox && !emailModalPrivacyCheckbox.checked) {
        showInputError('Необходимо согласиться с политикой конфиденциальности');
        return;
    }

    // Скрываем ошибку если есть
    if (emailModalError) {
        emailModalError.textContent = '';
    }
    emailModalInput.classList.remove('error');

    // Показываем загрузку
    showEmailLoadingState();

    // Выполняем покупку
    await executePurchase(email);
}

/**
 * Показать ошибку в поле input
 */
function showInputError(message) {
    if (emailModalInput) {
        emailModalInput.classList.add('error');
    }
    if (emailModalError) {
        emailModalError.textContent = message;
    }

    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
}

/**
 * Показать состояние оплаты (виджет ЮКассы)
 */
function showEmailPaymentState() {
    if (!emailModal) return;
    hideAllModalBodies();
    const paymentBody = document.getElementById('email-modal-body-payment');
    if (paymentBody) {
        paymentBody.classList.remove('email-modal-body-hidden');
    }
}

/**
 * Выполнить покупку через ЮКассу
 */
async function executePurchase(email) {
    console.log('🛒 Создание платежа для email:', email);

    // Проверяем пользователя
    if (!currentUser || !currentUser.id) {
        console.error('❌ Данные пользователя не доступны');
        showEmailErrorState('Не удалось получить данные пользователя. Откройте приложение через Telegram.');
        return;
    }

    try {
        // Подготававливаем данные для Edge Function
        const paymentData = {
            telegram_id: currentUser.id,
            telegram_name: currentUser.first_name || currentUser.username || 'Пользователь',
            email: email,
            amount: '100.00'
        };

        console.log('📦 Данные для создания платежа:', paymentData);

        // Вызываем Edge Function с авторизацией
        const headers = {
            'Content-Type': 'application/json',
            'apikey': PURCHASE_SUPABASE_KEY,
            'Authorization': `Bearer ${PURCHASE_SUPABASE_KEY}`,
            'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || ''
        };

        console.log('🌐 Отправка запроса к Edge Function...');
        console.log('📤 Заголовки:', headers);

        const response = await fetch('https://venkgteszgtpjethpftj.supabase.co/functions/v1/create-payment', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(paymentData)
        });

        console.log('📡 Статус ответа:', response.status, response.statusText);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error('❌ Ошибка создания платежа:', errorData);
            showEmailErrorState(errorData.error || `Ошибка сервера (${response.status}). Попробуйте позже.`);

            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
            return;
        }

        const result = await response.json();
        console.log('✅ Платёж создан:', result);
        console.log('📦 Confirmation объект:', result.payment.confirmation);

        if (!result.payment || !result.payment.confirmation) {
            console.error('❌ Некорректный ответ от сервера:', result);
            showEmailErrorState('Некорректный ответ от сервера. Попробуйте позже.');
            return;
        }

        // Получаем confirmation_url из ответа ЮКассы
        const confirmationUrl = result.payment.confirmation.confirmation_url;

        if (!confirmationUrl) {
            console.error('❌ Нет confirmation_url в ответе:', result);
            showEmailErrorState('Некорректный ответ от сервера. Попробуйте позже.');
            return;
        }

        console.log('💳 Открываем страницу оплаты ЮКассы...');

        // Сразу открываем ЮКассу в новой вкладке
        const paymentWindow = window.open(confirmationUrl, '_blank');

        // Показываем сообщение о том, что модал останется открытым для отслеживания
        showEmailPaymentState();
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h3 style="margin-bottom: 1rem;">✅ Открыта страница оплаты</h3>
                    <p style="margin-bottom: 1.5rem;">Завершите оплату в открытой вкладке</p>
                    <p style="font-size: 0.9rem; color: var(--neobrut-darkgray);">
                        Это окно останется открытым для отслеживания статуса оплаты. После успешной оплаты приложение обновится автоматически.
                    </p>
                </div>
            `;
        }

        // Запускаем периодическую проверку статуса подписки
        let checkCount = 0;
        const maxChecks = 120; // Проверяем 120 раз с интервалом 0.5 секунд = 1 минута

        const checkInterval = setInterval(async () => {
            checkCount++;

            // Проверяем статус подписки через Edge Function (сначала очищаем кэш)
            clearSubscriptionCache(); // Очищаем кэш, чтобы получить свежие данные
            const hasSub = await checkSubscriptionStatus(currentUser.id);
            console.log(`🔍 Polling проверка #${checkCount}: hasSub=${hasSub}`);

            if (hasSub) {
                clearInterval(checkInterval);
                console.log('✅ Подписка активирована! Перезагружаем мини-апп...');

                // Очищаем кэш
                clearSubscriptionCache();

                // Устанавливаем флаг для поздравительного окна
                localStorage.setItem('fitTrackerJustPurchased', JSON.stringify({
                    timestamp: new Date().toISOString(),
                    telegramId: currentUser.id
                }));
                console.log('🎉 Установлен флаг fitTrackerJustPurchased для поздравления');

                // Пытаемся закрыть окно оплаты (если браузер разрешит)
                try {
                    if (paymentWindow && !paymentWindow.closed) {
                        paymentWindow.close();
                        console.log('🔒 Окно оплаты закрыто');
                    }
                } catch (e) {
                    console.log('⚠️ Не удалось закрыть окно оплаты (ограничение браузера)');
                }

                // Перезагружаем мини-апп
                location.reload();
            } else if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                console.log('⏰ Время проверки истекло (1 минута)');
            }
        }, 500); // Каждые 0.5 секунд

        console.log('🔍 Начали проверку статуса подписки (каждые 0.5 сек, максимум 1 минута)...');

    } catch (err) {
        console.error('❌ Непредвиденная ошибка:', err);
        showEmailErrorState(`Ошибка сети: ${err.message}. Проверьте подключение к интернету.`);

        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
    }
}

/**
 * Закрыть приветственный экран
 */
function closeWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.classList.add('hidden');
        setTimeout(() => {
            welcomeScreen.style.display = 'none';
        }, 600);
    }
}

/**
 * Начать процесс покупки
 */
function handlePurchase() {
    console.log('🛒 Начало процесса покупки...');

    // Проверяем Telegram WebApp
    if (!window.Telegram || !window.Telegram.WebApp) {
        console.error('❌ Telegram WebApp не доступен');
        showEmailErrorState('Telegram WebApp не доступен. Откройте приложение через Telegram.');
        showEmailModal();
        return;
    }

    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;

    if (!user || !user.id) {
        console.error('❌ Не удалось получить данные пользователя');
        showEmailErrorState('Не удалось получить данные пользователя. Попробуйте открыть через Telegram.');
        showEmailModal();
        return;
    }

    // Сохраняем пользователя
    currentUser = user;

    console.log('👤 Данные пользователя:', {
        id: user.id,
        first_name: user.first_name,
        username: user.username
    });

    // Показываем модальное окно для ввода email
    showEmailModal();
}

/**
 * Инициализация обработчика покупки
 */
function initPurchaseHandler() {
    console.log('🔧 Инициализация обработчика покупки...');

    // Инициализируем модальное окно
    initEmailModal();

    // Находим кнопку покупки
    const buyButton = document.getElementById('pricing-buy-btn');

    if (buyButton) {
        console.log('✅ Кнопка покупки найдена');

        // Удаляем старые обработчики
        buyButton.onclick = null;

        // Добавляем обработчик для клика (desktop)
        buyButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Клик по кнопке покупки');
            handlePurchase();
        });

        // Добавляем обработчик для тача (mobile)
        buyButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Тач по кнопке покупки');
            handlePurchase();
        });

        console.log('✅ Обработчик покупки добавлен');
    } else {
        console.error('❌ Кнопка покупки не найдена');
    }
}

// Инициализация после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPurchaseHandler);
} else {
    initPurchaseHandler();
}

console.log('📦 purchase.js загружен');
