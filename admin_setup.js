const bcrypt = require('bcrypt');

// Создаем хеш пароля для администратора
async function createAdminHash() {
    const password = 'adminpass123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Хеш пароля для админа:', hash);
    console.log('SQL запрос:');
    console.log(`INSERT IGNORE INTO users (id, name, email, password, is_admin) VALUES (0, 'Марк', 'admin@gmail.com', '${hash}', TRUE);`);
}

createAdminHash().catch(console.error);
