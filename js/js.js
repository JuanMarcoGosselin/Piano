let audioCtx = null;
        octavaActual = 4; 
        const audioBuffers = {};
        let pedalSostenuto = false;
        const sourcesActivos = {};
        let gainNode = null;
        let VolumenGlobal = 0.5;
        const teclas = {
            'a' : 60, //C4
            'w' : 61, //C#4
            's' : 62, //D4
            'e' : 63, //D#4
            'd' : 64, //E4
            'f' : 65, //F4
            't' : 66, //F#4
            'g' : 67, //G4
            'y' : 68, //G#4
            'h' : 69, //A4
            'u' : 70, //A#4
            'j' : 71, //B4
            'k' : 72, //C5
        }; 

        
        let regionesSFZ = [];

        (async function inicio() {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            // Crear nodo de ganancia para el volumen 
            gainNode = audioCtx.createGain();
            gainNode.gain.value = VolumenGlobal;
            gainNode.connect(audioCtx.destination);

            
            regionesSFZ = await cargarSFZ();

            await precargarAudio();
            document.getElementById("pantalla-carga").classList.add("oculta");
            console.log("SFZ cargado, listo para tocar");
        })();

        async function cargarSFZ() {
            const response = await fetch('soundfonts/SalamanderGrandPianoV3Retuned.sfz');
            const textoSFZ = await response.text(); 
            console.log("Contenido del SFZ:", textoSFZ);
            return parsearSFZ(textoSFZ);
        } 

        async function precargarAudio() {
            for (const region of regionesSFZ) {
                await loadAudioBuffer(region.sample);
                console.log("Audio precargado para muestra:", region.sample);
            }
        }


        function parsearSFZ(texto) {
            const regiones = [];
            let lineas = texto.split('\n');
            for (const linea of lineas) {
                if (linea.includes('<region>') && linea.match(/v10\.wav/)) {
                    sampleMatch = linea.match(/sample=([^\s]+)/);
                    const region = {};
                    if (sampleMatch)
                        region.sample = sampleMatch[1];

                    const lokeyMatch = linea.match(/lokey=(\d+)/)
                   if (lokeyMatch)
                        region.lokey = parseInt(lokeyMatch[1]);

                    const pitch_keycenterMatch  = linea.match(/pitch_keycenter=(\d+)/)
                    if (pitch_keycenterMatch)
                        region.pitch_keycenter = parseInt(pitch_keycenterMatch[1]);

                    const hikeyMatch = linea.match(/hikey=(\d+)/)
                    if (hikeyMatch)
                        region.hikey = parseInt(hikeyMatch[1]);

                    regiones.push(region);
                }
            }
            console.log("Regiones parseadas:", regiones);
            return regiones
        }


        document.addEventListener('keydown', function(evento) {
                
        if (evento.repeat){
            return;
            }
        console.log(evento.key);

        //lógica de octavas
        const X = document.getElementById("X");
        const Z = document.getElementById("Z");
        if ((evento.key === "X" || evento.key === "x") && octavaActual < 7){
            octavaActual++;
            console.log("Octava actual:", octavaActual);
            X.classList.add("cambio-activadoX");
            setTimeout(() => {
                X.classList.remove("cambio-activadoX");
            }, 100);
            return;         
        }
        else if ((evento.key === "Z" || evento.key === "z") && octavaActual > 1){
            octavaActual--;
            console.log("Octava actual:", octavaActual);
            Z.classList.add("cambio-activadoZ");
            setTimeout(() => {
                Z.classList.remove("cambio-activadoZ");
            }, 100);
        
        
            return;
        }



        if (evento.key in teclas) {
            const notaBase = teclas[evento.key];
            const presionada = document.querySelector(`[data-nota="${notaBase}"]`)
            const nota = notaBase + ((octavaActual - 4) * 12);
            
            if (presionada.classList.contains('tecla-blanca')) { 
                presionada.classList.add('tecla-blanca-activada');
            } else {
                presionada.classList.add('tecla-negra-activada');
            }
            PlayDo(nota);
        }
        if (evento.code === 'Space') {
            pedalSostenuto = true;
            const PedalActivo = document.getElementById('sustain');
            PedalActivo.classList.add("sustain-activado");
        }
        });

        document.addEventListener('keyup', function(evento) {
            if(evento.key in teclas) {
                const notaBase = teclas[evento.key];
                const nota = notaBase + ((octavaActual - 4) * 12);
                const suelta = document.querySelector(`[data-nota="${notaBase}"]`)
                

                if (sourcesActivos[nota] != null && !pedalSostenuto) {
                sourcesActivos[nota].stop(audioCtx.currentTime + 0.81);
                gainNode.gain.value = VolumenGlobal*0.8; // Disminuir el volumen para simular el decaimiento natural
                }
                if (suelta.classList.contains('tecla-blanca')) { 
                    suelta.classList.remove('tecla-blanca-activada');
                } else {
                    suelta.classList.remove('tecla-negra-activada');
                }

            }
        if (evento.code === 'Space') {
            pedalSostenuto = false;
            const PedalActivo = document.getElementById('sustain');
            for (const i in sourcesActivos) {
                sourcesActivos[i].stop(audioCtx.currentTime + 0.5);
            }
            PedalActivo.classList.remove('sustain-activado');           
        }
        });

        function AsignarVolumen(volumen) {
            VolumenGlobal = volumen/100;
            if (gainNode) {
                gainNode.gain.value = VolumenGlobal;
            }
        }

        async function PlayDo(nota) { 
            if (audioCtx.state == 'suspended') {
                await audioCtx.resume();
            }
            console.log(audioCtx.state)
            const region = regionesSFZ.find(r => nota >= r.lokey && nota <= r.hikey);

            if (!region) {
                console.warn("No se encontró región para nota:", nota);
                return;
            }

            console.log("nota:", nota, "region:", region);

            const buffer = await loadAudioBuffer(region.sample);
            console.log("buffer cargado:", buffer);

            // Crear buffer para tocar audio
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = Math.pow(2, (nota - region.pitch_keycenter)/ 12); 
            sourcesActivos[nota] = source;
            

            // Conectar nodos
            source.connect(gainNode);
            //destination es el ultimo nodo, ya existente no es necesario crear uno nuevo
            

            console.log("playbackRate:", source.playbackRate.value);
            console.log("gain:", gainNode.gain.value);
            console.log("source conectado, arrancando...");

            source.start(audioCtx.currentTime);
        }

        async function loadAudioBuffer(samplePath) {
            const safePath = "soundfonts/" + samplePath
                .replace(/#/g, '%23')
                .replace(/\\/g, '/'); 
            if (audioBuffers[safePath]) {
                return audioBuffers[safePath];
            }
            const response = await fetch(safePath);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            audioBuffers[safePath] = audioBuffer;
            return audioBuffer;
        }

        