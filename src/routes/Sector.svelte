<script lang="ts">
    import { T } from "@threlte/core";
    import * as THREE from "three";

    const {
        from = new THREE.Vector3(1, 0, 0),
        to = new THREE.Vector3(0, 1, 0),
        normal = null,
        radius = 1,
        color = "orange",
        segments = 32,
    } = $props();
    const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

    const len2 = (v) => dot(v, v);
    const len = (v) => Math.sqrt(len2(v));

    const scale = (s, v) => ({ x: s * v.x, y: s * v.y, z: s * v.z });
    const norm = (v) => scale(1 / len(v), v);

    const add = (u, v) => ({ x: u.x + v.x, y: u.y + v.y, z: u.z + v.z });
    const subtract = (u, v) => add(u, scale(-1, v));

    const v = ({ x, y, z }) => new THREE.Vector3(x, y, z);

    const project = (t, s) => scale(dot(t, s) / len2(s), s);

    function createSector(a, b, radius, segments, n = null) {
        const points = [new THREE.Vector3(0, 0, 0)];

        const na = a.clone().normalize();
        const nb = b.clone().normalize();

        const normal = n ? norm(n) : na.clone().cross(nb).normalize();

        const angle = n
            ? v(subtract(nb, project(nb, n))).angleTo(
                  v(subtract(na, project(na, n))),
              )
            : na.angleTo(nb);

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const v = na
                .clone()
                .applyAxisAngle(normal, angle * t)
                .multiplyScalar(radius);

            points.push(v);
        }

        const vertices = [];
        for (let i = 1; i < points.length - 1; i++) {
            vertices.push(
                0,
                0,
                0,
                ...points[i].toArray(),
                ...points[i + 1].toArray(),
            );
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3),
        );
        geometry.computeVertexNormals();

        return geometry;
    }

    const geometry = $derived(createSector(from, to, radius, segments, normal));
</script>

<T.Mesh {geometry}>
    <T.MeshBasicMaterial
        {color}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
        premultipliedAlpha={true}
        blending={THREE.CustomBlending}
    />
</T.Mesh>
