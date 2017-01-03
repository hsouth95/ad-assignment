var EDIT_FUNCTIONS = [
    new EditFileFunction({
        name: "Watermark",
        fileTypes: ["image"],
        extensions: ["jpg"],
        event: function(file, data, callback){
            editImage(file, "/watermark/base64");
        },
        displayableElement: function(){
            var div = document.createElement("div"),
                button = document.createElement("button"),
                textBox = document.createElement("input");

            div.className = "row";
            
            textBox.className = "form-control col-lg-8";
            textBox.type = "text";
            textBox.placeholder = "Enter watermark text";

            button.innerHTML = this.name;
            button.className = "btn btn-default col-lg-4";
            button.addEventListener("click", this.event);

            div.appendChild(textBox);
            div.appendChild(button);

            return div;
        }
    })
];