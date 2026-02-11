// supabase.js - Подключение к Supabase

// Конфигурация Supabase
const SUPABASE_URL = 'https://venkgteszgtpjethpftj.supabase.co';
// ЗАМЕНИТЕ НА ВАШ SUPABASE ANON/PUBLIC KEY (начинается с eyJ...)
// НЕ используйте service_role ключ (начинается с sb_secret_)!
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbmtndGVzemd0cGpldGhwZnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNTczMDAsImV4cCI6MjA4NDgzMzMwMH0.vxPSCs5M7N7i0J0wGtH1eZqTDNEF3LonlZU3TFvSAwc'; // Вставьте ваш полный ANON/PUBLIC ключ

// Инициализация клиента Supabase (только если ещё не инициализирован)
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase подключен!');
}

// Тестовая функция для проверки соединения (теперь через Edge Function)
async function testSupabaseConnection() {
  console.log('🔧 Supabase клиент инициализирован. Проверка подписки через Edge Function...');
  // Тест больше не нужен - проверка идёт через Edge Function при необходимости
  console.log('✅ Готово к работе с подписками');
}

// Автоматически проверяем соединение при загрузке
testSupabaseConnection();

// Глобальная переменная для кэширования статуса подписки
window.hasSubscription = null;
window.subscriptionData = null; // Данные подписки (daysLeft, expires_at)

// Ключ для localStorage кэша подписки
const SUBSCRIPTION_CACHE_KEY = 'fitTrackerSubscriptionCache';
// Время жизни кэша (24 часа в миллисекундах)
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Получает статус подписки из кэша localStorage
 * Проверяет срок действия кэша И срок действия подписки
 * @param {number} telegramId - ID пользователя из Telegram
 * @returns {object|null} - {hasSubscription, daysLeft, expiresAt} или null если нет/просрочен
 */
function getSubscriptionFromCache(telegramId) {
    if (!telegramId) return null;

    try {
        const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
        if (!cached) return null;

        const data = JSON.parse(cached);

        // Проверяем что кэш для этого же пользователя
        if (data.telegramId !== telegramId) return null;

        const now = Date.now();

        // Проверяем что кэш не просрочен (24 часа)
        if (now - data.timestamp > CACHE_TTL) {
            console.log('⏰ Кэш подписки просрочен (24ч)');
            localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
            return null;
        }

        // ПРОВЕРКА СРОКА ПОДПИСКИ
        // Если в кэше есть expiresAt - проверяем не истекла ли подписка
        if (data.expiresAt) {
            const expiresAtTime = new Date(data.expiresAt).getTime();
            if (now > expiresAtTime) {
                console.log('⏰ Подписка ИСТЕКЛА - очищаем кэш');
                localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
                return null;
            }
        }

        console.log('✅ Подписка из кэша:', data.hasSubscription, 'дней осталось:', data.daysLeft || '?');
        return {
            hasSubscription: data.hasSubscription,
            daysLeft: data.daysLeft,
            expiresAt: data.expiresAt
        };
    } catch (err) {
        console.error('❌ Ошибка чтения кэша:', err);
        return null;
    }
}

/**
 * Сохраняет статус подписки в кэш localStorage
 * @param {number} telegramId - ID пользователя из Telegram
 * @param {boolean} hasSubscription - Статус подписки
 * @param {object} subscriptionData - Данные подписки {expiresAt, daysLeft}
 */
function saveSubscriptionToCache(telegramId, hasSubscription, subscriptionData = null) {
    if (!telegramId) return;

    try {
        const data = {
            telegramId: telegramId,
            hasSubscription: hasSubscription,
            timestamp: Date.now(),
            expiresAt: subscriptionData?.expiresAt || null,
            daysLeft: subscriptionData?.daysLeft || null
        };
        localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(data));
        console.log('💾 Подписка сохранена в кэш:', hasSubscription, 'до:', data.expiresAt);
    } catch (err) {
        console.error('❌ Ошибка сохранения кэша:', err);
    }
}

/**
 * Очищает кэш подписки (например, после изменения статуса)
 */
function clearSubscriptionCache() {
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    console.log('🗑️ Кэш подписки очищен');
}

/**
 * Проверяет наличие активной подписки у пользователя по telegram_id
 * Сначала проверяет кэш, если нет - делает запрос через Edge Function
 * @param {number} telegramId - ID пользователя из Telegram
 * @returns {Promise<boolean>} - true если есть активная подписка
 */
async function checkSubscriptionStatus(telegramId) {
    if (!telegramId) {
        console.log('⚠️ telegramId не предоставлен');
        return false;
    }

    // Проверяем кэш (теперь возвращает объект или null)
    const cached = getSubscriptionFromCache(telegramId);
    if (cached !== null) {
        window.hasSubscription = cached.hasSubscription;
        window.subscriptionData = cached;
        return cached.hasSubscription;
    }

    try {
        console.log('🔍 Проверка подписки через Edge Function для telegram_id:', telegramId);

        // Вызываем Edge Function вместо прямого запроса к БД
        const response = await fetch(
            'https://venkgteszgtpjethpftj.supabase.co/functions/v1/check-subscription',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || ''
                },
                body: JSON.stringify({ telegram_id: telegramId })
            }
        );

        const result = await response.json();

        if (result.error) {
            console.error('❌ Ошибка проверки подписки:', result.error);
            window.hasSubscription = false;
            return false;
        }

        const hasSub = result.hasSubscription;
        window.hasSubscription = hasSub;

        // Сохраняем в кэш с данными о сроке
        if (hasSub && result.data) {
            window.subscriptionData = result.data;
            saveSubscriptionToCache(telegramId, hasSub, {
                expiresAt: result.data.expires_at,
                daysLeft: result.data.daysLeft
            });
            console.log('✅ Активная подписка найдена, дней до окончания:', result.data.daysLeft);
        } else {
            saveSubscriptionToCache(telegramId, hasSub);
            console.log('⚠️ Подписка не найдена для telegram_id:', telegramId);
        }

        return hasSub;

    } catch (err) {
        console.error('❌ Ошибка при проверке подписки:', err);
        window.hasSubscription = false;
        return false;
    }
}
