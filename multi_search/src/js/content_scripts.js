var tabId;
var tabkey;

chrome.runtime.sendMessage({ action: "getTabId" }, function (response) {
  tabId = response.tabId;
  tabkey = getTabkey(tabId);

  var MutationObserver =
    window.MutationObserver || window.WebKitMutationObserver;
  var MutationObserverConfig = {
    childList: true,
    subtree: true,
    characterData: true,
  };
  var observer = new MutationObserver(function (mutations) {
    chrome.storage.local.get(["settings", tabkey], function (result) {
      var settings = result.settings;
      var tabinfo = result[tabkey];
      hl_refresh(tabinfo.keywords, settings, tabinfo);
    });
  });
  observer.observe(document.body, MutationObserverConfig);

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.action == "hl_clearall") {
      chrome.storage.local.get(["settings", tabkey], function (result) {
        var settings = result.settings;
        var tabinfo = result[tabkey];
        hl_clearall(settings, tabinfo);
      });
      sendResponse({ action: "null" });
    } else if (request.action == "hl_refresh_existing") {
      chrome.storage.local.get(["settings", tabkey], function (result) {
        var settings = result.settings;
        var tabinfo = result[tabkey];
        hl_refresh(tabinfo.keywords, settings, tabinfo);
      });
      sendResponse({ action: "null" });
    } else if (request.action == "_hl_search") {
      chrome.storage.local.get(["settings", tabkey], function (result) {
        var settings = result.settings;
        var tabinfo = result[tabkey];
        _hl_search(request.addedKws, settings, tabinfo);
      });
      sendResponse({ action: "null" });
    } else if (request.action == "_hl_clear") {
      chrome.storage.local.get(["settings", tabkey], function (result) {
        var settings = result.settings;
        var tabinfo = result[tabkey];
        _hl_clear(request.removedKws, settings, tabinfo);
      });
      sendResponse({ action: "null" });
    }
  });

  function hl_refresh(Kws, settings, tabinfo) {
    hl_clearall(settings, tabinfo);
    _hl_search(Kws, settings, tabinfo);
  }

  function _hl_search(addedKws, settings, tabinfo) {
    clsPrefix = settings.CSSprefix1 + " " + settings.CSSprefix2;

    addedKws.sort((firstElem, secondElem) => {
      return secondElem.kwStr.length - firstElem.kwStr.length;
    });

    function KeywordEscape(kw) {
      return kw.replace(/\n/gis, "\\n");
    }

    observer.disconnect();
    for (var i = 0; i < addedKws.length; i++) {
      kw = addedKws[i];
      var hl_param1 = KeywordEscape(kw.kwStr);
      var hl_param2 =
        clsPrefix + kw.kwGrp + " " + settings.CSSprefix3 + encodeURI(kw.kwStr);
      var hl_param2 = { className: hl_param2, element: settings.element };
      $(document.body).highlight(hl_param1, hl_param2);
    }
    observer.observe(document.body, MutationObserverConfig);
  }

  function _hl_clear(removedKws, settings, tabinfo) {
    observer.disconnect();
    removedKws_flatten = removedKws.flat();
    for (var i = 0; i < removedKws_flatten.length; i++) {
      kw = removedKws_flatten[i];
      className = (settings.CSSprefix3 + encodeURI(kw.kwStr)).replace(
        /[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g,
        "\\$&"
      );
      $(document.body).unhighlight({
        className: className,
        element: settings.element,
      });
    }
    observer.observe(document.body, MutationObserverConfig);
  }

  function hl_clearall(settings, tabinfo) {
    observer.disconnect();
    $(document.body).unhighlight({
      className: settings.CSSprefix1,
      element: settings.element,
    });
    observer.observe(document.body, MutationObserverConfig);
  }
});

function getTabkey(tabId) {
  return "multi-highlight_" + tabId;
}
function getTabId(tabkey) {
  return parseInt(tabkey.substring(16));
}
