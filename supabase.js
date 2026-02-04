// supabase.js - Подключение к Supabase

// Конфигурация Supabase
const SUPABASE_URL = 'https://venkgteszgtpjethpftj.supabase.co';
// ЗАМЕНИТЕ НА ВАШ SUPABASE ANON/PUBLIC KEY (начинается с eyJ...)
// НЕ используйте service_role ключ (начинается с sb_secret_)!
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbmtndGVzemd0cGpldGhwZnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNTczMDAsImV4cCI6MjA4NDgzMzMwMH0.vxPSCs5M7N7i0J0wGtH1eZqTDNEF3LonlZU3TFvSAwc'; // Вставьте ваш полный ANON/PUBLIC ключ

// Secret token for Edge Functions authentication
const SECRET_TOKEN = 'fittracker-secret-token-2024';

// Инициализация клиента Supabase (только если ещё не инициализирован)
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase подключен!');
    console.log('URL:', SUPABASE_URL);
    console.log('Клиент:', window.supabaseClient);
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

// Ключ для localStorage кэша подписки
const SUBSCRIPTION_CACHE_KEY = 'fitTrackerSubscriptionCache';
// Время жизни кэша (24 часа в миллисекундах)
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Получает статус подписки из кэша localStorage
 * @param {number} telegramId - ID пользователя из Telegram
 * @returns {boolean|null} - true/false из кэша, или null если нет в кэше или просрочен
 */
function getSubscriptionFromCache(telegramId) {
    if (!telegramId) return null;

    try {
        const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
        if (!cached) return null;

        const data = JSON.parse(cached);

        // Проверяем что кэш для этого же пользователя
        if (data.telegramId !== telegramId) return null;

        // Проверяем что кэш не просрочен
        const now = Date.now();
        if (now - data.timestamp > CACHE_TTL) {
            console.log('⏰ Кэш подписки просрочен');
            localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
            return null;
        }

        console.log('✅ Подписка из кэша:', data.hasSubscription);
        return data.hasSubscription;
    } catch (err) {
        console.error('❌ Ошибка чтения кэша:', err);
        return null;
    }
}

/**
 * Сохраняет статус подписки в кэш localStorage
 * @param {number} telegramId - ID пользователя из Telegram
 * @param {boolean} hasSubscription - Статус подписки
 */
function saveSubscriptionToCache(telegramId, hasSubscription) {
    if (!telegramId) return;

    try {
        const data = {
            telegramId: telegramId,
            hasSubscription: hasSubscription,
            timestamp: Date.now()
        };
        localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(data));
        console.log('💾 Подписка сохранена в кэш:', hasSubscription);
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

    // Проверяем кэш
    const cached = getSubscriptionFromCache(telegramId);
    if (cached !== null) {
        window.hasSubscription = cached;
        return cached;
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
                    'X-Secret-Token': SECRET_TOKEN
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

        // Сохраняем в кэш
        saveSubscriptionToCache(telegramId, hasSub);

        if (hasSub) {
            console.log('✅ Активная подписка найдена');
        } else {
            console.log('⚠️ Подписка не найдена для telegram_id:', telegramId);
        }

        return hasSub;

    } catch (err) {
        console.error('❌ Ошибка при проверке подписки:', err);
        window.hasSubscription = false;
        return false;
    }
}
