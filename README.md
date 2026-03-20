# 🎁 Wishlist App

Веб-приложение для создания и ведения списков желаний: регистрация и авторизация через JWT, CRUD желаний с рейтингом и категориями, публичная страница шаринга, админ-панель и загрузка изображений.

## ✨ Возможности

- **Регистрация и вход** пользователей с JWT-аутентификацией
- **Управление желаниями**: создать, редактировать, удалять, отмечать выполненными
- **Рейтинг от 1 до 5 звёзд** и категории для каждого желания
- **Публичная страница шаринга** по `/share/:userId` без авторизации
- **Админ-панель**: просмотр всех пользователей и желаний
- **Загрузка изображений** (Base64 и multipart)
- **Тёмная/светлая тема** и кастомный курсор (только на десктопе)
- **Адаптивный дизайн**
- **PHP-прокси** для продакшена через Apache

## 🧰 Технологический стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, Vite 4, React Router 6 |
| Backend | Node.js, Express 4 |
| База данных | MySQL (`mysql2`) |
| Аутентификация | JWT (`jsonwebtoken`), `bcrypt` |
| Загрузка файлов | `multer` (multipart) + Base64 |
| Продакшен-сервер | Apache + PHP-прокси (`api.php`) |

## 🏗 Архитектура

```
Frontend (React SPA)
    │
    ├── Локальная разработка:  /api  → Vite proxy → Node.js (localhost:3000)
    └── Продакшен:             /api.php → PHP-прокси → Node.js (localhost:3000)
                                                              │
                                                              ▼
                                                         MySQL
```

В продакшене статику раздаёт Apache, а все API-запросы идут через `api.php`, который проксирует их на Node.js-сервер по адресу `127.0.0.1:3000/api`.

## 📦 Требования

- Node.js **>= 16**
- MySQL 5.7 / 8.x
- (опционально) XAMPP / Apache + PHP для продакшен-режима

## 🚀 Быстрый старт

### 1. База данных

Создайте базу и выполните SQL из раздела [Схема базы данных](#-схема-базы-данных).

### 2. Переменные окружения

```bash
cp .env.example .env
```

Заполните `.env` (см. раздел «Переменные окружения»). Файл `.env` в репозиторий не попадает.

### 3. Бэкенд (Node.js сервер)

```bash
npm install
npm start        # порт 3000
```

### 4. Фронтенд (React + Vite)

В отдельном терминале:

```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

Vite автоматически проксирует запросы `/api` и `/uploads` на `http://localhost:3000` (настройка в `client/vite.config.js`). Загруженные изображения складываются в папку `uploads/`, которая создаётся автоматически при запуске сервера и в репозиторий не попадает.

### Быстрый запуск с XAMPP

1. Запустите XAMPP: **MySQL** и **Apache**.
2. Терминал 1: `cd client && npm run dev`
3. Терминал 2 (в корне): `npm run dev` — запускает `server.js` (Node API).

## ⚙️ Переменные окружения

Переменные в `.env` (шаблон — `.env.example`):

```env
# База данных
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name

# Сервер
PORT=3000
JWT_SECRET=your-super-secret-key-min-32-characters
NODE_ENV=development
```

> ⚠️ В продакшене обязательно задайте собственный `JWT_SECRET` (минимум 32 символа).

## 🗄 Схема базы данных

Таблица **users** — пользователи:

| Поле | Тип | Описание |
|------|-----|----------|
| id | INT PK AUTO_INCREMENT | ID пользователя |
| name | VARCHAR(255) | Имя |
| email | VARCHAR(255) UNIQUE | Email |
| password | VARCHAR(255) | Хеш пароля (bcrypt) |
| is_admin | BOOLEAN | Флаг администратора |
| created_at | TIMESTAMP | Дата создания |

Таблица **wishes** — желания (`user_id` → `users.id`, связь «один ко многим»):

| Поле | Тип | Описание |
|------|-----|----------|
| id | INT PK AUTO_INCREMENT | ID желания |
| user_id | INT FK | Владелец |
| title | VARCHAR(255) | Название |
| description | TEXT | Описание |
| category | VARCHAR(255) | Категория (по умолчанию «Без категории») |
| price | DECIMAL(10,2) | Цена |
| link | TEXT | Ссылка на подарок |
| image | TEXT | Путь к изображению |
| rating | INT (1–5) | Рейтинг важности |
| completed | BOOLEAN | Выполнено |
| completed_at | TIMESTAMP | Дата выполнения |
| created_at / updated_at | TIMESTAMP | Даты создания/обновления |

SQL для создания таблиц:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) DEFAULT 'Без категории',
    price DECIMAL(10,2) DEFAULT 0.00,
    link TEXT,
    image TEXT,
    rating INT DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

> Для создания администратора добавьте запись в `users` вручную. Пароль должен храниться в виде bcrypt-хеша (приложение проверяет пароль через `bcrypt.compare`).

## 🔌 API Endpoints

Все маршруты префиксуются как `/api` (Node.js) или `/api.php` (через PHP-прокси).

### Аутентификация и пользователи

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | `/api/users/register` | Публичный | Регистрация пользователя |
| POST | `/api/users/login` | Публичный | Вход, возвращает JWT (7 дней) |
| GET | `/api/users` | Админ | Список всех пользователей |

### Желания

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/api/wishes` | JWT | Свои желания (админ — все) |
| POST | `/api/wishes` | JWT | Создать желание |
| PUT | `/api/wishes/:id` | Владелец/Админ | Обновить желание |
| DELETE | `/api/wishes/:id` | Владелец/Админ | Удалить желание |
| PUT | `/api/wishes/:id/complete` | Владелец/Админ | Отметить как выполненное |
| GET | `/api/public/wishes/:userId` | Публичный | Публичный список для шаринга |

### Загрузка изображений

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/upload-base64` | Сохранение изображения (Base64) |
| POST | `/api/upload` | Загрузка через multipart (`multer`, лимит 5 МБ) |

Авторизация: токен передаётся заголовком `Authorization: Bearer <token>` и хранится в `localStorage` клиента (`wishlist_token`). Для обхода ограничений хостинга PUT/DELETE заменяются на POST с полем `_method` (обрабатывается и на Node.js, и в PHP-прокси).

## 📁 Структура проекта

В репозитории хранятся только исходники; сборка, зависимости, переменные окружения и загруженные файлы исключены через `.gitignore`.

```
kursovaya/
├── server.js              # Express API-сервер (порт 3000): JWT, CRUD, загрузка файлов
├── db.js                  # Подключение к MySQL (mysql2)
├── api.php                # PHP-прокси для продакшена (Apache → Node.js)
├── package.json           # Зависимости и скрипты бэкенда
├── package-lock.json
├── .env.example           # Шаблон переменных окружения
├── .gitignore
├── README.md
MySQL
├── apishka/               # PHP-эндпоинты (проксируют запросы на Node.js)
│   ├── api.php
│   ├── api_upload.php
│   ├── api_users.php
│   ├── api_wishes.php
│   └── api_wishes_complete.php
└── client/                # React SPA (Vite)
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js     # Конфиг Vite (прокси /api, минификация, base '/')
    ├── public/
    │   ├── .htaccess      # SPA-роутинг + проброс заголовка Authorization
    │   └── images/        # Логотип, курсоры и прочие статические изображения
    └── src/
        ├── components/    # WishCard, WishForm, StarRating, ThemeToggle, ...
        ├── pages/         # Dashboard, Login, Register, Share, NotFound
        ├── App.jsx        # Маршрутизация
        ├── api.js         # API-клиент с JWT
        ├── auth.jsx       # Контекст аутентификации (localStorage)
        ├── main.jsx       # Точка входа
        └── styles.css     # Глобальные стили
```

Файлы и папки, которых нет в репозитории (создаются локально или на сервере):

- `.env` — секреты и доступ к БД (в репозитории только `.env.example`)
- `uploads/` — загруженные изображения (создаётся автоматически при запуске)
- `client/dist/` — продакшен-сборка Vite
- `node_modules/` — зависимости
- `server.key` / `server.cert` — локальные SSL-сертификаты

## 🗺 Маршруты приложения

| URL | Описание |
|-----|----------|
| `/` | Редирект на `/dashboard` |
| `/login` | Вход |
| `/register` | Регистрация |
| `/dashboard` | Личный кабинет (только для авторизованных) |
| `/share/:userId` | Публичный список желаний пользователя |
| `*` | Страница 404 |

## 🚢 Сборка и деплой

```bash
cd client
npm run build          # сборка через Vite (terser); результат в client/dist/ (не коммитится)
```

Порядок выкладки на сервер:

- содержимое `client/dist/*` → `/var/www/html/`
- `client/dist/.htaccess` → `/var/www/html/` (SPA-роутинг + проброс авторизации)
- `server.js`, `db.js`, `api.php`, `apishka/` → веб-каталог
- установите зависимости бэкенда и запустите сервер:

```bash
npm install
JWT_SECRET=... DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... PORT=3000 nohup node server.js &
```

Или через `pm2`:

```bash
pm2 start server.js --name wishlist
```

## 🔒 Безопасность

- Пароли хешируются **bcrypt** (cost factor 10)
- JWT-токены с expiry 7 дней
- Проверка владельца при обновлении/удалении желаний; админ видит все данные
- CORS ограничен доменами `gelhellswreckers.ru` и `localhost`
- Security-заголовки: `X-Content-Type-Options`, `X-Frame-Options`, `CSP`, `Strict-Transport-Security` и др.

## 📜 Скрипты

### Корень (бэкенд)

| Команда | Описание |
|---------|----------|
| `npm start` | Запуск API-сервера (Node.js, порт 3000) |
| `npm run dev` | То же, что `npm start` |

### client (фронтенд)

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер Vite (http://localhost:5173) |
| `npm run build` | Продакшен-сборка в `dist/` |
| `npm run preview` | Просмотр собранной версии |

