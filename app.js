// app.js
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
const appointmentBtn = document.getElementById('appointmentBtn');
const installInstructions = document.getElementById('installInstructions');

// Определение платформы пользователя
const isWindows = navigator.userAgent.indexOf('Windows') !== -1;
const isAndroid = navigator.userAgent.indexOf('Android') !== -1;

// Проверка, поддерживает ли браузер установку PWA
let isInstallable = false;

// Проверка, установлено ли уже приложение
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true) {
    // Приложение уже установлено, скрываем кнопку
    installBtn.classList.add('hidden');
}

// Если Windows, показываем кнопку установки по умолчанию
if (isWindows) {
    installBtn.classList.remove('hidden');
}

// Слушаем событие beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    isInstallable = true;
    
    // Убедимся, что кнопка установки видима
    installBtn.classList.remove('hidden');
});

// Обработчик завершения установки
window.addEventListener('appinstalled', (e) => {
    console.log('Приложение успешно установлено');
    // Скрываем кнопку установки после успешной установки
    installBtn.classList.add('hidden');
});

// Обработчик кнопки установки
installBtn.addEventListener('click', async () => {
    if (isInstallable && deferredPrompt) {
        // Если браузер поддерживает автоматическую установку
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Ответ пользователя: ${outcome}`);
        deferredPrompt = null;
    } else if (isWindows) {
        // Специальная инструкция для Windows
        installInstructions.innerHTML = `
            <p>Для установки на Windows:</p>
            <ol>
                <li>Нажмите на меню в правом верхнем углу браузера (⋮)</li>
                <li>Выберите "Установить приложение" или "Установить сайт как приложение"</li>
                <li>Следуйте инструкциям на экране</li>
            </ol>`;
        installInstructions.classList.remove('hidden');
    } else if (isAndroid) {
        // Инструкции для Android, если автоматическая установка не сработала
        installInstructions.innerHTML = `
            <p>Для установки на Android:</p>
            <ol>
                <li>Нажмите на меню в правом верхнем углу браузера (⋮)</li>
                <li>Выберите "Установить приложение" или "Добавить на главный экран"</li>
            </ol>`;
        installInstructions.classList.remove('hidden');
    } else {
        // Общие инструкции для других платформ
        installInstructions.innerHTML = `
            <p>Для установки приложения:</p>
            <ol>
                <li>Откройте меню браузера</li>
                <li>Найдите опцию "Установить приложение" или "Добавить на главный экран"</li>
            </ol>`;
        installInstructions.classList.remove('hidden');
    }
});

// Обработчик кнопки записи на прием
appointmentBtn.addEventListener('click', () => {
    alert('Функция записи на прием будет доступна в ближайшее время!');
});
