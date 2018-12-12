
export const nodeVertexShader = `
  varying vec3 vColor;
  void main() {
    vColor = color.xyz;
    vec4 mvPosition = modelViewMatrix * vec4( position.xyz, 1.0);
    gl_PointSize = 5.0;
    gl_Position =  projectionMatrix * mvPosition;
  }
`

export const nodeFragmentShader = `
  #ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
  #endif

  precision mediump float;
  varying vec3 vColor;

  void main()
  {
      float r = 0.0, delta = 0.0, alpha = 1.0;
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      r = dot(cxy, cxy);
  #ifdef GL_OES_standard_derivatives
      delta = fwidth(r);
      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
  #endif

  gl_FragColor = vec4(vColor.xyz, alpha);

  }
`