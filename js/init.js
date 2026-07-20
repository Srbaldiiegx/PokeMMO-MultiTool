document.addEventListener('DOMContentLoaded', () => {
    renderGym();
    renderBerry();
    setInterval(renderGym, 30000);
    setInterval(checkNotifications, 15000);

    const firebaseWait = setInterval(() => {
        if (!window.currentUser || !window.firebaseOnValue || !window.firebaseShowcaseRef) return;
        clearInterval(firebaseWait);
        window.firebaseOnValue(window.firebaseShowcaseRef, (snapshot) => {
            const data = snapshot.val() || {};
            window.showcaseData = Object.entries(data).map(([id, profile]) => ({
                id,
                ownerId: profile.ownerId || 'legacy-profile',
                username: profile.username || 'Entrenador',
                avatar: profile.avatar || null,
                pokemons: Array.isArray(profile.pokemons) ? profile.pokemons : [],
                ...profile
            }));
            syncSelectOptions();
            renderShowcase();
        });
    }, 200);

    document.getElementById('profile-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!window.currentUser) return alert('Inicia sesión para crear tu perfil.');
        const username = document.getElementById('reg-username').value.trim();
        if (!username) return;

        const editingId = event.currentTarget.dataset.editId;
        const existing = editingId ? getProfile(editingId) : window.showcaseData.find(profile => profile.ownerId === window.currentUser.uid);
        if (existing && !canManageProfile(existing)) return alert('No tienes permiso para modificar este perfil.');
        const nameInUse = window.showcaseData.some(profile => profile.id !== existing?.id && profile.username.toLowerCase() === username.toLowerCase());
        if (nameInUse) return alert('Ese nombre de entrenador ya está registrado.');

        const avatarFile = document.getElementById('reg-avatar').files[0];
        const avatar = avatarFile ? await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(avatarFile);
        }) : existing?.avatar || null;

        const profile = {
            id: existing?.id || window.currentUser.uid,
            ownerId: existing?.ownerId || window.currentUser.uid,
            username,
            avatar,
            pokemons: existing?.pokemons || [],
            badges: existing?.badges || []
        };
        try {
            await saveProfile(profile);
            resetProfileForm();
            alert(existing ? 'Tu perfil se ha actualizado.' : 'Tu perfil se ha creado.');
        } catch (error) {
            // saveProfile ya muestra un mensaje claro al usuario.
        }
    });

    document.getElementById('pokemon-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const profileId = document.getElementById('poke-user-select').value;
        const pokemonName = document.getElementById('poke-name').value.trim();
        const profile = getProfile(profileId);
        if (!profile || !pokemonName) return;
        if (!canManageProfile(profile)) return alert('No tienes permiso para modificar este perfil.');

        profile.pokemons = profile.pokemons || [];
        const editingPokemonId = event.currentTarget.dataset.editId;
        const oldIndex = profile.pokemons.findIndex(item => item.id === editingPokemonId);
        const originalPokemon = oldIndex >= 0 ? profile.pokemons[oldIndex] : null;
        const pokemon = {
            id: editingPokemonId || `poke_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: pokemonName,
            nature: document.getElementById('poke-nature').value,
            location: document.getElementById('poke-location').value.trim() || 'Desconocido',
            encounters: document.getElementById('poke-encounters').value || '0',
            status: document.getElementById('poke-status').value || originalPokemon?.status || 'active',
            isAlpha: document.getElementById('poke-is-alpha').checked,
            ivHp: document.getElementById('poke-iv-hp').value || '0',
            ivAtk: document.getElementById('poke-iv-atk').value || '0',
            ivDef: document.getElementById('poke-iv-def').value || '0',
            ivSpatk: document.getElementById('poke-iv-spatk').value || '0',
            ivSpdef: document.getElementById('poke-iv-spdef').value || '0',
            ivSpeed: document.getElementById('poke-iv-speed').value || '0',
            isFav: originalPokemon?.isFav || false
        };
        if (oldIndex >= 0) profile.pokemons.splice(oldIndex, 1, pokemon);
        else profile.pokemons.push(pokemon);
        try {
            await saveProfile(profile);
            resetPokemonForm();
            alert(`✨ ${pokemonName.toUpperCase()} se ha registrado para ${profile.username}.`);
        } catch (error) {
            if (oldIndex >= 0) profile.pokemons.splice(oldIndex, 1, originalPokemon);
            else profile.pokemons.pop();
        }
    });

    document.getElementById('badge-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!window.isAdmin) return alert('Solo el administrador puede añadir badges.');
        const profile = getProfile(document.getElementById('badge-profile-select').value);
        const label = document.getElementById('badge-label').value.trim();
        if (!profile || !label) return;
        profile.badges = profile.badges || [];
        profile.badges.push({ id: `badge_${Date.now()}`, label, icon: document.getElementById('badge-icon').value.trim(), color: document.getElementById('badge-color').value });
        try { await saveProfile(profile); event.currentTarget.reset(); }
        catch (error) { profile.badges.pop(); }
    });

    document.getElementById('search-name').addEventListener('input', (event) => renderShowcase(event.target.value));
});

document.addEventListener('auth-state-changed', () => {
    document.querySelectorAll('.admin-only').forEach(element => { element.hidden = !window.isAdmin; });
    if (!window.isAdmin && document.getElementById('badge-form')) document.getElementById('badge-form').style.display = 'none';
});
