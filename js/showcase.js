function toggleAdminPanel() {
        const content = document.getElementById('admin-content');
        const btn = document.getElementById('toggle-btn');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            btn.innerText = 'Ocultar Formularios';
        } else {
            content.style.display = 'none';
            btn.innerText = 'Mostrar Formularios';
        }
    }

    function switchShowcaseTab(tab) {
        document.getElementById('tab-prof').classList.toggle('active', tab === 'profile');
        document.getElementById('tab-poke').classList.toggle('active', tab === 'pokemon');
        document.getElementById('profile-form').style.display = tab === 'profile' ? 'grid' : 'none';
        document.getElementById('pokemon-form').style.display = tab === 'pokemon' ? 'grid' : 'none';
    }

    function openModal(memberName, dataString) {
        // El modal debe estar al nivel global para no quedar oculto por una sección.
        const modal = document.getElementById('details-modal');
        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        document.getElementById('modal-member-name').innerText = memberName;
        const grid = document.getElementById('container-shinys-activos');
        grid.innerHTML = '';
        
        const decodedData = JSON.parse(decodeURIComponent(dataString));
        if(!decodedData || decodedData.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted); grid-column:span 4; text-align:center; padding:20px;">Este entrenador aún no posee Shinies registrados.</p>';
        } else {
            decodedData.forEach(p => {
                const card = document.createElement('div');
                card.className = 'pokemon-card';
                card.onclick = () => openPokemonModal(p);
                
                const cleanName = p.name.trim().toLowerCase();
                const spriteUrl = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${cleanName}.gif`;
                
                card.innerHTML = `
                    <button class="fav-btn ${p.isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavPokemon('${memberName}', '${p.id}')">
                        <i class="fa-solid fa-star"></i>
                    </button>
                    <button class="delete-poke-btn" onclick="event.stopPropagation(); deletePokemon('${memberName}', '${p.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <img src="${spriteUrl}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/0.png'">
                    <p>${p.name.toUpperCase()}</p>
                    <span>${p.encounters ? parseInt(p.encounters).toLocaleString() : 0} encounters</span>
                `;
                grid.appendChild(card);
            });
        }
        modal.style.display = 'flex';
    }

    function closeModal() { document.getElementById('details-modal').style.display = 'none'; }

    function openPokemonModal(p) {
        const modal = document.getElementById('pokemon-detail-modal');
        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        document.getElementById('pmodal-name').innerText = p.name.toUpperCase();
        const cleanName = p.name.trim().toLowerCase();
        document.getElementById('pmodal-sprite').src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${cleanName}.gif`;
        document.getElementById('pmodal-sprite').onerror = function() { this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/0.png'; };
        
        document.getElementById('pmodal-encounters').innerText = p.encounters ? parseInt(p.encounters).toLocaleString() : '0';
        document.getElementById('pmodal-nature').innerText = p.nature || '---';
        document.getElementById('pmodal-location').innerText = p.location || '---';
        
        document.getElementById('pmodal-iv-hp').innerText = p.ivHp || '0';
        document.getElementById('pmodal-iv-atk').innerText = p.ivAtk || '0';
        document.getElementById('pmodal-iv-def').innerText = p.ivDef || '0';
        document.getElementById('pmodal-iv-spatk').innerText = p.ivSpatk || '0';
        document.getElementById('pmodal-iv-spdef').innerText = p.ivSpdef || '0';
        document.getElementById('pmodal-iv-speed').innerText = p.ivSpeed || '0';
        
        modal.style.display = 'flex';
    }

    function closePokemonModal() { document.getElementById('pokemon-detail-modal').style.display = 'none'; }

    function syncSelectOptions() {
        const select = document.getElementById('poke-user-select');
        if(!select) return;
        select.innerHTML = '';
        window.showcaseData.forEach(user => {
            const opt = document.createElement('option');
            opt.value = user.username; opt.innerText = user.username;
            select.appendChild(opt);
        });
    }

    function renderShowcase(filter = "") {
        const grid = document.getElementById('showcase-members-grid');
        if(!grid) return;
        grid.innerHTML = '';
        
        const sorted = [...window.showcaseData].sort((a,b) => (b.pokemons?.length || 0) - (a.pokemons?.length || 0));
        
        sorted.forEach(user => {
            if(filter && !user.username.toLowerCase().includes(filter.toLowerCase())) return;
            
            const card = document.createElement('div');
            card.className = 'member-card';
            
            const pList = user.pokemons || [];
            const fav = pList.find(p => p.isFav) || pList[0];
            const count = pList.length;
            
            let buddyHtml = '<div class="buddy-sprite"></div>';
            if(fav) {
                const cleanName = fav.name.trim().toLowerCase();
                buddyHtml = `<div class="buddy-sprite"><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/${cleanName}.gif" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/0.png'"></div>`;
            }
            
            const dataString = encodeURIComponent(JSON.stringify(pList));
            card.onclick = () => openModal(user.username, dataString);
            
            card.innerHTML = `
                <button class="delete-user-btn" onclick="event.stopPropagation(); deleteUser('${user.username}')"><i class="fa-solid fa-user-minus"></i></button>
                <div class="avatar-container">
                    <div class="trainer-avatar"><img src="${user.avatar || 'https://play.pokemmo.com/media/sprites/trainer/front/1.png'}"></div>
                    ${buddyHtml}
                </div>
                <h3 style="margin-bottom:6px; color:#fff;">${user.username}</h3>
                <span class="badge-count">${count} Shinies</span>
            `;
            grid.appendChild(card);
        });
    }

    // --- OPERACIONES FIREBASE (NUEVO CONTROL CENTRALIZADO) ---
    function uploadToFirebase() {
        if(window.firebaseSet && window.firebaseDbRef) {
            window.firebaseSet(window.firebaseDbRef, window.showcaseData)
            .catch(e => console.error("Error guardando base remota: ", e));
        }
    }

    function deleteUser(username) {
        if(confirm(`¿Estás seguro de que deseas eliminar al entrenador ${username} y todos sus pokémon?`)) {
            window.showcaseData = window.showcaseData.filter(u => u.username !== username);
            uploadToFirebase();
        }
    }

    function deletePokemon(username, pokeId) {
        if(confirm("¿Eliminar este pokémon del registro?")) {
            const user = window.showcaseData.find(u => u.username === username);
            if(user && user.pokemons) {
                user.pokemons = user.pokemons.filter(p => p.id !== pokeId);
                uploadToFirebase();
                const updatedDataStr = encodeURIComponent(JSON.stringify(user.pokemons));
                openModal(username, updatedDataStr); // Refrescar modal activo
            }
        }
    }

    function toggleFavPokemon(username, pokeId) {
        const user = window.showcaseData.find(u => u.username === username);
        if(user && user.pokemons) {
            user.pokemons.forEach(p => {
                if(p.id === pokeId) p.isFav = !p.isFav;
                else if(p.isFav) p.isFav = false; // Solo uno puede ser favorito
            });
            uploadToFirebase();
            const updatedDataStr = encodeURIComponent(JSON.stringify(user.pokemons));
            openModal(username, updatedDataStr);
        }
    }

    // --- LISTENERS DE FORMULARIOS ---
    
