/* requestAnimationFrame shim */
if (window.requestAnimationFrame == null) {
    window.requestAnimationFrame =
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
}

function comma(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,');
}

var particles = null,
    controller = null;

function updateCount() {
    var count = particles.statesize[0] * particles.statesize[1];
    $('.count').text(comma(count));
}

$(document).ready(function() {
    var canvas = $('#display')[0];
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = new Particles(canvas, 1024 * 32, 5).draw().start();
    controller = new Controller(particles);
    new FPS(particles);
    updateCount();
});
