// get the first a tag inside each div data-testid="cellInnerDiv" and get both the href and text of the first a tag, maybe the description?

function getFollowers() {
    alert('getting follower')
    let followers = []
    document.querySelectorAll('[data-testid="cellInnerDiv"]').forEach(div => {
        const a = div.getElementsByTagName('a')[2]
        if (a) {
            const href = a.href
            const text = a.innerText
            followers.push(href)
        }
    })
    console.log(followers)
    return followers
}

getFollowers()