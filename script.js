// API Configuration - используем PHP прокси
const API_BASE = '/api.php';

console.log('🔗 API_BASE:', API_BASE);
console.log('🌐 Current URL:', window.location.href);
console.log('🚀 Script version: PHP PROXY MODE');

// User data storage (temporary, will be loaded from API)
let users = [];
let currentUser = null;
let wishlist = [];

// Load data from API
async function loadUsers() {
    try {
        console.log(' Загрузка пользователей из: /api_users.php');
        const response = await fetch('/api_users.php');
        
        if (!response.ok) {
            console.error(' Ошибка ответа API:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('👥 Полученные пользователи:', data);
        
        users = data;
        console.log('✅ Пользователи загружены:', users.length);
    } catch (error) {
        console.error('❌ Ошибка загрузки пользователей:', error);
        // Не показываем alert при загрузке, чтобы не мешать пользователю
        users = [];
    }
}

async function loadWishes() {
    try {
        console.log('🔄 Загрузка желаний из:', '/api_wishes.php');
        const response = await fetch('/api_wishes.php');
        
        if (!response.ok) {
            console.error('❌ Ошибка ответа API:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Полученные данные с сервера:', data);
        console.log('📊 Тип данных:', typeof data);
        console.log('📊 Длина массива:', Array.isArray(data) ? data.length : 'не массив');
        
        wishlist = data;
        console.log('✅ Желания загружены:', wishlist.length);
        
        // Показываем первые 3 желания для отладки
        if (wishlist.length > 0) {
            console.log('🔍 Первые 3 желания:', wishlist.slice(0, 3));
        } else {
            console.log('⚠️ Список желаний пуст!');
        }
    } catch (error) {
        console.error('Ошибка загрузки желаний:', error);
        wishlist = [];
    }
}

// Initialize admin user if not exists (moved to database)
function initializeAdmin() {
    // Admin is now created in database via SQL script
    console.log('Администратор создан в базе данных');
}

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const addWishBtn = document.getElementById('addWishBtn');
const addWishModal = document.getElementById('addWishModal');
const addWishForm = document.getElementById('addWishForm');
const closeModal = document.querySelector('.close');
const logoutBtn = document.getElementById('logoutBtn');
const wishlistGrid = document.getElementById('wishlistGrid');
const starRating = document.getElementById('starRating');
const stars = document.querySelectorAll('.star');
let sortFilter = null; // Will be set dynamically based on user role
const userSelect = document.getElementById('userSelect');
let categoryFilter = null; // Will be set dynamically based on user role
const wishImageInput = document.getElementById('wishImage');
const imagePreview = document.getElementById('imagePreview');
const themeToggle = document.getElementById('themeToggle');

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('wishlistTheme') || 'dark';
    setTheme(savedTheme);
    updateThemeButton(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wishlistTheme', theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '🌙 Тёмная' : '☀️ Светлая';
        themeToggle.className = theme === 'dark' ? 'btn btn-outline' : 'btn btn-primary';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    initializeAdmin();
    initTheme();
    await checkAuth();
    setupEventListeners();
    
    // If we're on dashboard page and user is logged in, populate categories
    if (window.location.pathname.includes('dashboard.html') && currentUser) {
        setTimeout(() => {
            populateCategoryFilter();
        }, 50);
    }
});

// Check authentication
async function checkAuth() {
    // Load current user from localStorage
    const savedUser = localStorage.getItem('wishlistCurrentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    // Load data from API
    await loadUsers();
    await loadWishes();
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'dashboard.html' && !currentUser) {
        window.location.href = 'login.html';
    }
    
    if (currentPage === 'dashboard.html' && currentUser) {
        console.log('🔍 Пользователь на дашборде, загружаем данные');
        populateCategoryFilter();
        renderWishlist();
    }
    
    if ((currentPage === 'login.html' || currentPage === 'register.html') && currentUser) {
        window.location.href = 'dashboard.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Add wish button
    if (addWishBtn) {
        addWishBtn.addEventListener('click', openModal);
    }
    
    // Add wish form
    if (addWishForm) {
        addWishForm.addEventListener('submit', handleAddWish);
    }
    
    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', closeModalFunc);
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // User select for admin
    if (userSelect) {
        userSelect.addEventListener('change', () => {
            populateCategoryFilter();
            renderWishlist();
        });
    }
    
    // Image upload
    if (wishImageInput) {
        wishImageInput.addEventListener('change', handleImageUpload);
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Star rating - setup for both modal and existing items
    setupStarRating();
}

// Setup star rating functionality
function setupStarRating() {
    // Modal stars
    const modalStars = document.querySelectorAll('#starRating .star');
    modalStars.forEach(star => {
        // Remove existing listeners to prevent duplicates
        star.replaceWith(star.cloneNode(true));
    });
    
    // Re-add fresh event listeners
    const freshStars = document.querySelectorAll('#starRating .star');
    freshStars.forEach(star => {
        star.addEventListener('click', handleStarClick);
        star.addEventListener('mouseenter', handleStarHover);
    });
    
    if (starRating) {
        starRating.addEventListener('mouseleave', resetStarDisplay);
    }
    
    // Initialize display
    resetStarDisplay();
    
    // Existing item stars (for future editing functionality)
    const itemStars = document.querySelectorAll('.wish-rating .star');
    itemStars.forEach(star => {
        star.style.cursor = 'default'; // Make them non-clickable for now
    });
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            localStorage.setItem('wishlistCurrentUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            const error = await response.json();
            alert(error.error || 'Ошибка входа');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Ошибка подключения к серверу');
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Пароли не совпадают');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });
        
        if (response.ok) {
            const user = await response.json();
            alert('Регистрация успешна! Теперь вы можете войти.');
            window.location.href = 'login.html';
        } else {
            const error = await response.json();
            console.error('Ошибка регистрации API:', error);
            alert(error.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        if (error.name === 'TypeError' || error.message.includes('fetch')) {
            alert('Ошибка подключения к серверу. Проверьте что сервер запущен на порту 3000.');
        } else {
            alert('Ошибка регистрации: ' + error.message);
        }
    }
}

// Handle logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('wishlistCurrentUser');
    window.location.href = 'index.html';
}

// Modal functions
function openModal() {
    addWishModal.style.display = 'block';
    resetForm();
}

function closeModalFunc() {
    addWishModal.style.display = 'none';
    resetForm();
}

function resetForm() {
    addWishForm.reset();
    document.getElementById('wishRating').value = 3;
    resetStarDisplay();
    clearImagePreview();
}

function clearImagePreview() {
    if (imagePreview) {
        imagePreview.style.display = 'none';
        imagePreview.innerHTML = '';
        // Очищаем переменную чтобы не отправлять старое изображение
        console.log('🗑️ Предпросмотр изображения очищен');
    }
}

// Handle image upload
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        console.log('📸 Начинаю загрузку изображения:', file.name);
        console.log('📸 File info:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        });
        
        // Конвертируем в Base64
        const reader = new FileReader();
        reader.onload = async function(event) {
            const base64Data = event.target.result;
            
            try {
                console.log('🔄 Отправка изображения на сервер (Base64)...');
                
                const uploadResponse = await fetch('/api_upload.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: base64Data,
                        fileName: file.name,
                        mimeType: file.type
                    })
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    console.log('✅ Изображение загружено:', uploadResult);
                    
                    // Показываем загруженное изображение
                    if (imagePreview) {
                        imagePreview.style.display = 'block';
                        // Используем HTTPS URL через api_upload.php
                        const fullImageUrl = 'https://gelhellswreckers.ru/api_upload.php?file=' + uploadResult.imageUrl.replace('/uploads/', '');
                        console.log('🖼️ Полный URL изображения:', fullImageUrl);
                        
                        imagePreview.innerHTML = `
                            <img src="${fullImageUrl}" alt="Предпросмотр" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: none; box-shadow: none; background: transparent;">
                            <button type="button" onclick="clearImagePreview()" style="margin-top: 10px; padding: 5px 10px; background: #ff4444; color: white; border: none; border-radius:4px; cursor: pointer;">Удалить</button>
                        `;
                    }
                } else {
                    console.error('❌ Ошибка загрузки изображения');
                    alert('Ошибка загрузки изображения');
                }
            } catch (error) {
                console.error('❌ Ошибка при загрузке изображения:', error);
                alert('Ошибка загрузки изображения');
            }
        };
        reader.readAsDataURL(file);
    } else {
        alert('Пожалуйста, выберите изображение');
    }
}

// Handle add wish
async function handleAddWish(e) {
    e.preventDefault();
    
    const title = document.getElementById('wishTitle').value;
    const description = document.getElementById('wishDescription').value;
    const category = document.getElementById('wishCategory').value;
    const price = document.getElementById('wishPrice').value;
    const link = document.getElementById('wishLink').value;
    const rating = document.getElementById('wishRating').value;
    
    // Get image data - проверяем есть ли загруженное изображение
    let imageData = '';
    const previewImage = imagePreview ? imagePreview.querySelector('img') : null;
    if (previewImage) {
        // Получаем полный URL из src атрибута
        let imageSrc = previewImage.src;
        // Если URL уже полный, используем его, иначе добавляем домен через api_upload.php
        if (imageSrc.startsWith('http')) {
            imageData = imageSrc;
        } else {
            // Извлекаем имя файла из URL
            const fileName = imageSrc.replace('/uploads/', '');
            imageData = 'https://gelhellswreckers.ru/api_upload.php?file=' + fileName;
        }
        console.log('📸 Используем загруженное изображение:', imageData);
    } else {
        console.log('📸 Изображение не загружено');
    }
    
    const newWish = {
        user_id: currentUser.id,
        title,
        description,
        category: category || 'Без категории',
        price: price || 0,
        link: link || '',
        image: imageData,
        rating
    };
    
    try {
        console.log('🎁 Отправка желания:', newWish);
        console.log('🔗 URL запроса:', '/api_wishes.php');
        
        const response = await fetch('/api_wishes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newWish),
        });
        
        console.log('📡 Статус ответа:', response.status);
        
        if (response.ok) {
            const wish = await response.json();
            console.log('✅ Желание добавлено:', wish);
            
            // Перезагружаем список желаний с сервера
            await loadWishes();
            populateCategoryFilter();
            renderWishlist();
            closeModalFunc();
            
            console.log('🔄 Список желаний обновлен');
        } else {
            const error = await response.json();
            console.error('❌ Ошибка создания желания:', error);
            alert(error.error || 'Ошибка создания желания');
        }
    } catch (error) {
        console.error('Ошибка создания желания:', error);
        alert('Ошибка подключения к серверу');
    }
}

// Render wishlist
function renderWishlist() {
    console.log('🎨 Вызов renderWishlist');
    console.log('🎨 wishlistGrid элемент:', wishlistGrid);
    console.log('🎨 wishlist массив:', wishlist);
    console.log('🎨 currentUser:', currentUser);
    
    if (!wishlistGrid) {
        console.error('❌ Элемент wishlistGrid не найден!');
        return;
    }
    
    console.log('🎨 Отрисовка списка желаний, всего:', wishlist.length);
    
    let wishesToShow = wishlist;
    
    // Check if admin
    if (currentUser && currentUser.is_admin) {
        console.log('👑 Режим администратора');
        console.log('👑 Данные пользователя:', currentUser);
        console.log('👑 is_admin:', currentUser.is_admin);
        
        // Admin functionality
        updateDashboardForAdmin();
        
        // Get selected user
        const selectedUserId = userSelect ? userSelect.value : 'all';
        console.log('👤 Выбранный пользователь:', selectedUserId);
        
        if (selectedUserId !== 'all') {
            wishesToShow = wishesToShow.filter(wish => String(wish.user_id) === String(selectedUserId));
            console.log('🔍 Отфильтровано по пользователю:', wishesToShow.length);
        }
    } else {
        console.log('👤 Режим обычного пользователя');
        // Regular user functionality
        updateDashboardForRegularUser();
        
        // Show only user's wishes
        if (currentUser) {
            wishesToShow = wishesToShow.filter(wish => String(wish.user_id) === String(currentUser.id));
            console.log('🔍 Отфильтровано по текущему пользователю:', wishesToShow.length);
        } else {
            console.log('❌ Нет текущего пользователя!');
            wishesToShow = [];
        }
    }
    
    // Apply category filter - but keep completed wishes
    if (categoryFilter) {
        const selectedCategory = categoryFilter.value;
        if (selectedCategory !== 'all') {
            const filtered = wishesToShow.filter(wish => wish.category === selectedCategory);
            const completed = wishesToShow.filter(wish => wish.completed);
            // Combine filtered wishes with completed wishes (avoid duplicates)
            wishesToShow = [...new Set([...filtered, ...completed])];
        }
    }
    
    // Apply sorting
    if (sortFilter) {
        const sortType = sortFilter.value;
        wishesToShow = sortWishes(wishesToShow, sortType);
    }
    
    // Check if empty
    if (wishesToShow.length === 0) {
        let emptyMessage = 'У вас пока нет желаний. Добавьте первое желание!';
        
        if (currentUser && currentUser.is_admin) {
            const selectedUserId = userSelect ? userSelect.value : 'all';
            const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
            
            if (selectedUserId !== 'all' && selectedUserId !== undefined) {
                const selectedUser = getUserById(selectedUserId);
                emptyMessage = `У пользователя ${selectedUser ? selectedUser.name : 'неизвестного'} пока нет желаний`;
            } else if (selectedCategory !== 'all') {
                emptyMessage = `В категории "${selectedCategory}" пока нет желаний`;
            } else {
                emptyMessage = 'Зарегистрируйте пользователей чтобы они могли добавлять желания!';
            }
        } else {
            const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
            if (selectedCategory !== 'all') {
                emptyMessage = `В категории "${selectedCategory}" пока нет желаний`;
            }
        }
        
        wishlistGrid.innerHTML = `<div class="empty-state"><h3>${emptyMessage}</h3></div>`;
        return;
    }
    
    // Render wishes
    wishlistGrid.innerHTML = wishesToShow.map(wish => {
        let userName = '';
        
        if (currentUser && currentUser.is_admin) {
            const wishUser = getUserById(wish.user_id);
            userName = wishUser ? `👤 ${wishUser.name}` : '👤 Неизвестный пользователь';
        }
        
        return `
        <div class="wish-item ${currentUser && currentUser.is_admin ? 'admin-view' : ''} ${wish.completed ? 'completed' : ''}">
            ${!currentUser?.is_admin ? `<button class="delete-wish" onclick="deleteWish(${wish.id})">×</button>` : ''}
            ${currentUser?.is_admin ? `<button class="complete-wish" onclick="completeWish(${wish.id})" ${wish.completed ? 'disabled' : ''}>${wish.completed ? '✅' : '⏸️'}</button>` : ''}
            ${wish.image ? `<img src="${wish.image.startsWith('http') ? wish.image : 'https://gelhellswreckers.ru/api_upload.php?file=' + wish.image.replace('/uploads/', '')}" alt="${wish.title}" class="wish-image" style="border: none; box-shadow: none; background: transparent;">` : ''}
            <h3>${wish.title}</h3>
            ${currentUser?.is_admin ? `<div class="user-name">${userName}</div>` : ''}
            ${wish.category && wish.category !== 'Без категории' ? `<div class="wish-category">📁 ${wish.category}</div>` : ''}
            ${wish.description ? `<p>${wish.description}</p>` : ''}
            ${wish.price ? `<div class="wish-price">~${wish.price} руб.</div>` : ''}
            ${wish.link ? `<div class="wish-link"><a href="${wish.link}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-small">🔗 Ссылка</a></div>` : ''}
            <div class="wish-rating">
                ${generateStars(wish.rating)}
            </div>
            ${wish.completed ? '<div class="completed-badge">✅ Выполнено</div>' : ''}
        </div>
    `;
    }).join('');
    
    // Re-setup star rating after rendering
    setupStarRating();
}

// Populate category filter
function populateCategoryFilter() {
    // Find the correct category filter element based on user role
    let categoryFilterElement;
    let sortFilterElement;
    
    if (currentUser && currentUser.is_admin) {
        // Admin: use category filter in admin controls
        categoryFilterElement = document.querySelector('#adminControls #categoryFilter');
        sortFilterElement = document.querySelector('#adminControls #sortFilter');
    } else {
        // Regular user: use category filter in user controls
        categoryFilterElement = document.querySelector('#userControls #categoryFilter');
        sortFilterElement = document.querySelector('#userControls #sortFilter');
    }
    
    if (!categoryFilterElement) {
        return;
    }
    
    // Update global variables
    categoryFilter = categoryFilterElement;
    sortFilter = sortFilterElement;
    
    // Remember current selection
    const currentSelection = categoryFilterElement.value;
    
    // Get categories based on user role (including completed wishes)
    const categories = new Set();
    
    if (currentUser && currentUser.is_admin) {
        // Admin: get categories from selected user's wishes or all wishes
        const selectedUserId = userSelect ? userSelect.value : 'all';
        if (selectedUserId === 'all') {
            // Get categories from all wishes
            wishlist.forEach(wish => {
                if (wish.category && wish.category !== 'Без категории') {
                    categories.add(wish.category);
                }
            });
        } else {
            // Get categories only from selected user's wishes
            wishlist.filter(wish => wish.user_id == selectedUserId).forEach(wish => {
                if (wish.category && wish.category !== 'Без категории') {
                    categories.add(wish.category);
                }
            });
        }
    } else {
        // Regular user: get categories only from their own wishes
        wishlist.filter(wish => wish.user_id === currentUser.id).forEach(wish => {
            if (wish.category && wish.category !== 'Без категории') {
                categories.add(wish.category);
            }
        });
    }
    
    // Clear existing options except "all"
    categoryFilterElement.innerHTML = '<option value="all">Все категории</option>';
    
    // Add category options sorted alphabetically
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilterElement.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (currentSelection && categoryFilterElement.querySelector(`option[value="${currentSelection}"]`)) {
        categoryFilterElement.value = currentSelection;
    }
    
    // Add event listeners
    categoryFilterElement.addEventListener('change', renderWishlist);
    if (sortFilterElement) {
        sortFilterElement.addEventListener('change', renderWishlist);
    }
}

// Populate user select for admin
function populateUserSelect() {
    if (!userSelect) return;
    
    // Remember current selection
    const currentSelection = userSelect.value;
    
    // Clear existing options except "all"
    userSelect.innerHTML = '<option value="all">Все пользователи</option>';
    
    // Add user options (non-admin users only)
    users.filter(u => !u.isAdmin).forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        userSelect.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (currentSelection && userSelect.querySelector(`option[value="${currentSelection}"]`)) {
        userSelect.value = currentSelection;
    }
}

// Get user by ID
function getUserById(userId) {
    console.log('🔍 Поиск пользователя с ID:', userId);
    console.log('🔍 Доступные пользователи:', users);
    
    const user = users.find(u => String(u.id) === String(userId));
    console.log('🔍 Найденный пользователь:', user);
    
    return user;
}

// Update dashboard for admin
function updateDashboardForAdmin() {
    console.log('👑 Вызов updateDashboardForAdmin');
    
    const dashboardHeader = document.querySelector('.dashboard-header h2');
    const adminControls = document.getElementById('adminControls');
    const userControls = document.getElementById('userControls');
    const addWishBtn = document.getElementById('addWishBtn');
    
    console.log('👑 Элементы:', {
        dashboardHeader: !!dashboardHeader,
        adminControls: !!adminControls,
        userControls: !!userControls,
        addWishBtn: !!addWishBtn
    });
    
    if (dashboardHeader) {
        dashboardHeader.textContent = '👑 Панель администратора';
        console.log('👑 Заголовок изменен');
    }
    
    if (adminControls) {
        adminControls.style.display = 'flex';
        console.log('👑 Админ контролы показаны');
    } else {
        console.log('❌ adminControls не найден');
    }
    
    if (userControls) userControls.style.display = 'flex';
    
    // Hide add wish button for admin
    if (addWishBtn) {
        addWishBtn.style.display = 'none';
        console.log('👑 Кнопка добавления скрыта');
    }
    
    // Only populate user select if it's empty (first time)
    if (userSelect && userSelect.options.length <= 1) {
        populateUserSelect();
        console.log('👑 Заполняем список пользователей');
    }
}

// Update dashboard for regular user
function updateDashboardForRegularUser() {
    const dashboardHeader = document.querySelector('.dashboard-header h2');
    const adminControls = document.getElementById('adminControls');
    const userControls = document.getElementById('userControls');
    const addWishBtn = document.getElementById('addWishBtn');
    
    if (dashboardHeader) {
        dashboardHeader.textContent = 'Мой Wishlist';
    }
    
    if (adminControls) adminControls.style.display = 'none';
    if (userControls) userControls.style.display = 'flex';
    
    // Show add wish button for regular user
    if (addWishBtn) {
        addWishBtn.style.display = 'block';
    }
    
    // Populate categories for regular user
    populateCategoryFilter();
}

// Sort wishes based on filter
function sortWishes(wishes, sortType) {
    const sortedWishes = [...wishes];
    
    switch(sortType) {
        case 'rating-desc':
            return sortedWishes.sort((a, b) => b.rating - a.rating);
        case 'rating-asc':
            return sortedWishes.sort((a, b) => a.rating - b.rating);
        case 'price-desc':
            return sortedWishes.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'price-asc':
            return sortedWishes.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'date-desc':
            return sortedWishes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'date-asc':
            return sortedWishes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        default:
            // Default sort: completed wishes at the end, then by date
            return sortedWishes.sort((a, b) => {
                if (a.completed && !b.completed) return 1;
                if (!a.completed && b.completed) return -1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    }
}

// Generate stars HTML
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rating ? 'active' : 'inactive'}">⭐</span>`;
    }
    return stars;
}

// Complete wish (admin only)
window.completeWish = async function(wishId) {
    // Only admin can complete wishes
    if (!currentUser?.is_admin) {
        return;
    }
    
    const wish = wishlist.find(w => w.id === wishId);
    if (!wish) return;
    
    console.log('🎯 Попытка выполнить желание:', wishId, wish.title);
    
    if (confirm(`Отметить желание "${wish.title}" как выполненное?`)) {
        try {
            console.log('🔄 Отправка запроса на выполнение:', `/api_wishes_complete.php?id=${wishId}`);
            
            const response = await fetch(`/api_wishes_complete.php?id=${wishId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: true }),
            });
            
            console.log('📡 Статус ответа выполнения:', response.status);
            
            if (response.ok) {
                console.log('✅ Желание выполнено успешно');
                // Перезагружаем список желаний
                await loadWishes();
                populateCategoryFilter();
                renderWishlist();
            } else {
                const error = await response.json();
                console.error('❌ Ошибка выполнения желания:', error);
                alert(error.error || 'Ошибка выполнения желания');
            }
        } catch (error) {
            console.error('Ошибка выполнения желания:', error);
            alert('Ошибка подключения к серверу');
        }
    }
};

// Delete wish
async function deleteWish(wishId) {
    // Admin cannot delete wishes
    if (currentUser && currentUser.is_admin) {
        return;
    }
    
    if (confirm('Вы уверены, что хотите удалить это желание?')) {
        try {
            const response = await fetch(`${API_BASE}/wishes/${wishId}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                wishlist = wishlist.filter(wish => wish.id !== wishId);
                renderWishlist();
            } else {
                const error = await response.json();
                alert(error.error || 'Ошибка удаления желания');
            }
        } catch (error) {
            console.error('Ошибка удаления желания:', error);
            alert('Ошибка подключения к серверу');
        }
    }
}

// Star rating functions
function handleStarClick(e) {
    e.preventDefault();
    const rating = parseInt(e.target.dataset.rating);
    document.getElementById('wishRating').value = rating;
    updateStarDisplay(rating);
    console.log('Star clicked:', rating); // Debug log
}

function handleStarHover(e) {
    const rating = parseInt(e.target.dataset.rating);
    updateStarDisplay(rating);
}

function resetStarDisplay() {
    const ratingInput = document.getElementById('wishRating');
    const rating = ratingInput ? parseInt(ratingInput.value) || 3 : 3;
    updateStarDisplay(rating);
}

function updateStarDisplay(rating) {
    const modalStars = document.querySelectorAll('#starRating .star');
    modalStars.forEach((star, index) => {
        const starIndex = index + 1;
        star.classList.remove('active', 'inactive');
        
        if (starIndex <= rating) {
            star.classList.add('active');
        } else {
            star.classList.add('inactive');
        }
    });
    console.log('Updated star display to rating:', rating); // Debug log
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === addWishModal) {
        closeModalFunc();
    }
});
