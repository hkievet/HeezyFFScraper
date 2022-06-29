// event to run execute.js content when extension's button is clicked
let followerUrls = []
let videos = []
browser.action.onClicked.addListener(execScript);

function appConsole(message) {
  console.log("TWITTERAPP: " + message)
}

async function execScript(tab) {
  try {
    console.log(tab.id)
    window.tab = tab.id
    await browser.scripting.executeScript({
      target: {
        tabId: tab.id,
        allFrames: true,
      },
      files: ["content-script.js"],
    });
  } catch (err) {
    console.error(`failed to execute script: ${err}`);
  }
}


browser.contextMenus.create({
  id: "scrapeFollowers",
  title: "scrapeFollowers",
  contexts: ["page"]
}, onCreated);

browser.contextMenus.create({
  id: "navigate",
  title: "navigate",
  contexts: ["page"]
}, onCreated);

function onCreated() {
  if (browser.runtime.lastError) {
    console.log("error creating item:" + browser.runtime.lastError);
  } else {
    console.log("item created successfully");
  }
}

async function callScript(tab, script) {
  return await browser.scripting.executeScript({
    target: {
      tabId: tab.id,
      allFrames: true,
    },
    files: [script],
  });
}

function navigate(tab, url) {
  browser.scripting.executeScript({
    target: {
      tabId: tab.id,
      allFrames: true,
    },
    func: (url) => {
      window.location.href = url;
      browser.runtime.sendMessage({ type: "autoScraper", finished: true })
    },
    args: [url]
  })
}

function handleMessage(request, sender, sendResponse) {
  const tab = sender.tab
  switch (request.type) {
    case "autoScraper":
      appConsole("autoscraper found...")
      setTimeout(() => {
        callScript(tab, "content-script.js")
      }, 1000)
      break
    case "twitterPageScraper":
      // request.videos will be videos
      // appConsole('youtube-dl ' + request.videos.join(' '))
      if (request.videos) {
        appConsole("Videos found : " + request.videos.length)
        videos.push(...request.videos)
        appConsole('youtube-dl ' + videos.join(' '))
      }
      if (followerUrls.length) {
        const newUrl = followerUrls.pop()
        appConsole("navigating to next url" + newUrl)
        navigate(tab, newUrl)
      }
      else {
        appConsole("no more urls")
        appConsole(`youtube-dl -o '%(id)s.%(ext)s'` + videos.join(' '))
      }
      break
    case "followersScraped":
      if (request.followers) {
        appConsole("Followers found : " + request.followers.length)
        followerUrls.push(...request.followers)
      }
      break
  }
}

browser.runtime.onMessage.addListener(handleMessage);

browser.contextMenus.onClicked.addListener(async function (info, tab) {
  switch (info.menuItemId) {
    case "scrapeFollowers":
      callScript(tab, "get-followers.js")
      break;
    case "navigate":
      // starts navigating....
      // await callScript(tab, "autoScraper.js")
      await browser.scripting.executeScript({
        target: {
          tabId: tab.id,
          allFrames: true,
        },
        func: (text) => {
          window.location.href = text;
          browser.runtime.sendMessage({ type: "autoScraper", finished: true })
        },
        args: [followerUrls.pop()]
      });
      setTimeout(() => {
        callScript(tab, "content-script.js")
      }, 3000)
      break;
  }
})


// load the followers...
// the run a program that iterates through each of the urls and then scrapes videos

