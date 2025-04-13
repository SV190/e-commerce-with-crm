// Скрипт для назначения роли администратора пользователю в Supabase
// Запуск: node admin/set-admin-role.js <email>

const { createClient } = require('@supabase/supabase-js');

// Получаем переменные окружения или используем значения по умолчанию
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Ошибка: Не указаны переменные окружения NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
  console.log('Экспортируйте переменные окружения перед запуском скрипта:');
  console.log('export NEXT_PUBLIC_SUPABASE_URL=ваш_url');
  console.log('export SUPABASE_SERVICE_ROLE_KEY=ваш_ключ');
  process.exit(1);
}

// Создаем клиент Supabase с сервисной ролью
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setAdminRole(email) {
  try {
    // Сначала находим пользователя по email
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      // Альтернативный способ через auth API
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Ошибка при поиске пользователя:', authError);
        return;
      }
      
      const user = authUsers.users.find(u => u.email === email);
      
      if (!user) {
        console.error(`Пользователь с email ${email} не найден`);
        return;
      }
      
      // Обновляем метаданные пользователя с ролью администратора
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { 
          user_metadata: { 
            ...user.user_metadata,
            is_admin: true,
            role: 'admin' 
          },
          app_metadata: { 
            ...user.app_metadata,
            role: 'admin' 
          }
        }
      );
      
      if (updateError) {
        console.error('Ошибка при обновлении роли пользователя:', updateError);
        return;
      }
      
      console.log(`✅ Пользователь ${email} успешно назначен администратором!`);
      return;
    }
    
    // Если пользователь найден через запрос к таблице
    const userId = userData.id;
    
    // Обновляем метаданные пользователя
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        user_metadata: { is_admin: true, role: 'admin' },
        app_metadata: { role: 'admin' }
      }
    );
    
    if (updateError) {
      console.error('Ошибка при обновлении роли пользователя:', updateError);
      return;
    }
    
    console.log(`✅ Пользователь ${email} успешно назначен администратором!`);
    
  } catch (error) {
    console.error('Ошибка при выполнении скрипта:', error);
  }
}

// Получаем email из аргументов командной строки
const email = process.argv[2];

if (!email) {
  console.error('Ошибка: Email пользователя не указан');
  console.log('Использование: node admin/set-admin-role.js user@example.com');
  process.exit(1);
}

setAdminRole(email); 