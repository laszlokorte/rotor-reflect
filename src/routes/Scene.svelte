<script>
    import { Canvas } from "@threlte/core";

    import * as THREE from "three";
    import { T } from "@threlte/core";
    import {
        Grid,
        OrbitControls,
        Gizmo,
        FakeGlowMaterial,
        Text,
        Billboard,
    } from "@threlte/extras";
    import Arrow from "./Arrow.svelte";
    import Face from "./Face.svelte";
    import Sector from "./Sector.svelte";

    let { colors } = $props();

    const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

    const len2 = (v) => dot(v, v);
    const len = (v) => Math.sqrt(len2(v));

    const scale = (s, v) => ({ x: s * v.x, y: s * v.y, z: s * v.z });
    const norm = (v) => scale(1 / len(v), v);

    const add = (u, v) => ({ x: u.x + v.x, y: u.y + v.y, z: u.z + v.z });
    const subtract = (u, v) => add(u, scale(-1, v));

    const project = (t, s) => scale(dot(t, s) / len2(s), s);

    const reflect = (r, s) => {
        const projected = project(s, r);
        const reflected = subtract(scale(2, projected), s);
        return reflected;
    };

    let vector = $state({ x: 4, y: 5, z: 2 });
    let bivector = $state({ xy: 5, yz: 6, xz: 7 });
    let rotor = $state({
        to: { x: -2, y: 0, z: 2 },
        from: { x: 2, y: -2, z: 4 },
    });
    const reflectionA = $derived(reflect(rotor.from, vector));
    const reflectionB = $derived(reflect(rotor.to, reflectionA));
    const box = false;
    const rotorNormal = $derived(
        new THREE.Vector3(rotor.from.x, rotor.from.y, rotor.from.z)
            .cross(rotor.to)
            .normalize(),
    );
</script>

<section>
    <Canvas dpr={window.devicePixelRatio * 2}>
        <T.PerspectiveCamera
            fov={50}
            makeDefault
            position={[6.5, 8, 15]}
            lookAt.y={5.0}
        >
            <OrbitControls
                minDistance={10}
                maxDistance={30}
                minZoom={30}
                maxZoom={90}
                enablePan={false}
                enableDamping={false}
                rotateSpeed={0.5}
            >
                <Gizmo />
            </OrbitControls>
        </T.PerspectiveCamera>
        <Grid
            sectionSize={20}
            fadeDistance={10}
            fadeOrigin={[0, 0, 0]}
            cellThickness={2}
            sectionThickness={2}
            cellSize={5}
            fadeStrength={1}
            infiniteGrid={true}
            sectionColor="#999"
            renderOrder={-1}
            cellColor="#ccc"
        />
        <T.AmbientLight intensity={5} />

        <T.Mesh position={[0, 0, 0]}>
            <T.SphereGeometry args={[0.1, 8, 8]} />
            <T.MeshStandardMaterial color={0x000000} />
        </T.Mesh>

        <Arrow target={vector} color={colors.subject} />
        <Arrow target={reflectionA} color={colors.reflected} />
        <Arrow target={reflectionB} color={colors.rotated} />
        <Arrow target={rotor.from} color={colors.first} />
        <Arrow target={rotor.to} color={colors.second} />
        <Sector
            from={new THREE.Vector3(rotor.from.x, rotor.from.y, rotor.from.z)}
            to={new THREE.Vector3(rotor.to.x, rotor.to.y, rotor.to.z)}
            color={colors.angle}
            radius={3}
        />
        <Sector
            from={new THREE.Vector3(vector.x, vector.y, vector.z)}
            to={new THREE.Vector3(reflectionB.x, reflectionB.y, reflectionB.z)}
            normal={rotorNormal}
            color={colors.angle}
            radius={3}
        />

        <Sector
            from={new THREE.Vector3(vector.x, vector.y, vector.z)}
            to={new THREE.Vector3(reflectionA.x, reflectionA.y, reflectionA.z)}
            color={colors.first}
            radius={3}
        />
        <Sector
            from={new THREE.Vector3(
                reflectionB.x,
                reflectionB.y,
                reflectionB.z,
            )}
            to={new THREE.Vector3(reflectionA.x, reflectionA.y, reflectionA.z)}
            color={colors.second}
            radius={3}
        />
        <Face {bivector} color="black" />
        <Arrow target={rotorNormal.multiplyScalar(-5)} color={colors.angle} />
        <!--

	<Arrow target={{ ...vector, y: 0, z: 0 }} color="red" />
		<Arrow target={{ ...vector, x: 0, z: 0 }} color="green" />
		<Arrow target={{ ...vector, x: 0, y: 0 }} color="blue" />
	-->
        <Billboard position={[reflectionB.x, reflectionB.y + 1, reflectionB.z]}>
            <Text
                anchorX="center"
                anchorY="center"
                fontSize={0.5}
                color={colors.rotated}
                text="rotated"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial depthTest={false} depthWrite={false} />
            </Text>
        </Billboard>
        <Billboard position={[reflectionA.x, reflectionA.y, reflectionA.z]}>
            <Text
                anchorX="center"
                anchorY="center"
                fontSize={0.5}
                color={colors.reflected}
                text="first reflection q"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial depthTest={false} depthWrite={false} />
            </Text>
        </Billboard>

        <Billboard position={[rotorNormal.x, rotorNormal.y + 1, rotorNormal.z]}>
            <Text
                anchorX="center"
                anchorY="center"
                fontSize={0.5}
                color={colors.angle}
                text="rotor axis"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial depthTest={false} depthWrite={false} />
            </Text>
        </Billboard>
        <Billboard position={[vector.x, vector.y + 1, vector.z]}>
            <Text
                anchorX="center"
                anchorY="center"
                fontSize={0.5}
                color={colors.subject}
                text="Subject s"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial depthTest={false} depthWrite={false} />
            </Text>
        </Billboard>
        <Billboard
            position={[
                rotor.from.x * 1.1,
                rotor.from.y * 1.1,
                rotor.from.z * 1.1,
            ]}
        >
            <Text
                depthOffset={10}
                anchorX="center"
                anchorY="center"
                textAlign="center"
                fontSize={0.5}
                color={colors.first}
                text="first reflector u"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial depthTest={false} depthWrite={false} />
            </Text>
        </Billboard>

        <Billboard
            position={[rotor.to.x * 1.3, rotor.to.y * 1.3, rotor.to.z * 1.3]}
        >
            <Text
                depthOffset={10}
                anchorX="center"
                anchorY="center"
                textAlign="center"
                fontSize={0.5}
                color={colors.second}
                text="second reflector v"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial depthTest={false} depthWrite={false} />
            </Text>
        </Billboard>
    </Canvas>
</section>

<style>
    section {
        inset: 0;
        height: 50vh;
        display: grid;
        background-color: #fff;
    }
</style>
