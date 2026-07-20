<script>
    import * as THREE from "three";
    import { T } from "@threlte/core";
    const {
        target,
        color,
        scale = 1,
        radius = 0.05,
        headRadius = 0.2,
        headLength = 0.6,
    } = $props();

    const vector = $derived(new THREE.Vector3(target.x, target.y, target.z));
    const length = $derived(vector.length() * scale);

    const shaftLength = $derived(Math.max(0, length - headLength));

    const quaternion = $derived(
        new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), // cylinder points along +Y
            vector.clone().normalize(),
        ),
    );
</script>

<T.Group quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}>
    <!-- Shaft -->
    <T.Mesh position={[0, shaftLength / 2, 0]}>
        <T.CylinderGeometry args={[radius, radius, shaftLength, 16]} />
        <T.MeshStandardMaterial {color} />
    </T.Mesh>

    <!-- Arrow head -->
    <T.Mesh position={[0, shaftLength + headLength / 2, 0]}>
        <T.ConeGeometry args={[headRadius, headLength, 16]} />
        <T.MeshStandardMaterial {color} />
    </T.Mesh>
</T.Group>
