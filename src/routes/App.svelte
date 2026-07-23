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
        center: { x: 1, y: 1 },
        radius: 1,
    });
    let circle2 = $state({
            center: { x: -1, y: 2 },
            radius: 0.5,
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
    const circleReflected = $derived(circleReflect(circle, subject));
    const circleReflected2 = $derived(circleReflect(circle2, circleReflected));
    const circleProjected = $derived(circleProject(circle, subject));
    const circleProjected2 = $derived(circleProject(circle2, circleReflected));

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

{#snippet label(v, t, defaultColor = null, cls = null)}
    <text
        text-anchor={["start", "middle", "end"][1 - Math.sign(v.x)]}
        transform="translate(0 {-30 * Math.sign(v.y)})"
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
        text-anchor={["start", "middle", "end"][1 - Math.sign(v.x)]}
        transform="translate(0 {-30 * Math.sign(v.y)})"
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

{#snippet ctrl(v, defaultColor = null, cls = null)}
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

                const clamped = scale(Math.min(500, len(pos)), norm(pos));

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
{#snippet ctrlRad(circle, defaultColor = null, cls = null)}
    {@const v = add(circle.center, { x: circle.radius, y: 0 })}
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

                const clamped = scale(Math.min(500, len(pos)), norm(pos));

                circle.radius = Math.max(0, clamped.x / 100 - circle.center.x);
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
    <Scene></Scene>
</section>

<section>
    <h2>Circular Reflections</h2>

    <div class="grid">
    <figure class="grid-item">
        <figcaption></figcaption>
        <svg
            class="canvas"
            viewBox="-500 -500 1000 1000"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
        >
            {@render axis()}

            <circle
                cx={circle.center.x * 100}
                cy={-circle.center.y * 100}
                fill="limegreen"
                fill-opacity="0.1"
                stroke="limegreen"
                r={circle.radius * 100}
            ></circle>

            {@render vec(circle.center, "limegreen")}
            {@render vec(subject, "royalblue")}
            {@render vec(circleReflected, "rebeccapurple")}
            {@render line(
                circleReflected,
                circleProjected,
                "gray",
                "dashed nodir",
            )}
            {@render line(subject, circleProjected, "gray", "dashed nodir")}
            {@render line(
                circle.center,
                add(circle.center, { x: circle.radius, y: 0 }),
                "limegreen",
                "dashed nodir",
            )}
            {@render ctrl(subject, "royalblue")}
            <circle
                cx={circleReflected.x * 100}
                cy={-circleReflected.y * 100}
                fill="rebeccapurple"
                r="10"
            ></circle>
            <circle
                cx={circleProjected.x * 100}
                cy={-circleProjected.y * 100}
                fill="gray"
                r="7"
            ></circle>

            {@render ctrl(circle.center, "limegreen")}
            {@render ctrlRad(circle, "limegreen")}
        </svg>
    </figure>
    <figure class="grid-item">
            <figcaption></figcaption>
            <svg
                class="canvas"
                viewBox="-500 -500 1000 1000"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMid meet"
            >
                {@render axis()}

                <circle
                    cx={circle.center.x * 100}
                    cy={-circle.center.y * 100}
                    fill="limegreen"
                    fill-opacity="0.1"
                    stroke="limegreen"
                    r={circle.radius * 100}
                ></circle>
                <circle
                                  cx={circle2.center.x * 100}
                                  cy={-circle2.center.y * 100}
                                  fill="tomato"
                                  fill-opacity="0.1"
                                  stroke="tomato"
                                  r={circle2.radius * 100}
                              ></circle>

                {@render vec(circle.center, "limegreen")}
                {@render vec(subject, "royalblue")}
                {@render vec(circleReflected2, "rebeccapurple")}
                {@render line(
                    circleReflected2,
                    circleProjected2,
                    "gray",
                    "dashed nodir",
                )}
                {@render line(circleReflected, circleProjected2, "gray", "dashed nodir")}
                {@render line(
                    circle.center,
                    add(circle.center, { x: circle.radius, y: 0 }),
                    "limegreen",
                    "dashed nodir",
                )}
                {@render ctrl(circleReflected, "royalblue")}
                <circle
                    cx={circleReflected2.x * 100}
                    cy={-circleReflected.y * 100}
                    fill="rebeccapurple"
                    r="10"
                ></circle>
                <circle
                    cx={circleProjected2.x * 100}
                    cy={-circleProjected2.y * 100}
                    fill="gray"
                    r="7"
                ></circle>

                {@render ctrl(circle.center, "limegreen")}
                {@render ctrl(circle2.center, "tomato")}
                {@render ctrlRad(circle, "limegreen")}
                {@render ctrlRad(circle2, "tomato")}
            </svg>
        </figure>
    </div>
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

    pre {
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
