<script>
    import { onMount } from "svelte";
    import createREGL from "regl";

    let { uniforms } = $props();
    let canvas;
    let draw = $state(() => {});

    $effect(() => {
        const regl = createREGL({
            canvas,
            attributes: {
                alpha: true,
            },
        });

        draw = regl({
            vert: `
                precision mediump float;

                attribute vec2 position;
                varying vec2 uv;

                void main() {
                    uv = position * 0.5 + 0.5;
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `,

            frag: `
                precision mediump float;

                varying vec2 uv;
                uniform vec2 center;
                uniform float radius;

                void main() {
                    vec2 p = (uv - 0.5) - center;
                    float r2 = dot(p, p);

                    vec2 inverted = center + p * (radius * radius / r2);

                    float dist = length((uv - 0.5) - inverted);

                    float v = abs(sqrt(dist*dist*dist) * 15.0);

                    gl_FragColor = vec4(vec3(1.0 - uv.x, uv),  0.1 + 0.1 * v);
                }
            `,

            attributes: {
                position: [
                    [-1, -1],
                    [1, -1],
                    [1, 1],
                    [-1, 1],
                ],
            },
            uniforms: {
                center: regl.prop("center"),
                radius: regl.prop("radius"),
            },

            elements: [
                [0, 1, 2],
                [0, 2, 3],
            ],
        });

        regl.clear({
            color: [1, 1, 1, 0],
        });

        return () => regl.destroy();
    });
    $effect(() => {
        if (draw) {
            draw(uniforms);
        }
    });
</script>

<canvas class="canvas" width="1000" height="1000" bind:this={canvas}></canvas>

<style>
    .canvas {
        aspect-ratio: 1 / 1;
        position: relative;
        user-select: none;
        overflow: visible;
        box-sizing: border-box;
        padding: 1ex;
        width: 100%;
        height: auto;
        display: block;
        overflow: visible;
        z-index: 100;
        font-size: 2em;
        touch-action: none;
    }
</style>
