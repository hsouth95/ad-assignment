$(function () {
    var fileApi = new FileApi(),
        editingFile = null;

    addElement = function (data) {
        var container = document.createElement("div");
        container.className = "item col-lg-3 col-md-4 col-sm-6 col-xs-12";

        var mediaElement = getMediaElement(data);

        var information = document.createElement("div");
        information.innerHTML = "<span>" + data.name + "</span>";
        information.className = "file-info";

        var editButton = document.createElement("span");
        editButton.innerHTML = "<i class='fa fa-pencil'></i>";
        editButton.className = "edit-button";

        editButton.addEventListener("click", function () {
            editingFile = data;
            openEditWindow(data);
        });

        information.appendChild(editButton);

        container.appendChild(information);
        container.appendChild(mediaElement);

        $(".grid").append(container);
    }

    getMediaElement = function (data) {
        if (data instanceof ImageObject) {
            return getImageElement(data);
        } else if (data instanceof AudioObject) {
            return getAudioElement(data);
        } else if (data instanceof VideoObject) {
            return getVideoElement(data);
        }
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

    openEditWindow = function (element) {
        var modalContent = document.getElementById("edit-modal-body"),
            mediaBlock = document.getElementsByClassName("media-block")[0],
            informationBlock = document.getElementById("edit-information"),
            editActionsBlock = document.getElementById("edit-actions");

        var media = getMediaElement(element);
        media.id = "edit-media";
        mediaBlock.appendChild(media);

        var attributes = element.getDisplayableAttributes();

        for (attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
                var inputValue = document.createElement("div"),
                    label = document.createElement("label"),
                    input = document.createElement("input");

                label.innerHTML = attribute;

                input.type = "text";
                input.id = "edit-information-" + attribute;
                input.className = "form-control";
                input.placeholder = attributes[attribute];

                label.for = input.id;

                inputValue.appendChild(label);
                inputValue.appendChild(input);

                informationBlock.appendChild(inputValue);
            }
        }

        $("#edit-modal").modal({ show: true });
    }

    clearEditWindow = function () {
        var mediaBlock = document.getElementsByClassName("media-block")[0],
            informationBlock = document.getElementById("edit-information"),
            editActionsBlock = document.getElementById("edit-actions");

        mediaBlock.innerHTML = "";
        informationBlock.innerHTML = "";
        editActionsBlock.innerHTML = "";

        editingFile = null;
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

    getUploadUrl = function (callback) {
        $.ajax({
            url: "/upload",
            type: "GET",
            success: function (data) {
                callback(data);
            }
        });
    }

    $("#edit-modal").on("hidden.bs.modal", clearEditWindow);

    $("#edit-button-save").on("click", function () {
        Caman("#edit-media", function () {
            this.contrast(10);
            this.render(function () {
                var image = this.toBase64();
                urlToFile(image, editingFile.name, "image/" + editingFile.extension)
                    .then(function (file) {
                        var data = new FormData();
                        data.append("file", file);
                        data.append("blob_key", editingFile.blob_key);

                        getUploadUrl(function (url) {
                            $.ajax({
                                url: url,
                                type: "POST",
                                data: data,
                                processData: false,
                                contentType: false,
                                success: function (data) {
                                },
                                error: function (data) {
                                    alert(data);
                                }
                            })
                        });
                    });
            });
        });
    });

    urlToFile = function (url, filename, mimeType) {
        return (fetch(url)
            .then(function (res) { return res.arrayBuffer(); })
            .then(function (buf) { return new File([buf], filename, { type: mimeType }); })
        );
    }

    sendEditImage = function(formData, url) {
        $.ajax({
            url: url,
            type: "POST",
            data: formData,
            contentType: "image/jpeg",
            processData: false,
            success: function() {
                alert("yolo");
            },
            error: function(data) {
                alert(JSON.stringify(data));
            }
        });
    }

    $("#watermark-btn").on("click", function(){
        var value = $("#watermark-value").val(),
            formData = new FormData(),
            image = document.getElementById("edit-media");

        formData.append("value", value);
        var oReq = new XMLHttpRequest();
        oReq.open("GET", image.src, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function(oEvent) {
            var blob = new Blob([oReq.response], {type: "image/jpeg"});

            formData.append("file", blob);
            sendEditImage(formData, "/watermark");
        }
        oReq.send();
        
    });

    listItems();
});