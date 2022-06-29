// get the first a tag inside each div data-testid="cellInnerDiv" and get both the href and text of the first a tag, maybe the description?

let allFollowers = []

function scroll() {
    window.scrollByPages(2)
}

function scrollRepeatedly(numTimesRemaining, numTimesWithoutChange) {
    console.log(numTimesWithoutChange)
    const hasChange = updateFollowers()
    console.log(hasChange)
    scroll()
    setTimeout(() => {
        if (numTimesWithoutChange > 3) {
            browser.runtime.sendMessage({
                type: "followersScraped",
                followers: allFollowers
            });
        } else if (numTimesRemaining !== 0) {
            scrollRepeatedly(numTimesRemaining - 1, hasChange ? 0 : numTimesWithoutChange + 1);
        } else {
            browser.runtime.sendMessage({
                type: "followersScraped",
                followers: allFollowers
            });
        }
    }, 200)
}


function updateFollowers() {
    let prevFollowers = allFollowers.length
    let followers = []
    document.querySelectorAll('[data-testid="cellInnerDiv"]').forEach(div => {
        const a = div.getElementsByTagName('a')[2]
        if (a) {
            const href = a.href
            const text = a.innerText
            followers.push(href)
        }
    })
    allFollowers.push(...followers)
    // make allFollowers unique
    allFollowers = [...new Set(allFollowers)]
    if (allFollowers.length === prevFollowers) {
        console.log(allFollowers.length)
        return false
    }
    return true
}

scrollRepeatedly(100, 0)