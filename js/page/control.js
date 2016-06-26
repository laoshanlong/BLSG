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
    validateEditData: function(){
      if($(this).hasClass("rule-edit") == false){
        return false;
      }

      let rule = $(this).find("#input-rule").val();
      if(rule === undefined || rule === ""){
        return false
      }

      let path = $(this).find("#input-path").val();
      if(path === undefined || path === ""){
        return false;
      }

      return true;
    },
    extractEditData: function(){
      if($(this).validateEditData() == false){
        return undefined;
      }

      let target = $(this).attr("data-edit-target");
      let category = $(this).find("#select-category option:selected").val();
      let rule = $(this).find("#input-rule").val();
      let path = $(this).find("#input-path").val();

      return {target: target, category: category, rule: rule, path: path};
    }
});

$("select").select2();
$("input[data-toggle='switch']").bootstrapSwitch();

/*
$("#btn-add-rule").on("click", function(){
  let templateEdit = $("#template-edit").clone();

  templateEdit.css("margin-top", $("#empty").css("margin-top"));
  templateEdit.css("margin-bottom", $("#empty").css("margin-bottom"));

  let outerHeight = $("#empty").outerHeight();
  let marginBottom = parseInt($("#empty").css("margin-bottom").slice(0, -2));

  console.log(outerHeight);
  console.log(marginBottom);

  $("#empty").css("margin-bottom", (outerHeight + marginBottom) * -1);

  $("#empty").animateCss("fadeOutRight", function(animated){
    animated.addClass("hidden");
  });

  templateEdit.insertAfter("#empty");
  templateEdit.animateCss("fadeInLeft");
});
*/

$("#btn-add-rule").on("click", function(){
  let editor = $("#template-edit").clone();

  editor.find("#btn-submit").on("click", {editor: editor}, onSubmitAddRule);

  exchangeFromTo($(this), editor);
});

function onSubmitAddRule(event){
  let editor = event.data.editor;

  exchangeFromTo(editor, $("#btn-add-rule"), function(){
    editor.detach();
  });

  if(editor.validateEditData() == false){
    return;
  }

  let rule = $("#template-rule").clone();
  let index = $(".rule-collection > .rule-item").length;

  rule.attr("id", "rule-item-" + index);

  let editData = editor.extractEditData();

  rule.attr("data-rule-category", editData.category);
  rule.attr("data-rule-rule", editData.rule);
  rule.attr("data-rule-path", editData.path);

  rule.find("#category").text(":" + editData.category);
  rule.find("#rule").text(editData.rule);
  rule.find("#path").text(editData.path);
  rule.find("#path-rule").text(editData.rule);

  let empty = $("#empty");

  if(empty.hasClass("hidden") == false){
    exchangeFromTo(empty, rule);
  }
  else{
    rule.appendTo(".rule-collection");
    rule.animateCss("fadeInLeft");
  }
}

function exchangeFromTo(exchangeFrom, exchangeTo, callback){
  exchangeFrom.removeClass("hidden");
  exchangeTo.removeClass("hidden");

  let head = exchangeFrom;
  let tail = exchangeTo;

  exchangeTo.detach().insertAfter(exchangeFrom);

  if(exchangeFrom.outerHeight() > exchangeTo.outerHeight()){
    head = exchangeTo;
    tail = exchangeFrom;

    exchangeFrom.detach().insertAfter(exchangeTo);
  }

  exchangeTo.css("margin-top", exchangeFrom.css("margin-top"));
  exchangeTo.css("margin-bottom", exchangeFrom.css("margin-bottom"));

  let outerHeight = head.outerHeight();
  let marginBottom = parseInt(head.css("margin-bottom").slice(0, -2));

  head.css("margin-bottom", (outerHeight + marginBottom) * -1);

  exchangeFrom.animateCss("fadeOutRight", function(animated){
    exchangeFrom.addClass("hidden");
  });

  exchangeTo.animateCss("fadeInLeft", function(animated){
    if(exchangeTo == head){
      exchangeTo.css("margin-bottom", exchangeFrom.css("margin-bottom"));
    }

    exchangeFrom.removeAttr("style");

    if(callback === undefined){
      return;
    }

    callback();
  });
}

/*
$(".bs-callout").on("click", function(){
  $(".bs-callout").attr("active", "false");
  $(".bs-callout").attr("class", "bs-callout bs-callout-default");

  $(this).attr("active", "true");
  $(this).attr("class", "bs-callout bs-callout-primary");
});
*/
