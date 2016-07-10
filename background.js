let debug = false;
let enabled = true;
let ruleCollection = [];

/* Init */
chrome.storage.local.get(["enabled", "ruleCollection"], function(items){
  if(chrome.runtime.lastError){
    if(debug){
      console.error(chrome.runtime.lastError);
    }

    return;
  }

  enabled = items["enabled"];

  if(enabled === undefined){
    enabled = true;
  }

  ruleCollection = items["ruleCollection"];

  if(ruleCollection === undefined){
    ruleCollection = [];
  }
});

chrome.runtime.onMessage.addListener(function(request, sender){
  if(debug){
    console.log("command: " + request.command + " param: " + request.param);
  }

  switch(request.command){
    case "rqstGetInit":
    rqstGetInit();
    break;

    case "rqstAddRule":
    rqstAddRule(request.param);
    break;

    case "rqstEditRule":
    rqstEditRule(request.param);
    break;

    case "rqstDeleteRule":
    rqstDeleteRule(request.param);
    break;

    case "rqstSetEnabled":
    rqstSetEnabled(request.param);
    break;

    default:
    if(debug){
      console.warn("undefined command: " +  request.command);
    }
    break;
  }
});

function rqstGetInit(){
  chrome.runtime.sendMessage({command: "ackGetInit", state: "success", param: {debug:debug, enabled: enabled, ruleCollection: ruleCollection}});
}

function rqstAddRule(param){
  ruleCollection.push(param.rule);

  chrome.storage.local.set({"ruleCollection": ruleCollection}, function(){
    if(chrome.runtime.lastError){
      ruleCollection.pop();

      if(debug){
        console.error(chrome.runtime.lastError);
      }

      chrome.runtime.sendMessage({command: "ackAddRule", state: "error", param: {error: chrome.runtime.lastError}});

      return;
    }

    chrome.runtime.sendMessage({command: "ackAddRule", state: "success", param: {rule: param.rule}});
  });
}

function rqstEditRule(param, sendResponse){
  let old = ruleCollection[param.index];

  ruleCollection[param.index] = param.rule;

  chrome.storage.local.set({"ruleCollection": ruleCollection}, function(){
    if(chrome.runtime.lastError){
      ruleCollection[param.index] = old;

      if(debug){
        console.error(chrome.runtime.lastError);
      }

      chrome.runtime.sendMessage({command: "ackEditRule", state: "error", param: {error: chrome.runtime.lastError}});

      return;
    }

    chrome.runtime.sendMessage({command: "ackEditRule", state: "success", param: {index: param.index, rule: param.rule}});
  });
}

function rqstDeleteRule(param, sendResponse){
  let remove = ruleCollection.splice(param.index, 1)[0];

  chrome.storage.local.set({"ruleCollection": ruleCollection}, function(){
    if(chrome.runtime.lastError){
      ruleCollection.splice(param.index, 0, remove);

      if(debug){
        console.error(chrome.runtime.lastError);
      }

      chrome.runtime.sendMessage({command: "ackDeleteRule", state: "error", param: {error: chrome.runtime.lastError}});

      return;
    }

    chrome.runtime.sendMessage({command: "ackDeleteRule", state: "success", param: {index: param.index}});
  });
}

function rqstSetEnabled(param){
  let old = enabled;

  enabled = param.enabled;

  chrome.storage.local.set({"enabled": enabled}, function(){
    if(chrome.runtime.lastError){
      enabled = old;

      if(debug){
        console.error(chrome.runtime.lastError);
      }

      chrome.runtime.sendMessage({command: "ackSetEnabled", state: "error", param: {error: chrome.runtime.lastError}});

      return;
    }

    chrome.runtime.sendMessage({command: "ackSetEnabled", state: "success", param: {enabled: enabled}});
  });
}

chrome.downloads.onDeterminingFilename.addListener(function(downloadItem, suggest){
  if(enabled == false || ruleCollection === undefined){
    return;
  }

  if(debug){
    console.log("given: "+downloadItem.filename);
  }

  for(let rule of ruleCollection){
    let matched = false;

    switch(rule.category){
      case "extension":
      matched = matchTestExtension(rule, downloadItem.filename);
      break;

      case "regex":
      matched = matchTestRegex(rule, downloadItem.filename);
      break;

      default:
      if(debug){
        console.warn("undefined category: " + rule.category);
      }
      break;
    }

    if(matched == false){
      continue;
    }

    suggest({filename: rule.path + "/" + downloadItem.filename});

    break;
  }
});

function matchTestExtension(rule, filename){
  try{
    let regexp = new RegExp("\\." + rule.rule.replace(".", "\\."));

    return regexp.test(filename);
  }
  catch(exception){
    if(debug){
      console.error(exception);
    }

    return false;
  }
}

function matchTestRegex(rule, filename){
  try{
    let regexp = new RegExp(rule.rule);

    return regexp.test(filename);
  }
  catch(exception){
    if(debug){
      console.error(exception);
    }

    return false;
  }
}
