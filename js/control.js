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
      if($(this).hasClass("template-rule") === true){
        return JSON.parse($(this).attr("data"));
      }

      if($(this).hasClass("template-editor") === true){
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

      return undefined;
    },
    inject: function(data){
      if($(this).hasClass("template-rule") === true){
        $(this).attr("index", data.index);
        $(this).attr("data", JSON.stringify(data));

        let categoryColor = "#FFFFFF";

        if(data.category === "extension"){
          categoryColor = "#5D9CEC";
        }
        else if(data.category === "regex"){
          categoryColor = "#967ADC";
        }

        $(this).find("[name='category']").text(":" + data.category.toUpperCase()).css("background-color", categoryColor);
        $(this).find("[name='rule']").text(data.rule).css("color", categoryColor);
        $(this).find("[name='path']").text(data.path);
        $(this).find("[name='path-rule']").text(data.rule);
      }

      if($(this).hasClass("template-editor") === true){
        $(this).attr("index", data.index);

        $(this).find("[name|='dropdown-category'][active]").removeAttr("active").removeAttr("style");
        $(this).find("[name|='input-rule']:not(.hidden)").addClass("hidden");

        $(this).find("[name='dropdown-category-"+data.category+"']").attr("active", "").css("color", "#8CC152");
        $(this).find("[name='lbl-dropdown-category']").text(":" + data.category.toUpperCase());
        $(this).find("[name='input-rule-"+data.category+"']").removeClass("hidden").find("input").val(data.rule);
        $(this).find("[name='input-path']").val(data.path);
      }

      return $(this);
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
  if($(".template-editor[index='"+ $(".rule-collection > .template-rule").length+"']").length > 0){
    return;
  }

  let editor = createEditor().inject({index: $(".rule-collection > .template-rule").length, category: "extension", rule: "", path: ""});

  if($("#notify-empty:hidden").length > 0){
    editor.appendTo(".rule-collection").animateCss("fadeInLeft");
  }
  else{
    exchangeFromTo($("#notify-empty"), editor);
  }

  $("section").animate({scrollTop: editor.offset().top}, 800);
});

function createEditor(){
  let editor = $("#template > .template-editor").clone();

  editor.find("[name='btn-submit']").on("click", {editor: editor}, onSubmit);
  editor.find("[name='btn-cancel']").on("click", {editor: editor}, onCancel);
  editor.find("[name|='dropdown-category']").each(function(index, element){
    let category = $(element);

    category.on("click", function(){
      if(category.attr("active") !== undefined){
        return;
      }

      editor.find("[name|='dropdown-category'][active]").removeAttr("active").removeAttr("style");
      let edited = editor.find("[name|='input-rule']:not(.hidden)").addClass("hidden").find("input").val();

      category.attr("active", "").css("color", "#8CC152");

      editor.find("[name='lbl-dropdown-category']").text(category.text());
      editor.find("[name='input-rule-"+category.attr("name").replace("dropdown-category-", "")+"']").removeClass("hidden").find("input").val(edited);
    });
  });

  return editor;
}

function createRule(){
  let rule = $("#template > .template-rule").clone();

  rule.find("[name='btn-edit']").on("click", {rule: rule}, onEdit);

  return rule;
}

function onSubmit(event){
  let data = event.data.editor.extract();

  if(data === undefined){
    return;
  }

  let rule = $(".template-rule[index='"+data.index+"']");

  if(rule.length === 0){
    rule = createRule();
  }

  exchangeFromTo(event.data.editor, rule.inject(data), true);
}

function onCancel(event){
  let data = event.data.editor.extract();

  if( $(".rule-collection > .template-rule").length > 0){
    let rule = $(".template-rule[index='"+data.index+"']");

    if(rule.length > 0){
      exchangeFromTo(event.data.editor, rule, true);
    }
    else{
      event.data.editor.animateCss("fadeOutRight", function(){
        event.data.editor.detach();
      });
    }
  }
  else{
    exchangeFromTo(event.data.editor, $("#notify-empty"), true);
  }
}

function onEdit(event){
  exchangeFromTo(event.data.rule, createEditor().inject(event.data.rule.extract()));
}

function exchangeFromTo(exchangeFrom, exchangeTo, detachFrom = false){
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
    if(detachFrom === true){
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
