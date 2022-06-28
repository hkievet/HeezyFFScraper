// event to run execute.js content when extension's button is clicked
browser.action.onClicked.addListener(execScript);

async function execScript(tab) {
  try {
    const results = await browser.scripting.executeScript({
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