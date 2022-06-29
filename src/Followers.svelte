<script>
    let currentTab;

    async function setCurrentTab() {
        currentTab = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });
        currentTab = cur;
        await loadFollowers(currentTab[0].id);
    }

    async function loadFollowers(tabId) {
        console.log("hello");
        try {
            const results = await browser.scripting.executeScript({
                target: {
                    tabId: tabId,
                },
                func: () => {
                    alert("hello world");
                },
                // files: ["get-followers.js"],
            });
        } catch (e) {
            console.log(e);
        }
    }
</script>

{currentTab}
<button on:click={setCurrentTab}>Load Followers</button>
<p>Boom</p>
