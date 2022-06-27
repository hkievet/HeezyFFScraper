
function getVideos() {
    let videos = document.getElementsByTagName("video")
    let videosAry = [...videos]
    let videosArray = videosAry.map(img => {
        return img.src
    });
    return videosArray
}

function getImages() {
    let imgs = document.getElementsByTagName("img")
    let imgsAry = [...imgs]
    let imageArray = imgsAry.map(img => {
        return img.src
    });
    return imageArray
}


function handleResponse(message) {
    console.log(`Message from the background script:  ${message.response}`);
}

function handleError(error) {
    console.log(`Error: ${error}`);
}

function notifyBackgroundPage(images, videos) {
    let sending = browser.runtime.sendMessage({
        images,
        videos
    });
    sending.then(handleResponse, handleError);
}

notifyBackgroundPage(getImages(), getVideos())