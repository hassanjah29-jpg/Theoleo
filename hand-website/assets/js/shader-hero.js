/* HAND — animated shader hero background.
   Vanilla WebGL2 port of the "animated-shader-hero" component
   (shader by Matthias Hurrle / @atzedent, retinted to HAND's
   emerald/ink palette). Renders behind the homepage hero text.
   Degrades silently: no WebGL2, reduced motion, or no hero →
   the static dark background remains. */

(function () {
  "use strict";

  if (!document.body || !document.body.classList) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var FRAG = "#version 300 es\n" +
    "precision highp float;\n" +
    "out vec4 O;\n" +
    "uniform vec2 resolution;\n" +
    "uniform float time;\n" +
    "#define FC gl_FragCoord.xy\n" +
    "#define T time\n" +
    "#define R resolution\n" +
    "#define MN min(R.x,R.y)\n" +
    "float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}\n" +
    "float noise(in vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);" +
    "float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);" +
    "return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}\n" +
    "float fbm(vec2 p){float t=.0,a=1.;mat2 m=mat2(1.,-.5,.2,1.2);" +
    "for(int i=0;i<5;i++){t+=a*noise(p);p*=2.*m;a*=.5;}return t;}\n" +
    "float clouds(vec2 p){float d=1.,t=.0;" +
    "for(float i=.0;i<3.;i++){float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);" +
    "t=mix(t,d,a);d=a;p*=2./(i+1.);}return t;}\n" +
    "void main(void){\n" +
    "  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);\n" +
    "  vec3 col=vec3(0);\n" +
    "  float bg=clouds(vec2(st.x+T*.5,-st.y));\n" +
    "  uv*=1.-.3*(sin(T*.2)*.5+.5);\n" +
    "  for(float i=1.;i<12.;i++){\n" +
    "    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);\n" +
    "    vec2 p=uv;\n" +
    "    float d=length(p);\n" +
    "    col+=.00125/d*((cos(sin(i)*vec3(1,2,3))+1.)*vec3(.45,1.,.78));\n" +
    "    float b=noise(i+p+bg*1.731);\n" +
    "    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));\n" +
    /* HAND retint: original amber nebula → deep emerald/teal */
    "    col=mix(col,vec3(bg*.04,bg*.22,bg*.158),d);\n" +
    "  }\n" +
    "  O=vec4(col*.9,1);\n" +
    "}";

  var VERT = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}";

  function init() {
    if (reduced) return;
    var stage = document.querySelector(".scrub-hero .scrub-stage") ||
                document.querySelector(".hero");
    if (!stage) return;

    var canvas = document.createElement("canvas");
    canvas.className = "hero-canvas";
    canvas.setAttribute("aria-hidden", "true");

    var gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) return;

    var veil = document.createElement("div");
    veil.className = "hero-veil";
    veil.setAttribute("aria-hidden", "true");

    stage.insertBefore(veil, stage.firstChild);
    stage.insertBefore(canvas, veil);
    stage.classList.add("has-shader");

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.remove(); veil.remove(); return; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); veil.remove(); return; }

    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, "resolution");
    var uTime = gl.getUniformLocation(prog, "time");

    function resize() {
      var dpr = Math.max(1, 0.5 * (window.devicePixelRatio || 1));
      var w = stage.clientWidth, h = stage.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    var running = false;
    var visible = true;
    var raf = null;

    function frame(now) {
      raf = null;
      if (!running) return;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }

    function setRunning(on) {
      on = on && visible && !document.hidden;
      if (on === running) return;
      running = on;
      if (running && !raf) raf = requestAnimationFrame(frame);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        setRunning(visible);
      }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { setRunning(!document.hidden); });

    setRunning(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
