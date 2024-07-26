var Name = "";

window.onload = GetUser();

document.getElementById("activate-btn").addEventListener("click", ActivateUser);
document.getElementById("remove-btn").addEventListener("click", RemoveUser);

async function GetUser(){
    var URL = (document.location.href).split("#").join("").split("/");
    var userID = URL[URL.length - 1];
    var response = await fetch('/user/get-user', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({UserID: userID})
    });
    if(response.status == 200){
        var responseData = await response.json();
        DisplayData(responseData);
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function UpdateUser(){
    var URL = (document.location.href).split("#").join("").split("/");
    var userID = URL[URL.length - 1];
    var name = document.getElementById("name-input").value;
    var email = document.getElementById("email-input").value;
    var username = document.getElementById("username-input").value;
    var year = document.getElementById("year-input").value;
    var tshirtSize = (document.getElementById("tshirtsize-input").value).toUpperCase();
    var canAccessMeetings = (document.getElementById("canaccessmeetings-input").value).toLowerCase();
    var canAccessTeams = (document.getElementById("canaccessteams-input").value).toLowerCase();
    var canManageAllMeetings = (document.getElementById("canmanageallmeetings-input").value).toLowerCase();
    var canManageAllTeams = (document.getElementById("canmanageallteams-input").value).toLowerCase();
    var canManageAllUsers = (document.getElementById("canmanageallusers-input").value).toLowerCase();
    var canManageConfiguration = (document.getElementById("canmanageconfiguration-input").value).toLowerCase();
    var canUseTools = (document.getElementById("canusetools-input").value).toLowerCase();
    canAccessMeetings = (canAccessMeetings.indexOf('t') != -1 || canAccessMeetings.indexOf('y') != -1) ? (true) : (false);
    canAccessTeams = (canAccessTeams.indexOf('t') != -1 || canAccessTeams.indexOf('y') != -1) ? (true) : (false);
    canManageAllMeetings = (canManageAllMeetings.indexOf('t') != -1 || canManageAllMeetings.indexOf('y') != -1) ? (true) : (false);
    canManageAllTeams = (canManageAllTeams.indexOf('t') != -1 || canManageAllTeams.indexOf('y') != -1) ? (true) : (false);
    canManageAllUsers = (canManageAllUsers.indexOf('t') != -1 || canManageAllUsers.indexOf('y') != -1) ? (true) : (false);
    canManageConfiguration = (canManageConfiguration.indexOf('t') != -1 || canManageConfiguration.indexOf('y') != -1) ? (true) : (false);
    canUseTools = (canUseTools.indexOf('t') != -1 || canUseTools.indexOf('y') != -1) ? (true) : (false);
    var response = await fetch('/user/update-user', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({
            UserID: userID,
            Name: name,
            Email: email,
            Username: username,
            Year: year,
            TShirtSize: tshirtSize,
            CanAccessMeetings: canAccessMeetings,
            CanAccessTeams: canAccessTeams,
            CanManageAllMeetings: canManageAllMeetings,
            CanManageAllTeams: canManageAllTeams,
            CanManageAllUsers: canManageAllUsers,
            CanManageConfiguration: canManageConfiguration,
            CanUseTools: canUseTools
        })
    });
    if(response.status = 200){
        GetUser();
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function ActivateUser(){
    var URL = (document.location.href).split("#").join("").split("/");
    var userID = URL[URL.length - 1];
    if(window.confirm(`Do you want to activate ${Name}'s account?`)){
        var response = await fetch('/user/activate', {
            method: "POST",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({UserID: userID})
        });
        if(response.status == 200){
            window.alert(`${Name}'s account password is : ${(await response.json()).Password}`);
            document.getElementById("activate-btn").style.backgroundColor = 'grey';
            document.getElementById("activate-btn").removeEventListener("click", ActivateUser);
        }else{
            window.alert("An error occured in the servers, please try again later.");
        }
    }
}
async function RemoveUser(){
    var URL = (document.location.href).split("#").join("").split("/");
    var userID = URL[URL.length - 1];
    if(window.confirm(`Do you want to remove ${Name} from the database?`)){
        var response = await fetch('/user/delete', {
            method: "DELETE",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({UserID: userID})
        });
        if(response.status == 200){
            window.alert(`${Name} was removed from the database successfully`);
            window.location.href = '/user/dashboard';
        }else{
            window.alert("An error occured in the servers, please try again later.");
        }
    }
}

async function DisplayData(user){
    Name = user.Name;
    document.title = `Springfest Apps | ${user.Name}`;
    await RemoveEventListeners();
    if(user.Activated){
        document.getElementById("activate-btn").style.backgroundColor = 'grey';
        document.getElementById("activate-btn").removeEventListener("click", ActivateUser);
    }
    document.getElementById("header").innerHTML = `<div><h1>${user.Name} - ${user.Year}</h1><a href="mailto:${user.Email}">${user.Email}</a>`;
    document.getElementById("profiles").innerHTML = `
    <div class="template">
        <p>Team</p>
        <p>Role</p>
        <p>T-Shirt Text</p>
        <p>Gets T-Shirt</p>
    </div>`;
    for(var i=0; i<user.Profiles.length; i++){
        var style = (user.Profiles[i].GetsTShirt) ? ("") : ("background-color: rgba(255, 0, 0, 0.5) !important;");
        document.getElementById("profiles").innerHTML += `
        <a href="/profiles/${user.Profiles[i].ID}">
            <div class="profile">
                <p>${user.Profiles[i].TeamName}</p>
                <p>${user.Profiles[i].RoleName}</p>
                <p>${user.Profiles[i].TShirtText}</p>
                <p style="${style}">${user.Profiles[i].GetsTShirt}</p>
            </div>
        </a>`;
    }
    document.getElementById("name-input").value = user.Name;
    document.getElementById("email-input").value = user.Email;
    document.getElementById("username-input").value = user.Username;
    document.getElementById("year-input").value = user.Year;
    document.getElementById("tshirtsize-input").value = user.TShirtSize;
    document.getElementById("canaccessmeetings-input").value = user.CanAccessMeetings;
    document.getElementById("canaccessteams-input").value = user.CanAccessTeams;
    document.getElementById("canmanageallmeetings-input").value = user.CanManageAllMeetings;
    document.getElementById("canmanageallteams-input").value = user.CanManageAllTeams;
    document.getElementById("canmanageallusers-input").value = user.CanManageAllUsers;
    document.getElementById("canmanageconfiguration-input").value = user.CanManageConfiguration;
    document.getElementById("canusetools-input").value = user.CanUseTools;
    AddEventListeners();
}
function RemoveEventListeners(){
    var inputElements = ["name", "email", "username", "year", "tshirtsize", "canaccessmeetings", "canaccessteams", "canmanageallmeetings", "canmanageallteams", "canmanageallusers", "canmanageconfiguration", "canusetools"];
    for(var i=0; i<inputElements.length; i++){
        document.getElementById(`${inputElements[i]}-input`).removeEventListener("change", UpdateUser);
    }
}
function AddEventListeners(){
    var inputElements = ["name", "email", "username", "year", "tshirtsize", "canaccessmeetings", "canaccessteams", "canmanageallmeetings", "canmanageallteams", "canmanageallusers", "canmanageconfiguration", "canusetools"];
    for(var i=0; i<inputElements.length; i++){
        document.getElementById(`${inputElements[i]}-input`).addEventListener("change", UpdateUser);
    }
}