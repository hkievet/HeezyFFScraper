<script>
    // const modes = ["pictures", "videos"];
    let mode = "pictures";
    const ignoreURLS = [
        "styles.redditmedia.com",
        "preview.redd.it",
        "redditstatic.com",
        "pbs.twimg.com/profile_images",
    ];

    // togglign between pictures and videos
    function setPictureMode() {
        mode = "pictures";
    }
    function setVideoMode() {
        mode = "videos";
    }

    // import browser from "webextension-polyfill";
    let imgs = [];
    let videos = [];
    function printMessage(message) {
        console.log(message);
    }
    function handleMessage(request, sender, sendResponse) {
        imgs = filterImageUrls(request.images);
        videos = request.videos;
        // sendResponse({ response: "Response from background script" });
    }

    function filterImageUrls(urls) {
        return urls.filter((url) => {
            // if url contains a domain listed in ignoreURLS, return false
            if (ignoreURLS.some((domain) => url.includes(domain))) {
                return false;
            }
            return true;
        });
    }
    browser.runtime.onMessage.addListener(handleMessage);

    function copyText() {
        const text = `youtube-dl -o '%(id)s.%(ext)s' ${videos.join(" ")}`;
        navigator.clipboard.writeText(text);
    }
</script>

<svelte:window on:scraper_images_scraped={printMessage} />
<div>
    <button on:click={setPictureMode}>Picture</button>
    <button on:click={setVideoMode}>Video</button>
</div>
<p>
    {mode}
</p>
{#if mode === "pictures"}
    {#each imgs as img}
        <img src={img} alt="scraped" />
        <p>{img}</p>
    {/each}
{:else if mode === "videos"}
    <button on:click={copyText}>copy Text</button>
    {#each videos as video}
        <img src={video} alt="scraped" />
        <p>{video}</p>
    {/each}
{/if}
