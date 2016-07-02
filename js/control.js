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
    validate: function(){
      if($(this).hasClass("template-editor") == false){
        return false;
      }
      let category = $(this).find("[name|='dropdown-category'][active]").attr("name").replace("dropdown-category-", "");
      let rule = $(this).find("[name='input-rule-"+category+"']").find("input").val();
      if(rule === undefined || rule === ""){
        return false
      }

      let path = $(this).find("[name='input-path']").val();
      if(path === undefined || path === ""){
        return false;
      }

      return true;
    },
    extract: function(){
      let category = $(this).find("[name|='dropdown-category'][active]").attr("name").replace("dropdown-category-", "");
      let rule = $(this).find("[name='input-rule-"+category+"']").find("input").val();
      if(rule === undefined || rule === ""){
        return undefined;
      }

      let path = $(this).find("[name='input-path']").val();
      if(path === undefined || path === ""){
        return undefined;
      }

      return {index: $(this).attr("index"), category: category, rule: rule, path: path};
    }
});

$("#btn-apply-active").on("click", function(){
  $("#btn-apply-active").addClass("hidden");
  $("#btn-apply-inactive").removeClass("hidden");
});

$("#btn-apply-inactive").on("click", function(){
  $("#btn-apply-active").removeClass("hidden");
  $("#btn-apply-inactive").addClass("hidden");
})

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
  editor.attr("index", $(".rule-collection > .template-rule").length);

  editor.find("[name='btn-submit']").on("click", {editor: editor}, onSubmitAddRule);
  editor.find("[name='btn-cancel']").on("click", {editor: editor}, onCancelAddRule);
  editor.find("[name|='dropdown-category']").each(function(index, element){
    let category = $(element);

    category.on("click", {editor: editor, category: category}, onSelectCategory);
  });

  let ruleEmpty = $("#notify-empty");

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
  let data = editor.extract();

  if(data === undefined){
    return;
  }

  let rule = $("#template-rule").clone();

  rule.removeAttr("id");
  rule.attr("data", data);

  rule.find("[name='category']").text(":" + data.category.toUpperCase());
  rule.find("[name='rule']").text(data.rule);
  rule.find("[name='path']").text(data.path);
  rule.find("[name='path-rule']").text(data.rule);

  exchangeFromTo(editor, rule, true);
}

function onCancelAddRule(event){
  let editor = event.data.editor;

  if( $(".rule-collection > .template-rule").length > 0){
    editor.animateCss("fadeOutRight", function(){
      editor.detach();
    });
  }
  else{
    exchangeFromTo(editor, $("#notify-empty"), true);
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

  editor.find("[name='lbl-dropdown-category']").text(category.text());
  editor.find("[name='input-rule-"+category.attr("name").replace("dropdown-category-", "")+"']").removeClass("hidden");
}

function exchangeFromTo(exchangeFrom, exchangeTo, isDetachFrom = false){
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

  exchangeTo.css("margin-top", 0);
  exchangeTo.css("margin-bottom", exchangeFrom.css("margin-bottom"));

  head.css("margin-bottom", head.outerHeight() * -1);

  exchangeFrom.animateCss("fadeOutRight", function(animated){
    if(isDetachFrom === true){
      exchangeFrom.detach();
    }
    else{
      exchangeFrom.addClass("hidden");
    }
  });

  exchangeTo.animateCss("fadeInLeft", function(animated){
    exchangeTo.css("margin-top", exchangeFrom.css("margin-top"));

    if(exchangeTo == head){
      exchangeTo.css("margin-bottom", exchangeFrom.css("margin-bottom"));
    }

    exchangeFrom.removeAttr("style");
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
