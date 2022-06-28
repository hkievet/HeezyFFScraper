function scroll() {
    window.scrollByPages(2)
}

function scrollRepeatedly(numTimesRemaining, numTimesWithoutChange) {
    const hasChange = updateLists()
    numTimesWithoutChange + 1
    scroll()
    setTimeout(() => {
        if (numTimesWithoutChange > 3) {
            notifyBackgroundPage(images, videos)
        } else if (numTimesRemaining !== 0) {
            scrollRepeatedly(numTimesRemaining - 1, hasChange ? 0 : numTimesWithoutChange + 1);
        } else {
            notifyBackgroundPage(images, videos)
        }
    }, 600)
}

// returns the twitter url for the exact video...
// download the video with
// previoew is this..
// youtube-dl -o '%(id)s.%(ext)s' <url> 
let videos = []
let images = []

// returns true if there was somethign new
function updateLists() {
    const vidCount = videos.length
    const imageCount = images.length
    videos.push(...getVideos())
    images.push(...getImages())
    videos = [...new Set(videos)]
    images = [...new Set(images)]
    if (videos.length !== vidCount || images.length !== imageCount) {
        return true
    }
    return false
}

function getVideos() {
    let videos = document.getElementsByTagName("video")
    let videosAry = [...videos]
    let videosArray = videosAry.map(img => {
        try {
            return img.closest('article').getElementsByTagName('time')[0].parentElement.href
        } catch (e) {
            return "error"
        }
    });
    return videosArray.filter(x => x !== "error")
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
    console.log(`Message from the background script:`);
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

scrollRepeatedly(100, 0)