import React, { useEffect, useRef, useState } from "react";
import { Paper, Typography, Grid, IconButton, Tooltip } from "@mui/material";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";

const PointCloudViewer = () => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const rendererRef = useRef(null);

    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const controlInstructions = [
        { key: "Arrow Keys", action: "Rotate point cloud" },
        { key: "+ / -", action: "Zoom in/out" },
        { key: "Mouse Drag", action: "Orbit camera" },
        { key: "Mouse Wheel", action: "Zoom" },
        { key: "Right Mouse", action: "Pan" },
    ];

    useEffect(() => {
        if (!mountRef.current) return;

        while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }

        const container = mountRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            1000
        );

        sceneRef.current = scene;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
        });
        rendererRef.current = renderer;

        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        const roomGeometry = new THREE.BoxGeometry(30, 20, 30);
        const roomMaterial = new THREE.MeshPhongMaterial({
            color: 0x404040,
            side: THREE.BackSide,
        });
        const room = new THREE.Mesh(roomGeometry, roomMaterial);
        scene.add(room);

        const grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        scene.add(grid);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const generateInitialCube = () => {
            const size = 5;
            const divisions = 10;
            const spacing = 1.2;
            const pointPositions = [];
            const pointColors = [];

            for (let x = -size; x <= size; x += (size / divisions) * spacing) {
                for (
                    let y = -size;
                    y <= size;
                    y += (size / divisions) * spacing
                ) {
                    for (
                        let z = -size;
                        z <= size;
                        z += (size / divisions) * spacing
                    ) {
                        pointPositions.push(x, y, z);
                        pointColors.push(
                            (x + size) / (2 * size),
                            (y + size) / (2 * size),
                            (z + size) / (2 * size)
                        );
                    }
                }
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(pointPositions, 3)
            );
            geometry.setAttribute(
                "color",
                new THREE.Float32BufferAttribute(pointColors, 3)
            );

            const material = new THREE.PointsMaterial({
                size: 0.2,
                vertexColors: true,
                sizeAttenuation: true,
            });

            const cubePoints = new THREE.Points(geometry, material);
            return cubePoints;
        };

        const initialCube = generateInitialCube();
        scene.add(initialCube);

        camera.position.z = 15;
        camera.position.y = 5;

        const controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 30;
        controls.maxPolarAngle = Math.PI / 2;

        const handleResize = () => {
            const width = mountRef.current.clientWidth;
            const height = Math.min(window.innerHeight * 0.7, 600);

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener("resize", handleResize);

        const handleKeyDown = (e) => {
            if (!sceneRef.current) return;

            const pointCloud = sceneRef.current.children.find(
                (child) => child instanceof THREE.Points
            );
            if (!pointCloud) return;

            switch (e.key) {
                case "ArrowLeft":
                    pointCloud.rotation.y -= 0.1;
                    break;
                case "ArrowRight":
                    pointCloud.rotation.y += 0.1;
                    break;
                case "ArrowUp":
                    pointCloud.rotation.x -= 0.1;
                    break;
                case "ArrowDown":
                    pointCloud.rotation.x += 0.1;
                    break;
                case "+":
                case "=":
                    cameraRef.current.position.z = Math.max(
                        5,
                        cameraRef.current.position.z - 1
                    );
                    break;
                case "-":
                case "_":
                    cameraRef.current.position.z = Math.min(
                        30,
                        cameraRef.current.position.z + 1
                    );
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            initialCube.rotation.y += 0.001;
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", handleResize);
            mountRef.current?.removeChild(renderer.domElement);
            controls.dispose();
            renderer.dispose();
        };
    }, []);

    const generateSpherePoints = () => {
        if (!sceneRef.current) return;

        const existingPoints = sceneRef.current.children.find(
            (child) => child instanceof THREE.Points
        );
        if (existingPoints) {
            sceneRef.current.remove(existingPoints);
        }

        const geometry = new THREE.SphereGeometry(5, 32, 32);
        const vertices = geometry.attributes.position.array;
        const colors = new Float32Array(vertices.length);

        for (let i = 0; i < vertices.length; i += 3) {
            colors[i] = vertices[i + 1] > 0 ? 1 : 0;
            colors[i + 1] = vertices[i + 1] > 0 ? 0 : 1;
            colors[i + 2] = 0.5;
        }

        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(vertices, 3)
        );
        pointsGeometry.setAttribute(
            "color",
            new THREE.BufferAttribute(colors, 3)
        );

        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            sizeAttenuation: true,
        });

        const spherePoints = new THREE.Points(pointsGeometry, material);
        spherePoints.position.set(0, 0, 0);
        sceneRef.current.add(spherePoints);
    };

    const generateCirclePoints = () => {
        if (!sceneRef.current) return;

        const existingPoints = sceneRef.current.children.find(
            (child) => child instanceof THREE.Points
        );
        if (existingPoints) {
            sceneRef.current.remove(existingPoints);
        }

        const segments = 200;
        const radius = 5;
        const circlePositions = [];
        const circleColors = [];

        for (let i = 0; i < segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            circlePositions.push(
                Math.cos(theta) * radius,
                Math.sin(theta) * radius,
                0
            );
            circleColors.push(
                Math.sin(theta) * 0.5 + 0.5,
                Math.cos(theta) * 0.5 + 0.5,
                0.5
            );
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(circlePositions, 3)
        );
        geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(circleColors, 3)
        );

        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            sizeAttenuation: true,
        });

        const circlePoints = new THREE.Points(geometry, material);
        circlePoints.position.set(0, 0, 0);
        sceneRef.current.add(circlePoints);
    };

    const generateCubePoints = () => {
        if (!sceneRef.current) return;

        const existingPoints = sceneRef.current.children.find(
            (child) => child instanceof THREE.Points
        );
        if (existingPoints) {
            sceneRef.current.remove(existingPoints);
        }

        const size = 5;
        const divisions = 10;
        const spacing = 1.2;
        const pointPositions = [];
        const pointColors = [];

        for (let x = -size; x <= size; x += (size / divisions) * spacing) {
            for (let y = -size; y <= size; y += (size / divisions) * spacing) {
                for (
                    let z = -size;
                    z <= size;
                    z += (size / divisions) * spacing
                ) {
                    pointPositions.push(x, y, z);
                    pointColors.push(
                        (x + size) / (2 * size),
                        (y + size) / (2 * size),
                        (z + size) / (2 * size)
                    );
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(pointPositions, 3)
        );
        geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(pointColors, 3)
        );

        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            sizeAttenuation: true,
        });

        const cubePoints = new THREE.Points(geometry, material);
        cubePoints.position.set(0, 0, 0);
        sceneRef.current.add(cubePoints);
    };

    return (
        <div className="relative">
            <div className="absolute top-2 right-2 z-10 flex gap-2 bg-white">
                <Tooltip title="Toggle Controls">
                    <IconButton onClick={() => setShowControls(!showControls)}>
                        <RotateCcw />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Toggle Fullscreen">
                    <IconButton onClick={() => setIsFullscreen(!isFullscreen)}>
                        {isFullscreen ? <Minimize2 /> : <Maximize2 />}
                    </IconButton>
                </Tooltip>
            </div>
            <div
                ref={mountRef}
                style={{
                    width: "100%",
                    height: isFullscreen ? "90vh" : "600px",
                    position: "relative",
                    overflow: "hidden",
                }}
            />
            {showControls && (
                <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded">
                    <Typography variant="h6" className="mb-2">
                        Controls
                    </Typography>
                    {controlInstructions.map((instruction, i) => (
                        <Typography key={i} variant="body2">
                            <strong>{instruction.key}</strong>:{" "}
                            {instruction.action}
                        </Typography>
                    ))}
                </div>
            )}

            <Paper className="mt-4 p-4" elevation={3}>
                <Typography variant="h6" className="mb-4 text-center">
                    Point Cloud Shapes
                </Typography>
                <Grid container spacing={2}>
                    {[
                        {
                            icon: "⚪",
                            title: "Sphere",
                            description: "Half-colored sphere visualization",
                            onClick: generateSpherePoints,
                        },
                        {
                            icon: "◯",
                            title: "Circle",
                            description: "2D circular point distribution",
                            onClick: generateCirclePoints,
                        },
                        {
                            icon: "⬚",
                            title: "Cube",
                            description: "3D cubic point distribution",
                            onClick: generateCubePoints,
                        },
                    ].map((shape, index) => (
                        <Grid item xs={4} key={index}>
                            <Paper
                                className="p-4 cursor-pointer transition-all hover:bg-blue-500 hover:text-white text-center"
                                elevation={2}
                                onClick={shape.onClick}
                            >
                                <div className="text-center mb-2">
                                    <span className="text-4xl">
                                        {shape.icon}
                                    </span>
                                </div>
                                <Typography variant="subtitle1">
                                    {shape.title}
                                </Typography>
                                <Typography variant="caption" display="block">
                                    {shape.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </div>
    );
};

export default PointCloudViewer;
