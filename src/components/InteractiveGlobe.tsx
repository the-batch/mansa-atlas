import { useEffect, useRef } from 'react';

interface InteractiveGlobeProps {
    textureImage: HTMLImageElement;
}

const vertexShader = `
    attribute vec2 position;
    varying vec2 globePoint;
    void main() {
        globePoint = position;
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const fragmentShader = `
    precision mediump float;
    uniform sampler2D sourceImage;
    uniform float rotation;
    uniform float tilt;
    uniform vec2 resolution;
    varying vec2 globePoint;

    void main() {
        vec2 point = globePoint;
        point.x *= resolution.x / resolution.y;
        float radiusSquared = dot(point, point);
        if (radiusSquared >= 1.0) discard;

        vec3 normal = vec3(point, sqrt(1.0 - radiusSquared));
        float angle = rotation + tilt * 0.45;
        vec2 texturePoint = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * point;
        vec2 sourcePoint = vec2(
            0.565 + 0.338 * texturePoint.x,
            0.516 - 0.338 * texturePoint.y * 896.0 / 1182.0
        );
        vec3 color = texture2D(sourceImage, vec2(sourcePoint.x, 1.0 - sourcePoint.y)).rgb;

        float light = max(dot(normal, normalize(vec3(-0.45, 0.4, 1.0))), 0.0);
        float edgeLight = pow(1.0 - normal.z, 2.0);
        color *= 0.52 + light * 0.64;
        color += vec3(0.15, 0.24, 0.34) * edgeLight * 0.18;
        float edgeAlpha = 1.0 - smoothstep(0.975, 1.0, radiusSquared);
        gl_FragColor = vec4(color, edgeAlpha);
    }
`;

function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Could not create a shader for the Atlas globe.');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error.';
        gl.deleteShader(shader);
        throw new Error(message);
    }
    return shader;
}

export function InteractiveGlobe({ textureImage }: InteractiveGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: false,
            powerPreference: 'low-power',
            premultipliedAlpha: true
        });
        if (!gl) {
            canvas.dataset.unavailable = 'true';
            return;
        }

        let program: WebGLProgram | null = null;
        let vertex: WebGLShader | null = null;
        let fragment: WebGLShader | null = null;
        let texture: WebGLTexture | null = null;
        let frameId = 0;
        let dragging = false;
        let lastX = 0;
        let lastY = 0;
        let rotation = 0;
        let tilt = 0;
        let lastFrame = 0;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        try {
            vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
            fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
            const globeProgram = gl.createProgram();
            if (!globeProgram) {
                throw new Error('Could not create the Atlas globe shader program.');
            }
            program = globeProgram;
            gl.attachShader(globeProgram, vertex);
            gl.attachShader(globeProgram, fragment);
            gl.linkProgram(globeProgram);
            if (!gl.getProgramParameter(globeProgram, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(globeProgram) ?? 'Could not link the Atlas globe shader program.');
            }
            texture = gl.createTexture();
            if (!texture) {
                throw new Error('Could not create the Atlas globe texture.');
            }

            gl.useProgram(globeProgram);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage);

            const buffer = gl.createBuffer();
            if (!buffer) {
                throw new Error('Could not create the Atlas globe geometry.');
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                gl.STATIC_DRAW
            );
            const position = gl.getAttribLocation(globeProgram, 'position');
            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
            gl.uniform1i(gl.getUniformLocation(globeProgram, 'sourceImage'), 0);
            const rotationLocation = gl.getUniformLocation(globeProgram, 'rotation');
            const tiltLocation = gl.getUniformLocation(globeProgram, 'tilt');
            const resolutionLocation = gl.getUniformLocation(globeProgram, 'resolution');

            const draw = (time: number) => {
                if (!reducedMotion && time - lastFrame < 1000 / 30) {
                    frameId = window.requestAnimationFrame(draw);
                    return;
                }
                lastFrame = time;
                if (!dragging && !reducedMotion) rotation += 0.0018;
                gl.uniform1f(rotationLocation, rotation);
                gl.uniform1f(tiltLocation, tilt);
                gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                if (!reducedMotion) frameId = window.requestAnimationFrame(draw);
            };

            const renderOnce = () => {
                window.cancelAnimationFrame(frameId);
                frameId = window.requestAnimationFrame(draw);
            };

            const resizeObserver = new ResizeObserver(([entry]) => {
                const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
                canvas.width = Math.max(1, Math.round(entry.contentRect.width * pixelRatio));
                canvas.height = Math.max(1, Math.round(entry.contentRect.height * pixelRatio));
                gl.viewport(0, 0, canvas.width, canvas.height);
                renderOnce();
            });
            resizeObserver.observe(canvas);

            const handlePointerDown = (event: PointerEvent) => {
                dragging = true;
                lastX = event.clientX;
                lastY = event.clientY;
                canvas.setPointerCapture(event.pointerId);
            };
            const handlePointerMove = (event: PointerEvent) => {
                if (!dragging) return;
                rotation += (event.clientX - lastX) * 0.008;
                tilt = Math.max(-0.7, Math.min(0.7, tilt + (event.clientY - lastY) * 0.006));
                lastX = event.clientX;
                lastY = event.clientY;
                renderOnce();
            };
            const handlePointerUp = () => {
                dragging = false;
            };
            const handleKeyDown = (event: KeyboardEvent) => {
                const step = 0.12;
                if (event.key === 'ArrowLeft') rotation -= step;
                else if (event.key === 'ArrowRight') rotation += step;
                else if (event.key === 'ArrowUp') tilt = Math.min(0.7, tilt + step);
                else if (event.key === 'ArrowDown') tilt = Math.max(-0.7, tilt - step);
                else return;
                event.preventDefault();
                renderOnce();
            };

            canvas.addEventListener('pointerdown', handlePointerDown);
            canvas.addEventListener('pointermove', handlePointerMove);
            canvas.addEventListener('pointerup', handlePointerUp);
            canvas.addEventListener('pointercancel', handlePointerUp);
            canvas.addEventListener('keydown', handleKeyDown);

            renderOnce();
            return () => {
                window.cancelAnimationFrame(frameId);
                resizeObserver.disconnect();
                canvas.removeEventListener('pointerdown', handlePointerDown);
                canvas.removeEventListener('pointermove', handlePointerMove);
                canvas.removeEventListener('pointerup', handlePointerUp);
                canvas.removeEventListener('pointercancel', handlePointerUp);
                canvas.removeEventListener('keydown', handleKeyDown);
                gl.deleteBuffer(buffer);
                if (program) gl.deleteProgram(program);
                if (vertex) gl.deleteShader(vertex);
                if (fragment) gl.deleteShader(fragment);
                if (texture) gl.deleteTexture(texture);
            };
        } catch (error) {
            console.error('Unable to initialize the interactive Atlas globe.', error);
            canvas.dataset.unavailable = 'true';
            if (program) gl.deleteProgram(program);
            if (vertex) gl.deleteShader(vertex);
            if (fragment) gl.deleteShader(fragment);
            if (texture) gl.deleteTexture(texture);
        }
    }, [textureImage]);

    return (
        <canvas
            aria-label="Globe interactif : faites-le glisser ou utilisez les flèches du clavier pour le faire tourner."
            className="interactive-globe"
            ref={canvasRef}
            role="application"
            tabIndex={0}
        />
    );
}
