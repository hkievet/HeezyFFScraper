// event to run execute.js content when extension's button is clicked
browser.action.onClicked.addListener(execScript);

// function execScript() {
//   console.log("boom")
// }

async function execScript(tab) {
  try {
    const results = await browser.scripting.executeScript({
      target: {
        tabId: tab.id,
        allFrames: true,
      },
      files: ["content-script.js"],
    });
    console.log(results)
  } catch (err) {
    console.error(`failed to execute script: ${err}`);
  }
}