<script>
    import Scene from "./Scene.svelte";
    import fGrid from "./f_grid";

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
    });

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
        This is a demonstration how any rotation of a vector {@render textLabel(
            "subject",
            "s",
            "subject",
        )} can be achieved by two successive reflections.
    </p>
    <h2>Reflecting at a vector</h2>
    <p>
        A reflection of vector {@render textLabel("subject", "s", "subject")} at vector
        {@render textLabel("first reflector", "u", "first")} is achieved by first
        projecting
        {@render textLabel("subject", "s", "subject")}
        onto {@render textLabel("first reflector", "u", "first")} and then adding
        the difference betwen
        {@render textLabel("subject", "s", "subject")} and the projection.
    </p>
    <p>
        A reflection of vector {@render textLabel("subject", "s", "subject")} at vector
        {@render textLabel("first reflector", "u", "first")}
        followed by a reflection at vector {@render textLabel(
            "second reflector",
            "v",
            "second",
        )} results in a rotation of {@render textLabel(
            "subject",
            "s",
            "subject",
        )} in the plane spanned by vectors
        {@render textLabel("first reflector", "u", "first")}
        and
        {@render textLabel("second reflector", "v", "second")}.
    </p>
    <p>
        The angle of the rotation is twice as large as the angle between vector {@render textLabel(
            "first reflector",
            "u",
            "first",
        )}
        and vector
        {@render textLabel("second reflector", "v", "second")}.
    </p>
    <p>
        In general to construct a rotation of angle
        {@render textLabel("angle", "α", "angle")}
        you just need to construct two vectors that enclose an angle
        {@render textLabel("half angle", "α/2", "angle")} and then use them as reflectors
        for the subject vector.
    </p>

    <p>
        The pair of vector {@render textLabel("first reflector", "u", "first")} and
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
</header>

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
    <p>The same approch also works for 3 dimensions.</p>
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
        > the plane in the except same ways as in the 2d case above.
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
        To make the same approach work for higher dimensions we have to refine
        our understanding of what actually happens during a reflection.
    </p>
    <p>
        By reflection we usually mean that something something is on the
        opposite side of something else (the mirror) but at the same distance.
    </p>
    <p>
        In 2d, there is only one possibility for something to be <em
            >on the other side</em
        >
        of a vector. In 3d, for a single vector, the <em>other side</em> depends on
        the original position of the subject. But as long as we combine two reflections
        in a row, we do not need to care too much because this ambiguity cancels out.
    </p>
    <p>
        But to work reflections across any number of dimensions we need
        something to always determine <em>the other side</em> precisely and
        uniquely. What we are looking for is a <em>plane</em>.
    </p>
</section>
<section>
    <h2>Reflecting at a plane</h2>
    <p>
        A flat plane cuts the space into two regions: The part on the one side
        of the plane (outside) and the other part of the plane (inside).
    </p>
    <p>
        A simple way to define a flat plane is by its normal vector and a
        distance. The normal vector points to the outside. The distance
        determines how far from the origin along the normal direction something
        needs to be to actually be counted to the outside.
    </p>
</section>
<section>
    <h2>Circular Reflections</h2>
    <p>
        Instead of reflecting across a flat plane, we can also reflect with
        respect to more complex objects. One interesting example is the circular
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
</section>
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
                "dashed thin",
            )}
            {@render line(
                subject,
                circleProjected,
                colors.first,
                "dashed thin",
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

            {@render ctrl(circle.center, colors.first)}
            {@render ctrlRad(circle, colors.first)}
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
                colors.first,
                "dashed  thin",
            )}
            {@render line(
                circleReflected,
                circleProjected2,
                colors.first,
                "dashed  thin",
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
                colors.first,
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
            {@render ctrl(circle.center, colors.first)}
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
            {@render textLabel("rotated", "translated", "rotated")}.
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
            {@render vec(translate(trans, subject), colors.rotated)}
            {@render label(subject, "Subject (s)", colors.subject)}
            {@render label(trans.center, "Far away centers (f)", colors.first)}
            {@render label(
                translate(trans, subject),
                "translated result (t)",
                colors.rotated,
            )}

            {@render vec(subject, colors.subject)}
            <g mask="url(#far-mask)">
                {@render ctrlTransRads(trans, [colors.first, colors.second])}
            </g>

            {@render ctrl(subject, colors.subject)}
            {@render ctrl(trans.center, colors.first, null, 500)}
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
</style>
