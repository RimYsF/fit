// purchase.js - Обработчик покупки подписки

/**
 * Обрабатывает покупку подписки
 * Получает данные пользователя из Telegram WebApp, запрашивает email и отправляет в Supabase
 */
async function handlePurchase() {
    console.log('🛒 Начало процесса покупки...');

    // Проверяем доступность Telegram WebApp
    if (!window.Telegram || !window.Telegram.WebApp) {
        console.error('❌ Telegram WebApp не доступен');
        alert('Ошибка: Telegram WebApp не доступен. Откройте приложение через Telegram.');
        return;
    }

    const tg = window.Telegram.WebApp;
    console.log('📱 Telegram WebApp загружен:', tg);

    // Получаем данные пользователя
    const user = tg.initDataUnsafe?.user;

    if (!user || !user.id) {
        console.error('❌ Не удалось получить данные пользователя:', user);
        alert('Ошибка: Не удалось получить данные пользователя. Попробуйте открыть приложение через Telegram.');
        return;
    }

    console.log('👤 Данные пользователя получены:', {
        id: user.id,
        first_name: user.first_name,
        username: user.username
    });

    // Запрашиваем email для чека
    const email = prompt('Введите email для получения чека:');

    if (!email || email.trim() === '') {
        console.log('⚠️ Email не введён, отмена покупки');
        alert('Покупка отменена: Email не указан.');
        return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        console.error('❌ Некорректный email:', email);
        alert('Пожалуйста, введите корректный email адрес.');
        return;
    }

    console.log('📧 Email введён:', email.trim());

    // Проверяем доступность Supabase
    if (!window.supabaseClient) {
        console.error('❌ Supabase клиент не инициализирован');
        alert('Ошибка: База данных не доступна. Попробуйте позже.');
        return;
    }

    try {
        console.log('💾 Отправка данных в Supabase...');

        // Подготававливаем данные для вставки
        const subscriptionData = {
            telegram_id: user.id,
            telegram_name: user.first_name || user.username || 'Пользователь',
            email: email.trim(),
            status: 'active'
        };

        console.log('📦 Данные для отправки:', subscriptionData);

        // Вставляем запись в таблицу subscriptions
        const { data, error } = await window.supabaseClient
            .from('subscriptions')
            .insert([subscriptionData])
            .select();

        if (error) {
            console.error('❌ Ошибка Supabase:', error);

            // Проверяем ошибку уникальности (пользователь уже покупал)
            if (error.code === '23505') { // PostgreSQL unique violation
                console.log('⚠️ Пользователь уже имеет подписку');
                alert('Вы уже приобретали эту подписку! Проверьте свой email.');
            } else {
                console.error('❌ Детали ошибки:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                alert(`Ошибка при покупке: ${error.message}\nКод: ${error.code}`);
            }
            return;
        }

        console.log('✅ Подписка успешно создана!');
        console.log('📋 Ответ от Supabase:', data);

        // Успешная покупка
        alert(`🎉 Покупка успешна!\n\nСпасибо за покупку, ${user.first_name}!\nЧек отправлен на: ${email.trim()}`);

        // Опционально: отправляем событие в Telegram
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }

    } catch (err) {
        console.error('❌ Непредвиденная ошибка:', err);
        alert(`Произошла неожиданная ошибка: ${err.message}`);
    }
}

/**
 * Инициализация обработчика покупки
 * Добавляется после загрузки DOM
 */
function initPurchaseHandler() {
    console.log('🔧 Инициализация обработчика покупки...');

    const buyButton = document.getElementById('pricing-buy-btn');

    if (buyButton) {
        console.log('✅ Кнопка покупки найдена:', buyButton);

        // Удаляем старые обработчики (если есть)
        buyButton.onclick = null;

        // Добавляем новый обработчик
        buyButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ Клик по кнопке покупки');
            handlePurchase();
        });

        console.log('✅ Обработчик покупки добавлен');
    } else {
        console.error('❌ Кнопка покупки не найдена (id="pricing-buy-btn")');
    }
}

// Инициализируем после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPurchaseHandler);
} else {
    initPurchaseHandler();
}

console.log('📦 purchase.js загружен');
