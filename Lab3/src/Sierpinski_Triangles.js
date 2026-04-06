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

function triangles(p1, p2, p3, level, points)
{
    if(level == 0)
    {
        points.push(p1);
        points.push(p2);
        points.push(p3);
        return;
    }

    const pointA = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const pointB = [(p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2];
    const pointC = [(p3[0] + p1[0]) / 2, (p3[1] + p1[1]) / 2];
    
    triangles(p1, pointA, pointC, level - 1, points);
    triangles(pointA, p2, pointB, level - 1, points);
    triangles(pointC, pointB, p3, level - 1, points);
}

function Sierpinski(level)
{
    const points = [];
    const size = 1;

    const height = size * Math.sqrt(3) / 2;
    const p1 = [-size / 2, -height / 3];
    const p2 = [size / 2, -height / 3];
    const p3 = [0, 2 * height / 3];

    triangles(p1, p2, p3, level, points);

    points.push(p1);
    return points;
}

function drawSierpinski(level)
{
    const points = Sierpinski(level);

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

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}

let currentLevel = 0;

drawSierpinski(currentLevel);

if (window.keydownHandler) {
    window.removeEventListener("keydown", window.keydownHandler);
}

window.addEventListener("keydown", (event) => {
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

});

window.addEventListener("keydown", window.keydownHandler);
})();