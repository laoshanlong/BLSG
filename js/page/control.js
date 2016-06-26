$.fn.extend({
    animateCss: function (animationName, callback) {
        var animationEnd = "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";
        $(this).addClass("animated " + animationName).one(animationEnd, function() {
            $(this).removeClass("animated " + animationName);

            if(callback === undefined)
              return;

            callback($(this));
        });
    }
});

$("select").select2();

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
  let templateEdit = $("#template-edit").clone();

  templateEdit.css("margin-top", $("#btn-add-rule").css("margin-top"));
  templateEdit.css("margin-bottom", $("#btn-add-rule").css("margin-bottom"));

  let outerHeight = $("#btn-add-rule").outerHeight();
  let marginBottom = parseInt($("#btn-add-rule").css("margin-bottom").slice(0, -2));

  console.log(outerHeight);
  console.log(marginBottom);

  $("#btn-add-rule").css("margin-bottom", (outerHeight + marginBottom) * -1);

  $("#btn-add-rule").animateCss("fadeOutRight", function(animated){
    animated.addClass("hidden");
  });

  templateEdit.insertAfter("#btn-add-rule");
  templateEdit.animateCss("fadeInLeft");
});

//temporary value
var index = 0;

$("#btn-submit").on("click", function(){
    let templateEdit = $("#template-edit").clone();

    ++index;

    templateEdit.attr("id", index.toString());

    let category = $("#select-category option:selected").val();
    let rule = $("#input-rule").val();
    let path = $("#input-path").val();

    templateEdit.find("#index").text("#"+index);

    templateEdit.find("#category").text(":"+category);
    templateEdit.find("#rule").text(rule);

    templateEdit.find("#path").text(path);
    templateEdit.find("#path-rule").text(rule);

    $("#rule").append(template);

    templateEdit.animateCss("fadeInRight");

    $("section").scrollTop(templateEdit.offset().top);
});

/*
$(".bs-callout").on("click", function(){
  $(".bs-callout").attr("active", "false");
  $(".bs-callout").attr("class", "bs-callout bs-callout-default");

  $(this).attr("active", "true");
  $(this).attr("class", "bs-callout bs-callout-primary");
});
*/
