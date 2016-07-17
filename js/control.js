let debug = false;

/* Extend */
$.fn.extend({
    animateCss: function (animationName, callback) {
        var animationEnd = "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";
        $(this).addClass("animated " + animationName).one(animationEnd, function() {
            $(this).removeClass("animated " + animationName);

            if(callback === undefined){
              return;
            }

            callback();
        });
    },
    extract: function(){
      let data = JSON.parse($(this).attr("data"));

      if($(this).hasClass("template-rule") === true){
        return data;
      }

      if($(this).hasClass("template-editor") === true){
        data.category = $(this).find("[name|='dropdown-category'][active]").attr("name").replace("dropdown-category-", "");
        data.rule = $(this).find("[name|='input-rule']:not(.hidden)").find("input").val();
        data.path = $(this).find("[name='input-path']").val();

        return data;
      }

      return undefined;
    },
    inject: function(data){
      $(this).attr("data", JSON.stringify(data));

      if($(this).hasClass("template-rule") === true){
        $(this).addClass("template-rule-" + data.category)

        $(this).find("[name='category']").text(data.category.toUpperCase().replace("-", " : "));
        $(this).find("[name='rule']").text(data.rule);
        $(this).find("[name='path']").text(data.path);

        let rulePrefix, ruleSuffix;
        switch (data.category) {
          case "file-extension":
          rulePrefix = ".";
          ruleSuffix = "";
          break;

          case "site-address":
          rulePrefix = "http(or s)://";
          ruleSuffix = "";
          break;

          case "file-regex":
          case "site-regex":
          rulePrefix = "/";
          ruleSuffix = "/g";
          break;
        }

        $(this).find(".rule-prefix").removeClass("hidden").text(rulePrefix);;
        $(this).find(".rule-suffix").removeClass("hidden").text(ruleSuffix);
      }

      if($(this).hasClass("template-editor") === true){
        $(this).find("[name|='dropdown-category'][active]").removeAttr("active").removeAttr("style");
        $(this).find("[name|='input-rule']:not(.hidden)").addClass("hidden");

        $(this).find("[name='dropdown-category-"+data.category+"']").attr("active", "");
        $(this).find("[name='lbl-dropdown-category']").text(data.category.toUpperCase().replace("-", " : "));

        let inputGroupName = "input-rule-";

        switch(data.category){
          case "file-extension":
          inputGroupName += "extension";
          break;

          case "site-address":
          inputGroupName += "site";
          break;

          case "file-regex":
          case "site-regex":
          inputGroupName += "regex";
          break;
        }

        $(this).find("[name='" + inputGroupName + "']").removeClass("hidden").find("input").val(data.rule);

        $(this).find("[name='input-path']").val(data.path);
      }

      return $(this);
    }
});

/* Init */
chrome.runtime.onMessage.addListener(function(request, sender){
  if(debug){
    console.log("command: " + request.command + " param: " + request.param);
  }

  switch(request.command){
    case "ackGetInit":
    ackGetInit(request.state, request.param);
    break;

    case "ackAddRule":
    ackAddRule(request.state, request.param);
    break;

    case "ackEditRule":
    ackEditRule(request.state, request.param);
    break;

    case "ackDeleteRule":
    ackDeleteRule(request.state, request.param);
    break;

    case "ackSetEnabled":
    ackSetEnabled(request.state, request.param);
    break;

    default:
    if(debug){
      console.warn("undefined command: " +  request.command);
    }
    break;
  }
});

$(".popup").on("click", hideErrorPopup);

$("#btn-apply-active").on("click", function(){
  chrome.runtime.sendMessage({command: "rqstSetEnabled", param: {enabled: false}});
});

$("#btn-apply-inactive").on("click", function(){
  chrome.runtime.sendMessage({command: "rqstSetEnabled", param: {enabled: true}});
})

$("[name='btn-add-new']").on("click", onAddNew);

chrome.runtime.sendMessage({command: "rqstGetInit"});

/* Function */
function ackGetInit(state, param){
  debug = param.debug;

  setEnabled(param.enabled);

  if(param.ruleCollection.length > 0){
    for(let rule of param.ruleCollection){
      createRule().inject(rule).appendTo("#rule-collection").animateCss("fadeInLeft");

      $("<div></div>").addClass("child-collection").appendTo("#rule-collection");

      for(let child of rule.children){
        let created = createRule().addClass("template-child").inject(child).appendTo(".child-collection:last");

        created.find("[name='path-parent']").text("/" + rule.path + "/");
        created.animateCss("fadeInLeft");
      }
    }
  }
  else{
    createNotify("EMPTY").appendTo("#rule-collection").animateCss("fadeInLeft");
  }
}

function ackAddRule(state, param){
  let editor

  if(param.parent < 0){
    editor = $("#rule-collection > .template-editor:last");
  }
  else{
    editor = $("#rule-collection > .template:not(.template-child)").eq(param.parent).next().find(".template-editor:last");
  }

  if(state == "error"){
    editor.find("[name='btn-submit']").removeAttr("disabled");
    editor.find("[name='btn-cancel']").removeAttr("disabled");

    showErrorPopup("add rule: " + param.error);

    return;
  }

  let rule = editor.hasClass("template-child") == false ? createRule():createRule().addClass("template-child");

  exchangeFromTo(editor, rule.inject(param.rule));

  if(param.parent < 0){
    $("<div></div>").addClass("child-collection").appendTo("#rule-collection");

    $("#navbar-bottom").removeAttr("disabled");
  }
  else{
    let parent = rule.parent().prev();

    rule.find("[name='path-parent']").text("/" + parent.extract().path + "/");

    parent.find("[name='btn-edit']").removeAttr("disabled");
    parent.find("[name='btn-delete']").removeAttr("disabled");
    parent.find("[name='btn-add-child']").removeAttr("disabled");
  }
}

function ackEditRule(state, param){
  let editor;

  if(param.parent < 0){
    editor = $("#rule-collection > .template:not(.template-child)").eq(param.index);

    editor.next().children().find("[name='path-parent']").text("/" + param.rule.path + "/");
  }
  else{
    editor = $("#rule-collection > .template:not(.template-child)").eq(param.parent).next().children().eq(param.index);
  }

  if(state == "error"){
    editor.find("[name='btn-submit']").removeAttr("disabled");
    editor.find("[name='btn-cancel']").removeAttr("disabled");

    showErrorPopup("edit rule: " + param.error);

    return;
  }

  let rule = editor.hasClass("template-child") == false ? createRule():createRule().addClass("template-child");

  exchangeFromTo(editor, rule.inject(param.rule));
}

function ackDeleteRule(state, param){
  let rule;

  if(param.parent < 0){
    rule = $("#rule-collection > .template:not(template-child)").eq(param.index);
  }
  else{
    rule = $("#rule-collection > .template:not(template-child)").eq(param.parent).next().children().eq(param.index);
  }

  if(state == "error"){
    rule.find("[name='btn-edit']").removeAttr("disabled");
    rule.find("[name='btn-delete']").removeAttr("disabled");

    showErrorPopup("delete rule: " + param.error);

    return;
  }

  if(rule.hasClass("template-child") == false){
    rule.next().animateCss("fadeOutRight", function(){
      rule.next().detach();
    });
  }

  if(rule.hasClass("template-child") == true || $("#rule-collection").children(":not(.template-notify, .child-collection, .fadeOutRight)").length > 1){
    rule.animateCss("fadeOutRight", function(){
      rule.detach();
    });
  }
  else{
    exchangeFromTo(rule, createNotify("EMPTY"));
  }
}

function ackSetEnabled(state, param){
  if(state == "error"){
    showErrorPopup("set enabled: " + param.error);

    return;
  }

  setEnabled(param.enabled);
}

function createNotify(message, description){
  let notify = $(".template-notify:last").clone();

  let messageElement = notify.find("[name='message']");

  if(message !== undefined){
    messageElement.text(message);
  }
  else{
    messageElement.addClass("hidden");
  }

  let descriptionElement = notify.find("[name='description']");
  if(description !== undefined){
    descriptionElement.text(description);
  }
  else{
    descriptionElement.addClass("hidden");
  }

  return notify;
}

function createEditor(){
  let editor = $("#template > .template-editor").clone();

  editor.find("[name='btn-submit']").on("click", {editor: editor}, onSubmit);
  editor.find("[name='btn-cancel']").on("click", {editor: editor}, onCancel);
  editor.find("[name|='dropdown-category']").each(function(index, element){
    let category = $(element);

    category.on("click", function(){
      if(category.attr("active") !== undefined || category.parent().hasClass("disabled") == true){
        return;
      }

      editor.find("[name|='dropdown-category'][active]").removeAttr("active").removeAttr("style");
      let edited = editor.find("[name|='input-rule']:not(.hidden)").addClass("hidden").find("input").val();

      category.attr("active", "");

      editor.find("[name='lbl-dropdown-category']").text(category.text());

      let inputGroupName = "input-rule-";

      switch(category.attr("name").replace("dropdown-category-", "")){
        case "file-extension":
        inputGroupName += "extension";
        break;

        case "site-address":
        inputGroupName += "site";
        break;

        case "file-regex":
        case "site-regex":
        inputGroupName += "regex";
        break;
      }

      editor.find("[name='" + inputGroupName + "']").removeClass("hidden").find("input").val(edited);
    });
  });

  return editor;
}

function createRule(){
  let rule = $("#template > .template-rule").clone();

  rule.find("[name='btn-edit']").on("click", {rule: rule}, onEdit);
  rule.find("[name='btn-delete']").on("click", {rule: rule}, onDelete);
  rule.find("[name='btn-add-child']").on("click", {rule: rule}, onAddChild);

  return rule;
}

function onSubmit(event){
  let data = event.data.editor.extract();

  if(data === undefined){
    return;
  }

  let hasError = false;

  if(data.rule === undefined || data.rule === ""){
    event.data.editor.find("[name|='input-rule']:first").parent().addClass("has-error")

    hasError = true;
  }
  else{
    event.data.editor.find("[name|='input-rule']:first").parent().removeClass("has-error")
  }

  if(data.path === undefined || data.path === ""){
    event.data.editor.find("[name='input-path']").parent().addClass("has-error")

    hasError = true;
  }
  else{
    event.data.editor.find("[name='input-path']").parent().removeClass("has-error")
  }

  if(hasError == true){
    return;
  }

  event.data.editor.find("[name='btn-submit']").attr("disabled", "disabled");
  event.data.editor.find("[name='btn-cancel']").attr("disabled", "disabled");

  let parent;
  let index;

  if(event.data.editor.hasClass("template-child") == false){
    parent = -1;
    index = $("#rule-collection > .template").index(event.data.editor);
  }
  else{
    parent = $("#rule-collection > .template").index(event.data.editor.parent().prev());
    index = event.data.editor.parent().children().index(event.data.editor);
  }

  if(data.state == "new"){
    data.state = "contain";

    chrome.runtime.sendMessage({command: "rqstAddRule", param: {parent: parent, rule: data}});
  }
  else{
    chrome.runtime.sendMessage({command: "rqstEditRule", param: {parent: parent, index: index, rule: data}});
  }
}

function onCancel(event){
  event.data.editor.find("[name='btn-submit']").attr("disabled", "disabled");
  event.data.editor.find("[name='btn-cancel']").attr("disabled", "disabled");

  let data = event.data.editor.extract();

  if(data.state === "contain"){
    let rule = event.data.editor.hasClass("template-child") == false ? createRule() : createRule().addClass("template-child");

    exchangeFromTo(event.data.editor, rule.inject(data));
  }
  else{
    $("#navbar-bottom").removeAttr("disabled");

  if($("#rule-collection").children(":not(.template-notify, .fadeOutRight)").length > 1){
      event.data.editor.animateCss("fadeOutRight", function(){
        event.data.editor.detach();
      });
    }
    else{
      exchangeFromTo(event.data.editor, createNotify("EMPTY"));
    }
  }

  if(event.data.editor.hasClass("template-child") == true){
    let parent = event.data.editor.parent().prev();

    parent.find("[name='btn-edit']").removeAttr("disabled");
    parent.find("[name='btn-delete']").removeAttr("disabled");
    parent.find("[name='btn-add-child']").removeAttr("disabled");
  }
}

function onEdit(event){
  event.data.rule.find("[name='btn-edit']").attr("disabled", "disabled");
  event.data.rule.find("[name='btn-delete']").attr("disabled", "disabled");
  event.data.rule.find("[name='btn-add-child']").attr("disabled", "disabled");

  let editor = createEditor().inject(event.data.rule.extract());

  if(event.data.rule.hasClass("template-child") == true){
    editor.addClass("template-child");
  }

  exchangeFromTo(event.data.rule, editor);

  let container = $("#rule-collection")

  container.animate({scrollTop: editor.offset().top - container.offset().top + container.scrollTop()}, 500);
}

function onDelete(event){
  event.data.rule.find("[name='btn-edit']").attr("disabled", "disabled");
  event.data.rule.find("[name='btn-delete']").attr("disabled", "disabled");
  event.data.rule.find("[name='btn-add-child']").attr("disabled", "disabled");

  let parent;
  let index;

  if(event.data.rule.hasClass("template-child") == false){
    parent = -1;
    index = $("#rule-collection > .template").index(event.data.rule);
  }
  else{
    parent = $("#rule-collection > .template").index(event.data.rule.parent().prev());
    index = event.data.rule.parent().children().index(event.data.rule);
  }

  chrome.runtime.sendMessage({command: "rqstDeleteRule", param: {parent: parent, index: index}});
}

function onAddNew(){
  $(this).attr("disabled", "disabled");

  let editor = createEditor().inject({category: "file-extension", rule: "", path: "", children: [], state: "new"});

  if($("#rule-collection > .template-notify").length > 0){
    exchangeFromTo($("#rule-collection > .template-notify"), editor);
  }
  else{
    editor.appendTo("#rule-collection").animateCss("fadeInLeft");
  }

  let container = $("#rule-collection")

  container.animate({scrollTop: editor.offset().top - container.offset().top + container.scrollTop()}, 500);
}

function onAddChild(event){
  event.data.rule.find("[name='btn-edit']").attr("disabled", "disabled");
  event.data.rule.find("[name='btn-delete']").attr("disabled", "disabled");
  event.data.rule.find("[name='btn-add-child']").attr("disabled", "disabled");

  let editor = createEditor().addClass("template-child")

  if(event.data.rule.extract().category.startsWith("file-") == true){
    editor.inject({category: "site-address", rule: "", path: "", children: [], state: "new"});
    editor.find(".dropdown-menu > li > [name|='dropdown-category-file']").parent().addClass("disabled");
  }
  else{
    editor.inject({category: "file-extension", rule: "", path: "", children: [], state: "new"});
    editor.find(".dropdown-menu > li > [name|='dropdown-category-site']").parent().addClass("disabled");
  }

  editor.appendTo(event.data.rule.next()).animateCss("fadeInLeft");;

  let container = $("#rule-collection")

  container.animate({scrollTop: editor.offset().top - container.offset().top + container.scrollTop()}, 500);
}

function showErrorPopup(message){
  $(".popup").removeClass("hidden");
  $(".popup").find("[name='error-message']").text(message);

  $(".popup > .popup-window").animateCss("fadeInLeft");
}

function hideErrorPopup(){
  $(".popup > .popup-window").animateCss("fadeOutRight", function(){
    $(".popup").addClass("hidden");
  });
}

function setEnabled(enabled){
  if(enabled == true){
    $("#btn-apply-active").removeClass("hidden");
    $("#btn-apply-inactive").addClass("hidden");
  }
  else{
    $("#btn-apply-active").addClass("hidden");
    $("#btn-apply-inactive").removeClass("hidden");
  }
}

function exchangeFromTo(exchangeFrom, exchangeTo){
  exchangeFrom.removeClass("hidden");
  exchangeTo.removeClass("hidden");

  exchangeTo.css("margin", exchangeFrom.css("margin"));

  let head = exchangeFrom;
  let tail = exchangeTo;

  exchangeTo.detach().insertAfter(exchangeFrom);

  if(exchangeFrom.outerHeight() > exchangeTo.outerHeight()){
    head = exchangeTo;
    tail = exchangeFrom;

    exchangeFrom.detach().insertAfter(exchangeTo);
  }

  tail.css("margin-top", 0);
  tail.css("margin-bottom", head.css("margin-bottom"));

  head.css("margin-bottom", head.outerHeight() * -1);

  exchangeFrom.animateCss("fadeOutRight", function(animated){
    exchangeFrom.detach();
  });

  exchangeTo.animateCss("fadeInLeft", function(animated){
    tail.css("margin-top", head.css("margin-top"));

    if(exchangeTo == head){
      head.css("margin-bottom", tail.css("margin-bottom"));
    }
  });
}
