
    // --- DATOS GLOBALES ---
    let gymChars = JSON.parse(localStorage.getItem('pmmo_gym_v12')) || [];
    let berryChars = JSON.parse(localStorage.getItem('pmmo_berry_v12')) || [];
    window.showcaseData = []; // Declarado explícitamente en window para Firebase
    
    let activeGymTab = 0;
    let activeBerryTab = 0;
    let activeAlerts = new Set(); 
    let audioInterval = null;

    const BASE_28_GYMS = 250000; 
    const GYM_COOLDOWN = 18;

    // --- SISTEMA DE ALARMAS ---
    
