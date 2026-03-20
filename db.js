const mysql = require('mysql2');
require('dotenv').config();

// Создаем подключение к MySQL с mysql2
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    ssl: false,
    multipleStatements: true,
    connectTimeout: 10000
});

// Подключаемся к базе данных
connection.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к MySQL:', err);
        console.error('Код ошибки:', err.code);
        console.error('SQL состояние:', err.sqlState);
        return;
    }
    console.log('✅ Подключено к MySQL базе данных:', process.env.DB_NAME);
});

// Функция для выполнения запросов
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) {
                console.error('Ошибка запроса:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports = {
    query,
    connection
};
