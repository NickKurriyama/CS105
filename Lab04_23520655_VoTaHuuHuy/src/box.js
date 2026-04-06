
{
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({antialias: true});

    const width = window.innerWidth * 0.6;
    const height = window.innerHeight * 0.6;

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.margin = "20px auto";
    renderer.domElement.style.border = "3px solid #00ffff";
    renderer.domElement.style.borderRadius = "10px";

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({color: 0x00ffff});
    const cube = new THREE.Mesh(geometry, material);

    const edge = new THREE.EdgesGeometry(geometry);
    const line_material = new THREE.LineBasicMaterial({color: new THREE.Color(0, 0, 0), linewidth: 2});
    const line = new THREE.LineSegments(edge, line_material);
    
    cube.add(line);
    scene.add(cube);

    cube.position.set(0, 0, 0);
    cube.scale.set(3,3,3);
    camera.position.z = 5;

    function animate() {
        window.currentAnimation = requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        cube.rotation.z += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}