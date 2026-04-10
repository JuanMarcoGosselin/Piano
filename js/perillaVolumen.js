let presionado  = false; 
let mouseYincial = 0;
let anguloActual = 0;

document.getElementById('contenedorPerilla').addEventListener('mousedown', function(evento) {
    presionado = true;
    mouseYincial = evento.clientY;
});

document.addEventListener('mousemove', function(evento) {
    if (!presionado) 
        return;

    const movimiento = evento.clientY - mouseYincial;
    let nuevoAngulo = anguloActual + movimiento * 0.5; 
    nuevoAngulo = Math.max(-135, Math.min(135, nuevoAngulo));
    document.getElementById('perillaVolumen').style.transform = `rotate(${nuevoAngulo}deg)`;

    const volumen = Math.round(((nuevoAngulo + 135)/270)*100)
    AsignarVolumen(volumen);

});

document.addEventListener('mouseup', function() {
    presionado = false;
});