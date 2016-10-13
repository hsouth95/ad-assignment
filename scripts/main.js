$(function(){
    var fileSelected = false,
        loadingIcon = "<div class='spinner'><div class='double-bounce1'></div><div class='double-bounce2'></div></div>";

    pickFile = function(evt) {
      var target = evt.target || window.event.srcElement,
          files = target.files;

      $(".drag-n-drop-content").html(loadingIcon);
      $("#filename").val(files[0].name.split(".")[0]);
      handleFileType(files[0]);
    }

    handleFileType = function(file){
      var imgRegex = /^image\//,
          audioRegex = /^audio\//,
          videoRegex = /^video\//;

      if(imgRegex.test(file.type)) {
        handleImage(file);
      } else if(audioRegex.test(file.type)) {
        handleAudio(file);
      } else if(videoRegex.test(file.type)) {
        handleVideo(file);
      } else {
        alert("Bad file type!");
        resetForm(false);

        // Clear the files added to the picker
        document.getElementById("file-picker").value = "";
      }
    }

    handleImage = function(image){
      if(FileReader && image) {
          var fr = new FileReader();
          fr.onload = function () {
            appendImage(fr.result);
          }
          fr.readAsDataURL(image);
      } else {
        alert("File reading not supported!");
      }
    }

    appendImage = function(imageUrl){
        var uploadedImage = document.createElement("img"),
            image = new Image();

        image.src = imageUrl;
        uploadedImage.src = imageUrl;

        $(".drag-n-drop-content").html(uploadedImage);
        $(".drag-n-drop-overlay").removeClass("pointer");

        addField("height", "Height", "number", image.height);
        addField("width", "Width", "number", image.width);
    }

    cancel = function(e) {
      if (e.preventDefault) {
          e.preventDefault();
       }
      return false;
    }

    addField = function(name, labelText, type, value) {
        var inputElement = document.createElement("input"),
            labelElement = document.createElement("label");

        if($("input[name=" + name + "]").length === 0){
            inputElement.name = name;
            inputElement.id = name;
            inputElement.type = type;
            inputElement.placeholder = labelText;

            labelElement.htmlFor = name;
            labelElement.innerHTML = labelText;

            if(value) {
                inputElement.value = value;
            }

            $("#file-form fieldset").append(labelElement, inputElement);

            return true;
        } else {
            return false;
        }
    }

    resetForm = function(success) {
        $("input[type=text],input[type=number]").not("#filename").remove();
        $("label[for!='filename']").remove();
        $("#file-form")[0].reset();

        $(".drag-n-drop-overlay").addClass("pointer");

        if(success) {
            $(".drag-n-drop-content").html("<i class='fa fa-upload' aria-hidden='true'></i>&nbsp;Upload a file!");
        } else {
            $(".drag-n-drop-content").html("Opps! Something went wrong, please try again.");
        }
    }

    $("#file-picker-button").on("click", function(){
        if(!fileSelected){
          $("#file-picker").trigger("click");
        }
    });
    $("#file-picker-button").on("dragover", cancel);
    $("#file-picker-button").on("dragenter", cancel);
    $("#file-picker-button").on("drop", function(e){
        e = e || window.event;
        if (e.preventDefault) {
            e.preventDefault();
         }

         pickFile(e.originalEvent);
         return false;
    });

    $("#submit").on("click", function(e){
        e = e || window.event;
        if(e.preventDefault){
            e.preventDefault();
        }
    });

    document.getElementById("file-picker").onchange = pickFile;
});
