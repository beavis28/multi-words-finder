// handle extension installation event
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    var settings = {
      latest_keywords: [],
      element: "mh",

      colors_numbers: 20,
      CSSprefix1: "chrome-extension-FindManyStrings",
      CSSprefix2: "chrome-extension-FindManyStrings-style-",
      CSSprefix3: "CE-FMS-",
    };

    chrome.storage.local.set({ settings: settings });
  }
});

// handle tab update
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === "complete" || changeInfo.title || changeInfo.url) {
    chrome.storage.local.get(["settings"], function (result) {
      var settings = result.settings;
      var tabkey = getTabkey(tabId);
      var tabinfo = initTabinfo(tabId, settings);
      chrome.storage.local.set({ [tabkey]: tabinfo });
      setBadge("normal");
    });
  }
});

function initTabinfo(tabId) {
  var tabinfo = {};
  tabinfo.id = tabId;
  tabinfo.keywords = [];
  return tabinfo;
}

// handle activate tab switch in a window
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.storage.local.get(["settings"], function (result) {
    var tabkey = getTabkey(activeInfo.tabId);
    chrome.storage.local.get([tabkey], function (result) {
      var tabinfo = result[tabkey];
      if (tabinfo) {
        setBadge("normal");
      } else {
        setBadge("error");
      }
    });
  });
});

// set background color for badge
function setBadge(status) {
  if (status === "error") {
    chrome.action.setBadgeBackgroundColor({
      color: "#FF0000",
    });
    chrome.action.setBadgeText({
      text: "!",
    });
  } else if (status === "normal") {
    chrome.action.setBadgeBackgroundColor({
      color: "white",
    });
    chrome.action.setBadgeText({
      text: "",
    });
  }
}

// receive
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "getTabId") {
    sendResponse({ tabId: sender.tab.id });
  }
});

// handle popup close
chrome.runtime.onConnect.addListener(function (port) {
  if (port.name.startsWith("popup_")) {
    port.onDisconnect.addListener(function (port) {
      var tabId = parseInt(port.name.substring(6));
      var tabkey = getTabkey(tabId);
      chrome.storage.local.get(["settings", tabkey], function (result) {
        chrome.tabs.sendMessage(tabId, {
          action: "hl_refresh_existing",
        });
      });
    });
  }
});

// convertion between tabkey and tabId
function getTabkey(tabId) {
  return "multi-highlight_" + tabId;
}
function getTabId(tabkey) {
  return parseInt(tabkey.substring(16));
}
