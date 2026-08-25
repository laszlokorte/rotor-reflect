<script>
    import { Canvas } from "@threlte/core";

    import * as THREE from "three";
    import { MeshLineGeometry, MeshLineMaterial } from "@threlte/extras";
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

    const projectPlane = (normal, s) =>
        scale(dot(norm(normal), s), norm(normal));
    const cross = (a, b) => ({
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    });

    const reflectPlane = (normal, s) => {
        const projected = projectPlane(normal, s);
        const reflected = subtract(s, scale(2, projected));
        return reflected;
    };

    let vector = $state({ x: 5, y: 5, z: 3 });
    let bivector = $state({ xy: 5, yz: 6, xz: 7 });
    let rotor = $state({
        to: { x: -2, y: 0, z: 2 },
        from: { x: 2, y: -2, z: 4 },
    });
    const rotorNormal = $derived(
        new THREE.Vector3(rotor.from.x, rotor.from.y, rotor.from.z)
            .cross(rotor.to)
            .normalize(),
    );
    const firstPlaneNormal = $derived(norm(cross(rotor.from, rotorNormal)));
    const firstPlaneNormalV = $derived(
        new THREE.Vector3(
            firstPlaneNormal.x,
            firstPlaneNormal.y,
            firstPlaneNormal.z,
        ).normalize(),
    );
    const firstQuat = $derived(
        new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(
                firstPlaneNormal.x,
                firstPlaneNormal.y,
                firstPlaneNormal.z,
            ),
        ),
    );

    const secondPlaneNormal = $derived(norm(cross(rotor.to, rotorNormal)));
    const secondQuat = $derived(
        new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(
                secondPlaneNormal.x,
                secondPlaneNormal.y,
                secondPlaneNormal.z,
            ),
        ),
    );

    const reflectionA = $derived(reflectPlane(firstPlaneNormal, vector));
    const reflectionB = $derived(reflectPlane(secondPlaneNormal, reflectionA));

    const circlePoints = Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    });

    const circlePointsGeo = new THREE.BufferGeometry().setFromPoints(
        circlePoints,
    );
</script>

<section>
    <Canvas
        dpr={Math.max(window.devicePixelRatio, 2)}
        colorManagementEnabled={false}
    >
        <T.PerspectiveCamera
            fov={50}
            makeDefault
            position={[3.5, 14, 10]}
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

        <T.Mesh quaternion={firstQuat.toArray()}>
            <T.PlaneGeometry args={[10, 10]} />

            <T.ShaderMaterial
                transparent
                depthWrite={false}
                toneMapped={false}
                side={THREE.DoubleSide}
                uniforms={{
                    color: { value: new THREE.Color(colors.first) },
                }}
                vertexShader={`
                 varying vec2 vUv;

                 void main() {
                   vUv = uv;
                   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                 }
               `}
                fragmentShader={`
                 uniform vec3 color;
                 varying vec2 vUv;

                 void main() {
                   vec2 p = vUv - 0.5;
                   float r = length(p) * 2.0; // 0 at center, 1 at corners

                   float alpha = 1.0 - smoothstep(0.7, 1.0, r);

                   gl_FragColor = vec4(color, alpha * 0.3);
                 }
               `}
            />
        </T.Mesh>

        <T.Mesh quaternion={firstQuat.toArray()} scale={3.5}>
            <MeshLineGeometry points={circlePoints} />
            <MeshLineMaterial
                width={0.04}
                toneMapped={false}
                color={colors.first}
                opacity={0.8}
            />
        </T.Mesh>

        <T.Mesh quaternion={secondQuat.toArray()} scale={3.5}>
            <MeshLineGeometry points={circlePoints} />
            <MeshLineMaterial
                width={0.04}
                toneMapped={false}
                color={colors.second}
                opacity={0.9}
            />
        </T.Mesh>
        <T.Mesh quaternion={secondQuat.toArray()}>
            <T.PlaneGeometry args={[10, 10]} />

            <T.ShaderMaterial
                transparent
                depthWrite={false}
                toneMapped={false}
                side={THREE.DoubleSide}
                uniforms={{
                    color: { value: new THREE.Color(colors.second) },
                }}
                vertexShader={`
                 varying vec2 vUv;

                 void main() {
                   vUv = uv;
                   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                 }
               `}
                fragmentShader={`
                 uniform vec3 color;
                 varying vec2 vUv;

                 void main() {
                   vec2 p = vUv - 0.5;
                   float r = length(p) * 2.0; // 0 at center, 1 at corners

                   float alpha = 1.0 - smoothstep(0.7, 1.0, r);

                   gl_FragColor = vec4(color, alpha * 0.2);
                 }
               `}
            />
        </T.Mesh>
        <T.AmbientLight intensity={1} />
        <T.DirectionalLight position={[5, 5, 5]} intensity={5} />

        <T.Mesh position={[0, 0, 0]}>
            <T.SphereGeometry args={[0.1, 8, 8]} />
            <T.MeshStandardMaterial color={0x000000} />
        </T.Mesh>

        <Arrow target={vector} color={colors.subject} />
        <Arrow target={reflectionA} color={colors.reflected} />
        <Arrow target={reflectionB} color={colors.rotated} />

        <Face {bivector} color="black" />
        <Arrow target={rotorNormal.multiplyScalar(-5)} color={colors.angle} />

        <!--

	<Arrow target={{ ...vector, y: 0, z: 0 }} color="white" />
		<Arrow target={{ ...vector, x: 0, z: 0 }} color="green" />
		<Arrow target={{ ...vector, x: 0, y: 0 }} color="blue" />
	-->
        <Billboard position={[reflectionB.x, reflectionB.y + 1, reflectionB.z]}>
            <Text
                anchorX="center"
                anchorY="center"
                fontSize={0.5}
                color={"white"}
                outlineColor={colors.rotated}
                outlineWidth={0.05}
                opacity={1}
                outlineOpacity={1}
                text="rotated"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={true}
                    depthWrite={true}
                />
            </Text>
        </Billboard>
        <Billboard position={[reflectionA.x, reflectionA.y, reflectionA.z]}>
            <Text
                anchorX="center"
                anchorY="center"
                fontSize={0.5}
                color={"white"}
                outlineColor={colors.reflected}
                outlineWidth={0.05}
                opacity={1}
                outlineOpacity={1}
                text="first reflection q"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={true}
                    depthWrite={true}
                />
            </Text>
        </Billboard>

        <Billboard position={[rotorNormal.x, rotorNormal.y + 1, rotorNormal.z]}>
            <Text
                anchorX="center"
                anchorY="center"
                fontSize={0.5}
                color={"white"}
                outlineColor={colors.angle}
                outlineWidth={0.05}
                opacity={1}
                outlineOpacity={1}
                text="rotor axis"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={true}
                    depthWrite={true}
                />
            </Text>
        </Billboard>
        <Billboard position={[vector.x, vector.y + 1, vector.z]}>
            <Text
                anchorX="center"
                anchorY="center"
                fontSize={0.5}
                color={"white"}
                outlineColor={colors.subject}
                outlineWidth={0.05}
                opacity={1}
                outlineOpacity={1}
                text="Subject s"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={true}
                    depthWrite={true}
                />
            </Text>
        </Billboard>
        <Billboard
            position={[
                rotor.from.x * 1.1,
                -rotor.from.y * 1.1,
                rotor.from.z * 1.1,
            ]}
        >
            <Text
                depthOffset={10}
                anchorX="center"
                anchorY="center"
                textAlign="center"
                fontSize={0.5}
                color={"white"}
                outlineColor={colors.first}
                outlineWidth={0.05}
                opacity={1}
                outlineOpacity={1}
                text="first reflector u"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={true}
                    depthWrite={true}
                />
            </Text>
        </Billboard>

        <Billboard
            position={[
                rotor.to.x * 1.3,
                rotor.to.y * 1.3 + 2,
                rotor.to.z * 1.3,
            ]}
        >
            <Text
                depthOffset={10}
                anchorX="center"
                anchorY="center"
                textAlign="center"
                fontSize={0.5}
                color={"white"}
                outlineColor={colors.second}
                outlineWidth={0.05}
                opacity={1}
                outlineOpacity={1}
                text="second reflector v"
                renderOrder={10000}
            >
                <T.MeshBasicMaterial
                    toneMapped={false}
                    depthTest={true}
                    depthWrite={true}
                />
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
