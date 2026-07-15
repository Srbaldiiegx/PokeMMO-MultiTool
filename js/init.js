document.addEventListener("DOMContentLoaded", () => {
        // Inicializar vistas clásicas locales
        renderGym(); renderBerry();
        setInterval(renderGym, 30000); // Refrescar Relojes cada 30s
        setInterval(checkNotifications, 15000); // Comprobar alarmas cada 15s

        // Buscar actualizaciones en tiempo real de Firebase
        let checkFbInterval = setInterval(() => {
            if(window.firebaseOnValue && window.firebaseDbRef) {
                clearInterval(checkFbInterval);
                window.firebaseOnValue(window.firebaseDbRef, (snapshot) => {
                    const data = snapshot.val();
                    window.showcaseData = data ? Object.values(data) : [];
                    syncSelectOptions();
                    renderShowcase();
                });
            }
        }, 500);

        // Registro de Entrenadores
        document.getElementById('profile-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('reg-username').value.trim();
            if(!nameInput) return;

            if(window.showcaseData.some(u => u.username.toLowerCase() === nameInput.toLowerCase())) {
                alert("Ese entrenador ya se encuentra registrado.");
                return;
            }

            const avatarFile = document.getElementById('reg-avatar').files[0];
            const proceedSave = (avatarBase64 = null) => {
                window.showcaseData.push({ username: nameInput, avatar: avatarBase64, pokemons: [] });
                uploadToFirebase();
                document.getElementById('profile-form').reset();
                alert(`¡Entrenador ${nameInput} añadido correctamente!`);
            };

            if(avatarFile) {
                const reader = new FileReader();
                reader.onloadend = () => proceedSave(reader.result);
                reader.readAsDataURL(avatarFile);
            } else { proceedSave(); }
        });

        // Registro de Pokémon Shiny
        document.getElementById('pokemon-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const userTarget = document.getElementById('poke-user-select').value;
            const pName = document.getElementById('poke-name').value.trim();
            if(!userTarget || !pName) return;

            const user = window.showcaseData.find(u => u.username === userTarget);
            if(user) {
                if(!user.pokemons) user.pokemons = [];
                user.pokemons.push({
                    id: 'poke_' + Date.now() + '_' + Math.floor(Math.random()*1000),
                    name: pName,
                    nature: document.getElementById('poke-nature').value,
                    location: document.getElementById('poke-location').value.trim() || 'Desconocido',
                    encounters: document.getElementById('poke-encounters').value || '0',
                    ivHp: document.getElementById('poke-iv-hp').value || '0',
                    ivAtk: document.getElementById('poke-iv-atk').value || '0',
                    ivDef: document.getElementById('poke-iv-def').value || '0',
                    ivSpatk: document.getElementById('poke-iv-spatk').value || '0',
                    ivSpdef: document.getElementById('poke-iv-spdef').value || '0',
                    ivSpeed: document.getElementById('poke-iv-speed').value || '0',
                    isFav: false
                });
                uploadToFirebase();
                document.getElementById('pokemon-form').reset();
                alert(`✨ ¡${pName.toUpperCase()} Shiny registrado para ${userTarget}!`);
            }
        });

        // Barra de Búsqueda Dinámica
        document.getElementById('search-name').addEventListener('input', function(e) {
            renderShowcase(e.target.value);
        });
    });

