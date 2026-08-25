<script>
    import hljs from "highlight.js";
    import javascript from "highlight.js/lib/languages/javascript";
    hljs.registerLanguage("javascript", javascript);
    const { code } = $props();
</script>

<pre>{@html hljs.highlight(code.trim(), { language: "javascript" }).value}</pre>

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
    :global(.hljs-keyword) {
        font-weight: bold;
        color: #ffcec6;
    }
    :global(.hljs-comment) {
        opacity: 0.5;
    }
    :global(.hljs-title) {
        color: #cbffff;
    }
    :global(.hljs-property) {
        color: #aec3ff;
    }
</style>
