var ParentTeamUUID = '';

window.onload = GetRole();

document.getElementById("delete-btn").addEventListener("click", DeleteRole);

async function GetRole(){
    var URL = (document.location.href).split("#").join("").split("/");
    var roleID = URL[URL.length - 1];
    var response = await fetch('/roles/get-info', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({RoleID: roleID})
    });
    if(response.status == 200){
        await RemoveEventListeners();
        var responseData = await response.json();
        document.title = `Springfest Apps | ${responseData.TShirtText}`;
        document.getElementById("header").innerHTML = `
        <input type="text" id="rolename-input" value="${responseData.Name}">
        <a href="/team/team/${responseData.TeamUUID}">${responseData.TeamName}</a>`;
        ParentTeamUUID = responseData.TeamUUID;
        document.getElementById("tshirtText-input").value = responseData.TShirtText;
        document.getElementById("getsTshirt-input").value = responseData.GetsTShirt;
        document.getElementById("overridesTshirtTeamPriority-input").value = responseData.OverridesTShirtTeamPriority;
        document.getElementById("canManageSubTeams-input").value = responseData.CanManageSubTeams;
        document.getElementById("canManageTeam-input").value = responseData.CanManageTeam;
        document.getElementById("canManageTeamConfiguration-input").value = responseData.CanManageTeamConfiguration;
        AddEventListeners();
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function UpdateRole(){
    var URL = (document.location.href).split("#").join("").split("/");
    var roleID = URL[URL.length - 1];
    var role = document.getElementById("rolename-input").value;
    var overridesTshirtTeamPriority = (document.getElementById("overridesTshirtTeamPriority-input").value).toLowerCase();
    var canManageSubTeams = (document.getElementById("canManageSubTeams-input").value).toLowerCase();
    var canManageTeam = (document.getElementById("canManageTeam-input").value).toLowerCase();
    var canManageTeamConfiguration = (document.getElementById("canManageTeamConfiguration-input").value).toLowerCase();
    var getsTshirt = (document.getElementById("getsTshirt-input").value).toLowerCase();
    var tshirtText = document.getElementById("tshirtText-input").value;
    overridesTshirtTeamPriority = (overridesTshirtTeamPriority.indexOf('t') != -1 || overridesTshirtTeamPriority.indexOf('y') != -1) ? (true) : (false);
    canManageSubTeams = (canManageSubTeams.indexOf('t') != -1 || canManageSubTeams.indexOf('y') != -1) ? (true) : (false);
    canManageTeam = (canManageTeam.indexOf('t') != -1 || canManageTeam.indexOf('y') != -1) ? (true) : (false);
    canManageTeamConfiguration = (canManageTeamConfiguration.indexOf('t') != -1 || canManageTeamConfiguration.indexOf('y') != -1) ? (true) : (false);
    getsTshirt = (getsTshirt.indexOf('t') != -1 || getsTshirt.indexOf('y') != -1) ? (true) : (false);
    var response = await fetch('/roles/update-role', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({
            RoleID: roleID,
            Role: role,
            OverridesTShirtTeamPriority: overridesTshirtTeamPriority,
            CanManageSubTeams: canManageSubTeams,
            CanManageTeam: canManageTeam,
            CanManageTeamConfiguration: canManageTeamConfiguration,
            GetsTShirt: getsTshirt,
            TShirtText: tshirtText
        })
    });
    if(response.status == 200){
        GetRole();
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function DeleteRole(){
    var URL = (document.location.href).split("#").join("").split("/");
    var roleID = URL[URL.length - 1];
    var response = await fetch('/roles/delete-role', {
        method: "DELETE",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({RoleID: roleID})
    });
    if(response.status == 200){
        window.location.href = `/team/team/${ParentTeamUUID}`;
    }else if(response.status == 403){
        window.alert("Please create another role before deleting this one.");
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
function RemoveEventListeners(){
    var inputElements = ["rolename", "tshirtText", "getsTshirt", "overridesTshirtTeamPriority", "canManageSubTeams", "canManageTeam", "canManageTeamConfiguration"];
    for(var i=0; i<inputElements.length; i++){
        document.getElementById(`${inputElements[i]}-input`).removeEventListener("change", UpdateRole);
    }
}
function AddEventListeners(){
    var inputElements = ["rolename", "tshirtText", "getsTshirt", "overridesTshirtTeamPriority", "canManageSubTeams", "canManageTeam", "canManageTeamConfiguration"];
    for(var i=0; i<inputElements.length; i++){
        document.getElementById(`${inputElements[i]}-input`).addEventListener("change", UpdateRole);
    }
}