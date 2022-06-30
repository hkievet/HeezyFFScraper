import { appConsole } from './utils/logging'
import { scrapeContent } from './content-script'
import { scrapeFollowers } from './get-followers'

// STATE
let followerUrls = []
let videoCatalog = {}
let currentUrl = ""
let processTabId = null

browser.action.onClicked.addListener(onButtonClick);
browser.runtime.onMessage.addListener(handleMessage);

async function onButtonClick(tab) {
  await callScript(tab, scrapeContent)
}

/**
 * CREATE THE CONTEXT BUTTONS
 */
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

browser.contextMenus.create({
  id: "test",
  title: "test",
  contexts: ["page"]
}, onCreated);

function onCreated() {
  if (browser.runtime.lastError) {
    console.error("Context Menu item created successfully");
  }
}

browser.contextMenus.onClicked.addListener(async function (info, tab) {
  processTabId = tab.id
  switch (info.menuItemId) {
    case "test":
      // appConsole("boom", tab)
      browser.permissions.request({
        origins: ["*://*/*"]
      }).then((response) => {
        appConsole(response)
      })
      break;
    case "scrapeFollowers":
      callScript({ id: processTabId }, scrapeFollowers)
      break;
    case "navigate":
      currentUrl = await getNextUrl()
      navigate({ id: processTabId }, currentUrl)
      // await browser.scripting.executeScript({
      //   target: {
      //     tabId: tab.id,
      //     allFrames: true,
      //   },
      //   func: (text) => {
      //     window.location.href = text;
      //     browser.runtime.sendMessage({ type: "autoScraper", finished: true })
      //   },
      //   args: [currentUrl]
      // });
      setTimeout(() => {
        callScript({ id: processTabId }, scrapeContent)
      }, 3000)
      break;
  }
})


// Utility for running a content script in a tab
async function callScript(tab, f, args) {
  if (args === undefined) {
    args = []
  }
  return await browser.scripting.executeScript({
    target: {
      tabId: tab.id,
      allFrames: true,
    },
    func: f,
    args
  });
}


function navigate(tab, url) {
  callScript({ id: processTabId }, (url) => {
    window.location.href = url;
    browser.runtime.sendMessage({ type: "autoScraper", finished: true })
  }, [url])
}

// Message handling...
function handleMessage(request, sender, sendResponse) {
  const tab = sender.tab
  switch (request.type) {
    case "autoScraper":
      appConsole("Navigated to... " + currentUrl)
      setTimeout(() => {
        callScript({ id: processTabId }, scrapeContent)
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
      submitPost(tab.url, videoCatalog[currentUrl].videos, videoCatalog[currentUrl].images).then(() => {
        // const ffmpegCommand = makeFfmpegCommand()
        // navigator.clipboard.writeText(JSON.stringify({ ...videoCatalog, ffmpegCommand }, null, 2));
        // move on to next thing...
        if (followerUrls.length) {
          getNextUrl().then((url) => {
            currentUrl = url
            appConsole("navigating to next url" + currentUrl + ".  " + followerUrls.length + " remaining")
            navigate(tab, currentUrl)
          })
        }
        else {
          appConsole("Finshed scanning URLS")
        }
      })
      break;
    case "followersScraped":
      if (request.followers) {
        followerUrls = [...request.followers]
        appConsole("Followers found : " + followerUrls.length)
      }
      break
    default:
      break;
  }
}

/**
 * Makes a POST request to the server with the scrapecd data.
 */
async function submitPost(account, videos, photos) {
  appConsole("Submitting data for " + account)
  const url = "http://localhost:8080/submitScrapedData"
  const body = JSON.stringify({ account, videos, photos })
  appConsole(body)
  const settings = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body
  };
  try {
    const fetchResponse = await fetch(url, settings);
    const data = await fetchResponse.json();
    appConsole(data)
    return data;
  } catch (e) {
    return e;
  }
}

/**
 * Checks if the URL has already been hit
 */
async function checkUrl(account) {
  const url = "http://localhost:8080/accountExists/" + encodeURIComponent(account)
  const settings = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  try {
    const fetchResponse = await fetch(url, settings);
    const data = await fetchResponse.json();
    appConsole(data.exists)
    if (data && data.exists) {
      return true
    }
    return false
  } catch (e) {
    return e;
    return false
  }
}

async function getNextUrl() {
  while (followerUrls.length) {
    const url = followerUrls.pop()
    const skip = await checkUrl(url)
    if (skip) {
      appConsole("Skipping " + url)
    } else {
      return url
    }
  }
}
