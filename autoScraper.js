// background script....
let currentIndex = 0


alert('boom')
function handleMessage(request, sender, sendResponse) {
    alert(request)
}
browser.runtime.onMessage.addListener(handleMessage);

browser.runtime.sendMessage({ type: "autoScraper", test: currentIndex }).then((response) => {
    alert(response.valid
    )
})
