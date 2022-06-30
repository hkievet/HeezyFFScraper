function appConsole(message) {
    console.log("TWITTERAPP: " + message);
}

function scrapeContent() {
    const config = {
        posts: {
            numScrolls: 20,
            scrollDelay: 400,
            maxFails: 4,
        }
    };

    function scroll() {
        window.scrollByPages(2);
    }

    function scrollRepeatedly(numTimesRemaining, numTimesWithoutChange) {
        const hasChange = updateLists();
        scroll();
        setTimeout(() => {
            if (numTimesWithoutChange > config.posts.maxFails) {
                notifyBackgroundPage(images, videos);
            } else if (numTimesRemaining !== 0) {
                scrollRepeatedly(numTimesRemaining - 1, hasChange ? 0 : numTimesWithoutChange + 1);
            } else {
                notifyBackgroundPage(images, videos);
            }
        }, config.posts.scrollDelay);
    }

    // returns the twitter url for the exact video...
    // download the video with
    // previoew is this..
    // youtube-dl -o '%(id)s.%(ext)s' <url> 
    let videos = [];
    let images = [];

    // returns true if there was somethign new
    function updateLists() {
        const vidCount = videos.length;
        const imageCount = images.length;
        videos.push(...getVideos());
        images.push(...getImages());
        videos = [...new Set(videos)];
        images = [...new Set(images)];
        if (videos.length !== vidCount || images.length !== imageCount) {
            return true
        }
        return false
    }

    function getVideos() {
        let videos = document.getElementsByTagName("video");
        let videosAry = [...videos];
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
        let imgs = document.getElementsByTagName("img");
        let imgsAry = [...imgs];
        let imageArray = imgsAry.map(img => {
            return img.src
        });
        return imageArray
    }

    // Handling messaging with the background script
    function handleResponse(message) {
        console.log(`Message from the background script:`);
    }

    function handleError(error) {
        console.log(`Error: ${error}`);
    }

    function notifyBackgroundPage(images, videos) {
        let sending = browser.runtime.sendMessage({
            type: "twitterPageScraper",
            images,
            videos
        });
        sending.then(handleResponse, handleError);
    }
    console.log("hellooo");
    scrollRepeatedly(config.posts.numScrolls, 0);
}

function scrapeFollowers() {
    // get the first a tag inside each div data-testid="cellInnerDiv" and get both the href and text of the first a tag, maybe the description?
    const config = {
        followers: {
            numScrolls: 200,
            scrollDelay: 200,
            maxFails: 3,
            maxFollowers: 300,
        }
    };

    let allFollowers = [];

    function scroll() {
        window.scrollByPages(2);
    }

    function scrollRepeatedly(numTimesRemaining, numTimesWithoutChange) {
        console.log('scrolling...');
        const hasChange = updateFollowers();
        scroll();
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
        }, 200);
    }


    function updateFollowers() {
        let prevFollowers = allFollowers.length;
        let followers = [];
        document.querySelectorAll('[data-testid="cellInnerDiv"]').forEach(div => {
            const a = div.getElementsByTagName('a')[2];
            if (a) {
                const href = a.href;
                a.innerText;
                followers.push(href);
            }
        });
        allFollowers.push(...followers);
        // make allFollowers unique
        allFollowers = [...new Set(allFollowers)];
        if (allFollowers.length > config.followers.maxFollowers) {
            allFollowers = allFollowers.slice(0, config.followers.maxFollowers);
        }
        if (allFollowers.length === prevFollowers) {
            return false
        }
        return true
    }
    scrollRepeatedly(config.followers.numScrolls, 0);
}

// STATE
let followerUrls = [];
let videoCatalog = {};
let currentUrl = "";
let processTabId = null;

browser.action.onClicked.addListener(onButtonClick);
browser.runtime.onMessage.addListener(handleMessage);

async function onButtonClick(tab) {
  await callScript(tab, scrapeContent);
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
  processTabId = tab.id;
  switch (info.menuItemId) {
    case "test":
      // appConsole("boom", tab)
      browser.permissions.request({
        origins: ["*://*/*"]
      }).then((response) => {
        appConsole(response);
      });
      break;
    case "scrapeFollowers":
      callScript({ id: processTabId }, scrapeFollowers);
      break;
    case "navigate":
      currentUrl = await getNextUrl();
      navigate({ id: processTabId }, currentUrl);
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
        callScript({ id: processTabId }, scrapeContent);
      }, 3000);
      break;
  }
});


// Utility for running a content script in a tab
async function callScript(tab, f, args) {
  if (args === undefined) {
    args = [];
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
    browser.runtime.sendMessage({ type: "autoScraper", finished: true });
  }, [url]);
}

// Message handling...
function handleMessage(request, sender, sendResponse) {
  const tab = sender.tab;
  switch (request.type) {
    case "autoScraper":
      appConsole("Navigated to... " + currentUrl);
      setTimeout(() => {
        callScript({ id: processTabId }, scrapeContent);
      }, 1000);
      break
    case "twitterPageScraper":
      appConsole("finished scraping...");
      videoCatalog[currentUrl] = { images: [], videos: [] };
      if (request.videos) {
        appConsole("Videos found : " + request.videos.length);
        videoCatalog[currentUrl].videos = [...request.videos];
      }
      if (request.images) {
        appConsole("Photos found : " + request.images.length);
        videoCatalog[currentUrl].images = [...request.images];
      }
      submitPost(tab.url, videoCatalog[currentUrl].videos, videoCatalog[currentUrl].images).then(() => {
        // const ffmpegCommand = makeFfmpegCommand()
        // navigator.clipboard.writeText(JSON.stringify({ ...videoCatalog, ffmpegCommand }, null, 2));
        // move on to next thing...
        if (followerUrls.length) {
          getNextUrl().then((url) => {
            currentUrl = url;
            appConsole("navigating to next url" + currentUrl + ".  " + followerUrls.length + " remaining");
            navigate(tab, currentUrl);
          });
        }
        else {
          appConsole("Finshed scanning URLS");
        }
      });
      break;
    case "followersScraped":
      if (request.followers) {
        followerUrls = [...request.followers];
        appConsole("Followers found : " + followerUrls.length);
      }
      break
  }
}

/**
 * Makes a POST request to the server with the scrapecd data.
 */
async function submitPost(account, videos, photos) {
  appConsole("Submitting data for " + account);
  const url = "http://localhost:8080/submitScrapedData";
  const body = JSON.stringify({ account, videos, photos });
  appConsole(body);
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
    appConsole(data);
    return data;
  } catch (e) {
    return e;
  }
}

/**
 * Checks if the URL has already been hit
 */
async function checkUrl(account) {
  const url = "http://localhost:8080/accountExists/" + encodeURIComponent(account);
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
    appConsole(data.exists);
    if (data && data.exists) {
      return true
    }
    return false
  } catch (e) {
    return e;
  }
}

async function getNextUrl() {
  while (followerUrls.length) {
    const url = followerUrls.pop();
    const skip = await checkUrl(url);
    if (skip) {
      appConsole("Skipping " + url);
    } else {
      return url
    }
  }
}
