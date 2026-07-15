
        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
        import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

        const firebaseConfig = {
            apiKey: "AIzaSyDQimdGIIOu-blPbtU63MrGPpMbDwMAgGw",
            authDomain: "pokemmo-tool.firebaseapp.com",
            databaseURL: "https://pokemmo-tool-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "pokemmo-tool",
            storageBucket: "pokemmo-tool.firebasestorage.app",
            messagingSenderId: "873669256817",
            appId: "1:873669256817:web:702da03a997cd809355dd0",
            measurementId: "G-ZV2HPTFDJ5"
        };

        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        const showcaseRef = ref(db, 'showcaseData');

        // Hacer referencias y métodos accesibles al script clásico inferior
        window.firebaseDbRef = showcaseRef;
        window.firebaseSet = set;
        window.firebaseOnValue = onValue;
    
