#ifdef GL_ES
precision mediump float;
#endif

uniform float scale;
uniform vec2 position;
uniform vec2 worldsize;
uniform sampler2D previousGravity;
uniform int index;

const float BASE = 255.0;
const float OFFSET = BASE * BASE / 2.0;

float decode(vec2 channels, float scale) {
  return (dot(channels, vec2(BASE, BASE * BASE)) - OFFSET) / scale;
}

vec2 encode(float value, float scale) {
  value = value * scale + OFFSET;
  float x = mod(value, BASE);
  float y = floor(value / BASE);
  return vec2(x, y) / BASE;
}

void main() {
  vec2 pg = vec2(0.0, 0.0);
  if (index != 0) {
    vec4 gsample = texture2D(previousGravity, gl_FragCoord.xy / worldsize);
    pg = vec2(decode(gsample.rg, scale), decode(gsample.ba, scale));
  }
  vec2 gravity = pg + 3.0 * normalize(gl_FragCoord.xy - position) / pow(distance(gl_FragCoord.xy, position), 1.0);
  gl_FragColor = vec4(encode(gravity.x, scale), encode(gravity.y, scale));
}
