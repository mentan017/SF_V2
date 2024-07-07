var UserRoles = [];

window.onload = GetUsers();

document.getElementById("add-users-btn").addEventListener("click", function(e){
    document.getElementById("add-user-super-container").style.display = "grid";
});
document.getElementById("cancel-users-btn").addEventListener("click", function(e){
    document.getElementById("add-user-super-container").style.display = "none";
});
document.getElementById("submit-bulk-users").addEventListener("click", AddBatchUsers);
document.getElementById("submit-individual-user").addEventListener("click", AddIndividualUser);

async function AddIndividualUser(){
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    ClearErrors();
    var Email = document.getElementById("user-email-input").value;
    var TShirtSize = document.getElementById("user-t-shirt-input").value;
    var Role = document.getElementById("user-role-input").value;
    if(!Email){
        document.getElementById("users-individual-error").innerHTML = "Please provide an email";
    }else if(!TShirtSize){
        document.getElementById("users-individual-error").innerHTML = "Please provide a T-Shirt size";
    }else if(!Role){
        document.getElementById("users-individual-error").innerHTML = "Please select a role";
    }else{
        var response = await fetch(`/team/upload-individual-user/${teamUUID}`, {
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({Email: Email, TShirtSize: TShirtSize, Role: Role})
        });
        console.log(response.status);
    }
}
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
            //TODO Delete all users and fetch all users again
        }
    }else{
        document.getElementById("users-bulk-error").innerHTML = "Please provide an excel file";
    }
}
async function GetRoles(){
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    var response = await fetch('/team/list-roles', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({teamUUID: teamUUID})
    });
    if(response.status == 200){
        var responseData = await response.json();
        UserRoles = responseData;
        UpdateRoles(responseData);
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function GetUsers(){
    GetRoles();
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    var response = await fetch('/team/list-users', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({teamUUID: teamUUID})
    });
    if(response.status == 200){
        var responseData = await response.json();
        console.log(responseData);
    }
}
function ClearErrors(){
    var errors = document.getElementsByClassName("error");
    for(var i=0; i<errors.length; i++){
        errors[i].innerHTML = "";
    }
}
function UpdateRoles(roles){
    document.getElementById("user-role-input").innerHTML = "";
    for(var i=0; i<roles.length; i++){
        document.getElementById('user-role-input').innerHTML += `<option value="${roles[i].ID}">${roles[i].Name}</option>`;
    }
}