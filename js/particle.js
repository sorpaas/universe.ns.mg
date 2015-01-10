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
