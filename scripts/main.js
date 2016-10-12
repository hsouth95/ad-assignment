$(function(){
    var fileSelected = false;

    pickFile = function(evt) {
      var target = evt.target || window.event.srcElement,
          files = target.files;

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

    appendImage = function(image){
        var uploadedImage = document.createElement("img");
        uploadedImage.src = image;
        $(".drag-n-drop-content").html(uploadedImage)
        $(".drag-n-drop-overlay").removeClass("pointer");
    }

    $("#file-picker-button").on("click", function(){
        if(!fileSelected){
          $("#file-picker").trigger("click");
        }
    });

    document.getElementById("file-picker").onchange = pickFile;
});
