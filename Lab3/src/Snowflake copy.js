(function(){
const canvas = document.getElementById("webglcanvas");
const gl = canvas.getContext("webgl");
if (!gl) {
    console.error("WebGL không được hỗ trợ");
}''

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

function createShader(gl, type, source)
{
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(shader));
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

function Koch(p1, p2, level, points)
{
    if(level == 0)
    {
        points.push(p1);
        return;
    }

    const vector = [p2[0] - p1[0], p2[1] - p1[1]];
    const dist = [vector[0] / 3, vector[1] / 3];
    const pointA = [p1[0] + dist[0], p1[1] + dist[1]];
    const pointB = [p1[0] + 2*dist[0], p1[1] + 2 * dist[1]];

    const angle = -Math.PI / 3;
    const pointC = [
        pointA[0] + Math.cos(angle) * dist[0] - Math.sin(angle) * dist[1],
        pointA[1] + Math.sin(angle) * dist[0] + Math.cos(angle) * dist[1]
    ];
    Koch(p1, pointA, level - 1, points);
    Koch(pointA, pointC, level - 1, points);
    Koch(pointC, pointB, level - 1, points);
    Koch(pointB, p2, level - 1, points);
}

function SnowFlake(level)
{
    const points = [];
    const size = 1;

    const height = size * Math.sqrt(3) / 2;
    const p1 = [-size / 2, -height / 3];
    const p2 = [size / 2, -height / 3];
    const p3 = [0, 2 * height / 3];

    Koch(p1, p2, level, points);
    Koch(p2, p3, level, points);
    Koch(p3, p1, level, points);

    points.push(p1);
    return points;
}

function drawSnowFlake(level)
{
    const points = SnowFlake(level);

    const vertices = [];

    points.forEach(point => {
        vertices.push(point[0], point[1]);
    });

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.LINE_LOOP, 0, vertices.length / 2);
}

let currentLevel = 0;

drawSnowFlake(currentLevel);

if (window.keydownHandler) {
    window.removeEventListener("keydown", window.keydownHandler);
}

window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
        currentLevel = Math.min(currentLevel + 1, 6);
        document.getElementById("levelValue").textContent = currentLevel;
        drawSnowFlake(currentLevel);
    }
    if (event.key === "ArrowDown") {
        currentLevel = Math.max(currentLevel - 1, 0);
        document.getElementById("levelValue").textContent = currentLevel;
        drawSnowFlake(currentLevel);
    }

});

window.addEventListener("keydown", window.keydownHandler);
})();