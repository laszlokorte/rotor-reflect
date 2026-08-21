<script>
    import Scene from "./Scene.svelte";

    const favicon = "favicon.svg";
    let reflector = $state({
        x: 3,
        y: 2,
    });

    let reflector2 = $state({
        x: 2,
        y: 3,
    });

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
        center: scale(5, norm({ x: 3, y: -1 })),
        radiusA: 4,
        radiusB: 2,
    });

    function circleReflect(c, s) {
        const v = subtract(s, c.center);
        const d2 = dot(v, v);

        return add(c.center, scale((c.radius * c.radius) / d2, v));
    }
    function circleProject(c, s) {
        const v = subtract(s, c.center);
        const d2 = len(v);

        return add(c.center, scale(c.radius / d2, v));
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
    let projected = $derived(
        scale(dot(subject, reflector) / len2(reflector), reflector),
    );
    let reflected = $derived(subtract(scale(2, projected), subject));

    let projected2 = $derived(
        scale(dot(reflected, reflector2) / len2(reflector2), reflector2),
    );
    let rotated = $derived(subtract(scale(2, projected2), reflected));

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

    const gridSize = 8;

    function fShape(x, y) {
        return (
            x < (gridSize * 4) / 3 &&
            (x < 3 || y < 3 || (x <= gridSize && Math.abs(y - gridSize) < 2))
        );
    }

    const fGrid = [
        {
            x: 0,
            y: 0,
        },
        {
            x: 0,
            y: 1,
        },
        {
            x: 0,
            y: 2,
        },
        {
            x: 0,
            y: 3,
        },
        {
            x: 0,
            y: 4,
        },
        {
            x: 0,
            y: 5,
        },
        {
            x: 0,
            y: 6,
        },
        {
            x: 0,
            y: 7,
        },
        {
            x: 0,
            y: 8,
        },
        {
            x: 0,
            y: 9,
        },
        {
            x: 0,
            y: 10,
        },
        {
            x: 0,
            y: 11,
        },
        {
            x: 0,
            y: 12,
        },
        {
            x: 0,
            y: 13,
        },
        {
            x: 0,
            y: 14,
        },
        {
            x: 0,
            y: 15,
        },
        {
            x: 0,
            y: 16,
        },
        {
            x: 1,
            y: 0,
        },
        {
            x: 1,
            y: 1,
        },
        {
            x: 1,
            y: 2,
        },
        {
            x: 1,
            y: 3,
        },
        {
            x: 1,
            y: 4,
        },
        {
            x: 1,
            y: 5,
        },
        {
            x: 1,
            y: 6,
        },
        {
            x: 1,
            y: 7,
        },
        {
            x: 1,
            y: 8,
        },
        {
            x: 1,
            y: 9,
        },
        {
            x: 1,
            y: 10,
        },
        {
            x: 1,
            y: 11,
        },
        {
            x: 1,
            y: 12,
        },
        {
            x: 1,
            y: 13,
        },
        {
            x: 1,
            y: 14,
        },
        {
            x: 1,
            y: 15,
        },
        {
            x: 1,
            y: 16,
        },
        {
            x: 2,
            y: 0,
        },
        {
            x: 2,
            y: 1,
        },
        {
            x: 2,
            y: 2,
        },
        {
            x: 2,
            y: 3,
        },
        {
            x: 2,
            y: 4,
        },
        {
            x: 2,
            y: 5,
        },
        {
            x: 2,
            y: 6,
        },
        {
            x: 2,
            y: 7,
        },
        {
            x: 2,
            y: 8,
        },
        {
            x: 2,
            y: 9,
        },
        {
            x: 2,
            y: 10,
        },
        {
            x: 2,
            y: 11,
        },
        {
            x: 2,
            y: 12,
        },
        {
            x: 2,
            y: 13,
        },
        {
            x: 2,
            y: 14,
        },
        {
            x: 2,
            y: 15,
        },
        {
            x: 2,
            y: 16,
        },
        {
            x: 3,
            y: 0,
        },
        {
            x: 3,
            y: 1,
        },
        {
            x: 3,
            y: 2,
        },
        {
            x: 3,
            y: 7,
        },
        {
            x: 3,
            y: 8,
        },
        {
            x: 3,
            y: 9,
        },
        {
            x: 4,
            y: 0,
        },
        {
            x: 4,
            y: 1,
        },
        {
            x: 4,
            y: 2,
        },
        {
            x: 4,
            y: 7,
        },
        {
            x: 4,
            y: 8,
        },
        {
            x: 4,
            y: 9,
        },
        {
            x: 5,
            y: 0,
        },
        {
            x: 5,
            y: 1,
        },
        {
            x: 5,
            y: 2,
        },
        {
            x: 5,
            y: 7,
        },
        {
            x: 5,
            y: 8,
        },
        {
            x: 5,
            y: 9,
        },
        {
            x: 6,
            y: 0,
        },
        {
            x: 6,
            y: 1,
        },
        {
            x: 6,
            y: 2,
        },
        {
            x: 6,
            y: 7,
        },
        {
            x: 6,
            y: 8,
        },
        {
            x: 6,
            y: 9,
        },
        {
            x: 7,
            y: 0,
        },
        {
            x: 7,
            y: 1,
        },
        {
            x: 7,
            y: 2,
        },
        {
            x: 7,
            y: 7,
        },
        {
            x: 7,
            y: 8,
        },
        {
            x: 7,
            y: 9,
        },
        {
            x: 8,
            y: 0,
        },
        {
            x: 8,
            y: 1,
        },
        {
            x: 8,
            y: 2,
        },
        {
            x: 8,
            y: 7,
        },
        {
            x: 8,
            y: 8,
        },
        {
            x: 8,
            y: 9,
        },
        {
            x: 9,
            y: 0,
        },
        {
            x: 9,
            y: 1,
        },
        {
            x: 9,
            y: 2,
        },
        {
            x: 10,
            y: 0,
        },
        {
            x: 10,
            y: 1,
        },
        {
            x: 10,
            y: 2,
        },
    ];

    function translate(t, v) {
        return add(v, scale(t.radiusA - t.radiusB, norm(t.center)));
    }
</script>

{#snippet vec(v, defaultColor = null, cls = null)}
    <path
        class={[cls, "vector"]}
        marker-end="url(#vector-head)"
        vector-effect="non-scaling-stroke"
        d="M 0,0 L {v.x * 100} {v.y * -100}"
        stroke={defaultColor ?? v.color ?? "red"}
    />
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
        text-anchor={["start", "middle", "end"][
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
        text-anchor={["start", "middle", "end"][
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

{#snippet ctrl(v, defaultColor = null, cls = null, s = false)}
    <circle
        pointer-events="all"
        onpointerdown={(evt) => {
            if (evt.isPrimary) {
                evt.preventDefault();
                evt.currentTarget.setPointerCapture(evt.pointerId);

                const pos = reflect({ x: 1, y: 0 }, evtToSvg(evt));
                evt.currentTarget._offset = subtract(pos, scale(100, v));
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
                    s ? s : Math.min(500, len(pos)),
                    norm(pos),
                );

                v.x = clamped.x / 100;
                v.y = clamped.y / 100;
            }
        }}
        role="button"
        tabindex="-1"
        onkeypress={(evt) => {
            evt.preventDefault();
        }}
        class={[cls, "touch-point"]}
        cursor="move"
        r="40"
        cx={v.x * 100}
        cy={v.y * -100}
        fill="none"
    />
    <circle
        pointer-events="none"
        class={[cls]}
        r="20"
        opacity="0.3"
        cx={v.x * 100}
        cy={v.y * -100}
        fill={defaultColor ?? v.color ?? "red"}
    /><circle
        pointer-events="none"
        stroke="white"
        class={[cls]}
        r="10"
        cx={v.x * 100}
        cy={v.y * -100}
        fill={defaultColor ?? v.color ?? "red"}
    />
{/snippet}
{#snippet ctrlRad(circle, defaultColor = null, cls = null, forceCenter = null)}
    {@const center = forceCenter || circle.center}
    {@const v = add(center, { x: circle.radius, y: 0 })}

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
        r={circle.radius * 100 + 20}
        cx={center.x * 100}
        cy={center.y * -100}
        fill="none"
        stroke={defaultColor ?? v.color ?? "red"}
        stroke-width="40"
        stroke-opacity="0.1"
        pointer-events="stroke"
    />
{/snippet}
{#snippet ctrlTransRads(trans, defaultColors = [], cls = null)}
    {@const center = trans.center}
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
            d="M{center.x * (trans[rad] * 20 + 4) + center.y * 100}
            {center.y * -(trans[rad] * 20 + 4) + center.x * 100}
            Q
            {center.x * (trans[rad] * 20 - 15)}
            {center.y * -(trans[rad] * 20 - 15)}
            {center.x * (trans[rad] * 20 + 4) - center.y * 100}
            {center.y * -(trans[rad] * 20 + 4) - center.x * 100}"
            fill="none"
            stroke={defaultColors[i] ?? v.color ?? "red"}
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
            d="M{center.x * (trans[rad] * 20) + center.y * 100}
                     {center.y * -(trans[rad] * 20) + center.x * 100}
                     Q
                     {center.x * (trans[rad] * 20 - 19)}
                     {center.y * -(trans[rad] * 20 - 19)}
                     {center.x * (trans[rad] * 20) - center.y * 100}
                     {center.y * -(trans[rad] * 20) - center.x * 100}"
            fill="none"
            stroke={defaultColors[i] ?? v.color ?? "red"}
            stroke-width="40"
            stroke-opacity="0.1"
            pointer-events="stroke"
        />
    {/each}
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

<svelte:head>
    <title>Rotation via Double Reflection</title>
</svelte:head>

<header>
    <h1>
        <img src={favicon} alt="Icon" width="100" height="100" />
        Rotation via Double Reflection
    </h1>
    <p>
        This is a demonstration how any rotation of a vector <code
            class="name-s">s</code
        > can be achieved by two successive reflections.
    </p>
    <p>
        A reflection of vector <code class="name-s">s</code> at vector
        <code class="name-u">u</code> is achieved by first projecting
        <code class="name-s">s</code>
        onto <code class="name-u">u</code> and then adding the difference betwen
        <code class="name-s">s</code> and the projection.
    </p>
    <p>
        A reflection of vector <code class="name-s">s</code> at vector
        <code class="name-u">u</code>
        followed by a reflection at vector <code class="name-v">v</code> results
        in a rotation of <code class="name-s">s</code> in the plane spanned by
        vectors
        <code class="name-u">u</code>
        and
        <code class="name-s">v</code>.
    </p>
    <p>
        The angle of the rotation is twice as large as the angle between vector <code
            class="name-u">u</code
        >
        and vector
        <code class="name-v">v</code>.
    </p>
    <p>
        In general to construct a rotation of angle
        <code class="name-alpha">&alpha;</code>
        you just need to construct two vectors that enclose an angle
        <code><code class="name-alpha">&alpha;</code> / 2</code> and then use them
        as reflectors for the subject vector.
    </p>

    <p>
        The pair of vector <code class="name-u">u</code> and
        <code class="name-s">v</code>
        is called a rotor.
    </p>
    <p>
        Notice that only the relative orientation between
        <code class="name-u">u</code>
        and <code class="name-s">v</code>
        affect the rotation result. Try drag the arc segment called
        <code class="name-rotor">rotor</code> below to change the direction of both
        reflectors at once.
    </p>

    <fieldset>
        <legend>Options</legend>
        <label>
            <input type="checkbox" bind:checked={showChiral} />
            Show chiral figures
        </label>
    </fieldset>
</header>

<div class="grid">
    <figure class="grid-item">
        <figcaption>
            The <code class="name-s">Subject</code> together with the pair (<code
                class="name-u">First</code
            >, <code class="name-v">Second</code>) of reflection vectors of the
            <code style="background-color: #888;">rotor</code>.
        </figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {#if showChiral}
                {@render chiral(subject, "royalblue")}
            {/if}

            {@render axis()}
            {@render vec(subject, "royalblue")}

            {@render vec(rotor.from, "teal")}
            {@render vec(rotor.to, "tomato")}

            {@render label(subject, "Subject", "royalblue")}
            {@render label(rotor.from, "First Reflector", "teal")}
            {@render label(rotor.to, "Second Reflector", "tomato")}

            {@render arc(rotor.from, rotor.to, "gray")}
            {@render arclabel(rotor.from, rotor.to, "rotor", "gray")}

            {@render arcctrl(rotor.from, rotor.to, "none")}
            {@render ctrl(subject, "royalblue")}
            {@render ctrl(rotor.from, "teal")}
            {@render ctrl(rotor.to, "tomato")}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            The <code class="name-s">Subject</code> is decomposed into the
            component
            <code style="background: RosyBrown;">Projected</code> onto
            <code class="name-u">First reflector</code> and the
            <code
                style="text-decoration: underline; text-decoration-style: dashed; background-color: #888;"
                >orthogonal component</code
            >. The <code style="background-color: orchid;">Reflected</code> vector
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
                {@render chiral(subject, "royalblue")}
                {@render chiral(
                    reflected,
                    "orchid",
                    reflectionMatrix({ x: reflector.x, y: -reflector.y }),
                )}
            {/if}
            {@render axis()}
            {@render line(subject, projected, "black", "dashed faded")}
            {@render line(projected, reflected, "black", "dashed faded")}

            {@render vec(subject, "royalblue")}
            {@render vec(reflector, "teal")}
            {@render vec(reflected, "orchid")}
            {@render vec(projected, "RosyBrown", "thick")}

            {@render label(subject, "Subject", "royalblue")}
            {@render label(reflector, "First Reflector", "teal")}
            {@render label(projected, "Projected", "RosyBrown")}
            {@render label(reflected, "Reflected", "orchid")}

            {@render ctrl(subject, "royalblue")}
            {@render ctrl(reflector, "teal")}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            The <code style="background-color: orchid;">First reflection</code>
            is then reflected again. This time it is
            <code style="background-color: rebeccapurple;">Projected</code>
            onto the
            <code class="name-v">Second Reflector</code>. The result is the
            <code style="background-color: yellowgreen;">Rotated</code> vector.
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
                    "orchid",
                    reflectionMatrix({ x: reflector.x, y: -reflector.y }),
                )}
                {@render chiral(
                    rotated,
                    "yellowgreen",
                    `${reflectionMatrix({ x: rotor.to.x, y: -rotor.to.y })} ${reflectionMatrix({ x: rotor.from.x, y: -rotor.from.y })}`,
                )}
            {/if}
            {@render axis()}
            {@render line(reflected, projected2, "black", "dashed faded")}
            {@render line(projected2, rotated, "black", "dashed faded")}
            {@render vec(subject, "royalblue")}

            {@render vec(rotor.to, "tomato")}
            {@render vec(reflected, "orchid")}
            {@render vec(rotated, "yellowgreen")}
            {@render vec(projected2, "RebeccaPurple", "thick")}

            {@render arc(subject, rotated, "gray")}

            {@render label(subject, "Subject", "royalblue")}
            {@render label(rotor.to, "Second Reflector", "tomato")}
            {@render label(projected2, "Projected", "RebeccaPurple")}
            {@render label(rotated, "Rotated", "yellowgreen")}
            {@render label(reflected, "First Reflection", "orchid")}

            {@render arcctrl(subject, rotated, "none")}
            {@render ctrl(subject, "royalblue")}
            {@render ctrl(rotor.to, "tomato")}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            Drawing the angles between the interim results shows that the angle
            between <code class="name-s">Subject</code> and
            <code style="background-color: yellowgreen">Rotated</code> is the
            sum of two angles. The one angle is twice the difference between
            <code class="name-s">Subject</code>
            and <code class="name-u">First Reflector</code>. The second angle is
            twice the difference between the
            <code style="background-color: orchid;">First Reflection</code>
            and the
            <code style="background-color: yellowgreen;">Rotated</code> result.
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
                {@render chiral(subject, "royalblue")}
                {@render chiral(
                    reflected,
                    "orchid",
                    reflectionMatrix({ x: reflector.x, y: -reflector.y }),
                )}
                {@render chiral(
                    rotated,
                    "yellowgreen",
                    `${reflectionMatrix({ x: rotor.to.x, y: -rotor.to.y })} ${reflectionMatrix({ x: rotor.from.x, y: -rotor.from.y })}`,
                )}
            {/if}

            {@render vec(subject, "royalblue")}
            {@render vec(reflector, "teal")}
            {@render vec(scale(-1, reflector), "teal", "dashed nodir")}
            {@render vec(reflected, "orchid")}

            {@render vec(rotated, "yellowgreen")}
            {@render vec(rotor.to, "tomato")}
            {@render vec(scale(-1, rotor.to), "tomato", "dashed nodir")}

            {#if arcDirection(subject, reflected, rotated)}
                {@render arc(subject, reflected, "teal")}
                {@render arc(reflected, rotated, "tomato")}
            {:else}
                {@render arc(rotated, reflected, "tomato")}
                {@render arc(reflected, subject, "teal")}
            {/if}

            {@render label(rotor.to, "Second Reflector", "tomato")}
            {@render label(subject, "Subject", "royalblue")}
            {@render label(reflector, "First Reflector", "teal")}
            {@render label(reflected, "First Reflection", "orchid")}

            {@render label(rotated, "Rotated", "yellowgreen")}

            {@render ctrl(subject, "royalblue")}
            {@render ctrl(reflector, "teal")}
            {@render ctrl(reflector2, "tomato")}
        </svg>
    </figure>
</div>
<section>
    <p>
        Take a look at the implementation below. No trigonometric use of <code
            >sin</code
        >
        or <code>cos</code> is needed to perform the rotations.
    </p>
    <p>
        The construction of any transformation by only composing reflections
        sits at the core of <a href="https://bivector.net/" target="_blank"
            >Geometric Algebra</a
        >.
    </p>
</section>
<pre>{`
// dot ~ similarity in direction
const dot = (a, b) => a.x * b.x + a.y * b.y
// det ~ deviation in direction
const det = (u, v) =>  u.x * v.y - u.y * v.x

const len2 = (v) => dot(v,v)
const len = (v) => Math.sqrt(len2(v))

const scale = (s,v) => ({x: s * v.x, y: s * v.y})
const norm = (v) => scale(1 / len(v), v)

const add = (u, v) => ({x: u.x + v.x, y: u.y + v.y})
const subtract = (u, v) => add(u, scale(-1, v))

const project = (t, s) => scale(dot(t, s) / len2(s), s)

const reflect = (r,s) => {
  const projected = project(s, r);
  const reflected = subtract(scale(2, projected), s);
  return reflected;
}

const rotate =
  (a, b, s) => reflect(b, reflect(a, s))

const rotateHalf =
  (a, b, s) => rotate(scale(0.5, add(a, b)), b, s)
        `.trim()}
    </pre>

<section>
    <h2>3 Dimensions</h2>
    <p>The same approch also works for 3 dimensions and higher dimensions.</p>
    <p>
        Below you can see the <code class="name-s">subject</code> vector rotated
        in the plane spanned by the
        <code style="background-color: magenta">first</code>
        and
        <code style="background-color: teal">second</code> reflector.
    </p>
    <p>
        The reflection at the
        <code style="background-color: magenta">first reflector</code>
        mirrors the <code class="name-s">subject</code> onto
        <code>the first reflection</code>
        on the opposite side of the plane. The following reflection at the
        <code style:background-color="teal">second reflector</code> brings the
        vector back to the original side of the plane. So the orientation
        between the
        <code class="name-s">subject</code> and the rotation plane is restored.
    </p>
    <p>
        During this zic-zac motion across the plane the vector still rotates <em
            >along</em
        > the plane in the except same ways as in the 2d case above.
    </p>
</section>

<div class="grid" style:background="none">
    <figure class="grid-item">
        <Scene></Scene>
    </figure>
</div>
<section>
    <h2>Circular Reflections</h2>
    <p>
        Instead of reflecting across a vector, we can also reflect with respect
        to more complex objects. One interesting example is the circular
        reflection. A circular reflection maps points inside the circle to the
        outside and points outside the circle to the inside, while preserving
        the direction from the circle's center to the reflected point. In other
        words, the reflected point always lies on the same ray originating at
        the circle's center; only its distance from the center changes.
    </p>
    <p>
        For a circle with radius (<math
            xmlns="http://www.w3.org/1998/Math/MathML"
        >
            <mi>R</mi>
        </math>), a point at distance (<math
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
        The propper name for this is Circle Inversion. If you imagine the circle
        with its center really far away but its radius also really large you can
        think of it acting as straight line. In this way Circle Inversion is a
        generalization of a reflection on a line.
    </p>

    <fieldset>
        <legend>Options</legend>
        <label>
            <input type="checkbox" bind:checked={showChiral} />
            Show chiral figures
        </label>
    </fieldset>
</section>
<div class="grid">
    <figure class="grid-item">
        <figcaption>
            <code class="name-s">Subjects</code> outside the
            <code style:background-color="teal">reflector circle</code> get
            <code style:background-color="orchid">reflected</code>
            to the inside.
            <code class="name-s">Subjects</code> from the inside the circle get
            <code style:background-color="orchid">reflected</code> to the outside.
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
                            fill="royalblue"
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
                            fill="orchid"
                        />
                        >
                    {/each}
                </g>
            {/if}

            <circle
                cx={circle.center.x * 100}
                cy={-circle.center.y * 100}
                stroke="teal"
                fill="none"
                r={circle.radius * 100}
            ></circle>

            {@render line(
                circleProjected,
                circleReflected,
                "teal",
                "dashed thin",
            )}
            {@render line(subject, circleProjected, "teal", "dashed thin")}
            {@render vec(subject, "royalblue")}
            {@render vec(circleReflected, "orchid")}

            {@render ctrl(subject, "royalblue")}
            <circle
                cx={circleReflected.x * 100}
                cy={-circleReflected.y * 100}
                fill="orchid"
                r="10"
            ></circle>
            <circle
                cx={circleProjected.x * 100}
                cy={-circleProjected.y * 100}
                fill="teal"
                r="5"
            ></circle>

            {@render label(subject, "Subject", "royalblue")}
            {@render label(circleReflected, "Reflected", "orchid")}
            {@render label(
                circle.center,
                "Circular Reflector",
                "teal",
                "",
                circle.radius * 3,
                false,
            )}

            {@render ctrl(circle.center, "teal")}
            {@render ctrlRad(circle, "teal")}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            A <code style:background-color="tomato">second circle</code> can be
            used to on the result from the
            <code style:background-color="orchid">first reflection</code>
            to
            <code style:background-color="yellowgreen">reflect</code>
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
                            fill="orchid"
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
                            fill="yellowgreen"
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
                stroke="teal"
                r={circle.radius * 100}
            ></circle>
            <circle
                cx={circle2.center.x * 100}
                cy={-circle2.center.y * 100}
                fill="none"
                fill-opacity="0.1"
                stroke="tomato"
                r={circle2.radius * 100}
            ></circle>

            {@render vec(circleReflected, "orchid")}
            {@render line(
                circleProjected2,
                circleReflected2,
                "tomato",
                "dashed  thin",
            )}
            {@render line(
                circleReflected,
                circleProjected2,
                "tomato",
                "dashed  thin",
            )}

            {@render vec(subject, "royalblue")}
            {@render vec(circleReflected2, "yellowgreen")}

            <circle
                cx={circleReflected.x * 100}
                cy={-circleReflected.y * 100}
                fill="orchid"
                r="10"
            ></circle>
            <circle
                cx={circleProjected2.x * 100}
                cy={-circleProjected2.y * 100}
                fill="tomato"
                r="5"
            ></circle>
            {@render label(
                circle.center,
                "Circular Reflector",
                "teal",
                "",
                circle.radius * 3,
                false,
            )}
            {@render label(
                circle2.center,
                "Second Circular Reflector",
                "tomato",
                "",
                -circle2.radius * 3,
                false,
            )}

            {@render label(circleReflected, "Reflected", "orchid")}
            {@render label(circleReflected2, "Reflected Twice", "yellowgreen")}
            {@render label(subject, "Subject", "royalblue")}
            {@render ctrlRad(circle, "teal")}
            {@render ctrlRad(circle2, "tomato")}

            {@render ctrl(subject, "royalblue")}
            {@render ctrl(circle.center, "teal")}
            {@render ctrl(circle2.center, "tomato")}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            If the center of the <code style:background-color="teal">first</code
            >
            circle and
            <code style:background-color="tomato">second</code> circle are
            equal, the second reflection counters the distortion caused by the
            first reflection. The
            <code style:background-color="yellowgreen">final result</code> is the
            linear scaling with the circles common center as pivot and with the ratio
            of their radii as scaling factor.
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
                            fill="orchid"
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
                            fill="royalblue"
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
                            fill="yellowgreen"
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
                stroke="teal"
                r={circle.radius * 100}
            ></circle>
            <circle
                cx={circle3.center.x * 100}
                cy={-circle3.center.y * 100}
                fill="none"
                fill-opacity="0.1"
                stroke="tomato"
                r={circle3.radius * 100}
            ></circle>

            {@render vec(circleReflected, "orchid")}

            {@render vec(subject, "royalblue")}
            {@render vec(circleScaled, "yellowgreen")}

            {@render ctrlRad(circle, "teal")}
            {@render ctrlRad(circle2, "tomato", null, circle.center)}

            {@render ctrl(subject, "royalblue")}
            {@render ctrl(circle.center, "teal")}
        </svg>
    </figure>
    <figure class="grid-item">
        <figcaption>
            If the common center both the <code style:background-color="teal"
                >first</code
            >
            and the
            <code style:background-color="tomato">second</code> circle is really
            far away, the scaling around this far pivot will cause the
            <code class="name-s">subject</code> to be
            <code style:background-color="yellowgreen">translated</code>.
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
                            fill="royalblue"
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
                            fill="yellowgreen"
                        />
                        >
                    {/each}
                </g>
            {/if}
            <circle
                cx="0"
                cy="0"
                r="500"
                fill="none"
                stroke="#aaa"
                stroke-dasharray="20 20"
            ></circle>
            <mask id="far-mask">
                <circle
                    cx="0"
                    cy="0"
                    r="500"
                    fill="white"
                    stroke="#aaa"
                    stroke-dasharray="20 20"
                ></circle>
            </mask>
            {@render vec(translate(trans, subject), "yellowgreen")}
            {@render label(subject, "subject", "royalblue")}
            {@render label(trans.center, "Far away center", "teal")}
            {@render label(
                translate(trans, subject),
                "translated result",
                "yellowgreen",
            )}

            {@render vec(subject, "royalblue")}
            <g mask="url(#far-mask)">
                {@render ctrlTransRads(trans, ["tomato", "teal"])}
            </g>

            {@render ctrl(subject, "royalblue")}
            {@render ctrl(trans.center, "teal", null, 500)}
        </svg>
    </figure>
</div>

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
    </defs>
</svg>

<style>
    pre {
        margin: 0;
        padding: 1em;
        box-sizing: border-box;
        overflow: auto;
        line-height: 1.5;
        color: #fff;
        background-color: #333;
        font-size: 1em;

        margin: 1em auto;
        max-width: 120ch;
        font-family: monospace, monospace;
        box-sizing: border-box;
    }
    :global(body) {
        font-family: monospace, monospace;
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

    .name-u {
        background-color: teal;
    }
    .name-v {
        background-color: tomato;
    }

    .name-s {
        background-color: royalblue;
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
</style>
