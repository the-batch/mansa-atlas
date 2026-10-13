import { useEffect, useRef, useState } from 'react';
import {
    ACESFilmicToneMapping,
    AdditiveBlending,
    AmbientLight,
    BackSide,
    BufferAttribute,
    BufferGeometry,
    DirectionalLight,
    Group,
    MathUtils,
    Mesh,
    MeshStandardMaterial,
    PerspectiveCamera,
    Points,
    PointsMaterial,
    Raycaster,
    Scene,
    ShaderMaterial,
    SphereGeometry,
    SRGBColorSpace,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer,
    type Material
} from 'three';
import { archetypeProfiles } from '../data/questions';
import { type Archetype } from '../types/qcm';
import earthTextureUrl from '../assets/earth_atmos_2048.jpg';
import cloudTextureUrl from '../assets/earth_clouds_1024.png';

const archetypes: { id: Archetype; color: string; label: string; latitude: number; longitude: number }[] = [
    { id: 'createur', color: '#b25d28', label: 'CRÉATEUR', latitude: 28, longitude: -72 },
    { id: 'visionnaire', color: '#bca169', label: 'VISIONNAIRE', latitude: 24, longitude: -36 },
    { id: 'passeur', color: '#bdd0ec', label: 'PASSEUR', latitude: -18, longitude: 0 },
    { id: 'continuateur', color: '#dfe3e3', label: 'CONTINUATEUR', latitude: -38, longitude: 38 },
    { id: 'semeur', color: '#cf7844', label: 'SEMEUR', latitude: 8, longitude: 76 }
];

const globeRadius = 1.35;

function latitudeLongitudePosition(latitude: number, longitude: number, radius: number): Vector3 {
    const phi = MathUtils.degToRad(90 - latitude);
    const theta = MathUtils.degToRad(longitude + 180);
    return new Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

interface AtlasGlobeProps {
    selectedArchetype: Archetype;
    onSelectArchetype: (archetype: Archetype) => void;
}

export function AtlasGlobe({ selectedArchetype, onSelectArchetype }: AtlasGlobeProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const onSelectRef = useRef(onSelectArchetype);
    const selectedRef = useRef(selectedArchetype);
    const [webglAvailable, setWebglAvailable] = useState(true);

    useEffect(() => {
        onSelectRef.current = onSelectArchetype;
    }, [onSelectArchetype]);

    useEffect(() => {
        selectedRef.current = selectedArchetype;
    }, [selectedArchetype]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        let renderer: WebGLRenderer;
        try {
            renderer = new WebGLRenderer({ alpha: true, antialias: true });
        } catch {
            queueMicrotask(() => setWebglAvailable(false));
            return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        mount.appendChild(renderer.domElement);

        const scene = new Scene();
        const camera = new PerspectiveCamera(36, 1, 0.1, 100);
        camera.position.set(0, 0, 5.4);

        const ambient = new AmbientLight(0x8da4c2, 1.25);
        scene.add(ambient);
        const sunlight = new DirectionalLight(0xffe7cf, 3.4);
        sunlight.position.set(-2, 2.5, 4);
        scene.add(sunlight);
        const rimLight = new DirectionalLight(0x7aa9ed, 2.2);
        rimLight.position.set(3, -1, -3);
        scene.add(rimLight);

        const globeGroup = new Group();
        globeGroup.rotation.y = -Math.PI / 2;
        scene.add(globeGroup);

        const textureLoader = new TextureLoader();
        const earthTexture = textureLoader.load(earthTextureUrl);
        earthTexture.colorSpace = SRGBColorSpace;
        earthTexture.anisotropy = 8;
        const earth = new Mesh(
            new SphereGeometry(globeRadius, 96, 96),
            new MeshStandardMaterial({
                map: earthTexture,
                roughness: 0.92,
                metalness: 0.02,
                bumpMap: earthTexture,
                bumpScale: 0.008
            })
        );
        globeGroup.add(earth);

        const cloudTexture = textureLoader.load(cloudTextureUrl);
        cloudTexture.colorSpace = SRGBColorSpace;
        const clouds = new Mesh(
            new SphereGeometry(globeRadius * 1.008, 72, 72),
            new MeshStandardMaterial({
                color: 0xddeaff,
                alphaMap: cloudTexture,
                transparent: true,
                opacity: 0.22,
                depthWrite: false,
                roughness: 1
            })
        );
        globeGroup.add(clouds);

        const atmosphere = new Mesh(
            new SphereGeometry(globeRadius * 1.045, 64, 64),
            new ShaderMaterial({
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                        vPosition = modelViewPosition.xyz;
                        gl_Position = projectionMatrix * modelViewPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    void main() {
                        float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(-vPosition)), 0.0), 3.0);
                        gl_FragColor = vec4(0.34, 0.55, 0.86, rim * 0.42);
                    }
                `,
                side: BackSide,
                blending: AdditiveBlending,
                transparent: true,
                depthWrite: false
            })
        );
        globeGroup.add(atmosphere);

        const markerMeshes: Mesh[] = [];
        for (const archetype of archetypes) {
            const marker = new Mesh(
                new SphereGeometry(0.05, 20, 20),
                new MeshStandardMaterial({
                    color: archetype.color,
                    emissive: archetype.color,
                    emissiveIntensity: 0.75,
                    roughness: 0.35,
                    metalness: 0.12
                })
            );
            marker.position.copy(latitudeLongitudePosition(archetype.latitude, archetype.longitude, globeRadius * 1.014));
            marker.userData.archetype = archetype.id;
            globeGroup.add(marker);
            markerMeshes.push(marker);
        }

        const starPositions = new Float32Array(1100 * 3);
        for (let i = 0; i < 1100; i += 1) {
            starPositions[i * 3] = (Math.random() - 0.5) * 18;
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 18;
            starPositions[i * 3 + 2] = -2 - Math.random() * 8;
        }
        const starGeometry = new BufferGeometry();
        starGeometry.setAttribute('position', new BufferAttribute(starPositions, 3));
        const stars = new Points(
            starGeometry,
            new PointsMaterial({ color: 0xbdd0ec, size: 0.012, transparent: true, opacity: 0.72 })
        );
        scene.add(stars);

        const raycaster = new Raycaster();
        raycaster.params.Points.threshold = 0.06;
        const pointer = new Vector2();
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let width = 0;
        let height = 0;
        let frameId = 0;
        let dragging = false;
        let moved = false;
        let lastX = 0;
        let lastY = 0;
        let angularVelocity = 0.0007;

        const resizeObserver = new ResizeObserver(([entry]) => {
            width = entry.contentRect.width;
            height = entry.contentRect.height;
            if (width === 0 || height === 0) return;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });
        resizeObserver.observe(mount);

        const updatePointer = (event: PointerEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const handlePointerDown = (event: PointerEvent) => {
            dragging = true;
            moved = false;
            lastX = event.clientX;
            lastY = event.clientY;
            renderer.domElement.setPointerCapture(event.pointerId);
        };

        const handlePointerMove = (event: PointerEvent) => {
            updatePointer(event);
            if (dragging) {
                const deltaX = event.clientX - lastX;
                const deltaY = event.clientY - lastY;
                if (Math.abs(deltaX) + Math.abs(deltaY) > 2) moved = true;
                globeGroup.rotation.y += deltaX * 0.006;
                globeGroup.rotation.x = MathUtils.clamp(globeGroup.rotation.x + deltaY * 0.004, -0.65, 0.65);
                angularVelocity = deltaX * 0.0005;
                lastX = event.clientX;
                lastY = event.clientY;
                return;
            }

            raycaster.setFromCamera(pointer, camera);
            const hoveredMarker = raycaster.intersectObjects(markerMeshes)[0]?.object;
            renderer.domElement.style.cursor = hoveredMarker ? 'pointer' : 'grab';
        };

        const handlePointerUp = (event: PointerEvent) => {
            dragging = false;
            if (!moved) {
                updatePointer(event);
                raycaster.setFromCamera(pointer, camera);
                const earthDistance = raycaster.intersectObject(earth).at(0)?.distance ?? Infinity;
                const selectedMarker = raycaster.intersectObjects(markerMeshes)
                    .find(({ distance }) => distance < earthDistance);
                const archetype = selectedMarker?.object.userData.archetype as Archetype | undefined;
                if (archetype) onSelectRef.current(archetype);
            }
        };

        const handlePointerLeave = () => {
            dragging = false;
            renderer.domElement.style.cursor = 'grab';
        };

        renderer.domElement.addEventListener('pointerdown', handlePointerDown);
        renderer.domElement.addEventListener('pointermove', handlePointerMove);
        renderer.domElement.addEventListener('pointerup', handlePointerUp);
        renderer.domElement.addEventListener('pointercancel', handlePointerLeave);

        const animate = () => {
            frameId = window.requestAnimationFrame(animate);
            if (!reducedMotion && !dragging) {
                globeGroup.rotation.y += angularVelocity;
                angularVelocity *= 0.985;
                if (Math.abs(angularVelocity) < 0.0001) angularVelocity = 0.0007;
            }
            if (!reducedMotion) {
                clouds.rotation.y += 0.00015;
                stars.rotation.z += 0.00001;
            }
            for (const marker of markerMeshes) {
                const material = marker.material as MeshStandardMaterial;
                material.emissiveIntensity = marker.userData.archetype === selectedRef.current ? 1.8 : 0.65;
            }
            if (width > 0 && height > 0) renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
            renderer.domElement.removeEventListener('pointermove', handlePointerMove);
            renderer.domElement.removeEventListener('pointerup', handlePointerUp);
            renderer.domElement.removeEventListener('pointercancel', handlePointerLeave);
            globeGroup.traverse((object) => {
                if (object instanceof Mesh) {
                    object.geometry.dispose();
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach((material) => material.dispose());
                }
            });
            earthTexture.dispose();
            cloudTexture.dispose();
            starGeometry.dispose();
            (stars.material as Material).dispose();
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, []);

    return (
        <div className="atlas-globe-shell">
            <div
                className="atlas-globe-canvas"
                ref={mountRef}
                role="application"
                aria-label="Globe interactif. Faites glisser pour le faire tourner et cliquez sur un repère pour explorer un archétype."
            >
                {!webglAvailable && (
                    <p className="globe-fallback">L’affichage 3D n’est pas disponible sur cet appareil.</p>
                )}
            </div>
            <div className="atlas-globe-legend" aria-label="Explorer les archétypes">
                {archetypes.map((archetype) => (
                    <button
                        key={archetype.id}
                        className={`globe-legend-item${selectedArchetype === archetype.id ? ' is-selected' : ''}`}
                        type="button"
                        aria-pressed={selectedArchetype === archetype.id}
                        onClick={() => onSelectArchetype(archetype.id)}
                    >
                        <span className="globe-legend-dot" style={{ backgroundColor: archetype.color }} />
                        {archetypeProfiles[archetype.id].name}
                    </button>
                ))}
            </div>
            <p className="globe-instructions">FAITES TOURNER LE GLOBE · SÉLECTIONNEZ UN REPÈRE</p>
        </div>
    );
}
