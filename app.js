// app.js
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
const appointmentBtn = document.getElementById('appointmentBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Ответ пользователя: ${outcome}`);
    deferredPrompt = null;
    installBtn.classList.add('hidden');
});

appointmentBtn.addEventListener('click', () => {
    alert('Функция записи на прием будет доступна в ближайшее время!');
});
