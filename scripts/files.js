$(function () {
    var fileApi = new FileApi(),
        originalMediaObject = null,
        originalBlobKey = null,
        editingData = null,
        fileMediaUpdated = false;

    setLoading = function (visible) {
        if (visible) {
            $(".loading-block").show();
        } else {
            $(".loading-block").hide();
        }
    }

    addElement = function (data) {
        var container = document.createElement("div");
        container.className = "item col-lg-4 col-md-4 col-sm-6 col-xs-12";

        var mediaElement = getMediaElement(data);
        mediaElement.className += " center-block";

        var information = document.createElement("div");
        information.innerHTML = "<span>" + data.name + "</span>";
        information.className = "file-info";

        var editButton = getEditButton(data),
            shareButton = getShareButton(data),
            deleteButton = getDeleteButton(data);

        information.appendChild(deleteButton);
        information.appendChild(shareButton);
        information.appendChild(editButton);

        container.appendChild(information);
        container.appendChild(mediaElement);

        $(".grid").append(container);
    }

    getDeleteButton = function (data) {
        var deleteButton = document.createElement("span");
        deleteButton.innerHTML = "<i class='fa fa-times'></i>";
        deleteButton.className = "information-button delete-button";

        deleteButton.addEventListener("click", function () {
            var isConfirmed = window.confirm("Are you sure you want to delete this file permenantly?");
            if (isConfirmed) {
                FileApi.prototype.deleteFile(data.id, function () {
                    toastr.success("File successfully deleted");
                    listItems();
                }, function (data) {
                    toastr.error("File failed to delete");
                });
            }
        });

        return deleteButton;
    }

    getEditButton = function (data) {
        var editButton = document.createElement("span");
        editButton.innerHTML = "<i class='fa fa-pencil'></i>";
        editButton.className = "information-button edit-button";

        editButton.addEventListener("click", function () {
            originalBlobKey = data.blob_key;
            editingData = data;
            openEditWindow(data);
        });

        return editButton;
    }

    getShareButton = function (data) {
        var shareButton = document.createElement("span");
        shareButton.innerHTML = "<i class='fa fa-share-alt'></li>";
        shareButton.className = "information-button share-button";

        shareButton.addEventListener("click", function () {
            shareFile(data.id);
        });

        return shareButton;
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

    getFileEditFunctions = function (file) {
        var editFunctions = [];
        $.each(EDIT_FUNCTIONS, function () {
            if (!this.applicableFileTypes || this.applicableFileTypes.indexOf(file.file_type) !== -1) {
                if (!this.applicableExtensions || this.applicableExtensions.indexOf(file.extension) !== -1) {
                    editFunctions.push(this);
                }
            }
        });

        return editFunctions;
    }

    getFileAttributes = function (attributes, id) {
        var editInformationAttrs = [];
        for (var attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
                var inputValue = document.createElement("div"),
                    input = attributes[attribute].getInputElement(id),
                    label = attributes[attribute].getLabelElement(id);

                input.className = "form-control";

                inputValue.appendChild(label);
                inputValue.appendChild(input);

                editInformationAttrs.push(inputValue);
            }
        }

        return editInformationAttrs;
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

        attributeElements = getFileAttributes(attributes, "edit-information");
        fileEditFunctions = getFileEditFunctions(element);

        $.each(attributeElements, function () {
            informationBlock.appendChild(this);
        });
        $.each(fileEditFunctions, function () {
            editActionsBlock.appendChild(this.displayableElement());
        });

        $(".file-function").click(function () {
            var editFunction,
                that = this;

            $.each(fileEditFunctions, function () {
                if (this.id === that.id) {
                    editFunction = this;
                    return false;
                }
            });

            if (editFunction) {
                editFunction.fire(originalMediaObject, function (data) {
                    if (editFunction.getUpdatedData) {
                        updateSelectedFields(editFunction.getUpdatedData());
                    }

                    editFunction.replaceImageFile("edit-media", data.extension, data);
                    fileMediaUpdated = true;
                }, function (data) {
                    toastr.error("Failed to apply " + editFunction.name + " to the file.", "Error");
                });
            }
        });

        $("#edit-modal").modal({ show: true });
    }

    updateSelectedFields = function (data) {
        $.each(data, function () {
            var field = $("#edit-information-" + this.name);

            if (field) {
                field.val(this.value);
            }
        });
    }

    clearEditWindow = function () {
        var mediaBlock = document.getElementsByClassName("media-block")[0],
            informationBlock = document.getElementById("edit-information"),
            editActionsBlock = document.getElementById("edit-actions");

        mediaBlock.innerHTML = "";
        informationBlock.innerHTML = "";
        editActionsBlock.innerHTML = "";

        originalMediaObject = null;
        originalBlobKey = null;
        editingData = null;
        fileMediaUpdated = false;
    }

    getFilters = function () {
        var DELIMITER = "-",
            filterInputs = $(".sidebar").find("input"),
            filterData = {};

        $.each(filterInputs, function () {
            // Split by delimiter to find out the category of data
            var filterCategory = this.name.split(DELIMITER)[0],
                filterItem = this.name.split(DELIMITER)[1];

            switch (this.type) {
                case "checkbox":
                    if (this.checked) {
                        if (filterData[filterCategory]) {
                            filterData[filterCategory] += "," + filterItem;
                        } else {
                            filterData[filterCategory] = filterItem;
                        }
                    }
                    break;
                case "text":
                    if (this.value) {
                        filterData[filterItem] = this.value;
                    }
                    break;
            }
        });

        return filterData;
    }

    getSerializedFormArray = function (element) {
        var disabled = element.find(':input:disabled').removeAttr('disabled');
        var serialized = element.serializeArray();
        disabled.attr('disabled', 'disabled');

        return serialized;
    }

    convertFormToJSON = function (form) {
        var array = getSerializedFormArray($(form)),
            json = {},
            isFieldToUpdate = false;
        json.metadata = {};

        $.each(array, function () {
            if (this.value) {
                if (this.name.substr(0, "metadata-".length) === "metadata-") {
                    var attrName = this.name.split("metadata-")[1];
                    json.metadata[attrName] = this.value;
                } else {
                    json[this.name] = this.value || "";
                }

                isFieldToUpdate = true;
            }
        });

        // Only return data if any updates are present
        return isFieldToUpdate ? JSON.stringify(json) : null;
    }

    listItems = function () {
        $(".grid").html("<div class='loading-container'><div class='spinner'><div class='double-bounce1'></div><div class='double-bounce2'></div></div></div>");
        fileApi.getFiles($.param(getFilters()), function (data) {
            $(".grid").html("");

            if (data && data.length > 0) {
                $.each(data, function () {
                    addElement(this);
                });

                showElements();
            } else {
                $(".grid").html("<h1>No files</h1>");
            }
        });
    }

    shareFile = function (id) {
        fileApi.shareFile(id, function (data) {
            var url = EDIT_URL + "/" + data.id;
            toastr.success("Share from: <input onclick='this.select();' class='form-control' type='url' value='" + url + "' />", "Share Success", {
                timeOut: 0,
                extendedTimeOut: 0,
                closeButton: true,
                onclick: null,
                tapToDismiss: false
            });
        }, function (data) {
            toastr.error("Unable to create a shared file with error: <br />" + data + " <br />Please try again.", "Error");
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

    sendFile = function (file, callback) {
        var dataUrl = EditFileFunction.prototype.getDataUri(file),
            blob = EditFileFunction.prototype.dataUrlToBlob(dataUrl),
            formData = new FormData();

        formData.append("file", blob);
        formData.append("blob_key", originalBlobKey);

        getUploadUrl(function (url) {
            $.ajax({
                url: url,
                data: formData,
                type: "POST",
                contentType: false,
                processData: false,
                beforeSend: function () {
                    setLoading(true);
                },
                success: function (data) {
                    callback();
                },
                error: function (data) {
                    toastr.error("Failed to uploaded update file with error: " + data, "Error");
                },
                complete: function () {
                    setLoading(false);
                }
            })
        });
    }

    updateFile = function () {
        var form = $("#edit-information"),
            data = convertFormToJSON(form);

        if (data) {
            fileApi.updateFileData(editingData.id, data, function () {
                $("#edit-modal").modal("hide");
                toastr.success("Updated file");
                listItems();
            });
        } else {
            $("#edit-modal").modal("hide");
            toastr.success("Updated file");
            listItems();
        }
    }

    $("#edit-modal").on("hidden.bs.modal", clearEditWindow);

    $("#edit-save-btn").on("click", function () {
        var isConfirmed = window.confirm("Are you sure you want to save this file? It will not be revertable");
        if (isConfirmed) {
            var file = document.getElementById("edit-media");

            if (fileMediaUpdated) {
                sendFile(file, updateFile);
            } else {
                updateFile();
            }
        }
    });

    $("#filter-btn").on("click", function () {
        listItems();
    });

    listItems();
});