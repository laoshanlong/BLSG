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
      if($(this).hasClass("template-editor") == false){
        return false;
      }

      let rule = $(this).find("[name='input-rule']").val();
      if(rule === undefined || rule === ""){
        return false
      }

      let path = $(this).find("[name='input-path']").val();
      if(path === undefined || path === ""){
        return false;
      }

      return true;
    },
    extractEditData: function(){
      if($(this).validateEditData() == false){
        return undefined;
      }

      let target = $(this).attr("data-target");
      let category = $(this).find("[name='select-category'] option:selected").val();
      let rule = $(this).find("[name='input-rule']").val();
      let path = $(this).find("[name='input-path']").val();

      return {target: target, category: category, rule: rule, path: path};
    }
});

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
  if($("#editor-add").length > 0){
    return;
  }

  let editor = $("#template-editor").clone();

  editor.removeAttr("id");

  editor.find("[name='btn-submit']").on("click", {editor: editor}, onSubmitAddRule);
  editor.find("[name='btn-cancel']").on("click", {editor: editor}, onCancelAddRule);
  editor.find("[name|='dropdown-category']").each(function(index, element){
    let category = $(element);

    category.on("click", {editor: editor, category: category}, onSelectCategory);
  });

  let ruleEmpty = $("#rule-empty");

  if(ruleEmpty.hasClass("hidden") == false){
    exchangeFromTo(ruleEmpty, editor);
  }
  else{
    editor.appendTo(".rule-collection");
    editor.animateCss("fadeInLeft");
  }

  $("section").animate({scrollTop: editor.offset().top}, 800);
});

function onSubmitAddRule(event){
  let editor = event.data.editor;

  if(editor.validateEditData() == false){
    return;
  }

  let rule = $("#template-rule").clone();
  let index = $(".rule-collection > .template-rule").length;

  rule.attr("id", "rule-" + index);

  let editData = editor.extractEditData();

  rule.attr("data", editData);

  rule.find("[name='category']").text(":" + editData.category);
  rule.find("[name='rule']").text(editData.rule);
  rule.find("[name='path']").text(editData.path);
  rule.find("[name='path-rule']").text(editData.rule);

  exchangeFromTo(editor, rule, function(){
    editor.detach();
  });
}

function onCancelAddRule(event){
  let editor = event.data.editor;

  if( $(".rule-collection > .template-rule").length > 0){
    editor.animateCss("fadeOutRight", function(){
      editor.detach();
    });
  }
  else{
    exchangeFromTo(editor, $("#rule-empty"), function(){
      editor.detach();
    });
  }
}

function onSelectCategory(event){
  let editor = event.data.editor;
  let category = event.data.category;

  if(category.attr("active") !== undefined){
    return;
  }

  editor.find("[name|='dropdown-category'][active]").removeAttr("active").removeAttr("style");
  editor.find("[name|='input-rule']:not(.hidden)").addClass("hidden");

  category.attr("active", "");
  category.css("color", "#8CC152");

  editor.find("[name='btn-dropdown-category']").text(category.text());
  editor.find("[name='input-rule-"+category.attr("name").replace("dropdown-category-", "")+"']").removeClass("hidden");
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
