function toggleAdminPanel() {
    const content = document.getElementById('admin-content');
    const btn = document.getElementById('toggle-btn');
    if (!window.currentUser) {
        alert('Inicia sesión con Google para gestionar tus shinies.');
        return;
    }
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    btn.innerText = isHidden ? 'Ocultar Formularios' : 'Mostrar Formularios';
}

function switchShowcaseTab(tab) {
    document.getElementById('tab-prof').classList.toggle('active', tab === 'profile');
    document.getElementById('tab-poke').classList.toggle('active', tab === 'pokemon');
    document.getElementById('profile-form').style.display = tab === 'profile' ? 'grid' : 'none';
    document.getElementById('pokemon-form').style.display = tab === 'pokemon' ? 'grid' : 'none';
}

function canManageProfile(profile) {
    return Boolean(window.currentUser && (window.isAdmin || profile.ownerId === window.currentUser.uid));
}

function getProfile(profileId) {
    return window.showcaseData.find(profile => profile.id === profileId);
}

function saveProfile(profile) {
    if (!canManageProfile(profile)) {
        alert('No tienes permiso para modificar este perfil.');
        return;
    }
    const { id, ...data } = profile;
    window.firebaseSet(window.firebaseRef(window.firebaseDb, `showcaseData/${id}`), data)
        .catch(error => console.error('Error al guardar el perfil:', error));
}

function openModal(profile) {
    const modal = document.getElementById('details-modal');
    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    document.getElementById('modal-member-name').innerText = profile.username;
    const grid = document.getElementById('container-shinys-activos');
    const canEdit = canManageProfile(profile);
    grid.innerHTML = '';

    const pList = profile.pokemons || [];
    if (pList.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); grid-column:span 4; text-align:center; padding:20px;">Este entrenador aún no posee shinies registrados.</p>';
    } else {
        pList.forEach(pokemon => {
            const card = document.createElement('div');
            card.className = 'pokemon-card';
            card.onclick = () => openPokemonModal(pokemon);
            const cleanName = pokemon.name.trim().toLowerCase();
            const controls = canEdit ? `
                <button class="fav-btn ${pokemon.isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavPokemon('${profile.id}', '${pokemon.id}')"><i class="fa-solid fa-star"></i></button>
                <button class="delete-poke-btn" onclick="event.stopPropagation(); deletePokemon('${profile.id}', '${pokemon.id}')"><i class="fa-solid fa-trash-can"></i></button>` : '';

            card.innerHTML = `${controls}
                <img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/${cleanName}.gif" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/0.png'">
                <p>${pokemon.name.toUpperCase()}</p>
                <span>${pokemon.encounters ? parseInt(pokemon.encounters).toLocaleString() : 0} encuentros</span>`;
            grid.appendChild(card);
        });
    }
    modal.style.display = 'flex';
}

function closeModal() { document.getElementById('details-modal').style.display = 'none'; }

function openPokemonModal(pokemon) {
    const modal = document.getElementById('pokemon-detail-modal');
    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    document.getElementById('pmodal-name').innerText = pokemon.name.toUpperCase();
    const cleanName = pokemon.name.trim().toLowerCase();
    const sprite = document.getElementById('pmodal-sprite');
    sprite.src = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${cleanName}.gif`;
    sprite.onerror = function () { this.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/0.png'; };
    document.getElementById('pmodal-encounters').innerText = pokemon.encounters ? parseInt(pokemon.encounters).toLocaleString() : '0';
    document.getElementById('pmodal-nature').innerText = pokemon.nature || '---';
    document.getElementById('pmodal-location').innerText = pokemon.location || '---';
    document.getElementById('pmodal-iv-hp').innerText = pokemon.ivHp || '0';
    document.getElementById('pmodal-iv-atk').innerText = pokemon.ivAtk || '0';
    document.getElementById('pmodal-iv-def').innerText = pokemon.ivDef || '0';
    document.getElementById('pmodal-iv-spatk').innerText = pokemon.ivSpatk || '0';
    document.getElementById('pmodal-iv-spdef').innerText = pokemon.ivSpdef || '0';
    document.getElementById('pmodal-iv-speed').innerText = pokemon.ivSpeed || '0';
    modal.style.display = 'flex';
}

function closePokemonModal() { document.getElementById('pokemon-detail-modal').style.display = 'none'; }

function syncSelectOptions() {
    const select = document.getElementById('poke-user-select');
    if (!select) return;
    const editableProfiles = window.showcaseData.filter(canManageProfile);
    select.innerHTML = editableProfiles.length ? '' : '<option value="">Primero crea tu perfil</option>';
    editableProfiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.innerText = profile.username;
        select.appendChild(option);
    });
}

function renderShowcase(filter = '') {
    const grid = document.getElementById('showcase-members-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const sorted = [...window.showcaseData].sort((a, b) => (b.pokemons?.length || 0) - (a.pokemons?.length || 0));

    sorted.forEach(profile => {
        if (filter && !profile.username.toLowerCase().includes(filter.toLowerCase())) return;
        const pList = profile.pokemons || [];
        const favorite = pList.find(pokemon => pokemon.isFav) || pList[0];
        const canEdit = canManageProfile(profile);
        const card = document.createElement('div');
        card.className = 'member-card';
        card.onclick = () => openModal(profile);
        const buddyHtml = favorite ? `<div class="buddy-sprite"><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/${favorite.name.trim().toLowerCase()}.gif" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/0.png'"></div>` : '<div class="buddy-sprite"></div>';
        const deleteButton = canEdit ? `<button class="delete-user-btn" onclick="event.stopPropagation(); deleteUser('${profile.id}')"><i class="fa-solid fa-user-minus"></i></button>` : '';
        const ownerBadge = window.isAdmin && profile.ownerId !== window.currentUser?.uid ? '<span class="owner-badge">Perfil ajeno</span>' : '';

        card.innerHTML = `${deleteButton}<div class="avatar-container"><div class="trainer-avatar"><img src="${profile.avatar || 'https://play.pokemmo.com/media/sprites/trainer/front/1.png'}"></div>${buddyHtml}</div><h3 style="margin-bottom:6px; color:#fff;">${profile.username}</h3><span class="badge-count">${pList.length} Shinies</span>${ownerBadge}`;
        grid.appendChild(card);
    });
}

function deleteUser(profileId) {
    const profile = getProfile(profileId);
    if (!profile || !canManageProfile(profile)) return;
    if (confirm(`¿Eliminar el perfil de ${profile.username} y todos sus Pokémon?`)) {
        window.firebaseSet(window.firebaseRef(window.firebaseDb, `showcaseData/${profileId}`), null);
    }
}

function deletePokemon(profileId, pokemonId) {
    const profile = getProfile(profileId);
    if (!profile || !canManageProfile(profile)) return;
    if (confirm('¿Eliminar este Pokémon del registro?')) {
        profile.pokemons = profile.pokemons.filter(pokemon => pokemon.id !== pokemonId);
        saveProfile(profile);
        openModal(profile);
    }
}

function toggleFavPokemon(profileId, pokemonId) {
    const profile = getProfile(profileId);
    if (!profile || !canManageProfile(profile)) return;
    profile.pokemons.forEach(pokemon => {
        if (pokemon.id === pokemonId) pokemon.isFav = !pokemon.isFav;
        else pokemon.isFav = false;
    });
    saveProfile(profile);
    openModal(profile);
}

window.renderShowcase = renderShowcase;
window.syncSelectOptions = syncSelectOptions;
