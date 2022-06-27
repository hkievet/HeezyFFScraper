let imgs = document.getElementsByTagName("img")
let imgsAry = [...imgs]


let src = imgsAry.map(img => {
    return img.src
});
src;


function handleResponse(message) {
    console.log(`Message from the background script:  ${message.response}`);
}

function handleError(error) {
    console.log(`Error: ${error}`);
}

function notifyBackgroundPage(e) {
    let sending = browser.runtime.sendMessage({
        greeting: e
    });
    sending.then(handleResponse, handleError);
}

notifyBackgroundPage(src)