# 🗄️ Настройка MySQL на хостинге

## 📋 Что нужно сделать

### 1. Создание базы данных на хостинге

**Через панель управления хостингом:**
1. Войдите в cPanel/Plesk/ISPmanager
2. Найдите "Базы данных" → "MySQL"
3. Используйте вашу базу данных:
   - Имя БД: `u3453536_gelhellswreckers`
   - Пользователь: используйте существующего пользователя
   - Пароль: ваш текущий пароль от хостинга
   - Привилегии: SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX

**Пример данных:**
- Хост: `localhost` или IP адрес сервера
- Порт: `3306`
- База: `u3453536_gelhellswreckers`
- Пользователь: `u3453536` (обычно совпадает с именем БД)
- Пароль: `ваш_пароль_от_хостинга`

### 2. Загрузка SQL файла

**Способы загрузки:**

**Через phpMyAdmin:**
1. Откройте phpMyAdmin в панели хостинга
2. Выберите базу данных `u3453536_gelhellswreckers`
3. Нажмите "Импорт"
4. Выберите файл `database_mysql.sql`
5. Нажмите "Вперед"

**Через SSH:**
```bash
mysql -u username -p database_name < database_mysql.sql
```

### 3. Настройка подключения

**Обновите .env файл:**
```env
# Database configuration (MySQL)
DB_HOST=localhost  # или IP от хостинга
DB_PORT=3306
DB_USER=u3453536  # ваш пользователь БД (обычно совпадает с именем БД)
DB_PASSWORD=your_secure_password  # ваш пароль от хостинга
DB_NAME=u3453536_gelhellswreckers  # имя БД

# Server configuration
PORT=5003  # или порт от хостинга
NODE_ENV=production
```

### 4. Загрузка файлов на хостинг

**Структура файлов:**
```
/var/www/yourdomain.com/
├── server.js
├── package.json
├── .env
├── db.js
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── styles.css
├── script.js
├── logo.png
├── cursor_*.png
└── node_modules/
```

**Способы загрузки:**

**Через FTP:**
1. Используйте FileZilla или WinSCP
2. Подключитесь к FTP серверу
3. Загрузите все файлы в корневую папку

**Через SSH:**
```bash
scp -r * user@yourdomain.com:/var/www/yourdomain.com/
```

**Через Git:**
```bash
git clone your-repo /var/www/yourdomain.com/
cd /var/www/yourdomain.com/
npm install
```

### 5. Установка зависимостей

**Через SSH:**
```bash
cd /var/www/yourdomain.com/
npm install --production
```

### 6. Запуск приложения

**Способы запуска:**

**Через PM2 (рекомендую):**
```bash
# Установка PM2
npm install -g pm2

# Запуск приложения
pm2 start server.js --name "wishlist"

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

**Через systemd:**
```bash
# Создайте сервис
sudo nano /etc/systemd/system/wishlist.service
```

Содержимое файла:
```ini
[Unit]
Description=Wishlist App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/yourdomain.com
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
sudo systemctl enable wishlist
sudo systemctl start wishlist
```

### 7. Настройка веб-сервера

**Nginx конфигурация:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/yourdomain.com;
    index index.html;

    location / {
        try_files $uri $uri/ @backend;
    }

    location @backend {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Apache конфигурация (.htaccess):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5003/$1 [P,L]
```

## 🔧 Проверка работы

### 1. Проверка базы данных
```bash
mysql -u u3453536 -p -e "USE u3453536_gelhellswreckers; SHOW TABLES;"
```

### 2. Проверка Node.js
```bash
node server.js
```

### 3. Проверка веб-сервера
```bash
curl http://yourdomain.com
```

## 🚨 Частые проблемы

### 1. Ошибка подключения к БД
**Решение:**
- Проверьте данные в .env
- Убедитесь что пользователь имеет права
- Проверьте что БД создана

### 2. Порт занят
**Решение:**
- Измените PORT в .env
- Настройте проксирование в Nginx/Apache

### 3. Права доступа
**Решение:**
```bash
sudo chown -R www-data:www-data /var/www/yourdomain.com
sudo chmod -R 755 /var/www/yourdomain.com
```

## 📞 Поддержка хостинга

Если возникнут проблемы:
1. Свяжитесь с поддержкой хостинга
2. Проверьте логи ошибок:
   - Логи Nginx/Apache
   - Логи MySQL
   - Логи Node.js (PM2 logs)

---

**Готово к работе на вашем хостинге!** 🗄️✨
