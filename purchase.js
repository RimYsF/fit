// purchase.js - Обработчик покупки подписки с модальным окном

// API Key parts (same as in index.html)
const API_KEY_PART_1 = "c2stb3ItdjEtNWI2YmY1OTJi";
const API_KEY_PART_2 = "OTk1NzM3NzBjOTg0MzBiYTFh";
const API_KEY_PART_3 = "NGZjODJkMmQ2NTM4MGM0MWZl";
const API_KEY_PART_4 = "OTFjMDZkNzlhOGVmOWI5Mjc1ZQ==";

// Функция для получения API ключа
function getConnectionString() {
    const encoded = API_KEY_PART_1 + API_KEY_PART_2 + API_KEY_PART_3 + API_KEY_PART_4;
    return atob(encoded);
}

// Глобальные переменные для модального окна
let emailModal = null;
let emailModalInput = null;
let emailModalError = null;
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

        // Получаем API ключ для авторизации
        let apiKey = '';
        if (typeof window.getConnectionString === 'function') {
            apiKey = window.getConnectionString();
        } else if (typeof getConnectionString === 'function') {
            apiKey = getConnectionString();
        }

        console.log('🔑 API ключ длиной:', apiKey.length, 'первые 10 символов:', apiKey.substring(0, 10));

        // Вызываем Edge Function для создания платежа
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
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

        if (!result.payment || !result.payment.confirmation || !result.payment.confirmation.confirmation_token) {
            console.error('❌ Некорректный ответ от сервера:', result);
            showEmailErrorState('Некорректный ответ от сервера. Попробуйте позже.');
            return;
        }

        // Показываем состояние оплаты
        showEmailPaymentState();

        // Инициализируем виджет ЮКассы
        const checkout = new window.YooMoneyCheckoutWidget({
            confirmation_token: result.payment.confirmation.confirmation_token,
            return_url: window.location.href,
            error_callback: function(error) {
                console.error('❌ Ошибка виджета ЮКассы:', error);
                showEmailErrorState('Ошибка оплаты. Попробуйте позже.');

                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                }
            }
        });

        // Рендерим виджет в контейнер
        checkout.render('payment-form');

        console.log('💳 Виджет ЮКассы инициализирован');

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
