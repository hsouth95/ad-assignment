var EDIT_FUNCTIONS = [
    new EditFileFunction({
        id: "watermark",
        url: "/watermark/base64",
        name: "Watermark",
        fileTypes: ["image"],
        extensions: ["jpg"],
        event: function(data, url, callback){
            EditFileFunction.prototype.editFile(data, url, {
                success: callback,
                error: function(data){
                    alert(data);
                }
            });
        },
        displayableElement: function(){
            var div = document.createElement("div"),
                span = document.createElement("span"),
                button = document.createElement("button"),
                textBox = document.createElement("input");

            div.className = "input-group";
            span.className = "input-group-btn";
            
            textBox.className = "form-control";
            textBox.type = "text";
            textBox.placeholder = "Enter watermark text";

            button.innerHTML = this.name;
            button.id = this.id;
            button.className = "btn btn-default file-function";
            button.type="button";

            span.appendChild(button);

            div.appendChild(textBox);
            div.appendChild(span);

            return div;
        }
    })
];