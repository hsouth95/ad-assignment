$(function () {
    var fileApi = new FileApi(),
        fileData = null;
    fileMediaUpdated = false;

    getFile = function () {
        var id = $("#edit-file").attr("data-id");

        if (id) {
            var filters = "id=" + id;
            fileApi.getFiles(filters, function (data) {
                var file = data[0];
                fileData = file;
                displayFileDetails(file);
            }, function (data) {
                toastr.error("Error getting file");
            })
        }
    }

    setLoading = function (visible) {
        if (visible) {
            $(".loading-block").show();
        } else {
            $(".loading-block").hide();
        }
    }

    displayFileDetails = function (file) {
        var fileAttributes = getFileAttributes(file.getDisplayableAttributes(), "edit-information"),
            fileEditFunctions = getFileEditFunctions(file);

        $.each(fileAttributes, function () {
            $("#edit-information")[0].appendChild(this);
        });

        $.each(fileEditFunctions, function () {
            $(".edit-block")[0].appendChild(this.displayableElement());
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
                editFunction.fire(document.getElementById("edit-file"), function (data) {
                    editFunction.replaceImageFile("edit-file", file.extension, data);
                    fileMediaUpdated = true;
                }, function (data) {
                    toastr.error("Failed to apply " + editFunction.name + " to the file.", "Error");
                });
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

    convertFormToJSON = function (form) {
        var array = $(form).serializeArray(),
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

    sendFile = function (file, callback) {
        var dataUrl = EditFileFunction.prototype.getDataUri(file),
            blob = EditFileFunction.prototype.dataUrlToBlob(dataUrl),
            formData = new FormData();

        formData.append("file", blob);
        formData.append("blob_key", fileData.blob_key);

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
            fileApi.updateFileData(fileData.id, data, function () {
                toastr.success("Updated file");
            });
        } else {
            toastr.success("Updated file");
        }
    }

    $("#save-btn").click(function () {
        var file = document.getElementById("edit-file");

        if (fileMediaUpdated) {
            sendFile(file, updateFile);
        } else {
            updateFile();
        }
    });

    getFile();
});