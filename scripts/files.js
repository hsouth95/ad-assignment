$(function () {
    var fileApi = new FileApi();

    addElement = function (data) {
        var container = document.createElement("div");
        container.className = "item col-lg-3 col-md-4 col-sm-6 col-xs-12";

        var mediaElement;

        if (data instanceof ImageObject) {
            mediaElement = getImageElement(data);
        } else if (data instanceof AudioObject) {
            mediaElement = getAudioElement(data);
        } else if (data instanceof VideoObject) {
            mediaElement = getVideoElement(data);
        }

        var information = document.createElement("div");
        information.innerHTML = "<span>" + data.name + "</span>";
        information.className = "file-info";

        var editButton = document.createElement("span");
        editButton.innerHTML = "<i class='fa fa-pencil'></i>";
        editButton.className = "edit-button";

        editButton.addEventListener("click", function(){
            openEditWindow(data);
        });

        information.appendChild(editButton);

        container.appendChild(information);
        container.appendChild(mediaElement);

        $(".grid").append(container);
    }

    getImageElement = function (data) {
        var image = document.createElement("img");
        image.src = "/download/" + data.blob_key;

        return image;
    }

    getAudioElement = function (data) {
        var audio = document.createElement("audio");
        audio.src = "/download/" + data.blob_key;
        audio.controls = true;

        return audio;
    }

    getVideoElement = function (data) {
        var video = document.createElement("video");
        video.src = "/download/" + data.blob_key;
        video.controls = true;

        return video;
    }

    showElements = function () {
        $(".item").each(function (index) {
            setTimeout(function () {
                $(".item:nth-child(" + (index + 1) + ")").addClass("is-visible");
            }, 200 * index);
        });
    }

    openEditWindow = function(element) {
        var modalContent = document.getElementById("edit-modal-body"),
            mediaBlock = document.getElementsByClassName("media-block")[0],
            informationBlock = document.getElementsByClassName("information-block")[0];

        var span = document.createElement("span");
        span.innerText = "Blob: " + element.blob_key;

        var image = document.createElement("img");
        image.src = "/download/" + element.blob_key;

        informationBlock.appendChild(span);
        mediaBlock.appendChild(image);

        $("#edit-modal").modal({show: true});
    }

    clearEditWindow = function() {
        var mediaBlock = document.getElementsByClassName("media-block")[0],
            informationBlock = document.getElementsByClassName("information-block")[0];

        mediaBlock.innerHTML = "";
        informationBlock.innerHTML = "";
    }

    listItems = function () {
        fileApi.getFiles(function (data) {
            var elements = Array.prototype.concat(data.images, data.audios, data.videos);

            $.each(elements, function () {
                addElement(this);
            });

            showElements();
        });
    }

    $("#edit-modal").on("hidden.bs.modal", clearEditWindow);

    listItems();


});