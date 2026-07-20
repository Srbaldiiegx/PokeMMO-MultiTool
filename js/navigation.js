function showSection(id, btn) {
        document.querySelectorAll('.section-container').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        
        document.getElementById(id).classList.add('active');
        btn.classList.add('active');

        const alarmPanel = document.getElementById('global-system-panel');
        if (alarmPanel) {
            alarmPanel.classList.toggle('is-visible', id === 'berry-section');
        }
    }

    function saveAll() {
        localStorage.setItem('pmmo_gym_v12', JSON.stringify(gymChars));
        localStorage.setItem('pmmo_berry_v12', JSON.stringify(berryChars));
    }

    // --- LÓGICA CORE DE SHINY SHOWCASE ---
    
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('farm-dropdown-container');
    const menu = document.getElementById('farm-dropdown-menu');
    if (!container || !menu) return;

    container.addEventListener('click', (event) => {
        event.stopPropagation();
        const visible = menu.style.display === 'block';
        menu.style.display = visible ? 'none' : 'block';
    });

    document.addEventListener('click', () => { menu.style.display = 'none'; });
});
