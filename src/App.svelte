<script>
    function printMessage(message) {
        console.log(message);
    }
    function handleMessage(request, sender, sendResponse) {
        console.log("Message from the content script: " + request.greeting);
        sendResponse({ response: "Response from background script" });
    }

    browser.runtime.onMessage.addListener(handleMessage);
</script>

<svelte:window on:scraper_images_scraped={printMessage} />
<p>Bitching</p>
