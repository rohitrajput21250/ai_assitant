export const orbVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAudio;
  uniform float uState;
  uniform vec2 uPointer;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  void main() {
    vec3 p = position;
    vec3 n = normalize(normal);

    float breathing = sin(uTime * 1.18) * 0.5 + 0.5;
    float listeningPulse = smoothstep(0.18, 1.0, uState) * sin(uTime * 6.0) * 0.025;
    float reaction = clamp(uAudio, 0.0, 1.0);

    float largeWave = sin((n.y + uTime * 0.22) * 8.0 + uPointer.x * 1.7);
    float crossWave = sin((n.x - n.z + uTime * 0.38) * 13.0 + uPointer.y * 2.2);
    float plasmaNoise = noise(n * 3.4 + vec3(uTime * 0.24, -uTime * 0.17, uTime * 0.11));

    float displacement =
      0.035 * breathing +
      0.026 * largeWave +
      0.017 * crossWave +
      0.115 * reaction * plasmaNoise +
      listeningPulse +
      0.025 * uState * plasmaNoise;

    p += n * displacement;
    vDisplacement = displacement;
    vNormal = normalize(normalMatrix * n);
    vPosition = p;

    vec4 worldPosition = modelMatrix * vec4(p, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const orbFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uAudio;
  uniform float uState;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 2.35);
    float rim = pow(fresnel, 0.62);

    float latitude = atan(vPosition.z, vPosition.x);
    float rings = sin(latitude * 9.0 + vPosition.y * 7.0 - uTime * (1.8 + uState));
    rings = rings * 0.5 + 0.5;

    float veins = noise(vPosition.xy * 7.0 + vec2(uTime * 0.21, -uTime * 0.15));
    float electric = smoothstep(0.42, 0.96, rings * 0.58 + veins * 0.52 + uAudio * 0.36);

    float stateShift = clamp(uState / 3.0, 0.0, 1.0);
    vec3 base = mix(uPrimary, uSecondary, 0.45 + 0.45 * sin(uTime * 0.35 + vPosition.y * 1.9));
    vec3 active = mix(base, uAccent, stateShift * 0.58 + uAudio * 0.22);

    float core = 0.54 + 0.35 * veins + 0.18 * sin(uTime * 1.4 + vDisplacement * 28.0);
    vec3 color = active * core;
    color += uPrimary * electric * (0.7 + uAudio * 1.6);
    color += uSecondary * rim * (1.4 + uState * 0.34);
    color += uAccent * pow(rings, 7.0) * (0.45 + uAudio);

    float alpha = clamp(0.68 + rim * 0.28 + electric * 0.18, 0.62, 0.96);
    gl_FragColor = vec4(color, alpha);
  }
`;
