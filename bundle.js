(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Vector = require('./vector');

/**
 * Particle
 */
function Particle(x, y, radius, mass) {
    Vector.call(this, x, y);
    this.radius = radius;
    this.mass = mass;

    this._latest = new Vector();
    this._speed  = new Vector();
}

Particle.prototype = (function(o) {
    var s = new Vector(0, 0), p;
    for (p in o) s[p] = o[p];
    return s;
})({
    addSpeed: function(d) {
        if(isNaN(d.x) || isNaN(d.y)) {
            console.log("NaN detected.");
        }
        this._speed.add(d);
    },

    update: function(particles) {
        if (this.destroyed) return;
        if (this._speed.length() > 12) this._speed.normalize().scale(12);

        for (i = 0, len = particles.length; i < len; i++) {
            p = particles[i];
            if (p === this || p.destroyed) continue;

            if (
                this.mass >= p.mass && this.distanceTo(p) < (this.radius + p.radius) * 0.8
            ) {
                p.destroyed = true;
                this.gravity += p.gravity;

                this.addSpeed(new Vector(0.2 * p.mass * p._speed.x / this.mass,
                                         0.2 * p.mass * p._speed.y / this.mass));

                area = this.radius * this.radius * Math.PI;
                parea = p.radius * p.radius * Math.PI;
                this.radius = Math.sqrt((area + parea) / Math.PI);
            }

            var distance = Vector.distance(this, p);
            a = (p.mass) / (distance)
            this.addSpeed(Vector.sub(p, this).normalize().scale(a));
        }

        this._latest.set(this);
        this.add(this._speed);
    }

});

module.exports = Particle;

},{"./vector":2}],2:[function(require,module,exports){
/**
 * Vector
 */
function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.add = function(a, b) {
    return new Vector(a.x + b.x, a.y + b.y);
};

Vector.sub = function(a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
};

Vector.scale = function(v, s) {
    return v.clone().scale(s);
};

Vector.random = function() {
    return new Vector(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
    );
};

Vector.distance = function(a, b) {
    var dx = a.x - b.x,
        dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

Vector.prototype = {
    set: function(x, y) {
        if (typeof x === 'object') {
            y = x.y;
            x = x.x;
        }
        this.x = x || 0;
        this.y = y || 0;
        return this;
    },

    add: function(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    },

    sub: function(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    },

    scale: function(s) {
        this.x *= s;
        this.y *= s;
        return this;
    },

    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    lengthSq: function() {
        return this.x * this.x + this.y * this.y;
    },

    normalize: function() {
        var m = Math.sqrt(this.x * this.x + this.y * this.y);
        if (m) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    },

    angle: function() {
        return Math.atan2(this.y, this.x);
    },

    angleTo: function(v) {
        var dx = v.x - this.x,
            dy = v.y - this.y;
        return Math.atan2(dy, dx);
    },

    distanceTo: function(v) {
        var dx = v.x - this.x,
            dy = v.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    distanceToSq: function(v) {
        var dx = v.x - this.x,
            dy = v.y - this.y;
        return dx * dx + dy * dy;
    },

    lerp: function(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        return this;
    },

    clone: function() {
        return new Vector(this.x, this.y);
    },

    toString: function() {
        return '(x:' + this.x + ', y:' + this.y + ')';
    }
};

module.exports = Vector;

},{}],3:[function(require,module,exports){
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

    window.appendParticle = appendParticle;

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

},{"./particle":1,"./vector":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInBhcnRpY2xlLmpzIiwidmVjdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpO1xuXG4vKipcbiAqIFBhcnRpY2xlXG4gKi9cbmZ1bmN0aW9uIFBhcnRpY2xlKHgsIHksIHJhZGl1cywgbWFzcykge1xuICAgIFZlY3Rvci5jYWxsKHRoaXMsIHgsIHkpO1xuICAgIHRoaXMucmFkaXVzID0gcmFkaXVzO1xuICAgIHRoaXMubWFzcyA9IG1hc3M7XG5cbiAgICB0aGlzLl9sYXRlc3QgPSBuZXcgVmVjdG9yKCk7XG4gICAgdGhpcy5fc3BlZWQgID0gbmV3IFZlY3RvcigpO1xufVxuXG5QYXJ0aWNsZS5wcm90b3R5cGUgPSAoZnVuY3Rpb24obykge1xuICAgIHZhciBzID0gbmV3IFZlY3RvcigwLCAwKSwgcDtcbiAgICBmb3IgKHAgaW4gbykgc1twXSA9IG9bcF07XG4gICAgcmV0dXJuIHM7XG59KSh7XG4gICAgYWRkU3BlZWQ6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYoaXNOYU4oZC54KSB8fCBpc05hTihkLnkpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5hTiBkZXRlY3RlZC5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3BlZWQuYWRkKGQpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKHBhcnRpY2xlcykge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuX3NwZWVkLmxlbmd0aCgpID4gMTIpIHRoaXMuX3NwZWVkLm5vcm1hbGl6ZSgpLnNjYWxlKDEyKTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBwYXJ0aWNsZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHAgPSBwYXJ0aWNsZXNbaV07XG4gICAgICAgICAgICBpZiAocCA9PT0gdGhpcyB8fCBwLmRlc3Ryb3llZCkgY29udGludWU7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLm1hc3MgPj0gcC5tYXNzICYmIHRoaXMuZGlzdGFuY2VUbyhwKSA8ICh0aGlzLnJhZGl1cyArIHAucmFkaXVzKSAqIDAuOFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcC5kZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuZ3Jhdml0eSArPSBwLmdyYXZpdHk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFkZFNwZWVkKG5ldyBWZWN0b3IoMC4yICogcC5tYXNzICogcC5fc3BlZWQueCAvIHRoaXMubWFzcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMC4yICogcC5tYXNzICogcC5fc3BlZWQueSAvIHRoaXMubWFzcykpO1xuXG4gICAgICAgICAgICAgICAgYXJlYSA9IHRoaXMucmFkaXVzICogdGhpcy5yYWRpdXMgKiBNYXRoLlBJO1xuICAgICAgICAgICAgICAgIHBhcmVhID0gcC5yYWRpdXMgKiBwLnJhZGl1cyAqIE1hdGguUEk7XG4gICAgICAgICAgICAgICAgdGhpcy5yYWRpdXMgPSBNYXRoLnNxcnQoKGFyZWEgKyBwYXJlYSkgLyBNYXRoLlBJKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGRpc3RhbmNlID0gVmVjdG9yLmRpc3RhbmNlKHRoaXMsIHApO1xuICAgICAgICAgICAgYSA9IChwLm1hc3MpIC8gKGRpc3RhbmNlKVxuICAgICAgICAgICAgdGhpcy5hZGRTcGVlZChWZWN0b3Iuc3ViKHAsIHRoaXMpLm5vcm1hbGl6ZSgpLnNjYWxlKGEpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xhdGVzdC5zZXQodGhpcyk7XG4gICAgICAgIHRoaXMuYWRkKHRoaXMuX3NwZWVkKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnRpY2xlO1xuIiwiLyoqXG4gKiBWZWN0b3JcbiAqL1xuZnVuY3Rpb24gVmVjdG9yKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgdGhpcy55ID0geSB8fCAwO1xufVxuXG5WZWN0b3IuYWRkID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBuZXcgVmVjdG9yKGEueCArIGIueCwgYS55ICsgYi55KTtcbn07XG5cblZlY3Rvci5zdWIgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoYS54IC0gYi54LCBhLnkgLSBiLnkpO1xufTtcblxuVmVjdG9yLnNjYWxlID0gZnVuY3Rpb24odiwgcykge1xuICAgIHJldHVybiB2LmNsb25lKCkuc2NhbGUocyk7XG59O1xuXG5WZWN0b3IucmFuZG9tID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoXG4gICAgICAgIE1hdGgucmFuZG9tKCkgKiAyIC0gMSxcbiAgICAgICAgTWF0aC5yYW5kb20oKSAqIDIgLSAxXG4gICAgKTtcbn07XG5cblZlY3Rvci5kaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgZHggPSBhLnggLSBiLngsXG4gICAgICAgIGR5ID0gYS55IC0gYi55O1xuICAgIHJldHVybiBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xufVxuXG5WZWN0b3IucHJvdG90eXBlID0ge1xuICAgIHNldDogZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICBpZiAodHlwZW9mIHggPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB5ID0geC55O1xuICAgICAgICAgICAgeCA9IHgueDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgICAgIHRoaXMueSA9IHkgfHwgMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGFkZDogZnVuY3Rpb24odikge1xuICAgICAgICB0aGlzLnggKz0gdi54O1xuICAgICAgICB0aGlzLnkgKz0gdi55O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgc3ViOiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHRoaXMueCAtPSB2Lng7XG4gICAgICAgIHRoaXMueSAtPSB2Lnk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBzY2FsZTogZnVuY3Rpb24ocykge1xuICAgICAgICB0aGlzLnggKj0gcztcbiAgICAgICAgdGhpcy55ICo9IHM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBsZW5ndGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSk7XG4gICAgfSxcblxuICAgIGxlbmd0aFNxOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueTtcbiAgICB9LFxuXG4gICAgbm9ybWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG0gPSBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcbiAgICAgICAgaWYgKG0pIHtcbiAgICAgICAgICAgIHRoaXMueCAvPSBtO1xuICAgICAgICAgICAgdGhpcy55IC89IG07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGFuZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy55LCB0aGlzLngpO1xuICAgIH0sXG5cbiAgICBhbmdsZVRvOiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHZhciBkeCA9IHYueCAtIHRoaXMueCxcbiAgICAgICAgICAgIGR5ID0gdi55IC0gdGhpcy55O1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMihkeSwgZHgpO1xuICAgIH0sXG5cbiAgICBkaXN0YW5jZVRvOiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHZhciBkeCA9IHYueCAtIHRoaXMueCxcbiAgICAgICAgICAgIGR5ID0gdi55IC0gdGhpcy55O1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICB9LFxuXG4gICAgZGlzdGFuY2VUb1NxOiBmdW5jdGlvbih2KSB7XG4gICAgICAgIHZhciBkeCA9IHYueCAtIHRoaXMueCxcbiAgICAgICAgICAgIGR5ID0gdi55IC0gdGhpcy55O1xuICAgICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XG4gICAgfSxcblxuICAgIGxlcnA6IGZ1bmN0aW9uKHYsIHQpIHtcbiAgICAgICAgdGhpcy54ICs9ICh2LnggLSB0aGlzLngpICogdDtcbiAgICAgICAgdGhpcy55ICs9ICh2LnkgLSB0aGlzLnkpICogdDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54LCB0aGlzLnkpO1xuICAgIH0sXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAnKHg6JyArIHRoaXMueCArICcsIHk6JyArIHRoaXMueSArICcpJztcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjtcbiJdfQ==
