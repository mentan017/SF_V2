document.getElementById("add-users-btn").addEventListener("click", function(e){
    document.getElementById("add-user-super-container").style.display = "grid";
});
document.getElementById("cancel-users-btn").addEventListener("click", function(e){
    document.getElementById("add-user-super-container").style.display = "none";
});
document.getElementById("submit-bulk-users").addEventListener("click", AddBatchUsers);

async function AddBatchUsers(){
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    ClearErrors();
    var files = document.getElementById("users-file").files;
    if(files.length == 1){
        //Get the columns of the fields
        var EmailColumn = document.getElementById("users-email-column").value;
        var TShirtColumn = document.getElementById("users-t-shirt-column").value;
        if(!EmailColumn){
            document.getElementById("users-bulk-error").innerHTML = "Please provide the email column";
        }else if(!TShirtColumn){
            document.getElementById("users-bulk-error").innerHTML = "Please provide the T-Shirt size column";            
        }else{
            var file = await files[0];
            var newFileName = `${EmailColumn}${TShirtColumn}${(new Date()).getTime()}.xlsx`;
            var formData = new FormData();
            var blob = file.slice(0, file.size, file.type);
            formData.append('files', new File([blob], newFileName, {type: file.type}));
            var response = await fetch(`/team/upload-batch-users/${teamUUID}`, {
                method: "PUT",
                body: formData
            });
            console.log(response.status);    
        }
    }else{
        document.getElementById("users-bulk-error").innerHTML = "Please provide an excel file";
    }
}
function ClearErrors(){
    var errors = document.getElementsByClassName("error");
    for(var i=0; i<errors.length; i++){
        errors[i].innerHTML = "";
    }
}