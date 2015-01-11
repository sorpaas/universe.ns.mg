#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 quad;
uniform vec2 worldsize;
uniform vec2 position;
uniform sampler2D previousGravity;

void main() {
    gl_Position = vec4(quad, 0, 1);
}
