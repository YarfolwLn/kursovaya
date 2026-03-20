const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Upload middleware для изображений
// Создаем папку для загрузок если нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Создана папка uploads:', uploadsDir);
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
        console.log('📸 File filter check:', file.mimetype, file.originalname);
        
        // Разрешаем все типы изображений
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
        ];
        
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
            console.log('✅ File type accepted:', file.mimetype);
            cb(null, true);
        } else {
            console.log('❌ File type rejected:', file.mimetype);
            cb(new Error(`Тип файла не поддерживается: ${file.mimetype}`), false);
        }
    }
});

console.log('📸 Multer initialized with storage:', storage ? 'OK' : 'FAIL');

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    
    next();
});

// API Routes

// Получение всех пользователей
app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at DESC');
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
        
        console.log('📝 Попытка регистрации:', { name, email });
        
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
        
        console.log('✅ Пользователь создан:', result.insertId);
        
        const newUser = {
            id: result.insertId,
            name,
            email,
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
        
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            is_admin: user.is_admin
        });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение всех желаний
app.get('/api/wishes', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT w.*, u.name as user_name 
            FROM wishes w 
            LEFT JOIN users u ON w.user_id = u.id 
            ORDER BY w.completed ASC, w.created_at DESC
        `);
        res.json(result);
    } catch (error) {
        console.error('Ошибка при получении желаний:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Статические файлы
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Загрузка изображения (Base64)
app.post('/api/upload-base64', (req, res) => {
    console.log('📸 Base64 upload request received');
    
    try {
        const { image, fileName, mimeType } = req.body;
        
        if (!image || !fileName || !mimeType) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
        }
        
        // Декодируем Base64
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Генерируем уникальное имя файла
        const fs = require('fs');
        const path = require('path');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(fileName);
        const finalFileName = 'image-' + uniqueSuffix + fileExtension;
        const finalPath = 'uploads/' + finalFileName;
        
        // Сохраняем файл
        fs.writeFileSync(finalPath, buffer);
        
        const imageUrl = '/' + finalPath;
        console.log('📸 Base64 изображение сохранено:', imageUrl);
        
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

// Page Routes (с .html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Start server без SSL (для PHP прокси)
app.post('/api/upload', upload.single('image'), (req, res) => {
    console.log('📸 Upload request received');
    console.log('📸 Headers:', req.headers);
    console.log('📸 File info:', req.file);
    
    try {
        if (!req.file) {
            console.log('❌ No file received');
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        console.log('📸 Изображение загружено:', imageUrl);
        
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
app.post('/api/wishes', async (req, res) => {
    try {
        const { user_id, title, description, category, price, link, image, rating } = req.body;
        
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
app.put('/api/wishes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, price, link, image, rating } = req.body;
        
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
app.delete('/api/wishes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM wishes WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при удалении желания:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Отметка желания как выполненного
app.put('/api/wishes/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;
        
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
    console.log('🎁 Wishlist сервер запущен на порту 3000 (HTTP режим для PHP прокси)');
    console.log('🌐 Откройте в браузере: https://gelhellswreckers.ru');
    console.log('🗄️ Подключено к PostgreSQL:', process.env.DB_NAME);
    console.log('🎨 Ярко голубые и розовые тона активированы!');
    console.log('🔗 PHP прокси доступен по: /api.php');
});
