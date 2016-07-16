let debug = false;
let enabled = true;
let ruleCollection = [];
let regexpCollection = [];

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
  if(param.parent < 0){
    ruleCollection.push(param.rule);
  }
  else{
    let parent = ruleCollection[param.parent];

    parent.children.push(param.rule);
  }

  chrome.storage.local.set({"ruleCollection": ruleCollection}, function(){
    if(chrome.runtime.lastError){
      ruleCollection.pop();

      if(debug){
        console.error(chrome.runtime.lastError);
      }

      chrome.runtime.sendMessage({command: "ackAddRule", state: "error", param: {error: chrome.runtime.lastError}});

      return;
    }

    chrome.runtime.sendMessage({command: "ackAddRule", state: "success", param: {parent: param.parent, rule: param.rule}});
  });
}

function rqstEditRule(param, sendResponse){
  let old;

  if(param.parent < 0 ){
    old = ruleCollection[param.index];
    ruleCollection[param.index] = param.rule;
    ruleCollection[param.index].children = old.children;
  }
  else{
    old = ruleCollection[param.parent].children[param.index];
    ruleCollection[param.parent].children[param.index] = param.rule;
  }

  chrome.storage.local.set({"ruleCollection": ruleCollection}, function(){
    if(chrome.runtime.lastError){
      if(param.parent < 0 ){
        ruleCollection[param.index] = old;
      }
      else{
        ruleCollection[param.parent].children[param.index] = old;
      }

      if(debug){
        console.error(chrome.runtime.lastError);
      }

      chrome.runtime.sendMessage({command: "ackEditRule", state: "error", param: {error: chrome.runtime.lastError}});

      return;
    }

    if(param.rule.rule != old.rule && regexpCollection[old.rule] !== undefined){
      regexpCollection[old.rule] = undefined;
    }

    chrome.runtime.sendMessage({command: "ackEditRule", state: "success", param: {parent: param.parent, index: param.index, rule: param.rule}});
  });
}

function rqstDeleteRule(param, sendResponse){
  let remove;

  if(param.parent < 0 ){
    remove = ruleCollection.splice(param.index, 1)[0];
  }
  else{
    remove = ruleCollection[param.parent].children.splice(param.index, 1)[0];
  }

  chrome.storage.local.set({"ruleCollection": ruleCollection}, function(){
    if(chrome.runtime.lastError){
      if(param.parent < 0 ){
        ruleCollection.splice(param.index, 0, remove);
      }
      else{
        ruleCollection[param.parent].children.splice(param.index, 0, remove);
      }

      if(debug){
        console.error(chrome.runtime.lastError);
      }

      chrome.runtime.sendMessage({command: "ackDeleteRule", state: "error", param: {error: chrome.runtime.lastError}});

      return;
    }

    if(regexpCollection[remove.rule] !== undefined){
      regexpCollection[remove.rule] = undefined;
    }

    chrome.runtime.sendMessage({command: "ackDeleteRule", state: "success", param: {parent: param.parent, index: param.index}});
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
    console.log("given: " + downloadItem.filename);
    console.log("given: " + downloadItem.referrer);
  }

  suggest({filename: getSuggestion(ruleCollection, downloadItem)});
});

function getSuggestion(testPool, downloadItem){
  for(let rule of testPool){
    let matched = false;

    switch(rule.category){
      case "file-extension":
      matched = downloadItem.filename.endsWith("." + rule.rule);
      break;

      case "file-regex":
      if(regexpCollection[rule.rule] === undefined){
        regexpCollection[rule.rule] = new RegExp(rule.rule);
      }

      matched = regexpCollection[rule.rule].test(downloadItem.filename);
      break;

      case "site-address":
      matched = downloadItem.referrer.replace("https://", "").replace("http://", "").startsWith(rule.rule);
      break;

      case "site-regex":
      if(regexpCollection[rule.rule] === undefined){
        regexpCollection[rule.rule] = new RegExp(rule.rule);
      }

      matched = regexpCollection[rule.rule].test(downloadItem.referrer);
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

    if(rule.children.length > 0){
      return rule.path + "/" + getSuggestion(rule.children, downloadItem);
    }

    return rule.path + "/" + downloadItem.filename;
  }

  return downloadItem.filename;
}
