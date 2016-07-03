let ruleCollection = [];

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  console.log("command: " + request.command + " param: " + request.param);

  switch(request.command){
    case "rqstSelectRuleCollection":
    selectRuleCollection(sendResponse);
    break;

    case "rqstAddRule"
    addRule(request.param, sendResponse);
    break;

    case "rqstEditRule":
    editRule(request.param, sendResponse);
    break;

    case "rqstDeleteRule":
    deleteRule(request.param, sendResponse);
    break;

    default:
    console.log("undefined command: " +  request.command);
    break;
  }
});

function selectRuleCollection(sendResponse){
  chrome.storage.local.get("ruleCollection", function(items){
    if(chrome.runtime.lastError){
      console.log(chrome.runtime.lastError);

      sendResponse({state: "error", error: chrome.runtime.lastError});

      return;
    }

    ruleCollection = items;

    if(ruleCollection === undefined){
      ruleCollection = [];
    }

    sendResponse({state: "success", data: {ruleCollection: ruleCollection}});
  });
}

function addRule(param, sendResponse){
  ruleCollection.push(param.rule);

  chrome.storage.local.set({"ruleCollection": ruleCollection}, function(){
    if(chrome.runtime.lastError){
      ruleCollection.pop();

      console.log(chrome.runtime.lastError);

      sendResponse({state: "error", error: chrome.runtime.lastError});

      return;
    }

    sendResponse({state: "success"})
  });
}

function editRule(param, sendResponse){
  let old = ruleCollection[param.index];

  ruleCollection[param.index] = param.rule;

  chrome.storage.local.set({"ruleCollection": ruleCollection}, function(){
    if(chrome.runtime.lastError){
      ruleCollection[param.index] = old;

      console.log(chrome.runtime.lastError);

      sendResponse({state: "error", error: chrome.runtime.lastError});

      return;
    }

    sendResponse({state: "success"});
  });
}

function deleteRule(param, sendResponse){
  let remove = ruleCollection.splice(param.index, 1)[0];

  chrome.storage.local.set({"ruleCollection": ruleCollection}, function(){
    if(chrome.runtime.lastError){
      ruleCollection.splice(param.index, 0, remove);

      console.log(chrome.runtime.lastError);

      sendResponse({state: "error", error: chrome.runtime.lastError});

      return;
    }

    sendResponse({state: "success"});
  });
}

chrome.downloads.onDeterminingFilename.addListener(function(downloadItem, suggest){
  console.log("original: "+downloadItem.filename);

  suggest({filename: "adding/"+downloadItem.filename});
});
