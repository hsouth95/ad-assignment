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
            document.getElementById("uploadedImage").src = fr.result;
            fileSelected = true;
            document.getElementById("file-picker-progress").innerHTML = "";
          }
          fr.readAsDataURL(image);
          document.getElementById("file-picker-progress").innerHTML =
          "<div class='spinner'><div class='double-bounce1'></div><div class='double-bounce2'></div></div>";
      } else {
        alert("File reading not supported!");
      }
    }

    $("#file-picker-section").on("click", function(){
        if(!fileSelected){
          $("#file-picker").trigger("click");
        }
    });

    document.getElementById("file-picker").onchange = pickFile;
});
