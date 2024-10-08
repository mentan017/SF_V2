var UserRoles = [];
var TeamName = "";

window.onload = GetTeamInfo();

document.getElementById("add-users-btn").addEventListener("click", function(e){
    document.getElementById("add-user-super-container").style.display = "grid";
});
document.getElementById("close-users-btn").addEventListener("click", function(e){
    document.getElementById("add-user-super-container").style.display = "none";
});
document.getElementById("add-role-btn").addEventListener("click", function(e){
    document.getElementById("add-role-super-container").style.display = "grid";
});
document.getElementById("close-roles-btn").addEventListener("click", function(e){
    document.getElementById("add-role-super-container").style.display = "none";
});
document.getElementById("submit-bulk-users").addEventListener("click", AddBatchUsers);
document.getElementById("submit-individual-user").addEventListener("click", AddIndividualUser);
document.getElementById("submit-new-role").addEventListener("click", AddNewRole);
document.getElementById("delete-btn").addEventListener("click", DeleteTeam);

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
        GetUsers();
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
            GetUsers();
        }
    }else{
        document.getElementById("users-bulk-error").innerHTML = "Please provide an excel file";
    }
}
async function AddNewRole(){
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    ClearErrors();
    var RoleName = document.getElementById("new-role-input").value;
    if(RoleName){
        var response = await fetch(`/roles/new-role`, {
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({TeamUUID: teamUUID, RoleName: RoleName})
        });
        if(response.status == 200){
            GetRoles();
        }else{
            window.alert("An error occured in the servers, please try again later.");
        }
    }else{
        document.getElementById("new-role-error").innerText = "Please provide a role name";
    }
}
async function GetTeamInfo(){
    GetUsers();
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    var response = await fetch('/team/team-info', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({teamUUID: teamUUID})
    });
    if(response.status == 200){
        var responseData = await response.json();
        TeamName = responseData.TeamName;
        document.getElementById("header").innerHTML = `<input type="text" value="${responseData.TeamName}" id="teamname-input">`;
        document.title = `Springfest Apps | ${responseData.TeamName}`;
        document.getElementById("tshirt-color-name-input").value = responseData.TShirtColorName || "";
        document.getElementById("tshirt-color-hex-input").value = responseData.TShirtColorHEX || "";
        var elements = ["teamname-input", "tshirt-color-name-input", "tshirt-color-hex-input"];
        for(var i=0; i<elements.length; i++){
            document.getElementById(elements[i]).addEventListener("change", UpdateConfiguration);
        }
    }else{
        window.alert("An error occured in the servers, please try again later.");
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
    await GetRoles();
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    var response = await fetch('/team/list-users', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({teamUUID: teamUUID})
    });
    if(response.status == 200){
        var responseData = await response.json();
        UpdateUsers(responseData);
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function DeleteTeam(){
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    if(window.confirm(`Do you really want to delete the team: ${TeamName}?`)){
        var response = await fetch(`/team/delete/${teamUUID}`, {method: "DELETE"});
        if(response.status == 200){
            window.location.href = "/team/list-teams";
        }else{
            window.alert("An error occured in the servers, please try again later.");
        }
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
    document.getElementById("roles").innerHTML = `
    <div class="template roles">
        <p>Role</p>
        <p>Members</p>
    </div>`;
    for(var i=0; i<roles.length; i++){
        document.getElementById('user-role-input').innerHTML += `<option value="${roles[i].ID}">${roles[i].Name}</option>`;
        document.getElementById("roles").innerHTML += `
        <a href="/roles/${roles[i].ID}" class="role">
            <div>
                <p>${roles[i].Name}</p>
                <p>${roles[i].MembersWithRole}</p>
            </div>
        </a>`;
    }
}
function UpdateUsers(users){
    document.getElementById("users").innerHTML = `
    <div class="template users">
        <p>Name</p>
        <p>Email</p>
        <p>Year</p>
        <p>T-Shirt Size</p>
        <p>Role</p>
    </div>`;
    var rolesHTML = "";
    for(var i=0; i<UserRoles.length; i++){
        rolesHTML += `<option value="${UserRoles[i].ID}">${UserRoles[i].Name}</option>`;
    }
    for(var i=0; i<users.length; i++){
        var tshirtSizeStyle = '';
        if(!users[i].GetsTShirt) tshirtSizeStyle = 'background-color:rgba(255, 0, 0, 0.5)';
        var userElement = document.createElement("div");
        userElement.className = "user";
        userElement.innerHTML = `
        <a href="/profiles/${users[i].ID}"><div class="user-info">
            <p>${users[i].Name}</p>
            <p>${users[i].Email}</p>
            <p>${users[i].Year}</p>
        </div></a>
        <select class="user-tshirt-input" data-userid="${users[i].ID}" style="${tshirtSizeStyle}">
            <option value="XXS">XXS</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
        </select>
        <select class="user-role-input" data-userid="${users[i].ID}">${rolesHTML}</select>`;
        (userElement.getElementsByClassName("user-tshirt-input"))[0].value = users[i].TShirtSize;
        (userElement.getElementsByClassName("user-role-input"))[0].value = users[i].Role;
        (userElement.getElementsByClassName("user-tshirt-input"))[0].addEventListener("change", function(e){
            UpdateUserFields(this.getAttribute("data-userid"));
        });
        (userElement.getElementsByClassName("user-role-input"))[0].addEventListener("change", function(e){
            UpdateUserFields(this.getAttribute("data-userid"));
        });
        document.getElementById("users").appendChild(userElement);
    }
}
async function UpdateUserFields(UserID){
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    var inputs = document.querySelectorAll(`select[data-userid='${UserID}']`);
    var TShirtSize = inputs[0].value;
    var Role = inputs[1].value;
    var response = await fetch('/team/update-user', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({teamUUID: teamUUID, UserID: UserID, TShirtSize: TShirtSize, Role: Role})
    });
}
async function UpdateConfiguration(){
    var URL = (document.location.href).split("#").join("").split("/");
    var teamUUID = URL[URL.length - 1];
    var teamName = document.getElementById("teamname-input").value;
    var tshirtColorName = document.getElementById("tshirt-color-name-input").value;
    var tshirtColorHEX = document.getElementById("tshirt-color-hex-input").value;
    var response = await fetch('/team/update-configuration', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({teamUUID: teamUUID, TeamName: teamName, TShirtColorName: tshirtColorName, TShirtColorHEX: tshirtColorHEX})
    });
}