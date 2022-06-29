// event to run execute.js content when extension's button is clicked
let urls = []
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
  if (request.type === "autoScraper") {
    appConsole("autoscraper found...")
    setTimeout(() => {
      callScript(tab, "content-script.js")
    }, 3000)
  }
  if (request.type === "twitterPageScraper") {
    // request.videos will be videos
    // appConsole('youtube-dl ' + request.videos.join(' '))
    if (request.videos) {
      appConsole("Videos found : " + request.videos.length)
      videos.push(...request.videos)
    }
    if (urls.length) {
      const newUrl = urls.pop()
      appConsole("navigating to next url" + newUrl)
      navigate(tab, newUrl)
    }
    else {
      appConsole("no more urls")
      appConsole('youtube-dl ' + videos.join(' '))
    }
  }
}

browser.runtime.onMessage.addListener(handleMessage);

browser.contextMenus.onClicked.addListener(async function (info, tab) {
  switch (info.menuItemId) {
    case "scrapeFollowers":
      const results = await callScript(tab, "get-followers.js")
      videos = []
      urls = results[0].result.splice(0, 10)
      console.log(urls)
      appConsole("Found " + urls.length + " urls")
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
        args: [urls.pop()]
      });
      setTimeout(() => {
        callScript(tab, "content-script.js")
      }, 3000)
      break;
  }
})


// load the followers...
// the run a program that iterates through each of the urls and then scrapes videos

