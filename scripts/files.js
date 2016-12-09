$(function() {
    var fileApi = new FileApi();

    addImage = function(data) {
        var container = document.createElement("div");
        container.className = "item col-md-3 col-sm-6 col-xs-12";

        var image = document.createElement("img");
        image.src = "/download/" + data.blob_key;

        var information = document.createElement("div");
        information.innerHTML = "File Name";
        information.className = "file-info";

        container.appendChild(information);
        container.appendChild(image);

        $(".grid").append(container);
    }

    addAudio = function(data) {
        var audio = document.createElement("audio");
        audio.src = "/download/" + data.blob_key;
        audio.controls = true;
        audio.className = "item col-md-3 col-sm-6 col-xs-12";

        $(".grid").append(audio);
    }

    addVideo = function(data) {
        var video = document.createElement("video");
        video.src = "/download/" + data.blob_key;
        video.controls = true;
        video.className = "item col-md-3 col-sm-6 col-xs-12";

        $(".grid").append(video);
    }

    showElements = function() {
        $(".item").each(function(index) {
            setTimeout(function() {
                $(".item:nth-child(" + (index + 1) + ")").addClass("is-visible");
            }, 200 * index);
        });
    }

    listItems = function() {
        fileApi.getFiles(function(data) {
            for (var i = 0; i < data.images.length; i++) {
                addImage(data.images[i]);
            }

            for (var i = 0; i < data.audios.length; i++) {
                addAudio(data.audios[i]);
            }

            for (var i = 0; i < data.videos.length; i++) {
                addVideo(data.videos[i]);
            }

            showElements();
        });
    }

    listItems();
});