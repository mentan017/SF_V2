var ProfileName = '';
var TeamName = '';
var TeamUUID = '';

window.onload = GetProfileInfo();

document.getElementById("remove-btn").addEventListener("click", RemoveProfile);

async function GetProfileInfo(){
    var URL = (document.location.href).split("#").join("").split("/");
    var profileID = URL[URL.length - 1];
    var response = await fetch('/profiles/get-profile-info', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({ProfileID: profileID})
    });
    if(response.status == 200){
        var responseData = await response.json();
        DisplayData(responseData);
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function DisplayData(profile){
    await RemoveEventListeners();
    ProfileName = profile.Name;
    TeamName = profile.TeamName;
    TeamUUID = profile.TeamUUID;
    document.title = `Springfest Apps | ${profile.Name}`;
    document.getElementById("header").innerHTML = `
    <div>
        <h1>${profile.Name} - ${profile.Year}</h1>
        <a href="mailto:${profile.Email}">${profile.Email}</a>
        <a href="/team/team/${profile.TeamUUID}">${profile.TeamName}</a>
    </div>`;
    var rolesOptionsHTML = '';
    for(var i=0; i<profile.Roles.length; i++){
        rolesOptionsHTML += `<option value="${profile.Roles[i].ID}">${profile.Roles[i].Name}</option>`
    }
    document.getElementById("role-input").innerHTML = rolesOptionsHTML;
    document.getElementById("role-input").value = profile.Role;
    document.getElementById("canManageSubTeams-input").value = profile.CanManageSubTeams;
    document.getElementById("canManageTeam-input").value = profile.CanManageTeam;
    document.getElementById("canManageTeamConfiguration-input").value = profile.CanManageTeamConfiguration;
    document.getElementById("getstshirt-input").value = profile.GetsTShirt;
    document.getElementById("tshirtsize-input").value = profile.TShirtSize;
    document.getElementById("tshirttext-input").value = profile.TShirtText;
    AddEventListeners();
}
function RemoveEventListeners(){
    var inputElements = ["role", "canManageSubTeams", "canManageTeam", "canManageTeamConfiguration", "getstshirt", "tshirtsize", "tshirttext"];
    for(var i=0; i<inputElements.length; i++){
        document.getElementById(`${inputElements[i]}-input`).removeEventListener("change", UpdateProfile);
    }
}
function AddEventListeners(){
    var inputElements = ["role", "canManageSubTeams", "canManageTeam", "canManageTeamConfiguration", "getstshirt", "tshirtsize", "tshirttext"];
    for(var i=0; i<inputElements.length; i++){
        document.getElementById(`${inputElements[i]}-input`).addEventListener("change", UpdateProfile);
    }
}
async function UpdateProfile(){
    var URL = (document.location.href).split("#").join("").split("/");
    var profileID = URL[URL.length - 1];
    var role = document.getElementById("role-input").value;
    var canManageSubTeams = (document.getElementById("canManageSubTeams-input").value).toLowerCase();
    var canManageTeam = (document.getElementById("canManageTeam-input").value).toLowerCase();
    var canManageTeamConfiguration = (document.getElementById("canManageTeamConfiguration-input").value).toLowerCase();
    var GetsTShirt = (document.getElementById("getstshirt-input").value).toLowerCase();
    var TShirtSize = (document.getElementById("tshirtsize-input").value);
    var TShirtText = (document.getElementById("tshirttext-input").value);
    canManageSubTeams = (canManageSubTeams.indexOf('t') != -1 || canManageSubTeams.indexOf('y') != -1) ? (true) : (false);
    canManageTeam = (canManageTeam.indexOf('t') != -1 || canManageTeam.indexOf('y') != -1) ? (true) : (false);
    canManageTeamConfiguration = (canManageTeamConfiguration.indexOf('t') != -1 || canManageTeamConfiguration.indexOf('y') != -1) ? (true) : (false);
    GetsTShirt = (GetsTShirt.indexOf('t') != -1 || GetsTShirt.indexOf('y') != -1) ? (true) : (false);
    var response = await fetch('/profiles/update-profile', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({ProfileID: profileID, Role: role, CanManageSubTeams: canManageSubTeams, CanManageTeam: canManageTeam, CanManageTeamConfiguration: canManageTeamConfiguration, GetsTShirt: GetsTShirt, TShirtSize: TShirtSize, TShirtText: TShirtText})
    });
    if(response.status == 200){
        GetProfileInfo();
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function RemoveProfile(){
    var URL = (document.location.href).split("#").join("").split("/");
    var profileID = URL[URL.length - 1];
    if(window.confirm(`Do you really want to remove ${ProfileName} from the ${TeamName} team?`)){
        var response = await fetch('/profiles/remove', {
            method: "DELETE",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({ProfileID: profileID})
        });
        if(response.status == 200){
            window.location.href = `/team/team/${TeamUUID}`;
        }else{
            window.alert("An error occured in the servers, please try again later.");
        }
    }
}