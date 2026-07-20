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
    const badgeForm = document.getElementById('badge-form');
    if (badgeForm) badgeForm.style.display = tab === 'badge' && window.isAdmin ? 'grid' : 'none';
    const badgeTab = document.getElementById('tab-badge');
    if (badgeTab) badgeTab.classList.toggle('active', tab === 'badge');
}

function canManageProfile(profile) {
    return Boolean(window.currentUser && (window.isAdmin || profile.ownerId === window.currentUser.uid));
}

function getProfile(profileId) {
    return window.showcaseData.find(profile => profile.id === profileId);
}

// Funciones auxiliares para formatear nombres de Pokémon y URLs de sprites
function formatPokemonSpriteName(name) {
    if (!name) return '';
    let clean = name.toLowerCase().trim();

    if (clean === 'nidoran♂' || clean === 'nidoran m' || clean === 'nidoran-m') {
        return 'nidoran-m';
    }
    if (clean === 'nidoran♀' || clean === 'nidoran f' || clean === 'nidoran-f') {
        return 'nidoran-f';
    }

    clean = clean
        .replace(/\./g, '')
        .replace(/\s+/g, '-')
        .replace(/['♀♂]/g, '');

    return clean;
}

function formatPokemonDisplayName(name) {
    if (!name) return '';
    const lowerName = name.toLowerCase().trim();

    // Casos especiales de género
    if (lowerName === 'nidoran-m' || lowerName === 'nidoran♂') return 'Nidoran ♂';
    if (lowerName === 'nidoran-f' || lowerName === 'nidoran♀') return 'Nidoran ♀';
    
    // Casos especiales con nombres compuestos
    if (lowerName === 'mime-jr' || lowerName === 'mime jr') return 'Mime Jr.';
    if (lowerName === 'mr-mime' || lowerName === 'mr mime') return 'Mr. Mime';
    if (lowerName === 'ho-oh' || lowerName === 'hooh') return 'Ho-Oh';

    // Limpieza automática para Pokémon con formas (ej: shellos-east -> shellos)
    const baseName = lowerName.split('-')[0];
    return baseName.charAt(0).toUpperCase() + baseName.slice(1);
}

async function saveProfile(profile) {
    if (!canManageProfile(profile)) {
        throw new Error('No tienes permiso para modificar este perfil.');
    }
    const { id, ...data } = profile;
    try {
        await window.firebaseSet(window.firebaseRef(window.firebaseDb, `showcaseData/${id}`), data);
    } catch (error) {
        console.error('Error al guardar el perfil:', error);
        const message = error.code === 'PERMISSION_DENIED'
            ? 'Firebase ha bloqueado el guardado. Publica las reglas de firebase-rules.json en Realtime Database.'
            : 'No se pudo guardar el perfil. Comprueba tu conexión e inténtalo de nuevo.';
        alert(message);
        throw error;
    }
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
            
            const cleanName = formatPokemonSpriteName(pokemon.name);
            const displayName = formatPokemonDisplayName(pokemon.name);
            
            const controls = canEdit ? `
                <button class="fav-btn ${pokemon.isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavPokemon('${profile.id}', '${pokemon.id}')"><i class="fa-solid fa-star"></i></button>
                <button class="edit-poke-btn" title="Editar shiny" onclick="event.stopPropagation(); editPokemon('${profile.id}', '${pokemon.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-poke-btn" onclick="event.stopPropagation(); deletePokemon('${profile.id}', '${pokemon.id}')"><i class="fa-solid fa-trash-can"></i></button>` : '';

            card.innerHTML = `${controls}
                <img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/${cleanName}.gif" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/0.png'">
                <p>${displayName.toUpperCase()}</p>
                <span>${pokemon.encounters ? parseInt(pokemon.encounters).toLocaleString() : 0} encuentros</span>`;
            grid.appendChild(card);
        });
    }
    const actions = document.getElementById('modal-profile-actions');
    actions.innerHTML = canEdit ? `<button class="btn-toggle" onclick="editProfile('${profile.id}')"><i class="fa-solid fa-pen"></i> Editar perfil</button>` : '';
    modal.style.display = 'flex';
}

function closeModal() { document.getElementById('details-modal').style.display = 'none'; }

function openPokemonModal(pokemon) {
    const modal = document.getElementById('pokemon-detail-modal');
    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    const displayName = formatPokemonDisplayName(pokemon.name);
    document.getElementById('pmodal-name').innerText = displayName.toUpperCase();
    
    const cleanName = formatPokemonSpriteName(pokemon.name);
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
    const badgeSelect = document.getElementById('badge-profile-select');
    if (badgeSelect) {
        badgeSelect.innerHTML = '';
        window.showcaseData.forEach(profile => badgeSelect.add(new Option(profile.username, profile.id)));
    }
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
        
        const cleanBuddyName = favorite ? formatPokemonSpriteName(favorite.name) : '';
        const buddyHtml = favorite ? `<div class="buddy-sprite"><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/${cleanBuddyName}.gif" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/0.png'"></div>` : '<div class="buddy-sprite"></div>';
        const deleteButton = canEdit ? `<button class="edit-user-btn" title="Editar perfil" onclick="event.stopPropagation(); editProfile('${profile.id}')"><i class="fa-solid fa-pen"></i></button><button class="delete-user-btn" onclick="event.stopPropagation(); deleteUser('${profile.id}')"><i class="fa-solid fa-user-minus"></i></button>` : '';
        const ownerBadge = window.isAdmin && profile.ownerId !== window.currentUser?.uid ? '<span class="owner-badge">Perfil ajeno</span>' : '';
        const customBadges = (profile.badges || []).map(badge => {
            const removeButton = window.isAdmin ? `<button class="delete-badge-btn" title="Eliminar badge" onclick="event.stopPropagation(); deleteBadge('${profile.id}', '${badge.id}')"><i class="fa-solid fa-xmark"></i></button>` : '';
            return `<span class="custom-badge" style="color:${badge.color || '#ffcc00'}">${badge.icon || ''} ${badge.label}${removeButton}</span>`;
        }).join('');

        card.innerHTML = `${deleteButton}<div class="avatar-container"><div class="trainer-avatar"><img src="${profile.avatar || 'https://play.pokemmo.com/media/sprites/trainer/front/1.png'}"></div>${buddyHtml}</div><h3 style="margin-bottom:6px; color:#fff;">${profile.username}</h3><span class="badge-count">${pList.length} Shinies</span>${ownerBadge}<div class="custom-badges">${customBadges}</div>`;
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

function deleteBadge(profileId, badgeId) {
    const profile = getProfile(profileId);
    if (!window.isAdmin || !profile) return;
    const badge = (profile.badges || []).find(item => item.id === badgeId);
    if (!badge || !confirm(`¿Eliminar el badge "${badge.label}" de ${profile.username}?`)) return;
    const originalBadges = profile.badges;
    profile.badges = profile.badges.filter(item => item.id !== badgeId);
    saveProfile(profile).catch(() => { profile.badges = originalBadges; });
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
function editProfile(profileId) {
    const profile = getProfile(profileId);
    if (!profile || !canManageProfile(profile)) return;
    closeModal();
    switchShowcaseTab('profile');
    document.getElementById('reg-username').value = profile.username;
    document.getElementById('profile-form').dataset.editId = profile.id;
    document.getElementById('profile-submit-btn').textContent = 'Actualizar perfil';
    document.getElementById('profile-cancel-btn').hidden = false;
    document.getElementById('admin-content').style.display = 'block';
    document.getElementById('toggle-btn').innerText = 'Ocultar Formularios';
    document.getElementById('profile-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function editPokemon(profileId, pokemonId) {
    const profile = getProfile(profileId), pokemon = profile?.pokemons?.find(item => item.id === pokemonId);
    if (!pokemon || !canManageProfile(profile)) return;
    closeModal(); switchShowcaseTab('pokemon');
    document.getElementById('poke-user-select').value = profileId;
    ['name','nature','location','encounters','ivHp','ivAtk','ivDef','ivSpatk','ivSpdef','ivSpeed'].forEach(key => {
        const input = document.getElementById(`poke-${key.replace('ivHp','iv-hp').replace('ivAtk','iv-atk').replace('ivDef','iv-def').replace('ivSpatk','iv-spatk').replace('ivSpdef','iv-spdef').replace('ivSpeed','iv-speed')}`);
        if (input) input.value = pokemon[key] || '';
    });
    const form = document.getElementById('pokemon-form'); form.dataset.editId = pokemonId;
    document.getElementById('pokemon-submit-btn').textContent = 'Actualizar Shiny'; document.getElementById('pokemon-cancel-btn').hidden = false;
    document.getElementById('admin-content').style.display = 'block'; document.getElementById('toggle-btn').innerText = 'Ocultar Formularios';
}
function resetProfileForm() { const form = document.getElementById('profile-form'); form.reset(); delete form.dataset.editId; document.getElementById('profile-submit-btn').textContent = 'Guardar Perfil'; document.getElementById('profile-cancel-btn').hidden = true; }
function resetPokemonForm() { const form = document.getElementById('pokemon-form'); form.reset(); delete form.dataset.editId; document.getElementById('pokemon-submit-btn').textContent = 'Añadir Shiny'; document.getElementById('pokemon-cancel-btn').hidden = true; }
window.editProfile = editProfile; window.editPokemon = editPokemon; window.resetProfileForm = resetProfileForm; window.resetPokemonForm = resetPokemonForm;
window.deleteBadge = deleteBadge;
