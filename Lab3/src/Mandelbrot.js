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

        uniform int u_maxIter;
        uniform vec2 u_center;
        uniform float u_zoom;
        uniform float u_aspect;

        vec3 palette(float t) {
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0, 1.0, 1.0);
            vec3 d = vec3(0.00, 0.10, 0.20);
            return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
            vec2 c;
            c.x = (v_uv.x * u_aspect) / u_zoom + u_center.x;
            c.y = v_uv.y / u_zoom + u_center.y;

            vec2 z = vec2(0.0);
            float iter = 0.0;
            float maxF = float(u_maxIter);

            for (int i = 0; i < 512; i++) {
                if (i >= u_maxIter) break;
                if (dot(z, z) > 4.0) break;
                z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
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

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uMaxIter = gl.getUniformLocation(program, "u_maxIter");
    const uCenter  = gl.getUniformLocation(program, "u_center");
    const uZoom    = gl.getUniformLocation(program, "u_zoom");
    const uAspect  = gl.getUniformLocation(program, "u_aspect");


    let center = [-0.5, 0.0];
    let zoom   = 1.5;
    let maxIter = 100;

    const ITER_LEVELS = [50, 100, 150, 200, 300, 400, 512];
    let currentLevel = 1;

    function render() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform1i(uMaxIter, maxIter);
        gl.uniform2f(uCenter, center[0], center[1]);
        gl.uniform1f(uZoom, zoom);
        gl.uniform1f(uAspect, canvas.width / canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    render();
    document.getElementById("levelValue").textContent = currentLevel;

    let infoEl = document.getElementById("mandelbrot-info");
    if (!infoEl) {
        infoEl = document.createElement("div");
        infoEl.id = "mandelbrot-info";
        infoEl.className = "fractal-info";
        canvas.parentElement.after(infoEl);
    }

    function updateInfo() {
        infoEl.innerHTML = `
            <span>Center: (${center[0].toFixed(6)}, ${center[1].toFixed(6)})</span>
            <span>Zoom: ${(1/zoom).toFixed(4)}×</span>
            <span>Iterations: ${maxIter}</span>
        `;
    }
    updateInfo();

    function onWheel(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width  * 2 - 1) * (canvas.width / canvas.height) / zoom + center[0];
        const my = ((1 - (e.clientY - rect.top) / rect.height) * 2 - 1) / zoom + center[1];
        const factor = e.deltaY < 0 ? 0.8 : 1.25;
        zoom /= factor;
        center[0] = mx - ((e.clientX - rect.left) / rect.width  * 2 - 1) * (canvas.width / canvas.height) / zoom;
        center[1] = my - ((1 - (e.clientY - rect.top) / rect.height) * 2 - 1) / zoom;
        render();
        updateInfo();
    }

   
    let dragging = false, dragStart = [0, 0], dragCenter = [0, 0];

    function onMouseDown(e) {
        dragging = true;
        dragStart = [e.clientX, e.clientY];
        dragCenter = [...center];
    }
    function onMouseMove(e) {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const dx = (e.clientX - dragStart[0]) / rect.width  * 2 * (canvas.width / canvas.height) / zoom;
        const dy = (e.clientY - dragStart[1]) / rect.height * 2 / zoom;
        center = [dragCenter[0] - dx, dragCenter[1] + dy];
        render();
        updateInfo();
    }
    function onMouseUp() { dragging = false; }

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);

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
        if (event.key === "r" || event.key === "R") {
            center = [-0.5, 0.0];
            zoom = 1.5;
            render();
            updateInfo();
        }
    }

    if (window._mandelbrotKeyHandler) {
        window.removeEventListener("keydown", window._mandelbrotKeyHandler);
    }
    if (window._mandelbrotWheel) canvas.removeEventListener("wheel", window._mandelbrotWheel);

    window._mandelbrotKeyHandler = keydownHandler;
    window.addEventListener("keydown", keydownHandler);

  
    window._mandelbrotCleanup = function () {
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("mousedown", onMouseDown);
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("mouseup", onMouseUp);
        canvas.removeEventListener("mouseleave", onMouseUp);
        window.removeEventListener("keydown", keydownHandler);
        if (infoEl && infoEl.parentElement) infoEl.parentElement.removeChild(infoEl);
    };
})();