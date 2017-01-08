var EDIT_FUNCTIONS = [
    new EditFileFunction({
        id: "watermark",
        url: "/watermark/base64",
        name: "Watermark",
        fileTypes: ["image"],
        extensions: ["jpg"],
        extraData: function (data) {
            var value = $("#watermark-text").val();

            if (value) {
                data.append("value", value);
            }

            return data;
        },
        displayableElement: function () {
            var div = document.createElement("div"),
                span = document.createElement("span"),
                button = document.createElement("button"),
                textBox = document.createElement("input");

            div.className = "input-group";
            span.className = "input-group-btn";

            textBox.id = "watermark-text";
            textBox.className = "form-control";
            textBox.type = "text";
            textBox.placeholder = "Enter watermark text";

            button.innerHTML = this.name;
            button.id = this.id;
            button.className = "btn btn-default file-function";
            button.type = "button";

            span.appendChild(button);

            div.appendChild(textBox);
            div.appendChild(span);

            return div;
        }
    }),
    new EditFileFunction({
        id: "resize",
        url: "/resize/base64",
        name: "Resize",
        fileTypes: ["image"],
        extensions: ["jpg", "png"],
        extraData: function (data) {
            var height = $("#resize-height").val(),
                width = $("#resize-width").val();

            if (height) {
                data.append("height", height);
            }

            if (width) {
                data.append("width", width);
            }

            return data;
        },
        getUpdatedData: function () {
            var height = $("#resize-height").val(),
                width = $("#resize-width").val(),
                data = [];

            if(height){
                data.push({
                    name: "metadata-height",
                    value: height
                });
            }

            if(height){
                data.push({
                    name: "metadata-width",
                    value: width
                });
            }

            return data;
        },
        displayableElement: function () {
            var div = document.createElement("div"),
                button = document.createElement("button"),
                heightBox = document.createElement("input"),
                widthBox = document.createElement("input");
            
            div.className = "row";

            heightBox.id = "resize-height";
            heightBox.className = "form-control col-lg-4";
            heightBox.type = "number";
            heightBox.placeholder = "Enter file height";

            widthBox.id = "resize-width";
            widthBox.className = "form-control col-lg-4";
            widthBox.type = "number";
            widthBox.placeholder = "Enter file width";

            button.innerHTML = this.name;
            button.id = this.id;
            button.className = "btn btn-default file-function";
            button.type = "button";


            div.appendChild(widthBox);
            div.appendChild(heightBox);
            div.appendChild(button);

            return div;
        }
    }),
    new EditFileFunction({
        id: "greyscale",
        url: "/greyscale/base64",
        name: "Greyscale",
        fileTypes: ["image"],
        extensions: ["png", "jpg"],
        displayableElement: function () {
            var button = document.createElement("button");
            button.innerHTML = this.name;
            button.id = this.id;
            button.className = "btn btn-default file-function";
            button.type = "button";

            return button;
        }
    })
];