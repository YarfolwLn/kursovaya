const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Method Override middleware (для PUT/DELETE через POST с _method)
app.use((req, res, next) => {
    if (req.body && req.body._method) {
        req.method = req.body._method;
        delete req.body._method;
    }
    next();
});

// Upload middleware для изображений
// Создаем папку для загрузок если нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        // Разрешаем все типы изображений
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
        ];
        
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error(`Тип файла не поддерживается: ${file.mimetype}`), false);
        }
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS middleware - ограничиваем только наш домен
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000', // для локальной разработки (Node.js сервер)
        'http://localhost:5173' // для Vite (фронтенд)
    ];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin) || !origin) { // !origin для локальной разработки
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Security Headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self';")
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    
    next();
});

// API Routes

// Получение всех пользователей - ТОЛЬКО для админов
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        // Только админ может видеть всех пользователей
        if (!req.user.is_admin) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
        
        // Возвращаем только необходимые поля, без email
        const result = await db.query('SELECT id, name, is_admin, created_at FROM users ORDER BY created_at DESC');
        res.json(result);
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Регистрация пользователя
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Проверяем, существует ли пользователь
        const existingUsers = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }
        
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Создаем пользователя
        const result = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        
        const newUser = {
            id: result.insertId,
            name,
            is_admin: false
        };
        
        res.status(201).json(newUser);
    } catch (error) {
        console.error('❌ Ошибка при регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Вход пользователя
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        const user = users[0];
        
        // Проверяем пароль с помощью bcrypt
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        // Создаем JWT токен
        const token = jwt.sign(
            { id: user.id, email: user.email, is_admin: user.is_admin },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            is_admin: user.is_admin,
            token
        });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение всех желаний - требует авторизации, пользователь видит только свои (админ - все)
app.get('/api/wishes', authenticateToken, async (req, res) => {
    try {
        let query;
        let params = [];
        
        if (req.user.is_admin) {
            // Админ видит все желания
            query = `
                SELECT w.*, u.name as user_name 
                FROM wishes w 
                LEFT JOIN users u ON w.user_id = u.id 
                ORDER BY w.completed ASC, w.created_at DESC
            `;
        } else {
            // Обычный пользователь видит только свои желания
            query = `
                SELECT w.*, u.name as user_name 
                FROM wishes w 
                LEFT JOIN users u ON w.user_id = u.id 
                WHERE w.user_id = ?
                ORDER BY w.completed ASC, w.created_at DESC
            `;
            params = [req.user.id];
        }
        
        const result = await db.query(query, params);
        res.json(result);
    } catch (error) {
        console.error('Ошибка при получении желаний:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение публичных желаний пользователя (для share страницы)
app.get('/api/public/wishes/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await db.query(`
            SELECT w.*, u.name as user_name 
            FROM wishes w 
            LEFT JOIN users u ON w.user_id = u.id 
            WHERE w.user_id = ? AND w.completed = false
            ORDER BY w.rating DESC, w.created_at DESC
        `, [userId]);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Загрузка изображения (Base64)
app.post('/api/upload-base64', (req, res) => {
    try {
        const { image, fileName, mimeType } = req.body;
        
        if (!image || !fileName || !mimeType) {
            return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
        }
        
        // Декодируем Base64
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(fileName);
        const finalFileName = 'image-' + uniqueSuffix + fileExtension;
        const finalPath = 'uploads/' + finalFileName;
        
        // Сохраняем файл
        fs.writeFileSync(finalPath, buffer);
        
        const imageUrl = '/' + finalPath;
        
        res.json({ 
            success: true, 
            imageUrl: imageUrl,
            filename: finalFileName
        });
    } catch (error) {
        console.error('Ошибка загрузки Base64 изображения:', error);
        res.status(500).json({ error: 'Ошибка загрузки изображения' });
    }
});

// Start server без SSL (для PHP прокси)
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        
        res.json({ 
            success: true, 
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        res.status(500).json({ error: 'Ошибка загрузки изображения' });
    }
});

// Создание желания
app.post('/api/wishes', authenticateToken, async (req, res) => {
    try {
        const { title, description, category, price, link, image, rating } = req.body;
        
        // Используем user_id из токена, а не из тела запроса
        const user_id = req.user.id;
        
        const result = await db.query(
            'INSERT INTO wishes (user_id, title, description, category, price, link, image, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, title, description, category || 'Без категории', price || 0, link || '', image || '', rating || 3]
        );
        
        const newWish = {
            id: result.insertId,
            user_id,
            title,
            description,
            category: category || 'Без категории',
            price: price || 0,
            link: link || '',
            image: image || '',
            rating: rating || 3,
            completed: false,
            completed_at: null
        };
        
        res.status(201).json(newWish);
    } catch (error) {
        console.error('Ошибка при создании желания:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление желания
app.put('/api/wishes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, price, link, image, rating } = req.body;
        
        // Проверяем, что желание принадлежит пользователю (или админ)
        const wishes = await db.query('SELECT user_id FROM wishes WHERE id = ?', [id]);
        if (wishes.length === 0) {
            return res.status(404).json({ error: 'Желание не найдено' });
        }
        
        if (wishes[0].user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Нет доступа к этому желанию' });
        }
        
        await db.query(
            'UPDATE wishes SET title = ?, description = ?, category = ?, price = ?, link = ?, image = ?, rating = ? WHERE id = ?',
            [title, description, category || 'Без категории', price || 0, link || '', image || '', rating || 3, id]
        );
        
        const updatedWish = await db.query('SELECT * FROM wishes WHERE id = ?', [id]);
        res.json(updatedWish[0]);
    } catch (error) {
        console.error('Ошибка при обновлении желания:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление желания
app.delete('/api/wishes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Проверяем, что желание принадлежит пользователю (или админ)
        const wishes = await db.query('SELECT user_id FROM wishes WHERE id = ?', [id]);
        if (wishes.length === 0) {
            return res.status(404).json({ error: 'Желание не найдено' });
        }
        
        if (wishes[0].user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Нет доступа к этому желанию' });
        }
        
        await db.query('DELETE FROM wishes WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при удалении желания:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Отметка желания как выполненного
app.put('/api/wishes/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;
        
        // Проверяем, что желание принадлежит пользователю (или админ)
        const wishes = await db.query('SELECT user_id FROM wishes WHERE id = ?', [id]);
        if (wishes.length === 0) {
            return res.status(404).json({ error: 'Желание не найдено' });
        }
        
        if (wishes[0].user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Нет доступа к этому желанию' });
        }
        
        await db.query(
            'UPDATE wishes SET completed = ?, completed_at = ? WHERE id = ?',
            [completed, completed ? new Date() : null, id]
        );
        
        const updatedWish = await db.query('SELECT * FROM wishes WHERE id = ?', [id]);
        res.json(updatedWish[0]);
    } catch (error) {
        console.error('Ошибка при обновлении статуса желания:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Start server без SSL (для PHP прокси)
app.listen(PORT, () => {
    console.log('Wishlist сервер запущен на порту 3000 (HTTP режим для PHP прокси)');
    console.log('Откройте в браузере: https://localhost:5173');
    console.log('Подключено к mySQL:', process.env.DB_NAME);
    console.log('PHP прокси доступен по: /api.php');
});
