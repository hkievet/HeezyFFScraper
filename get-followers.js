export function scrapeFollowers() {
    // get the first a tag inside each div data-testid="cellInnerDiv" and get both the href and text of the first a tag, maybe the description?
    const config = {
        followers: {
            numScrolls: 200,
            scrollDelay: 200,
            maxFails: 3,
            maxFollowers: 300,
        }
    }

    let allFollowers = []

    function scroll() {
        window.scrollBy(0, window.innerHeight)
    }

    function scrollRepeatedly(numTimesRemaining, numTimesWithoutChange) {
        console.log('scrolling...')
        const hasChange = updateFollowers()
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
        }, config.followers.scrollDelay)
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
        if (allFollowers.length > config.followers.maxFollowers) {
            allFollowers = allFollowers.slice(0, config.followers.maxFollowers)
        }
        if (allFollowers.length === prevFollowers) {
            return false
        }
        return true
    }
    scrollRepeatedly(config.followers.numScrolls, 0)
}
