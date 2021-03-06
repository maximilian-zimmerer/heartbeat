let loop;
let timeout;
let window = 400;
const step = 300;
const pause = 60000;
const init = step * 4;
const icons = {
  active: "../icons/48-on.png",
  inactive: "../icons/48-off.png",
};

let counter, active, limit;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set(
    {
      myState: false,
      myLimit: init,
      myCounter: init,
    },
    () => {
      state = false;
      limit = init;
      counter = init;
    }
  );
});
// get values from storage
chrome.storage.local.get(["myCounter", "myState", "myLimit"], (result) => {
  counter = result.myCounter;
  active = result.myState;
  limit = result.myLimit;
  setIcon(active);
  if (active) setCounter();
});
// listen to state changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    if (changes.myState) {
      active = changes.myState.newValue;
      handleState(active);
    }
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "reset" || request.msg === "close") {
    clearInterval(loop);
    setCounter();
  } else if (request.msg === "plus") {
    incLimit();
  } else if (request.msg === "minus") {
    decLimit();
  }
  sendResponse(null);
});

// start the counter
function setCounter() {
  clearTimeout(timeout);
  counter = limit;
  updateCounter();
  if (active) loop = setInterval(runCounter, 1000);
}
// run the counter
function runCounter() {
  counter > 0 ? counter-- : prompt();
  updateCounter();
}
// open new prompt
function prompt() {
  clearInterval(loop);
  chrome.windows.create(
    {
      top: randomPos().h,
      left: randomPos().w,
      width: window,
      height: window,
      type: "popup",
      state: "normal",
      url: chrome.runtime.getURL("prompt.html"),
    },
    () => {
      timeout = setTimeout(setCounter, pause);
    }
  );
}
// update storage values
function updateCounter() {
  chrome.storage.local.set({
    myCounter: counter,
  });
}
function updateLimit() {
  chrome.storage.local.set(
    {
      myLimit: limit,
      myCounter: limit,
    },
    () => {
      counter = limit;
    }
  );
}
function incLimit() {
  limit += step;
  updateLimit();
}
function decLimit() {
  if (limit < step) return;
  limit -= step;
  updateLimit();
}
// play/pause
function handleState(active) {
  // pause if active
  if (!active) {
    clearInterval(loop);
    // reset if break
    if (!counter) {
      clearTimeout(timeout);
      counter = limit;
      updateCounter();
    }
  } else {
    // resume countdown
    updateCounter();
    loop = setInterval(runCounter, 1000);
  }
}
// toggle icon
function setIcon(bool) {
  chrome.browserAction.setIcon({
    path: icons[bool ? "active" : "inactive"],
  });
}
//generate random position
function randomPos() {
  let w = screen.width;
  let h = screen.height;
  let rw = Math.floor(Math.random() * w - window) + window;
  let rh = Math.floor(Math.random() * h - window) + window;
  return { w: rw, h: rh };
}
