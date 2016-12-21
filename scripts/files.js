$(function () {
    var fileApi = new FileApi(),
        originalMediaObject = null,
        originalBlobKey = null;

    setLoading = function(visible) {
        if(visible) {
            $(".loading-block").show();
        } else {
            $(".loading-block").hide();
        }
    }

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
            originalBlobKey = data.blob_key;
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
            // Display each file with a delay of 200ms after the last file
            setTimeout(function () {
                $(".item:nth-child(" + (index + 1) + ")").addClass("is-visible");
            }, 200 * index);
        });
    }

    openEditWindow = function (element) {
        var modalContent = document.getElementById("edit-modal-body"),
            mediaBlock = document.getElementsByClassName("media-block")[0],
            informationBlock = document.getElementById("edit-information"),
            editActionsBlock = document.getElementById("edit-actions"),
            media = getMediaElement(element),
            attributes = element.getDisplayableAttributes();

        media.id = "edit-media";
        mediaBlock.appendChild(media);
        originalMediaObject = media;

        for (var attribute in attributes) {
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

        originalMediaObject = null;
    }

    getFilters = function() {
        var DELIMITER = "-",
            filterInputs = $(".sidebar").find("input"),
            filterData = {};

        $.each(filterInputs, function(){
            // Split by delimiter to find out the category of data
            var filterCategory = this.name.split(DELIMITER)[0],
                filterItem = this.name.split(DELIMITER)[1];

            switch(this.type) {
                case "checkbox":
                    if(this.checked){
                        if(filterData[filterCategory]){
                            filterData[filterCategory] += "," + filterItem;
                        } else {
                            filterData[filterCategory] = filterItem;
                        }
                    }
                    break;
                case "text":
                    if(this.value) {
                        filterData[filterItem] = this.value; 
                    }
                    break;
            }
        });

        return filterData;
    }

    listItems = function () {
        $(".grid").html("");
        fileApi.getFiles($.param(getFilters()), function (data) {
            var elements = Array.prototype.concat(data.images, data.audios, data.videos);

            if(elements && elements.length > 0){
                $.each(elements, function () {
                    addElement(this);
                });

                showElements();
            } else {
                $(".grid").html("<h1>No files</h1>");
            }
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

    dataURLtoBlob = function(dataurl) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type:mime});
    }

    getDataUri = function(image) {
        var canvas = document.createElement("canvas");
        canvas.height = image.naturalHeight;
        canvas.width = image.naturalWidth;

        canvas.getContext("2d").drawImage(image, 0, 0);

        return canvas.toDataURL("image/jpeg");
    }

    hexToBase64 = function(str) {
        return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
    }

    sendImage = function(image) {
        var blob = dataURLtoBlob(getDataUri(image)),
            formData = new FormData();
        
        formData.append("file", blob);
        formData.append("blob_key", originalBlobKey);
        getUploadUrl(function(url){
            $.ajax({
                url: url,
                data: formData,
                type: "POST",
                contentType: false,
                processData: false,
                beforeSend: function(){
                    setLoading(true);
                },
                success: function(data) {
                    var images = $(".grid").find("img[src$='/download/" + originalBlobKey +"']");

                    if(images) {
                        images[0].src = "/download/" + data.blob_key;
                        $("#edit-modal").modal("hide");
                    }
                },
                error: function(data) {
                    alert("error uploading image");
                },
                complete: function() {
                    setLoading(false);
                }
            })
        });
    }

    editImage = function(formData, url) {
        $.ajax({
            url: url,
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            beforeSend: function(){
                setLoading(true);
                $(".image-btn").prop("disabled", true);
                $("#edit-save-btn").prop("disabled", true);
            },
            success: function(data) {
                var updatedImage = document.createElement("img");
                updatedImage.id = "edit-media";
                updatedImage.onload = function() {
                    $("#edit-media").replaceWith(updatedImage);
                }
                updatedImage.src = "data:image/jpeg;base64," + decodeURIComponent(data);
            },
            error: function(data) {
                $("#edit-modal-body").prepend("Error with watermark: " + data.responseText);
            },
            complete:function(){
                setLoading(false);
                $(".image-btn").prop("disabled", false);
                $("#edit-save-btn").prop("disabled", false);
            }
        });
    }

    $("#watermark-btn").on("click", function(){
        var value = $("#watermark-value").val(),
            formData = new FormData(),
            image = originalMediaObject,
            dataUrl = getDataUri(image),
            blob = dataURLtoBlob(dataUrl);

        formData.append("value", value);
        formData.append("file", blob);

        editImage(formData, "/watermark/base64");
    });

    $("#edit-save-btn").on("click", function(){
        var image = document.getElementById("edit-media");

        sendImage(image);
    });

    $("#filter-btn").on("click", function(){
        listItems();
    });

    listItems();
});