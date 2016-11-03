$(function(){
    var fileSelected = false,
        loadingIcon = "<div class='spinner'><div class='double-bounce1'></div><div class='double-bounce2'></div></div>";

    /**
     * A function to handle the picking of a file
     * @param {Object} evt - The file picking event e.g. drag, pick
     */
    pickFile = function(evt) {
      var target = evt.dataTransfer || evt.target || window.event.srcElement,
          files = target.files;

      setLoading();
      $("#filename").val(files[0].name.split(".")[0]);
      handleFileType(files[0]);
    }

    /** Indicates to the user that something is loading */
    setLoading = function(){
        $(".drag-n-drop-content").html(loadingIcon);
    }

    /**
     * Chooses a different handler for each file type e.g. Audio, Image
     * @param {File} file - The file that is being uploaded
     */
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

    /**
     * Parses the image and displays to the user
     * @param {File} image - The image file to be handled
     */
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

    /**
     * Displays the image in the upload box
     * @param {string} imageUrl - The url of the image to be displayed
     */
    appendImage = function(imageUrl){
        var uploadedImage = document.createElement("img"),
            image = new Image();

        image.src = imageUrl;
        uploadedImage.src = imageUrl;

        $(".drag-n-drop-content").html(uploadedImage);
        $(".drag-n-drop-overlay").removeClass("pointer");
        $("#submit").removeAttr("disabled");

        addField("file_type", "File Type", "text", "image");
        addField("height", "Height", "number", image.height);
        addField("width", "Width", "number", image.width);
    }

    /**
     * Utility function to cancel the default behaviour of an event
     * @param {Event} e - The event to cancel
     */
    cancel = function(e) {
      if (e.preventDefault) {
          e.preventDefault();
       }
      return false;
    }

    /**
     * Creates an input field inside the upload form
     * @param {string} name - The name of the input field
     * @param {string} labelText - The text in the input field to be displayed
     * @param {string} type - The type of the input field
     * @param {integer} value - The value inside the field
     */
    addField = function(name, labelText, type, value) {
        var inputElement = document.createElement("input"),
            labelElement = document.createElement("label");

        if($("input[name=" + name + "]").length === 0){
            inputElement.name = name;
            inputElement.id = name;
            inputElement.type = type;
            inputElement.className = "form-control";
            inputElement.placeholder = labelText;

            labelElement.htmlFor = name;
            labelElement.innerHTML = labelText;

            if(value) {
                inputElement.value = value;
            }

            $("#file-form #fieldset").append(labelElement, inputElement);

            return true;
        } else {
            return false;
        }
    }

    /**
     * Resets the form to allow for additional uploads
     * @param {boolean} success - Indicates if we're resetting because of a successful upload
     */
    resetForm = function(success) {
        $("input[type=text],input[type=number]").not("#filename").remove();
        $("label[for!='filename']").remove();
        $("#file-form")[0].reset();
        $("#submit").attr("disabled", "true");

        $(".drag-n-drop-overlay").addClass("pointer");

        if(success) {
            $(".drag-n-drop-content").html("<i class='fa fa-upload' aria-hidden='true'></i>&nbsp;Drag or pick a file to upload.");
            setUploadUrl(true);
        } else {
            $(".drag-n-drop-content").html("Opps! Something went wrong, please try again.");
        }
    }

    /**
     * Sets the upload url of the file uploader
     * @param {boolean} isSync - States if the request should be fired synchronously
     */
    setUploadUrl = function(isSync){
        $.ajax({
            url: "/upload",
            type: "GET",
            async: !!isAsync,
            success: function(data){
                $("#file-form").attr("action", data);
            }
        })
    }

    /** Asynchronously uploads the file and the fields to the server */
    submitForm = function(){
        var url = $("#file-form").attr("action");

        // To allow for async file uploads we require FormData, IE 9 does not use this
        if(typeof FormData !== "undefined"){
            var formData = new FormData($("#file-form")[0]);

            $.ajax({
                url: url,
                type: "POST",
                data: formData,
                beforeSend: function(){
                    setLoading();
                },
                processData: false,
                contentType: false,
                success: function(data){
                    $("#file-form").attr("action", data);
                    resetForm(true);
                }
            })
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

        // If the FormData object does not exist then we have to synchronously upload the file
        // therefore we rely on the form action
        if(e.preventDefault && typeof FormData !== "undefined"){
            e.preventDefault();
            submitForm();
        }
    });

    document.getElementById("file-picker").onchange = pickFile;

    /*
     * To prevent DDOS attempts, Google has a 10-minute limit on the upload URL
     * therefore every 9 minutes we request a new URL.
     * SEE: https://groups.google.com/forum/#!topic/google-appengine/55__MQ61EO0
     */
    setInterval(setUploadUrl, 1000 * 60 * 9);
});
