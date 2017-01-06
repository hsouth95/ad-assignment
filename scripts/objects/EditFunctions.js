var EDIT_FUNCTIONS = [
    new EditFileFunction({
        id: "watermark",
        url: "/watermark/base64",
        name: "Watermark",
        fileTypes: ["image"],
        extensions: ["jpg"],
        extraData: function(data){
            var value = $("#watermark-text").val();

            if(value){
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
        id: "greyscale",
        url: "/greyscale/base64",
        name: "Greyscale",
        fileTypes: ["image"],
        extensions: ["png"],
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