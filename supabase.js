// supabase.js - Подключение к Supabase

// Конфигурация Supabase
const SUPABASE_URL = 'https://venkgteszgtpjethpftj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eQl1wB8m35f9p13TQbETmA_Jx6WRCeH';

// Инициализация клиента Supabase (только если ещё не инициализирован)
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase подключен!');
    console.log('URL:', SUPABASE_URL);
    console.log('Клиент:', window.supabaseClient);
}

// Тестовая функция для проверки соединения
async function testSupabaseConnection() {
  try {
    const { data, error } = await window.supabaseClient
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (error) {
      console.log('⚠️ Ошибка (это нормально, если таблицы еще нет):', error.message);
    } else {
      console.log('✅ Соединение работает! Данные:', data);
    }
  } catch (err) {
    console.error('❌ Ошибка подключения:', err);
  }
}

// Автоматически проверяем соединение при загрузке
testSupabaseConnection();

// Глобальная переменная для кэширования статуса подписки
window.hasSubscription = null;

/**
 * Проверяет наличие активной подписки у пользователя по telegram_id
 * @param {number} telegramId - ID пользователя из Telegram
 * @returns {Promise<boolean>} - true если есть активная подписка
 */
async function checkSubscriptionStatus(telegramId) {
    if (!window.supabaseClient) {
        console.log('⚠️ Supabase клиент не инициализирован');
        return false;
    }

    if (!telegramId) {
        console.log('⚠️ telegramId не предоставлен');
        return false;
    }

    try {
        console.log('🔍 Проверка подписки для telegram_id:', telegramId);

        const { data, error } = await window.supabaseClient
            .from('subscriptions')
            .select('status, created_at')
            .eq('telegram_id', telegramId)
            .eq('status', 'active')
            .maybeSingle(); // maybeSingle возвращает null если нет записей

        if (error) {
            console.error('❌ Ошибка проверки подписки:', error);
            window.hasSubscription = false;
            return false;
        }

        const hasSub = !!data;
        window.hasSubscription = hasSub;

        if (hasSub) {
            console.log('✅ Активная подписка найдена:', data);
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
