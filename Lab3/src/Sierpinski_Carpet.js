(function(){
    const canvas = document.getElementById("webglcanvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("WebGL không được hỗ trợ");
        return;
    }

    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    function squares(p1, p2, p3, p4, level, points) {
        if (level === 0) {
            points.push(
                p1[0], p1[1],
                p2[0], p2[1],
                p3[0], p3[1],

                p1[0], p1[1],
                p3[0], p3[1],
                p4[0], p4[1]
            );
            return;
        }

        const dx = (p2[0] - p1[0]) / 3;
        const dy = (p4[1] - p1[1]) / 3;

        const grid = [];
        for (let i = 0; i <= 3; i++) {
            for (let j = 0; j <= 3; j++) {
                grid.push([p1[0] + j * dx, p1[1] + i * dy]);
            }
        }

        function get(i, j) { return grid[i * 4 + j]; }

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (i === 1 && j === 1) continue;
                squares(get(i, j), get(i, j+1), get(i+1, j+1), get(i+1, j), level - 1, points);
            }
        }
    }

    function buildVertices(level) {
        const points = [];  
        const size = 1;
        squares([-size/2, -size/2], [size/2, -size/2], [size/2, size/2], [-size/2, size/2], level, points);
        return points;
    }

    const buffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, "a_position");

    function drawSierpinski(level) {
       
        const vertices = buildVertices(level);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    }

    let currentLevel = 0;
    drawSierpinski(currentLevel);

    function keydownHandler(event) {
        if (event.key === "ArrowUp") {
            currentLevel = Math.min(currentLevel + 1, 6);
            document.getElementById("levelValue").textContent = currentLevel;
            drawSierpinski(currentLevel);
        }
        if (event.key === "ArrowDown") {
            currentLevel = Math.max(currentLevel - 1, 0);
            document.getElementById("levelValue").textContent = currentLevel;
            drawSierpinski(currentLevel);
        }
    }

    if (window._carpetKeyHandler) {
        window.removeEventListener("keydown", window._carpetKeyHandler);
    }
    window._carpetKeyHandler = keydownHandler;
    window.addEventListener("keydown", keydownHandler);
})();