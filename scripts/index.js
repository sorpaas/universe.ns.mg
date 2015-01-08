var SPEED = 7;

var Vector = require('./vector');
var Particle = require('./particle');

/**
 * requestAnimationFrame
 */
window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Initialize

(function() {

    // Configs

    var BACKGROUND_COLOR      = 'rgba(11, 51, 56, 1)',
        PARTICLE_RADIUS       = 1,
        G_POINT_RADIUS        = 10,
        G_POINT_RADIUS_LIMITS = 65;

    // Vars

    var canvas, context,
        bufferCvs, bufferCtx,
        screenWidth, screenHeight,
        particles = [],
        offset = new Vector(),
        beginMouse = new Vector(),
        beginOffset = new Vector(),
        dragging = false,
        grad;

    // Event Listeners

    function resize(e) {
        screenWidth  = canvas.width  = window.innerWidth;
        screenHeight = canvas.height = window.innerHeight;
        bufferCvs.width  = screenWidth;
        bufferCvs.height = screenHeight;
        context   = canvas.getContext('2d');
        bufferCtx = bufferCvs.getContext('2d');

        var cx = canvas.width * 0.5,
            cy = canvas.height * 0.5;

        grad = context.createRadialGradient(cx, cy, 0, cx, cy, Math.sqrt(cx * cx + cy * cy));
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    }

    function mouseMove(e) {
        if(dragging) {
            offset.set(beginOffset.x + (e.clientX - beginMouse.x),
                       beginOffset.y + (e.clientY - beginMouse.y));
        }
    }

    function mouseDown(e) {
        canvas.style.cursor = 'pointer';
        beginMouse.set(e.clientX, e.clientY);
        beginOffset.set(offset.x, offset.y);
        dragging = true;
    }

    function mouseUp(e) {
        canvas.style.cursor = 'default';
        dragging = false;
    }

    function appendParticle(num, radius, mass) {
        var i, p;
        for (i = 0; i < num; i++) {
            p = new Particle(
                Math.floor(Math.random() * screenWidth - PARTICLE_RADIUS * 2) + 1 + radius,
                Math.floor(Math.random() * screenHeight - PARTICLE_RADIUS * 2) + 1 + radius,
                radius,
                mass
            );
            p.addSpeed(Vector.random());
            particles.push(p);
        }
    }

    // Init

    canvas  = document.getElementById('c');
    bufferCvs = document.createElement('canvas');

    window.addEventListener('resize', resize, false);
    resize(null);

    appendParticle(300, 1, 1);
    appendParticle(2, 4, 20);

    canvas.addEventListener('mousemove', mouseMove, false);
    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mouseup', mouseUp, false);
    canvas.addEventListener('mouseleave', mouseUp, false);

    // Start Update
    var loop = function() {
        var i, len, g, p;

        context.save();
        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(0, 0, screenWidth, screenHeight);
        context.restore();

        bufferCtx.save();
        bufferCtx.fillStyle = BACKGROUND_COLOR;
        bufferCtx.fillRect(0, 0, screenWidth, screenHeight);
        bufferCtx.restore();

        len = particles.length;
        bufferCtx.save();
        bufferCtx.fillStyle = bufferCtx.strokeStyle = '#fff';
        bufferCtx.lineCap = bufferCtx.lineJoin = 'round';
        bufferCtx.lineWidth = PARTICLE_RADIUS * 2;
        bufferCtx.beginPath();
        for (i = 0; i < len; i++) {
            p = particles[i];
            if (p.destroyed) continue;
            p.update(particles);
            bufferCtx.moveTo(offset.x + p.x, offset.y + p.y);
            bufferCtx.lineTo(offset.x + p._latest.x, offset.y + p._latest.y);
        }
        bufferCtx.stroke();
        bufferCtx.beginPath();
        for (i = 0; i < len; i++) {
            p = particles[i];
            if (p.destroyed) continue;
            bufferCtx.moveTo(offset.x + p.x, offset.y + p.y);
            bufferCtx.arc(offset.x + p.x, offset.y + p.y, p.radius, 0, Math.PI * 2, false);
        }
        bufferCtx.fill();
        bufferCtx.restore();

        context.drawImage(bufferCvs, 0, 0);

        requestAnimationFrame(loop);
    };
    loop();

})();
