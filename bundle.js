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

},{"./particle":1,"./vector":2}]},{},[3]);
