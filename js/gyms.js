function playBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch(e) { console.log("Audio no iniciado"); }
    }

    function triggerAlarm(id, message) {
        if (activeAlerts.has(id)) return;
        activeAlerts.add(id);
        const container = document.getElementById('alert-container');
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-banner';
        alertDiv.id = `alert-${id}`;
        alertDiv.innerHTML = `<span><b>${message}</b></span><button class="btn-stop" onclick="stopAlarm('${id}')">PARAR</button>`;
        container.appendChild(alertDiv);
        if (!audioInterval) { playBeep(); audioInterval = setInterval(playBeep, 3000); }
    }

    function stopAlarm(id) {
        activeAlerts.delete(id);
        const el = document.getElementById(`alert-${id}`);
        if (el) el.remove();
        if (activeAlerts.size === 0) { clearInterval(audioInterval); audioInterval = null; }
    }

    function checkNotifications() {
        const ahora = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        berryChars.forEach((char, index) => {
            if (char.nextWater === ahora && !activeAlerts.has(`${index}-water`)) {
                triggerAlarm(`${index}-water`, `💧 Toca REGAR en: ${char.name}`);
            }
            if (char.nextHarvest === ahora && !activeAlerts.has(`${index}-harvest`)) {
                triggerAlarm(`${index}-harvest`, `🍓 Toca COSECHAR en: ${char.name}`);
            }
        });
    }

    // --- HISTORIAL ---
    function selectBerryLog(charIdx, logIdx) {
        const log = berryChars[charIdx].logs[logIdx];
        berryChars[charIdx].nextWater = log.riego || '--:--';
        berryChars[charIdx].nextHarvest = log.cosecha;
        saveAll();
        renderBerry();
    }

    // --- FUNCIONES GIMNASIOS ---
    function addGymChar() {
        const name = document.getElementById('newCharGym').value.trim();
        if(name) {
            gymChars.push({name, nextAvailable:0, multiplier:1.75, itemCost:20000});
            document.getElementById('newCharGym').value='';
            saveAll(); renderGym();
        }
    }

    function startGymRun(i) {
        gymChars[i].nextAvailable = Date.now() + (GYM_COOLDOWN * 60 * 60 * 1000);
        saveAll(); renderGym();
    }

    function updateGymCalc(i) {
        gymChars[i].multiplier = parseFloat(document.getElementById(`mult-${i}`).value);
        gymChars[i].itemCost = parseFloat(document.getElementById(`cost-${i}`).value) || 0;
        saveAll();
        const neto = (BASE_28_GYMS * gymChars[i].multiplier) - gymChars[i].itemCost;
        document.getElementById(`neto-${i}`).innerText = new Intl.NumberFormat('es-ES').format(Math.floor(neto)) + " ¥";
    }

    function renderGym() {
        const tabs = document.getElementById('gymTabs');
        const content = document.getElementById('gymContent');
        if(!tabs) return;
        tabs.innerHTML = ''; content.innerHTML = '';
        
        gymChars.forEach((char, i) => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${i === activeGymTab ? 'active' : ''}`;
            btn.innerText = char.name;
            btn.onclick = () => { activeGymTab = i; renderGym(); };
            tabs.appendChild(btn);
        });

        const active = gymChars[activeGymTab];
        if(active) {
            const ms = active.nextAvailable - Date.now();
            const disponible = ms <= 0;
            let timeStr = "¡DISPONIBLE!";
            if(!disponible) {
                const h = Math.floor(ms / (1000*60*60));
                const m = Math.floor((ms % (1000*60*60)) / (1000*60));
                timeStr = `${h}h ${m}m`;
            }

            const neto = (BASE_28_GYMS * active.multiplier) - active.itemCost;

            content.innerHTML = `
                <div class="timer-display" style="color:${disponible ? 'var(--green)' : 'var(--gold)'}">${timeStr}</div>
                <button class="btn-main" onclick="startGymRun(${activeGymTab})" ${!disponible ? 'disabled' : ''}>
                    ${disponible ? 'Iniciar CoolDown (18h)' : 'En Cooldown'}
                </button>
                <div class="calc-grid" style="margin-top:20px;">
                    <div>
                        <label style="font-size:0.85em; color:#888;">Multiplicador</label>
                        <select id="mult-${activeGymTab}" onchange="updateGymCalc(${activeGymTab})">
                            <option value="1.5" ${active.multiplier===1.5?'selected':''}>Mon. Amuleto (50%)</option>
                            <option value="1.75" ${active.multiplier===1.75?'selected':''}>Amuleto Riqueza (75%)</option>
                            <option value="2" ${active.multiplier===2?'selected':''}>Amuleto Riqueza (100%)</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.85em; color:#888;">Gastos (Peluches/Amuleto)</label>
                        <input type="number" id="cost-${activeGymTab}" value="${active.itemCost}" oninput="updateGymCalc(${activeGymTab})">
                    </div>
                </div>
                <div style="margin-top:15px; text-align:center; font-size:1.2em;">
                    Ganancia Estimada: <b id="neto-${activeGymTab}" style="color:var(--green)">${new Intl.NumberFormat('es-ES').format(Math.floor(neto))} ¥</b>
                </div>
                <button onclick="deleteGymChar(${activeGymTab})" style="background:rgba(231,76,60,0.2); color:var(--red); border:1px solid var(--red); padding:8px; width:100%; margin-top:25px; border-radius:6px; cursor:pointer; font-weight:bold;">Eliminar Personaje</button>
            `;
        } else {
            content.innerHTML = `<p style="text-align:center; color:#666;">No hay personajes registrados. Añade uno arriba.</p>`;
        }
    }

    function deleteGymChar(i) {
        if(confirm("¿Eliminar este personaje?")) {
            gymChars.splice(i, 1);
            activeGymTab = 0;
            saveAll(); renderGym();
        }
    }

    // --- FUNCIONES BAYAS ---
    
