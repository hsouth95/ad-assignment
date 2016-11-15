// Set global namespace
var harrison = harrison || {};

harrison.assignment = harrison.assignment || {};

harrison.assignment.header = harrison.assignment.header || {};

harrison.assignment.header.init = function(callback) {
    harrison.assignment.auth.initalAuthCallbacks = [
        harrison.assignment.header.setupAuthentication,
        callback]
    harrison.assignment.auth.init();
}

harrison.assignment.header.setupAuthentication = function(){
    if(harrison.assignment.auth.signedIn){
        $("#login-status").html("Sign Out");
    } else {
        $("#login-status").html("Sign In");
    }
}

$("#login-status").click(function(){
    if(harrison.assignment.auth.signedIn){
        harrison.assignment.auth.signOut(harrison.assignment.header.setupAuthentication);
    } else {
        harrison.assignment.auth.signIn(harrison.assignment.auth.isUserAuthed);
    }
});
