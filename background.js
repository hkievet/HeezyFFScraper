// event to run execute.js content when extension's button is clicked
let followerUrls = []
let videoCatalog = {}
let currentUrl = ""
browser.action.onClicked.addListener(execScript);

function appConsole(message) {
  console.log("TWITTERAPP: " + message)
}

async function execScript(tab) {
  try {
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
  } else {
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

function makeFfmpegCommand() {
  let ffmpegCmd = Object.keys(videoCatalog).map(url => {
    const videos = videoCatalog[url].videos
    if (videos.length) {
      // remove leading https://twitter.com/ from url
      url = url.replace('https://twitter.com/', '')
      return `mkdir ${url} && cd ${url} && youtube-dl -o '%(id)s.%(ext)s' ${videos.join(' ')} && cd ..`
    } else {
      return ''
    }
  }).filter(x => x !== '').join('\\\n&& ')
  appConsole(ffmpegCmd)
  return ffmpegCmd
}

function handleMessage(request, sender, sendResponse) {
  const tab = sender.tab
  switch (request.type) {
    case "autoScraper":
      appConsole("Finished scanning " + currentUrl)
      setTimeout(() => {
        callScript(tab, "content-script.js")
      }, 1000)
      break
    case "twitterPageScraper":
      appConsole("finished scraping...")
      videoCatalog[currentUrl] = { images: [], videos: [] }
      if (request.videos) {
        appConsole("Videos found : " + request.videos.length)
        videoCatalog[currentUrl].videos = [...request.videos]
      }
      if (request.images) {
        appConsole("Photos found : " + request.images.length)
        videoCatalog[currentUrl].images = [...request.images]
      }
      const ffmpegCommand = makeFfmpegCommand()
      navigator.clipboard.writeText(JSON.stringify({ ...videoCatalog, ffmpegCommand }, null, 2));
      // move on to next thing...
      if (followerUrls.length) {
        currentUrl = followerUrls.pop()
        appConsole("navigating to next url" + currentUrl + ".  " + followerUrls.length + " remaining")
        navigate(tab, currentUrl)
      }
      else {
        appConsole("Finshed scannign URLS")
      }
      break
    case "followersScraped":
      if (request.followers) {
        appConsole("Followers found : " + request.followers.length)
        // get first 50 request.followers
        const followers = [...request.followers].slice(0, 50)
        followerUrls = [...followers]
        appConsole(followerUrls.length)
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
      currentUrl = followerUrls.pop()
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
        args: [currentUrl]
      });
      setTimeout(() => {
        callScript(tab, "content-script.js")
      }, 3000)
      break;
  }
})


// load the followers...
// the run a program that iterates through each of the urls and then scrapes videos

