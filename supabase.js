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
