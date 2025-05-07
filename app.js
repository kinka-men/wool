// app.js
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
const appointmentBtn = document.getElementById('appointmentBtn');
const installInstructions = document.getElementById('installInstructions');

// Проверка, поддерживает ли браузер установку PWA
let isInstallable = false;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    isInstallable = true;
});

installBtn.addEventListener('click', async () => {
    if (isInstallable && deferredPrompt) {
        // Если браузер поддерживает автоматическую установку
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Ответ пользователя: ${outcome}`);
        deferredPrompt = null;
    } else {
        // Показываем ручные инструкции по установке
        installInstructions.classList.remove('hidden');
    }
});

appointmentBtn.addEventListener('click', () => {
    alert('Функция записи на прием будет доступна в ближайшее время!');
});
