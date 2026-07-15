function addBerryChar() {
        const name = document.getElementById('newCharBerry').value.trim();
        if(name) {
            berryChars.push({name, nextWater:'--:--', nextHarvest:'--:--', logs:[]});
            document.getElementById('newCharBerry').value='';
            saveAll(); renderBerry();
        }
    }

    function setBerryTimes(type) {
    const active = berryChars[activeBerryTab];
    if(!active) return;
    const ahora = new Date();
    
    let nombreBaya = "";
    let tiempoCosecha = 0;

    if(type === 'extractoras') {
        nombreBaya = "Extractoras";
        tiempoCosecha = 16;
    } else if(type === 'zanama') {
        nombreBaya = "Zanama";
        tiempoCosecha = 20;
    }

    const format = (d) => d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    
    let tHarvest = new Date(ahora.getTime() + tiempoCosecha * 60 * 60 * 1000);
    active.nextHarvest = format(tHarvest);

    let tRiegoCalculado = new Date(ahora.getTime() + (type === 'extractoras' ? 5 : 9) * 60 * 60 * 1000);
    active.nextWater = format(tRiegoCalculado);

    active.logs.unshift({
        label: `${nombreBaya} (Cosecha: ${tiempoCosecha}h)`,
        fecha: `${ahora.toLocaleDateString()} ${format(ahora)}`,
        cosecha: active.nextHarvest,
        riego: active.nextWater, // Hora limpia para el contador superior
        riegoHistorial: type === 'zanama' ? `Regar: Ahora y ${active.nextWater}` : active.nextWater, // Texto completo para el historial
        aviso: type === 'extractoras' ? "⚠️ Recoger máx. 4h después" : ""
    });

    saveAll(); 
    renderBerry();
}

   function renderBerry() {
    const tabs = document.getElementById('berryTabs');
    const content = document.getElementById('berryContent');
    if(!tabs) return;
    tabs.innerHTML = ''; content.innerHTML = '';

    berryChars.forEach((char, i) => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${i === activeBerryTab ? 'active' : ''}`;
        btn.innerText = char.name;
        btn.onclick = () => { activeBerryTab = i; renderBerry(); };
        tabs.appendChild(btn);
    });

    const active = berryChars[activeBerryTab];
    if(active) {
        let logItems = (active.logs || []).map((l, idx) => `
            <div class="log-item" onclick="selectBerryLog(${activeBerryTab}, ${idx})">
                <div>
                    <b>${l.label}</b> ${l.aviso ? `<span style="color:#ffcc00; font-size:0.8em; margin-left:5px;">⚠️ ${l.aviso}</span>` : ""}
                    <span style="color:#555; font-size:0.85em;">(${l.fecha})</span>
                    <div style="font-size:0.85em; color:#888;">
                        Riego: ${l.riegoHistorial || l.riego} | Cosecha: ${l.cosecha}
                    </div>
                </div>
                <span class="del-log" onclick="event.stopPropagation(); deleteBerryLog(${activeBerryTab}, ${idx})">×</span>
            </div>
        `).join('');

        content.innerHTML = `
            <div class="grid-timers">
                <div class="time-box">
                    <div style="font-size:0.85em; color:#888; text-transform:uppercase;">Próximo Riego</div>
                    <div style="font-size:1.8em; font-weight:bold; color:var(--blue); margin-top:5px;">${active.nextWater}</div>
                </div>
                <div class="time-box" style="border-bottom-color:var(--green)">
                    <div style="font-size:0.85em; color:#888; text-transform:uppercase;">Cosecha</div>
                    <div style="font-size:1.8em; font-weight:bold; color:var(--green); margin-top:5px;">${active.nextHarvest}</div>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <button class="btn-main" style="background:var(--blue); margin:0;" onclick="setBerryTimes('extractoras'); alert('¡Aviso! Recuerda que las Extractoras tienen un máximo de 4 horas extra de margen para ser recogidas tras la cosecha.');">Plantar Extractoras</button>
                <button class="btn-main" style="background:#e67e22; margin:0;" onclick="setBerryTimes('zanama')">Plantar Zanama</button>
            </div>
            
            <div style="margin-top:20px;">
                <span style="color:#888; font-size:0.9em; font-weight:bold;">Historial de Cosechas:</span>
                <div class="history">${logItems || '<p style="color:#444; padding:10px; text-align:center;">No hay registros.</p>'}</div>
            </div>
            <button onclick="deleteBerryChar(${activeBerryTab})" style="background:rgba(231,76,60,0.2); color:var(--red); border:1px solid var(--red); padding:8px; width:100%; margin-top:25px; border-radius:6px; cursor:pointer; font-weight:bold;">Eliminar Cuenta</button>
        `;
    } else {
        content.innerHTML = `<p style="text-align:center; color:#666;">No hay cuentas registradas. Añade una arriba.</p>`;
    }
}

    function deleteBerryLog(charIdx, logIdx) {
        berryChars[charIdx].logs.splice(logIdx, 1);
        saveAll(); renderBerry();
    }

    function deleteBerryChar(i) {
        if(confirm("¿Eliminar esta cuenta de bayas?")) {
            berryChars.splice(i, 1);
            activeBerryTab = 0;
            saveAll(); renderBerry();
        }
    }

    // --- MANEJO DE SECCIONES GENERALES ---
    
