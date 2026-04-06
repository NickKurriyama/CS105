(function () {
    const canvas = document.getElementById("webglcanvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("WebGL không được hỗ trợ");
        return;
    }

    const vertexShaderSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
            v_uv = a_position;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision highp float;
        varying vec2 v_uv;

        uniform int   u_maxIter;
        uniform vec2  u_c;
        uniform vec2  u_center;
        uniform float u_zoom;
        uniform float u_aspect;

        vec3 palette(float t) {
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0, 0.7, 0.4);
            vec3 d = vec3(0.00, 0.15, 0.20);
            return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
            vec2 z;
            z.x = (v_uv.x * u_aspect) / u_zoom + u_center.x;
            z.y = v_uv.y / u_zoom + u_center.y;

            float iter  = 0.0;
            float maxF  = float(u_maxIter);

            for (int i = 0; i < 512; i++) {
                if (i >= u_maxIter) break;
                if (dot(z, z) > 4.0) break;
                z = vec2(z.x * z.x - z.y * z.y + u_c.x,
                         2.0 * z.x * z.y       + u_c.y);
                iter += 1.0;
            }

            if (iter >= maxF) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            } else {
                float smooth_iter = iter - log2(log2(dot(z, z))) + 4.0;
                float t = smooth_iter / maxF;
                vec3 col = palette(t);
                gl_FragColor = vec4(col, 1.0);
            }
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader error:", gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    const vertexShader   = createShader(gl, gl.VERTEX_SHADER,   vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full-screen quad
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uMaxIter = gl.getUniformLocation(program, "u_maxIter");
    const uC       = gl.getUniformLocation(program, "u_c");
    const uCenter  = gl.getUniformLocation(program, "u_center");
    const uZoom    = gl.getUniformLocation(program, "u_zoom");
    const uAspect  = gl.getUniformLocation(program, "u_aspect");

    const PRESETS = [
        { cx: -0.7269,  cy:  0.1889,  name: "Dendrite"    },
        { cx: -0.4,     cy:  0.6,     name: "Spiral"      },
        { cx:  0.285,   cy:  0.01,    name: "Cauliflower"  },
        { cx: -0.8,     cy:  0.156,   name: "San Marco"    },
        { cx: -0.7,     cy:  0.27015, name: "Lightning"   },
        { cx:  0.355,   cy:  0.355,   name: "Rabbits"     },
        { cx: -0.54557, cy: -0.54412, name: "Dragon"      },
    ];

    let presetIdx = 0;
    let cx = PRESETS[0].cx, cy = PRESETS[0].cy;
    let center = [0.0, 0.0];
    let zoom = 1.5;
    let maxIter = 150;
    let animating = false;
    let animId = null;

    const ITER_LEVELS = [50, 100, 150, 200, 300, 400, 512];
    let currentLevel = 2;

    function render() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform1i(uMaxIter, maxIter);
        gl.uniform2f(uC, cx, cy);
        gl.uniform2f(uCenter, center[0], center[1]);
        gl.uniform1f(uZoom, zoom);
        gl.uniform1f(uAspect, canvas.width / canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    render();
    document.getElementById("levelValue").textContent = currentLevel;

    let infoEl = document.getElementById("julia-info");
    if (!infoEl) {
        infoEl = document.createElement("div");
        infoEl.id = "julia-info";
        infoEl.className = "fractal-info";
        canvas.parentElement.after(infoEl);
    }

    let presetEl = document.getElementById("julia-presets");
    if (!presetEl) {
        presetEl = document.createElement("div");
        presetEl.id = "julia-presets";
        presetEl.className = "julia-presets";
        canvas.parentElement.after(presetEl);
    }

    function buildPresetButtons() {
        presetEl.innerHTML = "";
        PRESETS.forEach((p, i) => {
            const btn = document.createElement("button");
            btn.textContent = p.name;
            btn.className = "preset-btn" + (i === presetIdx ? " active" : "");
            btn.addEventListener("click", () => {
                presetIdx = i;
                cx = PRESETS[i].cx;
                cy = PRESETS[i].cy;
                render();
                updateInfo();
                buildPresetButtons();
            });
            presetEl.appendChild(btn);
        });
    }
    buildPresetButtons();

    function updateInfo() {
        infoEl.innerHTML = `
            <span>Preset: ${PRESETS[presetIdx].name}</span>
        `;
    }
    updateInfo();

    function onMouseMove(e) {
        if (dragging) {
        
            const rect = canvas.getBoundingClientRect();
            const dx = (e.clientX - dragStart[0]) / rect.width  * 2 * (canvas.width / canvas.height) / zoom;
            const dy = (e.clientY - dragStart[1]) / rect.height * 2 / zoom;
            center = [dragCenter[0] - dx, dragCenter[1] + dy];
            render();
            return;
        }
        if (!e.shiftKey) return; // Hold Shift to morph c
        const rect = canvas.getBoundingClientRect();
        const aspect = canvas.width / canvas.height;
        cx = ((e.clientX - rect.left) / rect.width  * 2 - 1) * aspect * 1.5;
        cy = (1 - (e.clientY - rect.top)  / rect.height * 2) * 1.5;
        cx = Math.max(-2, Math.min(2, cx));
        cy = Math.max(-2, Math.min(2, cy));
        presetIdx = -1; // custom
        render();
        infoEl.innerHTML = `
            <span>Preset: Custom</span>
        `;
        buildPresetButtons();
    }

  
    let dragging = false, dragStart = [0, 0], dragCenter = [0, 0];
    function onMouseDown(e) {
        dragging = true;
        dragStart = [e.clientX, e.clientY];
        dragCenter = [...center];
    }
    function onMouseUp() { dragging = false; }

   
    function onWheel(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 0.8 : 1.25;
        const rect = canvas.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width  * 2 - 1) * (canvas.width / canvas.height) / zoom + center[0];
        const my = ((1 - (e.clientY - rect.top) / rect.height) * 2 - 1) / zoom + center[1];
        zoom /= factor;
        center[0] = mx - ((e.clientX - rect.left) / rect.width  * 2 - 1) * (canvas.width / canvas.height) / zoom;
        center[1] = my - ((1 - (e.clientY - rect.top) / rect.height) * 2 - 1) / zoom;
        render();
        updateInfo();
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    function startAnimation() {
        if (animating) {
            cancelAnimationFrame(animId);
            animating = false;
            return;
        }
        animating = true;
        let t = 0;
        const r = Math.sqrt(cx * cx + cy * cy) || 0.7;
        function frame() {
            if (!animating) return;
            t += 0.005;
            cx = r * Math.cos(t);
            cy = r * Math.sin(t);
            render();
            infoEl.querySelector("span").textContent = `c = (${cx.toFixed(5)}, ${cy.toFixed(5)}i)`;
            animId = requestAnimationFrame(frame);
        }
        frame();
    }

    function keydownHandler(event) {
        if (event.key === "ArrowUp") {
            currentLevel = Math.min(currentLevel + 1, ITER_LEVELS.length - 1);
            maxIter = ITER_LEVELS[currentLevel];
            document.getElementById("levelValue").textContent = currentLevel;
            render();
            updateInfo();
        }
        if (event.key === "ArrowDown") {
            currentLevel = Math.max(currentLevel - 1, 0);
            maxIter = ITER_LEVELS[currentLevel];
            document.getElementById("levelValue").textContent = currentLevel;
            render();
            updateInfo();
        }
        if (event.key === "a" || event.key === "A") {
            startAnimation();
        }
        if (event.key === "Tab") {
            event.preventDefault();
            presetIdx = (presetIdx + 1) % PRESETS.length;
            cx = PRESETS[presetIdx].cx;
            cy = PRESETS[presetIdx].cy;
            render();
            updateInfo();
            buildPresetButtons();
        }
        if (event.key === "r" || event.key === "R") {
            center = [0.0, 0.0];
            zoom = 1.5;
            render();
            updateInfo();
        }
    }

    if (window._juliaKeyHandler) window.removeEventListener("keydown", window._juliaKeyHandler);
    window._juliaKeyHandler = keydownHandler;
    window.addEventListener("keydown", keydownHandler);

    window._juliaCleanup = function () {
        animating = false;
        if (animId) cancelAnimationFrame(animId);
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("mousedown", onMouseDown);
        canvas.removeEventListener("mouseup", onMouseUp);
        canvas.removeEventListener("mouseleave", onMouseUp);
        canvas.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", keydownHandler);
        if (infoEl   && infoEl.parentElement)   infoEl.parentElement.removeChild(infoEl);
        if (presetEl && presetEl.parentElement) presetEl.parentElement.removeChild(presetEl);
    };
})();