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
        from: { x: 3, y: -2, z: 3 },
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

<svelte:head>
    <title>3D Scene</title>
</svelte:head>

<section>
    <Canvas dpr={[1, 2]}>
        <T.PerspectiveCamera
            fov={50}
            makeDefault
            position={[10, 5, 15]}
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
            cellThickness={1}
            sectionThickness={1}
            cellSize={5}
            fadeStrength={1}
            infiniteGrid={true}
            sectionColor="#333"
            renderOrder={-1}
            cellColor="#555"
        />
        <T.AmbientLight />
        <T.DirectionalLight position={[20, 30, 10]}></T.DirectionalLight>
        <T.DirectionalLight position={[0, -20, -10]}></T.DirectionalLight>

        {#if box}
            <T.Mesh position.y={2.55}>
                <T.BoxGeometry args={[5, 5, 6]} />

                <T.MeshStandardMaterial color="rebeccapurple" />
            </T.Mesh>
            <T.Mesh position.y={2.55}>
                <T.BoxGeometry args={[5, 5, 6]} />

                <FakeGlowMaterial
                    falloff={0.6}
                    glowColor="purple"
                    opacity={0.5}
                />
            </T.Mesh>
        {/if}

        <T.Mesh position={[0, 0, 0]}>
            <T.SphereGeometry args={[0.1, 8, 8]} />
            <T.MeshStandardMaterial color={0x000000} />
        </T.Mesh>

        <Arrow target={vector} color="royalblue" />
        <Arrow target={reflectionA} color="darkmagenta" />
        <Arrow target={reflectionB} color="teal" />
        <Arrow target={rotor.from} color="magenta" />
        <Arrow target={rotor.to} color="cyan" />
        <Sector
            from={new THREE.Vector3(rotor.from.x, rotor.from.y, rotor.from.z)}
            to={new THREE.Vector3(rotor.to.x, rotor.to.y, rotor.to.z)}
            color="orange"
            radius={3}
        />
        <Sector
            from={new THREE.Vector3(vector.x, vector.y, vector.z)}
            to={new THREE.Vector3(reflectionB.x, reflectionB.y, reflectionB.z)}
            normal={rotorNormal}
            color="red"
            radius={3}
        />

        <Sector
            from={new THREE.Vector3(vector.x, vector.y, vector.z)}
            to={new THREE.Vector3(reflectionA.x, reflectionA.y, reflectionA.z)}
            color="magenta"
            radius={3}
        />
        <Sector
            from={new THREE.Vector3(
                reflectionB.x,
                reflectionB.y,
                reflectionB.z,
            )}
            to={new THREE.Vector3(reflectionA.x, reflectionA.y, reflectionA.z)}
            color="aqua"
            radius={3}
        />
        <Face {bivector} color="black" />
        <Arrow target={rotorNormal.multiplyScalar(-5)} color="yellow" />
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
                color="darkcyan"
                text="Rotated"
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
                color="black"
                text="first reflection"
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
                color="brown"
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
                color="royalblue"
                text="subject"
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
                color="magenta"
                text="first reflector"
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
                color="darkcyan"
                text="second reflector"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial depthTest={false} depthWrite={false} />
            </Text>
        </Billboard>

        <!--
		<Billboard position={[vector.x, 1, -1]}>
			<Text textAlign="center" fontSize={0.5} color="red" text="X" />
		</Billboard>

		<Billboard position={[0, vector.y + 1.5, 0]}>
			<Text fontSize={0.5} textAlign="center" color="green" text="Y" />
		</Billboard>

		<Billboard position={[-1, 1, vector.z]}>
			<Text textAlign="center" fontSize={0.5} color="blue" text="Z" />
		</Billboard>
		-->
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
