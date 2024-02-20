defaultSettings = {
  latest_keywords: [],
};

var detached = "|";

window.addEventListener("load", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var currrentTab = tabs[0];
    if (currrentTab) {
      // Sanity check
      tabId = currrentTab.id;
      var tabkey = getTabkey(tabId);
      chrome.storage.local.get(["settings", tabkey], function (result) {
        // init general settings
        var settings = Object.assign(defaultSettings, result.settings);

        // init popup UI
        var tabinfo = result[tabkey];
        if (typeof tabinfo === "undefined") {
          highlightWords.value = "";
          highlightWords.disabled = true;
          highlightWords.style.backgroundColor = "#E4E5E7";
          highlightWords.placeholder =
            "[ Disabled ]\n\nPlease refresh the webpage for the extension to take effect";
          return;
        } else {
          highlightWords.disabled = false;
          highlightWords.style.backgroundColor = "transparent";
          highlightWords.value = keywordsToStr(tabinfo.keywords, settings);
        }

        $("#highlightWords").on("input", function () {
          handleHighlightWords(tabkey, { fromBgOrPopup: true });
        });

        // remove input
        $("#closeBtn").on("click", function () {
          highlightWords.value = "";
          handleHighlightWords(tabkey, { fromBgOrPopup: false });
        });

        chrome.runtime.connect({ name: "popup_" + tabId });
      });
    }
  });
});

function handleHighlightWords(tabkey, option = {}, callback = null) {
  chrome.storage.local.get(["settings", tabkey], function (result) {
    var settings = result.settings;
    var tabinfo = result[tabkey];
    var tabId = getTabId(tabkey);

    if (!option.useSavedKws) {
      inputStr = highlightWords.value;
    } else {
      inputStr = keywordsToStr(tabinfo.keywords, settings);
    }

    if (!inputStr) {
      // empty string
      chrome.tabs.sendMessage(tabId, {
        action: "hl_clearall",
      });
      tabinfo.keywords = [];
      settings.latest_keywords = "";
      chrome.storage.local.set({ [tabkey]: tabinfo, settings: settings });
    } else {
      inputKws = keywordsFromStr(inputStr, settings);
      savedKws = tabinfo.keywords;

      addedKws = KeywordsMinus(inputKws, savedKws);
      removedKws = KeywordsMinus(savedKws, inputKws);

      chrome.tabs.sendMessage(
        tabId,
        {
          action: "_hl_clear",
          removedKws: removedKws,
        },
        function (response) {
          chrome.tabs.sendMessage(tabId, {
            action: "_hl_search",
            addedKws: addedKws,
          });
        }
      );

      tabinfo.keywords = inputKws;
      settings.latest_keywords = inputKws;
      chrome.storage.local.set({ [tabkey]: tabinfo, settings: settings });
    }

    callback && callback();
  });
}

function keywordsFromStr(inputStr) {
  return inputStr
    .split(detached)
    .filter((i) => i)
    .map((kws, cnt) => {
      return { kwGrp: cnt % 20, kwStr: kws };
    });
}
function keywordsToStr(kws) {
  var str = "";

  str = kws.map((kw) => kw.kwStr).join(detached);
  str += str ? detached : "";

  return str;
}
function KeywordsMinus(kwListA, kwListB) {
  function KwListContain(kwList, kwA) {
    for (const kw of kwList) {
      if (kw.kwStr === kwA.kwStr && kw.kwGrp === kwA.kwGrp) {
        return true;
      }
    }
    return false;
  }
  return kwListA.filter((x) => !KwListContain(kwListB, x));
}

function getTabkey(tabId) {
  return "multi-highlight_" + tabId;
}
function getTabId(tabkey) {
  return parseInt(tabkey.substring(16));
}
