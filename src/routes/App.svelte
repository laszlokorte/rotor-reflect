<script>
    import Scene from "./Scene.svelte";
    import ScenePlanes from "./ScenePlanes.svelte";
    import fGrid from "./f_grid";
    import Highlight from "./Highlight.svelte";
    import { jitteredGrid } from "./sampling";

    const favicon = "favicon.svg";

    let colors = $state({
        subject: "royalblue",
        first: "tomato",
        angle_a: "tomato",
        angle_b: "teal",
        second: "teal",
        projected: "rebeccapurple",
        projected2: "rebeccapurple",
        reflected: "orchid",
        rotated: "limegreen",
        angle: "#333",
        rotor: "#aaa",
        plane: "purple",
        single: "darkorange",
        pivot: "black",
    });

    let reflector = $state({
        x: 3,
        y: 2,
    });

    let reflector2 = $state({
        x: 2,
        y: 3,
    });
    let plane0 = $state({
        dragging: false,
        normal: norm({
            x: 2,
            y: -1,
        }),
        distance: 0,
    });
    let plane = $state({
        normal: norm({
            x: 2,
            y: -3,
        }),
        distance: 0,
    });

    let plane2 = $state({
        normal: norm({
            x: 3,
            y: -2,
        }),
        distance: 0,
    });

    let planesOrtho = $state({
        normal: norm({
            x: -1,
            y: -2,
        }),
        distanceA: 0.5,
        distanceB: 0.5,
    });
    let planesParallel = $state({
        normal: norm({
            x: 3,
            y: -2,
        }),
        distanceA: 1,
        distanceB: 2,
    });

    function transform(v, t) {
        return {
            x: v.x * t[0] + t[1] * v.y,
            y: v.x * t[2] + t[3] * v.y,
        };
    }

    function planeIntersection(p1, p2) {
        const { x: nx1, y: ny1 } = p1.normal;
        const { x: nx2, y: ny2 } = p2.normal;

        const det = nx1 * ny2 - ny1 * nx2;

        if (Math.abs(det) < 1e-10) {
            return null; // parallel (or coincident)
        }

        return {
            x: (p1.distance * ny2 - ny1 * p2.distance) / det,
            y: (nx1 * p2.distance - p1.distance * nx2) / det,
        };
    }

    let planeInter = $derived(planeIntersection(plane, plane2));

    let circle = $state({
        center: { x: -2.5, y: -2.5 },
        radius: 2,
    });
    let circle2 = $state({
        center: { x: 3, y: -0.5 },
        radius: 1.5,
    });
    const circle3 = $derived({
        center: circle.center,
        radius: circle2.radius,
    });

    let trans = $state({
        center: norm({ x: 3, y: -1 }),
        radiusA: 4,
        radiusB: 2,
    });

    function circleReflect(circle, subject) {
        const direction = subtract(subject, circle.center);
        const dist_ratio = len(direction) / circle.radius;
        const dist_inv = 1 / dist_ratio;

        return add(circle.center, scale(dist_inv * dist_inv, direction));
    }
    function circleProject(circle, subject) {
        const direction = subtract(subject, circle.center);
        const dist_ratio = len(direction) / circle.radius;
        const dist_inv = 1 / dist_ratio;

        return add(circle.center, scale(dist_inv, direction));
    }

    function circleScale(circleA, circleB, v) {
        const dotCircledReflected = circleReflect(circleA, v);
        return circleReflect(circleB, dotCircledReflected);
    }

    const circleReflected = $derived(circleReflect(circle, subject));
    const circleReflected2 = $derived(circleReflect(circle2, circleReflected));
    const circleProjected = $derived(circleProject(circle, subject));
    const circleProjected2 = $derived(circleProject(circle2, circleReflected));
    const circleScaled = $derived(circleScale(circle, circle3, subject));

    let rotor = $derived({
        from: reflector,
        to: reflector2,
    });

    let subject = $state({
        x: -1,
        y: 2,
    });

    let showChiral = $state(true);

    function dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    function det(u, v) {
        return u.x * v.y - u.y * v.x;
    }

    function dotdet(u, v) {
        return { x: dot(u, v), y: -det(u, v) };
    }

    function len2(v) {
        return dot(v, v);
    }

    function len(v) {
        return Math.sqrt(dot(v, v));
    }

    function scale(s, v) {
        return {
            x: s * v.x,
            y: s * v.y,
        };
    }

    function norm(v) {
        return scale(1 / len(v), v);
    }

    function inv(v) {
        return scale(1 / len2(v), v);
    }

    function add(u, v) {
        return {
            x: u.x + v.x,
            y: u.y + v.y,
        };
    }

    function subtract(u, v) {
        return add(u, scale(-1, v));
    }

    function project(t, s) {
        return scale(dot(t, s) / len2(s), s);
    }

    function reflect(r, s) {
        const projected = project(s, r);
        const reflected = subtract(scale(2, projected), s);

        return reflected;
    }

    function rotate(a, b, s) {
        return reflect(b, reflect(a, s));
    }

    function rotateHalf(a, b, s) {
        return rotate(scale(0.5, add(a, b)), b, s);
    }
    function isOnCCWArc(a, b, p) {
        const ab = det(a, b);

        if (ab >= 0) {
            return det(a, p) >= 0 && det(p, b) >= 0;
        } else {
            return det(a, p) >= 0 || det(p, b) >= 0;
        }
    }

    function arcDirection(subject, reflected, rotated) {
        return isOnCCWArc(subject, rotated, reflected);
    }

    function planeReject(subject, { normal: normal, distance: d }) {
        const dist = dot(subject, normal) - d;
        return scale(dist, normal);
    }

    function planeProject(subject, plane) {
        return subtract(subject, planeReject(subject, plane));
    }

    function planeReflect(subject, plane) {
        return add(subject, scale(-2, planeReject(subject, plane)));
    }

    let projected = $derived(
        scale(dot(subject, reflector) / len2(reflector), reflector),
    );
    let reflected = $derived(subtract(scale(2, projected), subject));

    let projected2 = $derived(
        scale(dot(reflected, reflector2) / len2(reflector2), reflector2),
    );
    let rotated = $derived(subtract(scale(2, projected2), reflected));

    let plane0Projected = $derived(planeProject(subject, plane0));
    let plane0Reflected = $derived(planeReflect(subject, plane0));
    let planeReflected = $derived(planeReflect(subject, plane));
    let planeProjected = $derived(planeProject(subject, plane));
    let planeProjected2 = $derived(planeProject(planeReflected, plane2));
    let planeRotated = $derived(planeReflect(planeReflected, plane2));
    const evtToSvg = (evt) => {
        const svg = evt.currentTarget.ownerSVGElement;
        const svgPoint = svg.createSVGPoint();

        svgPoint.x = evt.clientX;
        svgPoint.y = evt.clientY;
        const svgGlobal = svgPoint.matrixTransform(
            svg.getScreenCTM().inverse(),
        );

        return { x: svgGlobal.x, y: svgGlobal.y };
    };

    const reflectionMatrix = ({ x, y }) => {
        const xx = x * x;
        const yy = y * y;
        const xy = x * y;
        const d = xx + yy;

        const a = (xx - yy) / d;
        const b = (2 * xy) / d;
        const c = (2 * xy) / d;
        const e = (yy - xx) / d;

        return `matrix(${a} ${b} ${c} ${e} 0 0)`;
    };
    const reflectionPlaneMatrix = (plane) => {
        const { x: nx, y: ny } = plane.normal;
        const d = plane.distance * 10;

        return `matrix(
          ${1 - 2 * nx * nx},
          ${-2 * nx * -ny},
          ${-2 * nx * -ny},
          ${1 - 2 * -ny * -ny},
          ${2 * d * nx},
          ${2 * d * -ny}
        )`;
    };

    const gridSize = 8;

    function fShape(x, y) {
        return (
            x < (gridSize * 4) / 3 &&
            (x < 3 || y < 3 || (x <= gridSize && Math.abs(y - gridSize) < 2))
        );
    }

    function translate(t, v) {
        return add(v, scale(t.radiusA - t.radiusB, norm(t.center)));
    }

    const pointSamples = jitteredGrid(20, 0.25);
    const rainbow = (x, y) => {
        const h = (Math.atan2(y, x) / (2 * Math.PI) + 1) % 1;
        return `hsl(${h * 360} 100% 50%)`;
    };
    const adjustedPointSamples = $derived(
        pointSamples.map((p) =>
            add(
                scale(plane0.distance, plane0.normal),
                add(
                    scale(p.x, plane0.normal),
                    scale(p.y, { x: -plane0.normal.y, y: plane0.normal.x }),
                ),
            ),
        ),
    );
</script>

{#snippet vec(v, defaultColor = null, cls = null, stripe = [])}
    {#each stripe as str, si}
        {@const l = len(v)}
        {@const dash = ((l / stripe.length) * 100) / 5}
        <path
            class={[cls, "vector"]}
            marker-end="url(#vector-head)"
            vector-effect="non-scaling-stroke"
            d="M 0,0 L {v.x * 100} {v.y * -100}"
            stroke={str}
            stroke-dasharray="{dash} {dash}"
            stroke-dashoffset={dash * si}
        />
    {:else}
        <path
            class={[cls, "vector"]}
            marker-end="url(#vector-head)"
            vector-effect="non-scaling-stroke"
            d="M 0,0 L {v.x * 100} {v.y * -100}"
            stroke={defaultColor ?? v.color ?? "red"}
        />
    {/each}
{/snippet}

{#snippet line(u, v, defaultColor = null, cls = null)}
    <path
        class={[cls, "vector"]}
        marker-end="url(#vector-head)"
        vector-effect="non-scaling-stroke"
        d="M {u.x * 100} {u.y * -100} L {v.x * 100} {v.y * -100}"
        stroke={defaultColor ?? v.color ?? "#555"}
    />
{/snippet}

{#snippet arc(u, v, defaultColor = null, cls = null)}
    {@const rad = Math.min(len(u), len(v)) * 0.8}
    {@const un = norm(u)}
    {@const vn = norm(v)}
    <path
        class={[cls, "vector"]}
        fill-opacity="0.3"
        vector-effect="non-scaling-stroke"
        d="M 0 0 L {un.x * 100 * rad}, {un.y * -100 * rad} A {rad * 100} {rad *
            100} 0 {det(v, u) > 0 ? 1 : 0} 0 {vn.x * 100 * rad}, {vn.y *
            rad *
            -100} z"
        opacity="0.4"
        fill={defaultColor ?? v.color ?? "red"}
    />
    <path
        class={[cls, "vector"]}
        fill-opacity="0.3"
        vector-effect="non-scaling-stroke"
        d="M {un.x * 100 * rad}, {un.y * -100 * rad} A {rad * 100} {rad *
            100} 0 {det(v, u) > 0 ? 1 : 0} 0 {vn.x * 100 * rad}, {vn.y *
            rad *
            -100}"
        fill="none"
        opacity="0.4"
        stroke={defaultColor ?? v.color ?? "red"}
    />
{/snippet}

{#snippet label(
    v,
    t,
    defaultColor = null,
    cls = null,
    autofit = 1,
    autoalign = true,
)}
    <text
        text-anchor={typeof autoalign === "string"
            ? autoalign
            : ["start", "middle", "end"][
                  1 - Math.sign(v.x) * (autoalign ? 1 : 0)
              ]}
        transform="translate(0 {-30 * Math.sign(v.y) * autofit})"
        class={[cls, "label"]}
        x={v.x * 100}
        y={v.y * -100}
        fill={"white"}
        stroke={defaultColor ?? v.color ?? "red"}
        stroke-opacity="0.2"
        stroke-width="6"
    >
        {t}
    </text>
    <text
        text-anchor={typeof autoalign === "string"
            ? autoalign
            : ["start", "middle", "end"][
                  1 - Math.sign(v.x) * (autoalign ? 1 : 0)
              ]}
        transform="translate(0 {-30 * Math.sign(v.y) * autofit})"
        class={[cls, "label"]}
        x={v.x * 100}
        y={v.y * -100}
        fill={defaultColor ?? v.color ?? "red"}
    >
        {t}
    </text>
{/snippet}
{#snippet arclabel(u, v, t, defaultColor, cls)}
    {@const rad = Math.min(len(u), len(v)) * 0.5}
    {@const mid = scale(0.5 * (det(u, v) < 0 ? -1 : 1), add(norm(u), norm(v)))}
    {@const vv = scale(rad, norm(mid))}
    <text
        text-anchor={"middle"}
        class={[cls, "label"]}
        x={vv.x * 100}
        y={vv.y * -100}
        fill={defaultColor ?? v.color ?? "red"}
    >
        {t}
    </text>
{/snippet}

{#snippet axis()}
    <line
        marker-end="url(#vector-head)"
        class="axis"
        x1="-500"
        x2="500"
        stroke="#333"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
        shape-rendering="crispEdges"
    />
    <line
        marker-end="url(#vector-head)"
        class="axis"
        y2="-500"
        y1="500"
        stroke="#333"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
        shape-rendering="crispEdges"
    />
    <text class={["axis-label"]} x={500} y={-30} text-anchor="end"> X </text>
    <text class={["axis-label"]} x={30} y={-470} text-anchor="start"> Y </text>
{/snippet}

{#snippet ctrl(v, defaultColor = null, cls = null, s = false, stripe = [])}
    {#each stripe as str, si}
        {@const rad = 10}
        {@const circ = Math.PI * 2 * rad}
        {@const dash = circ / stripe.length / 2}
        <circle
            pointer-events="none"
            class={[cls]}
            r="10"
            cx={v.x * 100 * (s !== false ? s : 1)}
            cy={v.y * -100 * (s !== false ? s : 1)}
            stroke={str}
            fill="none"
            opacity={0.5}
            stroke-width="20"
            stroke-dasharray="{dash} {dash}"
            stroke-dashoffset={dash * si}
        />
    {:else}
        <circle
            pointer-events="none"
            class={[cls]}
            r="20"
            opacity="0.3"
            cx={v.x * 100 * (s !== false ? s : 1)}
            cy={v.y * -100 * (s !== false ? s : 1)}
            fill={defaultColor ?? v.color ?? "red"}
        />
    {/each}
    <circle
        pointer-events="none"
        stroke="white"
        class={[cls]}
        r="10"
        cx={v.x * 100 * (s !== false ? s : 1)}
        cy={v.y * -100 * (s !== false ? s : 1)}
        fill={defaultColor ?? v.color ?? "red"}
    />

    <circle
        pointer-events="all"
        onpointerdown={(evt) => {
            if (evt.isPrimary) {
                evt.preventDefault();
                evt.currentTarget.setPointerCapture(evt.pointerId);

                const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));
                evt.currentTarget._offset = subtract(
                    pos,
                    scale(100 * (s == false ? 1 : s), v),
                );
            }
        }}
        onpointermove={(evt) => {
            if (evt.currentTarget.hasPointerCapture(evt.pointerId)) {
                evt.preventDefault();
                const pos = subtract(
                    reflect({ x: 1, y: 0 }, evtToSvg(evt)),
                    evt.currentTarget._offset,
                );

                const clamped = scale(
                    s ? 100 * Math.sign(s) : Math.min(500, len(pos)),
                    norm(pos),
                );

                v.x = clamped.x / 100;
                v.y = clamped.y / 100;
            }
        }}
        ongotpointercapture={(evt) => {
            v.dragging = true;
        }}
        onlostpointercapture={(evt) => {
            v.dragging = false;
        }}
        role="button"
        tabindex="-1"
        onkeypress={(evt) => {
            evt.preventDefault();
        }}
        class={[cls, "touch-point"]}
        cursor="move"
        r="40"
        cx={v.x * 100 * (s !== false ? s : 1)}
        cy={v.y * -100 * (s !== false ? s : 1)}
        fill="none"
    />
{/snippet}

{#snippet ctrlPivot(p1, p2)}
    {@const int = planeIntersection(p1, p2)}
    {#if int}
        <circle
            r="20"
            fill="black"
            opacity="0.2"
            cx={int.x * 100}
            cy={-int.y * 100}
            pointer-events="all"
            onpointerdown={(evt) => {
                if (evt.isPrimary) {
                    evt.preventDefault();
                    evt.currentTarget.setPointerCapture(evt.pointerId);

                    const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));
                    evt.currentTarget._offset = subtract(pos, scale(100, int));
                }
            }}
            onpointermove={(evt) => {
                if (evt.currentTarget.hasPointerCapture(evt.pointerId)) {
                    evt.preventDefault();
                    const pos = subtract(
                        reflect({ x: 1, y: 0 }, evtToSvg(evt)),
                        evt.currentTarget._offset,
                    );
                    const clamped = scale(Math.min(len(pos), 500), norm(pos));

                    const d1 = dot(p1.normal, clamped);
                    const d2 = dot(p2.normal, clamped);
                    if (d1 < 0) {
                        p1.normal.x *= -1;
                        p1.normal.y *= -1;
                    }

                    if (d2 < 0) {
                        p2.normal.x *= -1;
                        p2.normal.y *= -1;
                    }
                    p1.distance = Math.abs(d1 / 100);
                    p2.distance = Math.abs(d2 / 100);
                }
            }}
            role="button"
            tabindex="-1"
            onkeypress={(evt) => {
                evt.preventDefault();
            }}
        ></circle>
    {/if}
{/snippet}
{#snippet ctrlRad(circle, defaultColor = null, cls = null, forceCenter = null)}
    {@const center = forceCenter || circle.center}
    {@const v = add(center, { x: circle.radius, y: 0 })}

    <circle
        r={circle.radius * 100 + 20}
        cx={center.x * 100}
        cy={center.y * -100}
        fill="none"
        stroke={defaultColor ?? v.color ?? "red"}
        stroke-width="40"
        stroke-opacity="0.1"
        pointer-events="none"
    />
    <circle
        onpointerdown={(evt) => {
            if (evt.isPrimary) {
                evt.preventDefault();
                evt.currentTarget.setPointerCapture(evt.pointerId);

                const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));
                evt.currentTarget._offset =
                    len(subtract(pos, scale(100, center))) -
                    circle.radius * 100;
            }
        }}
        onpointermove={(evt) => {
            if (evt.currentTarget.hasPointerCapture(evt.pointerId)) {
                evt.preventDefault();
                const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));

                circle.radius = Math.min(
                    5,
                    Math.max(
                        0,
                        Math.hypot(
                            Math.abs(pos.x / 100 - center.x),
                            Math.abs(pos.y / 100 - center.y),
                        ) -
                            evt.currentTarget._offset / 100,
                    ),
                );
            }
        }}
        role="button"
        tabindex="-1"
        onkeypress={(evt) => {
            evt.preventDefault();
        }}
        class={[cls, "touch-point"]}
        cursor="move"
        r={circle.radius * 100 + 40}
        cx={center.x * 100}
        cy={center.y * -100}
        fill="none"
        stroke={"transparent"}
        stroke-width={80}
        pointer-events="stroke"
    />
{/snippet}
{#snippet ctrlTransRads(trans, defaultColors = [], cls = null)}
    {@const center = norm(trans.center)}
    {@render line(
        scale(trans.radiusB - 0.2, center),
        scale(trans.radiusA - 0.2, center),
        "black",
        "dashed faded nodir",
    )}
    {#each ["radiusA", "radiusB"] as rad, i}
        {@const v = add(center, { x: trans[rad], y: 0 })}
        <path
            role="button"
            tabindex="-1"
            onkeypress={(evt) => {
                evt.preventDefault();
            }}
            class={[cls, "touch-point"]}
            cursor="move"
            d="M{center.x * (trans[rad] * 100 + 20) + center.y * 500}
            {center.y * -(trans[rad] * 100 + 20) + center.x * 500}
            Q
            {center.x * (trans[rad] * 100 - 80 + 20)}
            {center.y * -(trans[rad] * 100 - 80 + 20)}
            {center.x * (trans[rad] * 100 + 20) - center.y * 500}
            {center.y * -(trans[rad] * 100 + 20) - center.x * 500}"
            fill="none"
            stroke={defaultColors[i] ?? v.color ?? "red"}
            stroke-width="4"
            stroke-opacity="0.3"
            pointer-events="stroke"
        />
        <path
            stroke-linecap="round"
            class={[cls, "touch-point"]}
            cursor="move"
            d="M{center.x * (trans[rad] * 100) + center.y * 500}
                             {center.y * -(trans[rad] * 100) + center.x * 500}
                             Q
                             {center.x * (trans[rad] * 100 - 80)}
                             {center.y * -(trans[rad] * 100 - 80)}
                             {center.x * (trans[rad] * 100) - center.y * 500}
                             {center.y * -(trans[rad] * 100) - center.x * 500}"
            fill="none"
            stroke={defaultColors[i] ?? v.color ?? "red"}
            stroke-width="40"
            stroke-opacity="0.1"
            pointer-events="none"
        />
        <path
            onpointerdown={(evt) => {
                if (evt.isPrimary) {
                    evt.preventDefault();
                    evt.currentTarget.setPointerCapture(evt.pointerId);

                    const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));
                    evt.currentTarget._offset =
                        dot(scale(1 / 100, pos), norm(center)) - trans[rad];
                }
            }}
            onpointermove={(evt) => {
                if (evt.currentTarget.hasPointerCapture(evt.pointerId)) {
                    evt.preventDefault();
                    const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));

                    trans[rad] = Math.min(
                        5,
                        Math.max(
                            -4,
                            dot(norm(center), scale(1 / 100, pos)) -
                                evt.currentTarget._offset,
                        ),
                    );
                }
            }}
            role="button"
            tabindex="-1"
            onkeypress={(evt) => {
                evt.preventDefault();
            }}
            stroke-linecap="round"
            class={[cls, "touch-point"]}
            cursor="move"
            d="M{center.x * (trans[rad] * 100 - 20) + center.y * 500}
                     {center.y * -(trans[rad] * 100 - 20) + center.x * 500}
                     Q
                     {center.x * (trans[rad] * 100 - 20 - 80)}
                     {center.y * -(trans[rad] * 100 - 20 - 80)}
                     {center.x * (trans[rad] * 100 - 20) - center.y * 500}
                     {center.y * -(trans[rad] * 100 - 20) - center.x * 500}"
            fill="none"
            stroke={"transparent"}
            stroke-width={80}
            pointer-events="stroke"
        />
    {/each}
{/snippet}
{#snippet ctrlPlane(plane, defaultColor, cls = null)}
    {@const normal = norm(plane.normal)}
    {@const off = scale(plane.distance, normal)}
    {@const v = add(normal, { x: plane.distance, y: 0 })}
    <path
        role="button"
        tabindex="-1"
        onkeypress={(evt) => {
            evt.preventDefault();
        }}
        class={[cls, "touch-point"]}
        cursor="move"
        d="M{normal.x * (plane.distance * 100) + normal.y * 500}
            {normal.y * -(plane.distance * 100) + normal.x * 500}

            {normal.x * (plane.distance * 100) - normal.y * 500}
            {normal.y * -(plane.distance * 100) - normal.x * 500}"
        fill="none"
        stroke={defaultColor ?? "red"}
        stroke-width="4"
        stroke-opacity="0.3"
        pointer-events="stroke"
    />
    {@render vec(plane.normal, defaultColor)}
    <line
        stroke-linecap="round"
        opacity="0.5"
        x1={0}
        y1={0}
        x2={off.x * 100}
        y2={-off.y * 100}
        stroke-width="5"
        stroke-dasharray=" 10 10 5 10"
        stroke={defaultColor}
    />
    <path
        onpointerdown={(evt) => {
            if (evt.isPrimary) {
                evt.preventDefault();
                evt.currentTarget.setPointerCapture(evt.pointerId);

                const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));
                evt.currentTarget._offset =
                    dot(scale(1 / 100, pos), norm(normal)) - plane.distance;
            }
        }}
        ongotpointercapture={(evt) => {
            plane.dragging = true;
        }}
        onlostpointercapture={(evt) => {
            plane.dragging = false;
        }}
        onpointermove={(evt) => {
            if (evt.currentTarget.hasPointerCapture(evt.pointerId)) {
                evt.preventDefault();
                const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));

                plane.distance = Math.min(
                    4,
                    Math.max(
                        -0,
                        dot(norm(normal), scale(1 / 100, pos)) -
                            evt.currentTarget._offset,
                    ),
                );
            }
        }}
        role="button"
        tabindex="-1"
        onkeypress={(evt) => {
            evt.preventDefault();
        }}
        class={[cls, "touch-point"]}
        cursor="move"
        d="M
        {normal.x * (plane.distance * 100 + 20) + normal.y * 500}
        {normal.y * -(plane.distance * 100 + 20) + normal.x * 500}
        {normal.x * (plane.distance * 100 + 20) - normal.y * 500}
        {normal.y * -(plane.distance * 100 + 20) - normal.x * 500}"
        fill="none"
        stroke={defaultColor ?? "red"}
        stroke-width="40"
        stroke-opacity="0.1"
        pointer-events="stroke"
    />

    {@render ctrl(plane.normal, defaultColor, "", 1)}
{/snippet}
{#snippet ctrlPlanes(planes, defaultColors = [], ts = [], cls = null)}
    {@const normalA = transform(planes.normal, ts[0] ?? [1, 0, 0, 1])}
    {@const normalB = transform(planes.normal, ts[1] ?? [1, 0, 0, 1])}
    {@const int = planeIntersection(
        {
            normal: normalA,
            distance: planes.distanceA,
        },
        {
            normal: normalB,
            distance: planes.distanceB,
        },
    )}
    {#if det(normalA, normalB) == 0}
        {@render line(
            add(
                scale(0.5, { x: -planes.normal.y, y: planes.normal.x }),
                scale(planes.distanceA, planes.normal),
            ),
            add(
                scale(0.5, { x: -planes.normal.y, y: planes.normal.x }),
                scale(planes.distanceB, planes.normal),
            ),
            "black",
            "dashed faded nodir",
        )}
    {/if}
    {#each ["distanceA", "distanceB"] as d, di}
        {@const normal = scale(
            1,
            transform(norm(planes.normal), ts[di] ?? [1, 0, 0, 1]),
        )}
        <path
            role="button"
            tabindex="-1"
            onkeypress={(evt) => {
                evt.preventDefault();
            }}
            class={[cls, "touch-point"]}
            cursor="move"
            d="M{normal.x * (planes[d] * 100) + normal.y * 500}
            {normal.y * -(planes[d] * 100) + normal.x * 500}

            {normal.x * (planes[d] * 100) - normal.y * 500}
            {normal.y * -(planes[d] * 100) - normal.x * 500}"
            fill="none"
            stroke={defaultColors[di] ?? "red"}
            stroke-width="4"
            stroke-opacity="0.3"
            pointer-events="stroke"
        />
        <path
            onpointerdown={(evt) => {
                if (evt.isPrimary) {
                    evt.preventDefault();
                    evt.currentTarget.setPointerCapture(evt.pointerId);

                    const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));
                    evt.currentTarget._offset =
                        dot(scale(1 / 100, pos), norm(normal)) - planes[d];
                }
            }}
            onpointermove={(evt) => {
                if (evt.currentTarget.hasPointerCapture(evt.pointerId)) {
                    evt.preventDefault();
                    const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));

                    planes[d] = Math.min(
                        5,
                        Math.max(
                            -0,
                            dot(norm(normal), scale(1 / 100, pos)) -
                                evt.currentTarget._offset,
                        ),
                    );
                }
            }}
            role="button"
            tabindex="-1"
            onkeypress={(evt) => {
                evt.preventDefault();
            }}
            class={[cls, "touch-point"]}
            cursor="move"
            d="M
        {normal.x * (planes[d] * 100 + 20 * (Math.sign(planes[d]) || 1)) +
                normal.y * 500}
        {normal.y * -(planes[d] * 100 + 20 * (Math.sign(planes[d]) || 1)) +
                normal.x * 500}
        {normal.x * (planes[d] * 100 + 20 * (Math.sign(planes[d]) || 1)) -
                normal.y * 500}
        {normal.y * -(planes[d] * 100 + 20 * (Math.sign(planes[d]) || 1)) -
                normal.x * 500}"
            fill="none"
            stroke={defaultColors[di] ?? "red"}
            stroke-width="40"
            stroke-opacity="0.1"
            pointer-events="stroke"
        />
    {/each}
    {#if int}
        <circle
            cx={int.x * 100}
            cy={-int.y * 100}
            r="5"
            stroke="black"
            fill="white"
            stroke-width="4"
        ></circle>
        <circle
            r="20"
            fill="black"
            opacity="0.2"
            cx={int.x * 100}
            cy={-int.y * 100}
            pointer-events="all"
            onpointerdown={(evt) => {
                if (evt.isPrimary) {
                    evt.preventDefault();
                    evt.currentTarget.setPointerCapture(evt.pointerId);

                    const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));
                    evt.currentTarget._offset = subtract(pos, scale(100, int));
                }
            }}
            onpointermove={(evt) => {
                if (evt.currentTarget.hasPointerCapture(evt.pointerId)) {
                    evt.preventDefault();
                    const pos = subtract(
                        reflect({ x: 1, y: 0 }, evtToSvg(evt)),
                        evt.currentTarget._offset,
                    );
                    const clamped = scale(Math.min(len(pos), 500), norm(pos));

                    let d1 = dot(normalA, clamped);
                    let d2 = dot(normalB, clamped);

                    if (d1 < 0) {
                        planes.normal.x *= -1;
                        planes.normal.y *= -1;
                        d1 *= -1;
                        d2 *= -1;
                    }

                    planes.distanceA = d1 / 100;
                    planes.distanceB = d2 / 100;
                }
            }}
            role="button"
            tabindex="-1"
            onkeypress={(evt) => {
                evt.preventDefault();
            }}
        ></circle>
    {/if}
    {#if det(normalA, normalB) == 0}
        {@render ctrl(planes.normal, defaultColors[0], "", 1, defaultColors)}
        {@render vec(normalA, defaultColors[0] ?? "red", null, defaultColors)}
    {:else}
        {@render ctrl(planes.normal, defaultColors[0], "", 1)}
        {@render vec(normalA, defaultColors[0] ?? "red", null)}
    {/if}
    {#if ts[0]}
        {@render vec(
            scale(Math.sign(planes.distanceB), normalB),
            defaultColors[1] ?? "red",
        )}
    {/if}
{/snippet}
{#snippet pln(plane, defaultColor, cls = null)}
    {@const normal = norm(plane.normal)}
    <path
        role="button"
        tabindex="-1"
        onkeypress={(evt) => {
            evt.preventDefault();
        }}
        class={[cls, "touch-point"]}
        cursor="move"
        d="M{normal.x * (plane.distance * 100) + normal.y * 500}
            {normal.y * -(plane.distance * 100) + normal.x * 500}

            {normal.x * (plane.distance * 100) - normal.y * 500}
            {normal.y * -(plane.distance * 100) - normal.x * 500}"
        fill="none"
        stroke={defaultColor ?? "red"}
        stroke-width="4"
        stroke-opacity="0.8"
        pointer-events="stroke"
    />
{/snippet}

{#snippet labelPlane(
    plane,
    t,
    defaultColor,
    cls,
    autofit = 1,
    autoalign = true,
)}
    {@const normal = norm(plane.normal)}
    {@const off = scale(plane.distance, normal)}
    {@const v = add(normal, { x: plane.distance, y: 0 })}
    <text
        x={normal.x * (plane.distance * 100) - normal.y * 400}
        y={normal.y * -(plane.distance * 100) - normal.x * 400}
        text-anchor={["start", "middle", "end"][
            1 - Math.sign(v.x) * (autoalign ? 1 : 0)
        ]}
        transform="translate(0 {-30 * Math.sign(v.y) * autofit})"
        class={[cls, "label"]}
        fill={"white"}
        stroke={defaultColor ?? v.color ?? "red"}
        stroke-opacity="0.2"
        stroke-width="6"
        pointer-events="stroke">{t}</text
    >
    <text
        text-anchor={["start", "middle", "end"][
            1 - Math.sign(v.x) * (autoalign ? 1 : 0)
        ]}
        transform="translate(0 {-30 * Math.sign(v.y) * autofit})"
        class={[cls, "label"]}
        x={normal.x * (plane.distance * 100) - normal.y * 400}
        y={normal.y * -(plane.distance * 100) - normal.x * 400}
        fill={defaultColor ?? v.color ?? "red"}
    >
        {t}
    </text>
{/snippet}

{#snippet arcctrl(u, v, defaultColor = null, cls = null)}
    {@const rad = Math.min(len(u), len(v)) * 0.8}
    {@const un = norm(u)}
    {@const vn = norm(v)}
    <path
        class={[cls, "vector"]}
        fill-opacity="0.3"
        vector-effect="non-scaling-stroke"
        d="M 0 0 L {un.x * 100 * rad}, {un.y * -100 * rad} A {rad * 100} {rad *
            100} 0 {det(v, u) > 0 ? 1 : 0} 0 {vn.x * 100 * rad}, {vn.y *
            rad *
            -100} z"
        pointer-events="all"
        cursor="move"
        fill={defaultColor ?? v.color ?? "red"}
        onpointerdown={(evt) => {
            if (evt.isPrimary) {
                evt.preventDefault();
                evt.stopPropagation();
                evt.currentTarget.setPointerCapture(evt.pointerId);
                const pos = evtToSvg(evt);
                evt.currentTarget._offset = pos;
            }
        }}
        onpointermove={(evt) => {
            if (evt.currentTarget.hasPointerCapture(evt.pointerId)) {
                evt.preventDefault();
                const pos = evtToSvg(evt);
                const newV = rotateHalf(pos, evt.currentTarget._offset, v);
                const newU = rotateHalf(pos, evt.currentTarget._offset, u);

                v.x = newV.x;
                v.y = newV.y;
                u.x = newU.x;
                u.y = newU.y;
                evt.currentTarget._offset = pos;
            }
        }}
        role="button"
        tabindex="-1"
        onkeypress={(evt) => {
            evt.preventDefault();
        }}
    />
{/snippet}

{#snippet chiral(p, color = "red", trans = "")}
    <g
        pointer-events="none"
        opacity="0.4"
        transform="translate({p.x * 100}, {p.y * -100}) {trans}"
    >
        <text
            text-anchor="middle"
            x={0}
            y={0}
            transform="translate(0 110)"
            font-size={300}
            stroke={color}
            stroke-opacity="0.5"
            stroke-width="20"
            fill="#fff">F</text
        ><text
            text-anchor="middle"
            x={0}
            y={0}
            transform="translate(0 110)"
            font-size={300}
            stroke="none"
            stroke-width="0"
            fill="#fff">F</text
        >
    </g>
{/snippet}

{#snippet textLabel(long, short, type)}
    <code class="color-label" style:--color={colors[type]}> {short}</code>
{/snippet}

{#snippet colorPicker(long, short, type)}
    <label class="color-label-picker" style:--color={colors[type]}>
        <input class="minipicker" type="color" bind:value={colors[type]} />
        <code class="color-label" style:--color={colors[type]}>
            {long}</code
        ></label
    >
{/snippet}

<svelte:head>
    <title>Rotation via Double Reflection</title>
</svelte:head>

<header>
    <h1>
        <img src={favicon} alt="Icon" width="100" height="100" />
        Rotation via Double Reflection
    </h1>
    <p>
        This is a demonstration how any rotation can be composed of two
        successive reflections.
    </p>
    <h2>Reflecting at a vector</h2>
    <p>
        The simplest way of a reflection is reflecting one vector at another
        vector.
    </p>
    <p>
        A reflection of {@render textLabel(
            "subject",
            "subject vector (s)",
            "subject",
        )} at a
        {@render textLabel("first reflector", "reflector vector (u)", "first")} is
        achieved by first projecting
        {@render textLabel("subject", "s", "subject")}
        onto {@render textLabel("first reflector", "u", "first")} and then adding
        the difference between
        {@render textLabel("subject", "s", "subject")} and the projection.
    </p>
    <p>
        A reflection of vector {@render textLabel("subject", "s", "subject")} at a
        {@render textLabel("first reflector", "first reflector (u)", "first")}
        followed by a reflection at a {@render textLabel(
            "second reflector",
            "second reflector (v)",
            "second",
        )} results in a rotation of {@render textLabel(
            "subject",
            "s",
            "subject",
        )} in the plane spanned by the reflectors
        {@render textLabel("first reflector", "u", "first")}
        and
        {@render textLabel("second reflector", "v", "second")}.
    </p>
    <p>
        The angle of the rotation is twice as large as the angle between {@render textLabel(
            "first reflector",
            "u",
            "first",
        )}
        and
        {@render textLabel("second reflector", "v", "second")}.
    </p>
    <p>
        In general to construct a rotation of angle
        {@render textLabel("angle", "α", "angle")}
        you just need to construct two reflectors that enclose an angle
        {@render textLabel("half angle", "α/2", "angle")} and apply the reflections
        successively.
    </p>

    <p>
        The pair of reflectors {@render textLabel(
            "first reflector",
            "u",
            "first",
        )} and
        {@render textLabel("second reflector", "v", "second")}
        is called a rotor.
    </p>
    <p>
        Notice that only the relative orientation between
        {@render textLabel("first reflector", "u", "first")}
        and {@render textLabel("second reflector", "v", "second")}
        affect the rotation result. Try drag the arc segment
        {@render textLabel("rotor", "r", "rotor")} below to change the direction of
        both reflectors at once.
    </p>
</header>
<div class="options">
    <fieldset>
        <legend>Options</legend>
        <label>
            <input type="checkbox" bind:checked={showChiral} />
            Show chiral figures
        </label>
    </fieldset>
    <fieldset>
        <legend>Customize Colors</legend>

        <div class="picker-row">
            {@render colorPicker("Subject", "s", "subject")}
            {@render colorPicker("First Reflector", "u", "first")}
            {@render colorPicker("Second Reflector", "v", "second")}
            {@render colorPicker("Reflected", "q", "reflected")}
            {@render colorPicker("Rotated", "t", "rotated")}
            {@render colorPicker("Rotor", "r", "rotor")}
        </div>
    </fieldset>
</div>

<div class="grid">
    <figure class="grid-item">
        <figcaption>
            The {@render textLabel("subject", "Subject (s)", "subject")} together
            with the pair ({@render textLabel(
                "first reflector",
                "First reflector (u)",
                "first",
            )},
            {@render textLabel(
                "second reflector",
                "second reflector (v)",
                "second",
            )}) of reflection vectors of the
            {@render textLabel("rotor", "rotor (r)", "rotor")}.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@render chiral(subject, colors.subject)}
            {/if}

            {@render axis()}
            {@render vec(subject, colors.subject)}

            {@render vec(rotor.from, colors.first)}
            {@render vec(rotor.to, colors.second)}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(rotor.from, "First Reflector (u)", colors.first)}
            {@render label(rotor.to, "Second Reflector (v)", colors.second)}

            {@render arc(rotor.from, rotor.to, colors.rotor)}
            {@render arclabel(rotor.from, rotor.to, "rotor r", colors.rotor)}

            {@render arcctrl(rotor.from, rotor.to, "none")}
            {@render ctrl(subject, colors.subject)}
            {@render ctrl(rotor.from, colors.first)}
            {@render ctrl(rotor.to, colors.second)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            The {@render textLabel("subject", "Subject (s)", "subject")} is decomposed
            into the component
            {@render textLabel("projected", "projected (p)", "projected")} onto
            {@render textLabel(
                "first reflector",
                "first reflector (u)",
                "first",
            )} and the
            <code
                style="text-decoration: underline; text-decoration-style: dashed; background-color: #888;"
                >orthogonal component</code
            >. The {@render textLabel("reflected", "reflected", "reflected")} vector
            is recomposed from those components.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@render chiral(subject, colors.subject)}
                {@render chiral(
                    reflected,
                    colors.reflected,
                    reflectionMatrix({ x: reflector.x, y: -reflector.y }),
                )}
            {/if}
            {@render axis()}
            {@render line(subject, projected, "black", "dashed faded")}
            {@render line(projected, reflected, "black", "dashed faded")}

            {@render vec(subject, colors.subject)}
            {@render vec(reflector, colors.first)}
            {@render vec(reflected, colors.reflected)}
            {@render vec(projected, colors.projected, "thick")}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(reflector, "First Reflector (u)", colors.first)}
            {@render label(projected, "Projected (p)", colors.projected)}
            {@render label(reflected, "Reflected (q)", colors.reflected)}

            {@render ctrl(subject, colors.subject)}
            {@render ctrl(reflector, colors.first)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            The {@render textLabel(
                "first reflection",
                "first reflection (q)",
                "reflected",
            )}
            is then reflected again. This time it is
            {@render textLabel("projected", "projected (o)", "projected2")}
            onto the
            {@render textLabel(
                "second reflector",
                "second reflector (v)",
                "second",
            )}. The result is the
            {@render textLabel("rotated", "rotated", "rotated")} vector.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@render chiral(
                    reflected,
                    colors.reflected,
                    reflectionMatrix({ x: reflector.x, y: -reflector.y }),
                )}
                {@render chiral(
                    rotated,
                    colors.rotated,
                    `${reflectionMatrix({ x: rotor.to.x, y: -rotor.to.y })} ${reflectionMatrix({ x: rotor.from.x, y: -rotor.from.y })}`,
                )}
            {/if}
            {@render axis()}
            {@render line(reflected, projected2, "black", "dashed faded")}
            {@render line(projected2, rotated, "black", "dashed faded")}
            {@render vec(subject, colors.subject)}

            {@render vec(rotor.to, colors.second)}
            {@render vec(reflected, colors.reflected)}
            {@render vec(rotated, colors.rotated)}
            {@render vec(projected2, colors.projected2, "thick")}

            {@render arc(subject, rotated, colors.rotor)}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(rotor.to, "Second Reflector (v)", colors.second)}
            {@render label(projected2, "Projected (o)", colors.projected2)}
            {@render label(rotated, "Rotated (t)", colors.rotated)}
            {@render label(reflected, "First Reflection (q)", colors.reflected)}

            {@render arcctrl(subject, rotated, "none")}
            {@render ctrl(subject, colors.subject)}
            {@render ctrl(rotor.to, colors.second)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            <p>
                Drawing the angles between the interim results shows that the
                angle between {@render textLabel(
                    "subject",
                    "Subject (s)",
                    "subject",
                )} and
                {@render textLabel("rotated", "Rotated t", "rotated")} is the sum
                of two angles.
            </p>
            <p>
                The {@render textLabel(
                    "first angle",
                    "first angle (β)",
                    "angle_a",
                )} is twice the difference between
                {@render textLabel("subject", "Subject s", "subject")}
                and {@render textLabel(
                    "First reflector",
                    "First reflector (u)",
                    "first",
                )}. The {@render textLabel(
                    "second angle",
                    "second angle (γ)",
                    "angle_b",
                )} is twice the angle between the
                {@render textLabel(
                    "First reflection",
                    "First reflection (q)",
                    "reflected",
                )}
                and the
                {@render textLabel(
                    "rotated result",
                    "Rotated result (t)",
                    "rotated",
                )} result.
            </p>
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}

            {#if showChiral}
                {@render chiral(subject, colors.subject)}
                {@render chiral(
                    reflected,
                    colors.reflected,
                    reflectionMatrix({ x: reflector.x, y: -reflector.y }),
                )}
                {@render chiral(
                    rotated,
                    colors.rotated,
                    `${reflectionMatrix({ x: rotor.to.x, y: -rotor.to.y })} ${reflectionMatrix({ x: rotor.from.x, y: -rotor.from.y })}`,
                )}
            {/if}

            {@render vec(subject, colors.subject)}
            {@render vec(reflector, colors.first)}
            {@render vec(scale(-1, reflector), colors.first, "dashed nodir")}
            {@render vec(reflected, colors.reflected)}

            {@render vec(rotated, colors.rotated)}
            {@render vec(rotor.to, colors.second)}
            {@render vec(scale(-1, rotor.to), colors.second, "dashed nodir")}

            {#if arcDirection(subject, reflected, rotated)}
                {@render arc(subject, reflected, colors.angle_a)}
                {@render arc(reflected, rotated, colors.angle_b)}
            {:else}
                {@render arc(rotated, reflected, colors.angle_b)}
                {@render arc(reflected, subject, colors.angle_a)}
            {/if}

            {@render label(rotor.to, "Second Reflector (v)", colors.second)}
            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(reflector, "First Reflector (u)", colors.first)}
            {@render label(reflected, "First Reflection (q)", colors.reflected)}

            {@render label(rotated, "Rotated (t)", colors.rotated)}

            {@render ctrl(subject, colors.subject)}
            {@render ctrl(reflector, colors.first)}
            {@render ctrl(reflector2, colors.second)}
        </svg>
    </figure>
</div>
<section>
    <h2>Implementation</h2>
    <p>
        Take a look at the implementation below. No trigonometric use of <code
            >sin</code
        >
        or <code>cos</code> is needed to perform the rotations.
    </p>
    <p>
        Somestimes you may need to use trigonometric functions like <code
            >cos</code
        >
        or
        <code>sin</code> to construct the reflectors themself in the first
        place. But more often the <em>cause</em> of a rotation is already
        avaialble as pair of vectors. In many interactive application, like this
        one your are using right now, the input data are mouse coordintes
        encoded as <code>(x, y)</code> tuple. Instead of turning the movement of the
        mouse first into an angle, the rotor can be directly constructed.
    </p>
    <p>
        The construction of any transformation by only composing reflections
        sits at the core of <a href="https://bivector.net/" target="_blank"
            >Geometric Algebra</a
        >.
    </p>
</section>

<Highlight
    code={`
// dot ~ similarity in direction
const dot = (a, b) => a.x * b.x + a.y * b.y
// det ~ deviation in direction
const det = (u, v) =>  u.x * v.y - u.y * v.x

const len2 = (v) => dot(v,v)
const len = (v) => Math.sqrt(len2(v))

const scale = (s, v) => ({x: s * v.x, y: s * v.y})
const norm = (v) => scale(1 / len(v), v)

const add = (u, v) => ({x: u.x + v.x, y: u.y + v.y})
const subtract = (u, v) => add(u, scale(-1, v))

// projection ~ component pointing into the same direction
const project = (t, s) => scale(dot(t, s) / len2(s), s)
// rejection ~ component pointing into the orthogonal direction
const reject = (t, s) => subtract(s, project(t, s))
// reflection ~ keeping the projection and reversing the rejection
const reflect = (r, s) => subtract(project(t, s), reject(t, s))

const rotate = (a, b, s) => reflect(b, reflect(a, s))

const rotateHalf = (a, b, s) => rotate(scale(0.5, add(a, b)), b, s)
        `.trim()}
/>

<section>
    <h2>3 Dimensions</h2>
    <p>The same approach also works for 3 dimensions.</p>
    <p>
        Below you can see the {@render textLabel(
            "subject",
            "Subject s",
            "subject",
        )} vector rotated in the <code>plane</code> spanned by the
        {@render textLabel("first reflector", "first reflector (u)", "first")}
        and
        {@render textLabel(
            "second reflector",
            "second reflector (u)",
            "second",
        )}.
    </p>
    <p>
        The reflection at the
        {@render textLabel("first reflector", "first reflector (u)", "first")}
        mirrors the {@render textLabel("subject", "Subject (s)", "subject")} onto
        {@render textLabel(
            "first reflection",
            "first reflection (q)",
            "reflected",
        )}
        on the opposite side of the <code>plane</code>. The subsequent
        reflection at the
        {@render textLabel(
            "second reflector",
            "second reflector (u)",
            "second",
        )} brings the vector back to the original side of the plane. So the orientation
        between the
        {@render textLabel("subject", "Subject (s)", "subject")} and the
        <code>rotation plane</code>
        is restored.
    </p>
    <p>
        During this zic-zac motion across the plane the vector still rotates <em
            >along</em
        > the plane in the exact same way as in the 2-dimensional case before.
    </p>
</section>

<div class="grid" style:background="none">
    <figure class="grid-item">
        <Scene {colors}></Scene>
    </figure>
</div>
<section>
    <h2>Higher dimesions</h2>
    <p>
        You might now think that is works for any higher number of dimensions.
        To actually make this work, we first need to refine our definition of
        what a reflection actually is.
    </p>
    <p>
        By reflection, we usually mean moving a subject to the opposite side of
        a reflector while preserving the same distance between subject and
        reflector.
    </p>
    <p>
        In two dimensions, a vector can serve as a reflector: It defines a line
        through the origin and that line divides the space into two sides. There
        is therefore an unambiguous <em>opposite side</em>.
    </p>
    <p>
        In three dimensions, however, a single vector does not define a
        reflector in the same way. It does not devide the space into two side.
        Which side is opposite to a given vector depends on the orientation we
        look at it.
    </p>
    <p>
        In three dimensions this ambiguity still disappears if we compose two
        reflections: The ambiguity does not affect the resulting rotation. This
        is why the 3d example before did still work out.
    </p>
    <p>
        But if we want to define a single reflector itself in an arbitrary
        number of dimensions, we need another kind of geometric object that
        uniquely divides the space into two sides. What we need is a plane -
        more precisely, a hyperplane in higher dimensions.
    </p>
    <p>
        A flat plane always divides space into exactly two regions. It therefore
        gives us a well-defined notion of <em>one side and the opposite side</em
        >. This is exactly the property we need for a reflection.
    </p>
    <p>
        A simple way to define such a plane is by a normal vector and a
        distance. The normal vector determines the direction perpendicular to
        the plane, while the distance determines how far the plane is from the
        origin along that direction.
    </p>
    <h2>Reflecting at a plane</h2>
    <p>
        We will rebuild our construction from above but using planes instead of
        vectors. This will lead us to a solution that works for constructing
        rotations in any number of dimensions.
    </p>
    <p>
        Notice that difference in orientation: Before we projected the {@render textLabel(
            "subject",
            "subject (s)",
            "subject",
        )}
        <em>onto</em> the reflector vector itself. Now using a {@render textLabel(
            "plane",
            "plane",
            "plane",
        )} as reflector the planes normal vector is perpendicular to the reflectors
        surfaces.
    </p>
</section>
<div class="grid">
    <figure class="grid-item">
        <figcaption>
            The {@render textLabel("plane", "plane (p)", "plane")} is determined by
            its normal vector and a <code>distance </code> from the origin. It devides
            the space into inside and outside.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}

            {@render labelPlane(plane0, "plane (p)", colors.plane)}
            {@render label(plane0.normal, "Normal", colors.plane)}
            <text
                opacity="0.4"
                x={plane0.normal.x * (3.5 + plane0.distance / 2) * 100}
                y={-plane0.normal.y * (3.5 + plane0.distance / 2) * 100}
            >
                Outside
            </text>
            <text
                opacity="0.4"
                x={-plane0.normal.x * (3.5 - plane0.distance / 2) * 100}
                y={plane0.normal.y * (3.5 - plane0.distance / 2) * 100}
            >
                Inside
            </text>

            {@render ctrlPlane(plane0, colors.plane)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            A {@render textLabel("subject", "subject (s)", "subject")} can be {@render textLabel(
                "reflected",
                "reflected (r)",
                "single",
            )} at the plane {@render textLabel("plane", "plane (p)", "plane")} by
            taking the component that points into the planes normal direction and
            adding it twice to the subject.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}

            {@render labelPlane(plane0, "Plane (p)", colors.plane)}

            {@render vec(subject, colors.subject)}
            {@render vec(plane0Reflected, colors.single)}
            {@render line(
                subject,
                plane0Projected,
                colors.plane,
                "dashed faded",
            )}
            {@render line(
                plane0Projected,
                plane0Reflected,
                colors.plane,
                "dashed faded",
            )}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(plane0Reflected, "Reflected (r)", colors.single)}

            {@render ctrlPlane(plane0, colors.plane)}

            {@render ctrl(subject, colors.subject)}
        </svg>
    </figure>
</div>
<section>
    <h2>Implementation</h2>
    <p>
        The implementaion is similar simple as before. The <code>dot</code>
        product between vector and normal is be used to determinate the perpendicular
        distance between vector and plane. The normal scaled by this distance gives
        the component of the vector thats perpendicular to the plane (<code
            >reject</code
        >). For the reflection the original vector is subtraced from twice the
        perpendicular component. Subtracting only once projects the vector onto
        the plane.
    </p>
    <Highlight
        code={`
// rejection ~ component pointing away from the plane
const planeReject = (subject, plane) => {
  const dist = dot(subject, plane.normal) - plane.distance;
  return scale(dist, plane.normal);
}

// projection ~ component inside the plane
const planeProject = (subject, plane) =>
  subtract(subject, planeReject(subject, plane))

// reflection ~ keeping the projection and reversing the rejection
const planeReflect = (subject, plane) =>
  subtract(planeProject(subject, plane), planeReject(subject, plane))
`}
    />
</section>
<section>
    <h2>Rotation with two planes</h2>

    <p>
        We can now use two planes as reflectors to compose a rotation from two
        reflections. It works almost the same as before, except that by moving
        the planes away from the origin we can even choose the {@render textLabel(
            "pivot",
            "pivot (p)",
            "pivot",
        )} of the rotation. Try to drag the pivot around.
    </p>
</section>

<div class="options">
    <fieldset>
        <legend>Options</legend>
        <label>
            <input type="checkbox" bind:checked={showChiral} />
            Show chiral figures
        </label>
    </fieldset>
    <fieldset>
        <legend>Customize Colors</legend>

        <div class="picker-row">
            {@render colorPicker("Subject", "s", "subject")}
            {@render colorPicker("First Reflector", "u", "first")}
            {@render colorPicker("Second Reflector", "v", "second")}
            {@render colorPicker("Reflected", "q", "reflected")}
            {@render colorPicker("Rotated", "t", "rotated")}
        </div>
    </fieldset>
</div>
<div class="grid">
    <figure class="grid-item">
        <figcaption>
            The {@render textLabel(
                "first reflector",
                "First reflector plane (u)",
                "first",
            )} and the {@render textLabel(
                "second reflector",
                "second reflector plane (v)",
                "second",
            )} can again be composed into a rotor. The intersection point of both
            planes will determine the {@render textLabel(
                "pivot point",
                "pivot (p)",
                "pivot",
            )}
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@render chiral(subject, colors.subject)}
            {/if}

            {@render axis()}
            {@render vec(subject, colors.subject)}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render labelPlane(plane, "First reflector (u)", colors.first)}
            {@render labelPlane(plane2, "Second reflector (v)", colors.second)}

            {@render ctrlPlane(plane, colors.first)}
            {@render ctrlPlane(plane2, colors.second)}
            {#if planeInter && len(planeInter) <= 6}
                <circle
                    cx={planeInter.x * 100}
                    cy={-planeInter.y * 100}
                    r="5"
                    stroke="black"
                    fill="white"
                    stroke-width="4"
                ></circle>

                {@render label(
                    planeInter,
                    "Pivot (p)",
                    colors.pivot,
                    ["pivot-label"],
                    0,
                    "start",
                )}

                {@render ctrlPivot(plane, plane2)}
            {/if}
            {@render ctrl(subject, colors.subject)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            The {@render textLabel("subject", "Subject (s)", "subject")} is again
            decomposed into the component
            {@render textLabel("projected", "projected (p)", "projected")} onto
            {@render textLabel(
                "first reflector",
                "first reflector (u)",
                "first",
            )} and the
            <code
                style="text-decoration: underline; text-decoration-style: dashed; background-color: #888;"
                >orthogonal component</code
            >. The {@render textLabel("reflected", "reflected", "reflected")} vector
            is recomposed from those components.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@render chiral(subject, colors.subject)}
                <g>
                    {@render chiral(
                        planeReflected,
                        colors.reflected,
                        reflectionPlaneMatrix(plane),
                    )}</g
                >
            {/if}

            {@render axis()}
            {@render vec(subject, colors.subject)}
            {@render vec(planeReflected, colors.reflected)}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(planeReflected, "Reflected (q)", colors.reflected)}

            {@render labelPlane(plane, "First reflector (u)", colors.first)}
            {@render line(subject, planeProjected, "#888", "dashed faded")}
            {@render line(
                planeProjected,
                planeReflected,
                "#888",
                "dashed faded",
            )}

            {@render ctrlPlane(plane, colors.first)}
            {@render ctrl(subject, colors.subject)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            The {@render textLabel(
                "first reflection",
                "first reflection (q)",
                "reflected",
            )}
            is then reflected again. The result is the
            {@render textLabel("rotated", "rotated", "rotated")} vector.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@render chiral(subject, colors.subject)}
                <g>
                    {@render chiral(
                        planeReflected,
                        colors.reflected,
                        reflectionPlaneMatrix(plane),
                    )}</g
                >
                <g>
                    {@render chiral(
                        planeRotated,
                        colors.rotated,
                        `${reflectionPlaneMatrix(plane2)} ${reflectionPlaneMatrix(plane)}`,
                    )}</g
                >
            {/if}

            {@render axis()}
            {@render vec(subject, colors.subject)}
            {@render vec(planeReflected, colors.reflected)}
            {@render vec(planeRotated, colors.rotated)}
            {@render line(
                planeReflected,
                planeProjected2,
                "#888",
                "dashed faded",
            )}
            {@render line(
                planeProjected2,
                planeRotated,
                "#888",
                "dashed faded",
            )}

            {@render labelPlane(plane2, "Second reflector (v)", colors.second)}
            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(
                planeReflected,
                "First reflection (q)",
                colors.reflected,
            )}
            {@render label(planeRotated, "Rotated (t)", colors.rotated)}

            {@render ctrlPlane(plane2, colors.second)}
            {@render ctrl(subject, colors.subject)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            <p>
                Angle between {@render textLabel(
                    "subject",
                    "subject (s)",
                    "subject",
                )} the {@render textLabel(
                    "rotated",
                    "rotated result (t)",
                    "rotated",
                )}, measured at the {@render textLabel(
                    "pivot",
                    "pivot (p)",
                    "pivot",
                )}, can be seen to be twice the angle between the two reflector
                planes.
            </p>
            <p>
                If the {@render textLabel("pivot", "pivot (p)", "pivot")} is not at
                the origin the dashed lines highlight the actual angles to look at.
            </p>
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@render chiral(subject, colors.subject)}
                <g>
                    {@render chiral(
                        planeReflected,
                        colors.reflected,
                        reflectionPlaneMatrix(plane),
                    )}</g
                >
                <g>
                    {@render chiral(
                        planeRotated,
                        colors.rotated,
                        `${reflectionPlaneMatrix(plane2)} ${reflectionPlaneMatrix(plane)}`,
                    )}</g
                >
            {/if}

            {@render axis()}
            {@render vec(subject, colors.subject)}
            {@render pln(plane, colors.first)}
            {@render pln(plane2, colors.second)}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render line(planeInter, subject, colors.subject, "dashed nodir")}
            {@render line(
                planeInter,
                planeRotated,
                colors.rotated,
                "dashed nodir",
            )}
            {@render line(
                planeInter,
                planeReflected,
                colors.reflected,
                "dashed nodir",
            )}

            {@render vec(subject, colors.subject)}
            {@render vec(planeReflected, colors.reflected)}
            <g
                transform="translate({planeInter.x * 100}, {planeInter.y *
                    -100})"
            >
                {#if arcDirection(subtract(subject, planeInter), subtract(planeReflected, planeInter), subtract(planeRotated, planeInter))}
                    {@render arc(
                        subtract(subject, planeInter),
                        subtract(planeReflected, planeInter),
                        colors.angle_a,
                    )}
                    {@render arc(
                        subtract(planeReflected, planeInter),
                        subtract(planeRotated, planeInter),
                        colors.angle_b,
                    )}
                {:else}
                    {@render arc(
                        subtract(planeRotated, planeInter),
                        subtract(planeReflected, planeInter),
                        colors.angle_b,
                    )}
                    {@render arc(
                        subtract(planeReflected, planeInter),
                        subtract(subject, planeInter),
                        colors.angle_a,
                    )}
                {/if}</g
            >
            {@render labelPlane(plane, "First reflector (u)", colors.first)}
            {@render labelPlane(plane2, "Second reflector (v)", colors.second)}
            {@render vec(planeRotated, colors.rotated)}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(
                planeReflected,
                "First reflection (q)",
                colors.reflected,
            )}
            {@render label(planeRotated, "Rotated (t)", colors.rotated)}

            {#if planeInter && len(planeInter) <= 6}
                <circle
                    cx={planeInter.x * 100}
                    cy={-planeInter.y * 100}
                    r="5"
                    stroke="black"
                    fill="white"
                    stroke-width="4"
                ></circle>
                {@render label(
                    planeInter,
                    "Pivot (p)",
                    colors.pivot,
                    ["pivot-label"],
                    0,
                    "start",
                )}

                {@render ctrlPivot(plane, plane2)}
            {/if}

            {@render ctrl(subject, colors.subject)}
        </svg>
    </figure>
</div>
<section>
    <h2>Point Reflections and Translations</h2>
    <p>
        Notice what happens if the two reflectors are oriented either
        perpendicular or parallel to each other.
    </p>
</section>
<div class="grid">
    <figure class="grid-item">
        <figcaption>
            If the two reflectors are orthogonal the composed reflection is a
            point reflection. With the angle between the reflectors being 90°
            this corresponds two a 180° rotation.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@const refl = planeReflect(subject, {
                    normal: planesOrtho.normal,
                    distance: planesOrtho.distanceA,
                })}
                {@render chiral(subject, colors.subject)}
                {@render chiral(
                    refl,
                    colors.reflected,
                    `${reflectionPlaneMatrix({
                        normal: planesOrtho.normal,
                        distance: planesOrtho.distanceA,
                    })}`,
                )}
                {@render chiral(
                    planeReflect(
                        planeReflect(subject, {
                            normal: planesOrtho.normal,
                            distance: planesOrtho.distanceA,
                        }),
                        {
                            normal: {
                                x: -planesOrtho.normal.y,
                                y: planesOrtho.normal.x,
                            },
                            distance: planesOrtho.distanceB,
                        },
                    ),
                    colors.rotated,
                    `${reflectionPlaneMatrix({
                        normal: {
                            x: -planesOrtho.normal.y,
                            y: planesOrtho.normal.x,
                        },
                        distance: planesOrtho.distanceB,
                    })} ${reflectionPlaneMatrix({
                        normal: planesOrtho.normal,
                        distance: planesOrtho.distanceA,
                    })}`,
                )}
            {/if}

            {@render axis()}
            {@render vec(subject, colors.subject)}
            {@render vec(
                planeReflect(subject, {
                    normal: planesOrtho.normal,
                    distance: planesOrtho.distanceA,
                }),
                colors.reflected,
            )}
            {@render vec(
                planeReflect(
                    planeReflect(subject, {
                        normal: planesOrtho.normal,
                        distance: planesOrtho.distanceA,
                    }),
                    {
                        normal: {
                            x: -planesOrtho.normal.y,
                            y: planesOrtho.normal.x,
                        },
                        distance: planesOrtho.distanceB,
                    },
                ),
                colors.rotated,
            )}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(
                planeReflect(subject, {
                    normal: planesOrtho.normal,
                    distance: planesOrtho.distanceA,
                }),
                "First reflection (q)",
                colors.reflected,
            )}
            {@render label(
                planeReflect(
                    planeReflect(subject, {
                        normal: planesOrtho.normal,
                        distance: planesOrtho.distanceA,
                    }),
                    {
                        normal: {
                            x: -planesOrtho.normal.y,
                            y: planesOrtho.normal.x,
                        },
                        distance: planesOrtho.distanceB,
                    },
                ),
                "Reflected twice (t)",
                colors.rotated,
            )}
            {@render ctrlPlanes(
                planesOrtho,
                [colors.first, colors.second],
                [
                    [1, 0, 0, 1],
                    [0, -1, 1, 0],
                ],
            )}
            {@render ctrl(subject, colors.subject)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            If the two reflectors are parallel the composed reflection is a
            translation. The total <span
                style="text-decoration: underline; text-decoration-style: dotted;"
                >distance of the translation</span
            >
            is <em>twice</em> the
            <span
                style="text-decoration: underline; text-decoration-style: dashed;"
                >distance between the reflectors</span
            >.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@render chiral(subject, colors.subject)}
                {@render chiral(
                    planeReflect(subject, {
                        normal: planesParallel.normal,
                        distance: planesParallel.distanceA,
                    }),
                    colors.reflected,
                    `${reflectionPlaneMatrix({
                        normal: planesParallel.normal,
                        distance: planesParallel.distanceA,
                    })}`,
                )}
                {@render chiral(
                    add(
                        subject,
                        scale(
                            -planesParallel.distanceA * 2 +
                                2 * planesParallel.distanceB,
                            planesParallel.normal,
                        ),
                    ),
                    colors.rotated,
                )}
            {/if}

            {@render axis()}
            {@render vec(subject, colors.subject)}
            {@render vec(
                planeReflect(subject, {
                    normal: planesParallel.normal,
                    distance: planesParallel.distanceA,
                }),
                colors.reflected,
            )}
            {@render vec(
                planeReflect(
                    planeReflect(subject, {
                        normal: planesParallel.normal,
                        distance: planesParallel.distanceA,
                    }),
                    {
                        normal: planesParallel.normal,
                        distance: planesParallel.distanceB,
                    },
                ),
                colors.rotated,
            )}

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(
                planeReflect(subject, {
                    normal: planesParallel.normal,
                    distance: planesParallel.distanceA,
                }),
                "First reflection (q)",
                colors.reflected,
            )}
            {@render label(
                planeReflect(
                    planeReflect(subject, {
                        normal: planesParallel.normal,
                        distance: planesParallel.distanceA,
                    }),
                    {
                        normal: planesParallel.normal,
                        distance: planesParallel.distanceB,
                    },
                ),
                "Reflected twice (t)",
                colors.rotated,
            )}
            {@render line(
                subject,
                planeReflect(
                    planeReflect(subject, {
                        normal: planesParallel.normal,
                        distance: planesParallel.distanceA,
                    }),
                    {
                        normal: planesParallel.normal,
                        distance: planesParallel.distanceB,
                    },
                ),
                "black",
                "dotted faded nodir",
            )}
            {@render ctrlPlanes(planesParallel, [colors.first, colors.second])}

            {@render ctrl(subject, colors.subject)}
        </svg>
    </figure>
</div>
<section>
    <h2>3 Dimensions with planes</h2>
    <p>
        Now we can take another look at 3-dimensional reflections and rotations.
        Our reflectors are planes now. Below the planes are drawn as oriented
        squares lying inside the plane, cutting the space in two parts like a
        knife. The planes intersect each other in a line marked as rotor axis.
    </p>
    <p>
        Observe how the reflection on planes generalizes much better from 2d to
        3d, avoiding the zic-zac motion. This construction will now also work
        for higher dimensions. When turing the camera to look exactly into the
        direction of the rotor axis the scene will look like our 2d rotation
        from above.
    </p>
</section>

<div class="grid" style:background="none">
    <figure class="grid-item">
        <ScenePlanes {colors}></ScenePlanes>
    </figure>
</div>
<section>
    <h2>Circular Reflections</h2>
    <p>
        Instead of reflecting across a flat plane, we can also reflect with
        respect to curved objects. The most interesting example is the circular
        reflection. A circular reflection maps points inside the circle to the
        outside and points outside the circle to the inside, while preserving
        the direction from the circle's center to the reflected point. In other
        words, the reflected point always lies on the same ray originating at
        the circle's center; only its distance from the center changes.
    </p>
    <p>
        In this way a circle can be though of as generalization of a plane
        because it also devides the space into two sides: inside and outside.
    </p>
    <p>
        For a circle with radius a (<math
            xmlns="http://www.w3.org/1998/Math/MathML"
        >
            <mi>R</mi>
        </math>) at center
        <math xmlns="http://www.w3.org/1998/Math/MathML">
            (
            <msub>
                <mn>c</mn>
                <mi>x</mi>
            </msub>,
            <msub>
                <mn>c</mn>
                <mi>y</mi>
            </msub>
            )
        </math>, a subject point at distance (<math
            xmlns="http://www.w3.org/1998/Math/MathML"
        >
            <mi>r</mi>
        </math>) from the center is mapped to a point at distance
        <math xmlns="http://www.w3.org/1998/Math/MathML">
            <mfrac>
                <msup>
                    <mi>R</mi>
                    <mn>2</mn>
                </msup>
                <mi>r</mi>
            </mfrac>
        </math>.
    </p>

    <p>
        The propper name for this kind of reflection is <em>Circle Inversion</em
        >. If you imagine the circle with its center really far away and its
        radius really large you can think of its circumference acting as
        straight plane. In this way Circle Inversion is a generalization of a
        reflection on a plane.
    </p>
</section>
<div class="options">
    <fieldset>
        <legend>Options</legend>
        <label>
            <input type="checkbox" bind:checked={showChiral} />
            Show chiral figures
        </label>
    </fieldset>
    <fieldset>
        <legend>Customize Colors</legend>

        <div class="picker-row">
            {@render colorPicker("Subject", "s", "subject")}
            {@render colorPicker("First Circle", "u", "first")}
            {@render colorPicker("Second Circle", "v", "second")}
            {@render colorPicker("Reflected", "q", "reflected")}
            {@render colorPicker("Rotated", "t", "rotated")}
        </div>
    </fieldset>
</div>
<div class="grid">
    <figure class="grid-item">
        <figcaption>
            A {@render textLabel("subject", "Subject (s)", "subject")} outside the
            {@render textLabel(
                "first reflector",
                "reflector circle",
                "first reflector",
            )} gets
            {@render textLabel("reflected", "reflected", "reflected")}
            to the inside. A {@render textLabel(
                "subject",
                "Subject (s)",
                "subject",
            )} from the inside the {@render textLabel(
                "first reflector",
                "circle",
                "first reflector",
            )} get
            {@render textLabel("reflected", "reflected (q)", "reflected")} to the
            outside.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}

            {#if showChiral}
                <g pointer-events="none" opacity="0.4">
                    {#each fGrid as { x, y }}
                        {@const dot = {
                            x: subject.x + (x - gridSize) / 4,
                            y: subject.y - (y - gridSize) / 4,
                        }}
                        <circle
                            text-anchor="middle"
                            cx={dot.x * 100}
                            cy={-dot.y * 100}
                            r="4"
                            font-size={300}
                            stroke={"none"}
                            stroke-opacity="0.7"
                            stroke-width="20"
                            fill={colors.subject}
                        />
                        >
                    {/each}
                </g>
                <g pointer-events="none" opacity="0.4">
                    {#each fGrid as { x, y }}
                        {@const dot = {
                            x: subject.x + (x - gridSize) / 4,
                            y: subject.y - (y - gridSize) / 4,
                        }}
                        {@const dotCircledReflected = circleReflect(
                            circle,
                            dot,
                        )}
                        <circle
                            text-anchor="middle"
                            cx={dotCircledReflected.x * 100}
                            cy={-dotCircledReflected.y * 100}
                            r="4"
                            font-size={300}
                            stroke={"none"}
                            stroke-opacity="0.7"
                            stroke-width="20"
                            fill={colors.reflected}
                        />
                        >
                    {/each}
                </g>
            {/if}

            <circle
                cx={circle.center.x * 100}
                cy={-circle.center.y * 100}
                stroke={colors.first}
                fill="none"
                r={circle.radius * 100}
            ></circle>

            {@render line(
                circleProjected,
                circleReflected,
                colors.first,
                "dashed faded",
            )}
            {@render line(
                subject,
                circleProjected,
                colors.first,
                "dashed faded",
            )}
            {@render vec(subject, colors.subject)}
            {@render vec(circleReflected, colors.reflected)}

            {@render ctrl(subject, colors.subject)}
            <circle
                cx={circleReflected.x * 100}
                cy={-circleReflected.y * 100}
                fill={colors.reflected}
                r="10"
            ></circle>
            <circle
                cx={circleProjected.x * 100}
                cy={-circleProjected.y * 100}
                fill={colors.first}
                r="5"
            ></circle>

            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(circleReflected, "Reflected (q)", colors.reflected)}
            {@render label(
                circle.center,
                "Circular Reflector (u)",
                colors.first,
                "",
                circle.radius * 3,
                false,
            )}

            {@render ctrlRad(circle, colors.first)}
            {@render ctrl(circle.center, colors.first)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            A {@render textLabel("second circle", "second circle", "second")} can
            be used to on the {@render textLabel(
                "reflected",
                "result",
                "reflected",
            )} from the first reflection to
            {@render textLabel("rotated", "reflect", "rotated")}
            them again.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}
            {#if showChiral}
                <g pointer-events="none" opacity="0.4">
                    {#each fGrid as { x, y }}
                        {@const dot = {
                            x: subject.x + (x - gridSize) / 4,
                            y: subject.y - (y - gridSize) / 4,
                        }}
                        {@const dotCircledReflected = circleReflect(
                            circle,
                            dot,
                        )}
                        <circle
                            text-anchor="middle"
                            cx={dotCircledReflected.x * 100}
                            cy={-dotCircledReflected.y * 100}
                            r="4"
                            font-size={300}
                            stroke={"none"}
                            stroke-opacity="0.7"
                            stroke-width="20"
                            fill={colors.reflected}
                        />
                        >
                    {/each}
                </g>
                <g pointer-events="none" opacity="0.4">
                    {#each fGrid as { x, y }}
                        {@const dot = {
                            x: subject.x + (x - gridSize) / 4,
                            y: subject.y - (y - gridSize) / 4,
                        }}
                        {@const dotCircledReflected = circleReflect(
                            circle,
                            dot,
                        )}
                        {@const dotCircledReflectedTwice = circleReflect(
                            circle2,
                            dotCircledReflected,
                        )}
                        <circle
                            text-anchor="middle"
                            cx={dotCircledReflectedTwice.x * 100}
                            cy={-dotCircledReflectedTwice.y * 100}
                            r="4"
                            font-size={300}
                            stroke={"none"}
                            stroke-opacity="0.7"
                            stroke-width="20"
                            fill={colors.rotated}
                        />
                        >
                    {/each}
                </g>
            {/if}

            <circle
                cx={circle.center.x * 100}
                cy={-circle.center.y * 100}
                fill="none"
                fill-opacity="0.1"
                stroke={colors.first}
                r={circle.radius * 100}
            ></circle>
            <circle
                cx={circle2.center.x * 100}
                cy={-circle2.center.y * 100}
                fill="none"
                fill-opacity="0.1"
                stroke={colors.second}
                r={circle2.radius * 100}
            ></circle>

            {@render vec(circleReflected, colors.reflected)}
            {@render line(
                circleProjected2,
                circleReflected2,
                colors.second,
                "dashed faded",
            )}
            {@render line(
                circleReflected,
                circleProjected2,
                colors.second,
                "dashed faded",
            )}

            {@render vec(subject, colors.subject)}
            {@render vec(circleReflected2, colors.rotated)}

            {@render label(
                circle.center,
                "Circular Reflector (u)",
                colors.first,
                "",
                circle.radius * 3,
                false,
            )}
            {@render label(
                circle2.center,
                "Second Circular Reflector (v)",
                colors.second,
                "",
                -circle2.radius * 3,
                false,
            )}

            {@render label(circleReflected, "Reflected (q)", colors.reflected)}
            {@render label(
                circleReflected2,
                "Reflected Twice (t)",
                colors.rotated,
            )}
            {@render label(subject, "Subject s", colors.subject)}
            {@render ctrlRad(circle, colors.first)}
            {@render ctrlRad(circle2, colors.second)}

            {@render ctrl(subject, colors.subject)}
            {@render ctrl(circle.center, colors.first)}
            {@render ctrl(circle2.center, colors.second)}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            If the center of the {@render textLabel(
                "first",
                "first circle",
                "first",
            )} and
            {@render textLabel("second", "second circle", "second")} are equal, the
            second reflection counters the distortion caused by the first reflection.
            The
            {@render textLabel("rotated", "final result", "rotated")} is the linear
            scaling with the circles common center as pivot and with the ratio of
            their radii as scaling factor.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}
            {#if showChiral}
                <g pointer-events="none" opacity="0.4">
                    {#each fGrid as { x, y }}
                        {@const dot = {
                            x: subject.x + (x - gridSize) / 4,
                            y: subject.y - (y - gridSize) / 4,
                        }}
                        {@const dotCircledReflected = circleReflect(
                            circle,
                            dot,
                        )}
                        <circle
                            text-anchor="middle"
                            cx={dotCircledReflected.x * 100}
                            cy={-dotCircledReflected.y * 100}
                            r="4"
                            font-size={300}
                            stroke={"none"}
                            stroke-opacity="0.7"
                            stroke-width="20"
                            fill={colors.reflected}
                        />
                        >
                    {/each}
                </g>
                <g pointer-events="none" opacity="0.4">
                    {#each fGrid as { x, y }}
                        {@const dot = {
                            x: subject.x + (x - gridSize) / 4,
                            y: subject.y - (y - gridSize) / 4,
                        }}
                        <circle
                            text-anchor="middle"
                            cx={dot.x * 100}
                            cy={-dot.y * 100}
                            r="4"
                            font-size={300}
                            stroke={"none"}
                            stroke-opacity="0.7"
                            stroke-width="20"
                            fill={colors.subject}
                        />
                        >
                    {/each}
                </g>
                <g pointer-events="none" opacity="0.4">
                    {#each fGrid as { x, y }}
                        {@const dot = {
                            x: subject.x + (x - gridSize) / 4,
                            y: subject.y - (y - gridSize) / 4,
                        }}
                        {@const dotCircledReflected = circleReflect(
                            circle,
                            dot,
                        )}
                        {@const dotCircledReflectedTwice = circleReflect(
                            circle3,
                            dotCircledReflected,
                        )}
                        <circle
                            text-anchor="middle"
                            cx={dotCircledReflectedTwice.x * 100}
                            cy={-dotCircledReflectedTwice.y * 100}
                            r="4"
                            font-size={300}
                            stroke={"none"}
                            stroke-opacity="0.7"
                            stroke-width="20"
                            fill={colors.rotated}
                        />
                        >
                    {/each}
                </g>
            {/if}

            <circle
                cx={circle.center.x * 100}
                cy={-circle.center.y * 100}
                fill="none"
                fill-opacity="0.1"
                stroke={colors.first}
                r={circle.radius * 100}
            ></circle>
            <circle
                cx={circle3.center.x * 100}
                cy={-circle3.center.y * 100}
                fill="none"
                fill-opacity="0.1"
                stroke={colors.second}
                r={circle3.radius * 100}
            ></circle>

            {@render vec(circleReflected, colors.reflected)}

            {@render vec(subject, colors.subject)}
            {@render vec(circleScaled, colors.rotated)}

            {@render ctrlRad(circle, colors.first)}
            {@render ctrlRad(circle2, colors.second, null, circle.center)}

            {@render ctrl(subject, colors.subject)}
            {@render ctrl(circle.center, colors.first, [], false, [
                colors.first,
                colors.second,
            ])}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            If the common center both the {@render textLabel(
                "first",
                "first circle",
                "first",
            )}
            and the
            {@render textLabel("second", "second circle", "second")} circle is really
            far away, the scaling around this far pivot will cause the
            {@render textLabel("subject", "Subject s", "subject")} to be
            {@render textLabel("rotated", "translated", "rotated")}, as the two
            circles act as two parallel planes.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}
            {#if showChiral}
                <g pointer-events="none" opacity="0.4">
                    {#each fGrid as { x, y }}
                        {@const dot = {
                            x: subject.x + (x - gridSize) / 4,
                            y: subject.y - (y - gridSize) / 4,
                        }}
                        <circle
                            text-anchor="middle"
                            cx={dot.x * 100}
                            cy={-dot.y * 100}
                            r="4"
                            font-size={300}
                            stroke={"none"}
                            stroke-opacity="0.7"
                            stroke-width="20"
                            fill={colors.subject}
                        />
                        >
                    {/each}
                </g>
                <g pointer-events="none" opacity="0.4">
                    {#each fGrid as { x, y }}
                        {@const dot = {
                            x: subject.x + (x - gridSize) / 4,
                            y: subject.y - (y - gridSize) / 4,
                        }}
                        {@const dotCircleTranslated = translate(trans, dot)}
                        <circle
                            text-anchor="middle"
                            cx={dotCircleTranslated.x * 100}
                            cy={-dotCircleTranslated.y * 100}
                            r="4"
                            font-size={300}
                            stroke={"none"}
                            stroke-opacity="0.7"
                            stroke-width="20"
                            fill={colors.rotated}
                        />
                        >
                    {/each}
                </g>
            {/if}
            {@render line(
                subject,
                translate(trans, subject),
                "black",
                "dashed faded",
            )}
            <circle
                cx="0"
                cy="0"
                r="500"
                fill="none"
                stroke="#aaa"
                stroke-dasharray="20 20"
            ></circle>

            {@render vec(translate(trans, subject), colors.rotated)}
            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(
                scale(5.3, trans.center),
                "Far away centers (f)",
                colors.first,
            )}
            {@render label(
                translate(trans, subject),
                "translated result (t)",
                colors.rotated,
            )}

            {@render vec(subject, colors.subject)}
            <g clip-path="url(#circle-clip)">
                {@render ctrlTransRads(trans, [colors.first, colors.second])}
            </g>

            {@render ctrl(subject, colors.subject)}
            {@render ctrl(trans.center, colors.first, null, 5, [
                colors.first,
                colors.second,
            ])}
        </svg>
    </figure>
</div>
<section>
    <h2>Implementation</h2>
    <p>
        Notice that the <code>circleReflect</code> is not a sum of a projection and
        a rejection anymore.
    </p>
    <Highlight
        code={`
function circleProject(subject, circle) {
  const direction = subtract(subject, circle.center)
  const dist_ratio = len(direction) / circle.radius
  const dist_inv = 1 / dist_ratio

  return add(circle.center, scale(dist_inv, direction))
}

function circleReflect(subject, circle) {
  const direction = subtract(subject, circle.center)
  const dist_ratio = len(direction) / circle.radius
  const dist_inv = 1 / dist_ratio

  return add(circle.center, scale(dist_inv * dist_inv, direction))
}
`}
    ></Highlight>
</section>
<section>
    <h2>Fixed points</h2>
    <p>
        Go back and take a look at all the reflections we have constructed so
        far. Now think about what are the fixed points are for each of them.
        That is, for a given reflection what are the points will not move when
        being reflected? Next determine the fixed points of a composition of
        reflections.
    </p>
    <details>
        <summary>Solution</summary>
        <p>
            When reflecting across a plane, the points inside the plane will not
            move or in other words: The plane itself will not move.
        </p>
        <p>
            When reflecting (inversing) across a circle, the points on the
            circunference of the circle will not move.
        </p>
        <p>
            More generally <em
                >the reflector itself will not move during a single reflection</em
            >.
        </p>
        <p>
            When composing two flat plane reflections, only those points that
            are both inside the first and inside the second plane will not move.
            In other words: The intersection of two reflectors will not move.
        </p>
        <p>
            When composing two circle reflections exactly those points that are
            on both the first and the second circles circumference will not
            move.
        </p>
        <p>
            In case the circles <em>do not intersect</em> there are still two fixed
            points for which the second reflection inverses the first reflection.
        </p>
        <p>
            From this point of view we can come up with an peculiar insight:
            Geometric objects like points, lines, planes, and circles can be
            regarded as exactly the set of those points that do not move when
            using the object as a reflector.
        </p>
        <p>
            Intersections of two such objects <code>a</code> and <code>b</code>
            can then be regarded exactly as those points that do not move when reflecting
            first across object <code>a</code> and the reflecting across object
            <code>b</code>.
        </p>
        <p>
            This definitions will lead to two circles having always exactly two
            intersections, even if the sum of their radii is smaller then this
            distance between their centers.
        </p>
        <p>
            When leaning into this perspective of geometry the geometric objects
            stop being a set of points at all. Instead the object itself is the
            ((composed) reflection) transformation. What we see/draw when
            looking at/drawing a line or a circle are merely the fixed points of
            the underlying transformation.
        </p>
    </details>
</section>
<section>
    <h2>Vector fields</h2>
    <p>
        Until now we have looked at how a reflection affects a single vector and
        how it affects a simple polygon, like the letter <em>F</em> used as chiral
        figure.
    </p>
    <p>
        To get an even better unterstanding of the effects of the transformation
        we can try to take a look at all points at once and how they move unter
        a transformation.
    </p>
    <p>
        As looking at all infinite points at once might be difficult so we do
        the next best thing and look at a random sample of points.
    </p>
    <p>
        In the first figure you can see a simple plane as before together with a
        few points sampled in the planes neighborhood. Each point is colored
        according to its position to give each point a unique recognizable
        label.
    </p>
    <p>
        In the second figure you can each of those points, paired with their
        resulting point after the reflection.
    </p>
</section>
<div class="grid">
    <figure class="grid-item">
        <figcaption></figcaption>
        <svg
            class={{
                canvas: true,
                dragging: plane0.normal.dragging || plane0.dragging,
                polarrainbow: true,
            }}
            style:background=""
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}

            <g clip-path="url(#box-clip)">
                {#each adjustedPointSamples.map( (p) => add(scale(plane0.distance, plane0.normal), p) ) as { x, y }}
                    <circle
                        cx={x * 100}
                        cy={-y * 100}
                        r="8"
                        fill={rainbow(x, y)}
                        stroke-opacity="1"
                        stroke-width="4"
                        stroke="white"
                        class="slow"
                    ></circle>
                {/each}
            </g>

            <g clip-path="url(#box-clip)">
                {@render ctrlPlane(plane0, colors.plane)}
            </g>
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption></figcaption>
        <svg
            class={{
                canvas: true,
                dragging: plane0.normal.dragging || plane0.dragging,
                polarrainbow: true,
            }}
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}

            <g clip-path="url(#box-clip)">
                {#each adjustedPointSamples as { x, y }}
                    {@const reflected = planeReflect({ x, y }, plane0)}
                    {@const reflectedDir = norm(subtract(reflected, { x, y }))}
                    {@const tip = add({ x, y }, scale(0.2, reflectedDir))}
                    {@const tail = subtract(
                        reflected,
                        scale(0.2, reflectedDir),
                    )}
                    {#if len({ x, y }) < 6 || len(reflected) < 6}
                        <circle
                            cx={x * 100}
                            cy={-y * 100}
                            r="8"
                            stroke="none"
                            fill={rainbow(x, y)}
                            stroke-opacity="0.2"
                            stroke-width="7"
                            class="slow"
                        ></circle>

                        <circle
                            cx={reflected.x * 100}
                            cy={-reflected.y * 100}
                            r="5"
                            fill="none"
                            stroke={rainbow(x, y)}
                            stroke-width="3"
                            class="slow"
                        ></circle>
                        <line
                            x1={x * 100}
                            y1={-y * 100}
                            x2={reflected.x * 100}
                            y2={-reflected.y * 100}
                            stroke={rainbow(x, y)}
                            opacity="0.1"
                            stroke-width="5"
                            stroke-linecap="round"
                            class="slow"
                        ></line>
                        <line
                            class="wiremove slow"
                            x1={x * 100}
                            y1={-y * 100}
                            x2={reflected.x * 100}
                            y2={-reflected.y * 100}
                            stroke={rainbow(x, y)}
                            opacity="0.4"
                            stroke-width="10"
                            stroke-linecap="round"
                            style:--speed={-len(subtract({ x, y }, reflected)) *
                                20}
                            stroke-dasharray="0 {len(
                                subtract({ x, y }, reflected),
                            ) * 10}"
                        ></line>
                    {/if}
                {/each}
                {@render pln(plane0, colors.plane)}
            </g>
        </svg>
    </figure>
</div>
<section>
    <h2>To be continued</h2>

    <p>This section is still to be written.</p>
</section>

<section>
    <h2>References</h2>

    <ul>
        <li>
            <a href="https://www.youtube.com/watch?v=q3as9SGmDdw"
                >Talk: GAME26 Hamish Todd. Funhouse Mirrors.</a
            >
        </li>

        <li>
            <a href="https://bivector.net/">bivector.net</a>
        </li>
    </ul>
</section>

<footer>
    <a href="//tools.laszlokorte.de" target="_blank">More educational tools</a>
</footer>

<svg>
    <defs>
        <marker
            id="vector-head"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="30"
            markerHeight="30"
            fill="context-stroke"
            orient="auto-start-reverse"
        >
            <path d="M 10 5 l -10 5 l 3 -5 l -3 -5 z" />
        </marker>
        <clipPath id="box-clip">
            <rect x="-550" y="-550" width="1100" height="1100"></rect>
        </clipPath>

        <clipPath id="circle-clip">
            <circle cx="0" cy="0" r="500"></circle>
        </clipPath>
    </defs>
</svg>

<style>
    .wiremove {
        animation: wiremove 1s linear infinite;
    }
    .polarrainbow {
        background-image: conic-gradient(
            from 90deg,
            #ff000033,
            #ff00ff33,
            #0000ff33,
            #00ffff33,
            #00ff0033,
            #ffff0033,
            #ff000033
        );
    }
    .dragging .slow {
        opacity: 0;
        transition: opacity linear 0.1s;
    }
    .slow {
        transition: opacity linear 0.2s;
    }

    @keyframes wiremove {
        to {
            stroke-dashoffset: var(--speed, -40);
        }
    }
    :global(body) {
        font-family: monospace, monospace;
    }
    .options {
        max-width: 120ch;
        margin: auto;
    }
    .grid {
        overflow: visible;
        background: #eee;
        gap: 0.5ex;
        padding: 0.5ex;
        display: grid;
        box-sizing: border-box;
        max-width: 120ch;
        font-size: 1em;
        font-family: monospace, monospace;
        margin: auto;
        grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));
    }
    .grid-item:nth-child(3) {
        grid-column: 1;
    }
    .grid-item {
        background: #fff;
        overflow: visible;
        margin: 0;
        padding: 0;
    }

    .nodir {
        marker-end: none;
    }
    .thin {
        stroke-width: 0.5 !important;
    }

    code {
        font-family: monospace, monospace;
        background-color: #eee;
        padding: 0.25ex;
        background: #222;
        color: #fff;
        border-radius: 2px;
        white-space: nowrap;
    }

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

    .vector {
        stroke-width: 2px;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    .dashed {
        stroke-dasharray: 4 5;
        stroke-width: 2;
    }
    .dotted {
        stroke-dasharray: 1 5;
        stroke-width: 2;
    }
    .thick {
        stroke-width: 5;
        opacity: 0.8;
    }

    text {
        font-family: monospace, monospace;
        z-index: 100;
    }

    .label {
        pointer-events: none;
    }

    .faded {
        opacity: 0.3;
    }

    h1 img {
        width: 1em;
        height: 1em;
    }

    h1 {
        display: flex;
        gap: 1ex;
        align-items: center;
    }

    header,
    section {
        margin: auto;
        padding: 0 2ch;
        max-width: 84ch;
    }

    footer {
        margin: 1em auto 0;
        text-align: center;
    }

    a {
        color: tomato;
    }

    figure {
        display: flex;
        flex-direction: column;
    }

    figcaption {
        line-height: 1.75;
        order: 1;
        padding: 1ex;
        font-size: 1em;
        background-color: #fffa;
        z-index: 1000;
    }
    label {
        user-select: none;
    }
    fieldset {
        display: block;
        border: 2px solid #eee;
        margin: 1em 0;
    }

    legend {
        background-color: #333;
        color: #fff;
        display: block;
        padding: 0.1ex 0.5ex;
        border-radius: 3px;
    }

    text {
        pointer-events: none;
    }

    @media (pointer: coarse) {
        .touch-point {
            r: 4em;
        }
    }

    .color-label {
        background-color: var(--color, #111);
    }
    .color-label-picker {
        display: inline-flex;
        align-items: center;
        gap: 1ex;
        background-color: var(--color, #111);
        font-family: monospace, monospace;
        background-color: #eee;
        padding: 2px 2px 2px 1ex;
        border-radius: 4px;
        background: #222;
        color: #fff;
    }
    .minipicker {
        width: 15px;
        height: 15px;
        border: 1px solid #fffa;
        padding: 0;
        box-sizing: border-box;
        border-radius: 30px;
    }
    ::-moz-color-swatch {
        border: none;
    }
    .picker-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5ex 1ex;
    }

    .pivot-label {
        transform: translate(1ex, -1em);
    }

    details {
        padding: 1ex;
    }
    details:open {
        background-color: #f9f9f9;
    }
    details::details-content {
        padding: 0 1em;
    }
    details > summary {
        background-color: #111;
        color: #fff;
        padding: 1em;
        cursor: pointer;
    }
</style>
