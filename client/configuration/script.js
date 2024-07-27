window.onload = InitPage();

function InitPage(){
    var uploadBtns = document.getElementsByClassName("upload-btn");
    for(var i=0; i<uploadBtns.length; i++){
        uploadBtns[i].addEventListener("click", UploadFile);
    }
    document.getElementById("reset-btn").addEventListener("click", ConfirmReset);
    document.getElementById("confirm-reset").addEventListener("click", ResetAll);
    GetConfig();
}

async function GetConfig(){
    var response = await fetch('/configuration/get-config', {method: "POST"});
    if(response.status == 200){
        var responseData = await response.json();
        DisplayConfig(responseData);
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function UpdateConfig(){
    var springfestDate = document.getElementById("springfestdate-input").valueAsNumber || 0;
    if(springfestDate >= 0){
        var response = await fetch('/configuration/update-config', {
            method: "POST",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({SpringfestDate: springfestDate})
        });    
        if(response.status == 200){
            GetConfig();
        }else{
            window.alert("An error occured in the servers, please try again later.");
        }
    }
}
async function UploadFile(){
    var targetRoutes = [];
    var files = document.getElementById("logo-input").files;
    if(files.length == 1) targetRoutes.push("logo");
    files = document.getElementById("students-input").files;
    if(files.length == 1) targetRoutes.push("students");
    files = document.getElementById("teachers-input").files;
    if(files.length == 1) targetRoutes.push("teachers");
    for(var i=0; i<targetRoutes.length; i++){
        files = document.getElementById(`${targetRoutes[i]}-input`).files;
        var file = await files[0];
        var formData = new FormData();
        var blob = file.slice(0, file.size, file.type);
        formData.append('files', new File([blob], file.name, {type: file.type}));
        var response = await fetch(`/configuration/upload-${targetRoutes[i]}-file`, {
            method: "PUT",
            body: formData
        });
        document.getElementById(`${targetRoutes[i]}-input`).value = '';
    }
    GetConfig();
}
async function ResetAll(){
    var password = document.getElementById("password-input").value;
    password = await hashValue(password);
    var response = await fetch('/configuration/reset-all', {
        method: "DELETE",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Password: password})
    });
    if(response.status == 200){
        window.location.href = "/";
    }else if(response.status == 400){
        document.getElementById("error").innerText = "The password is wrong";
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
function DisplayConfig(config){
    DateEventListner('remove');
    if(config.SpringfestDate != 0) document.getElementById("springfestdate-input").valueAsNumber = config.SpringfestDate;
    DateEventListner('add');
    document.getElementById("teams").innerHTML = `<div class="template"><p>Position</p><p>Team Name</p><p>Move Up</p><p>Move Down</p></div>`;
    for(var i=0; i<config.TeamPriorities.length; i++){
        document.getElementById("teams").innerHTML += `
        <div class="team" data-uuid="${config.TeamPriorities[i]}">
            <p>${i+1}</p>
            <a href="/team/team/${config.TeamPriorities[i]}">${config.Teams[i]}</a>
            <p class="mvt-btn" data-mvt="1">Up &uarr;</p>
            <p class="mvt-btn" data-mvt="-1">Down &darr;</p>
        </div>`;
    }
    var mvtBtns = document.getElementsByClassName("mvt-btn");
    for(var i=0; i<mvtBtns.length; i++){
        mvtBtns[i].addEventListener("click", function(e){
            var teamUUID = this.parentElement.getAttribute("data-uuid");
            var mvt = parseInt(this.getAttribute("data-mvt"));
            MoveTeam(teamUUID, mvt);
        });
    }
}
async function MoveTeam(team, mvt){
    var teams = document.getElementsByClassName("team");
    var teamsUUID = [];
    for(var i=0; i<teams.length-1; i++){
        var currentUUID = teams[i].getAttribute("data-uuid");
        var nextUUID = teams[(i+1)%teams.length].getAttribute("data-uuid");
        if(mvt == 1){
            if(nextUUID == team){
                teamsUUID.push(nextUUID);
                i++;
                didMvt = true;
            }
            teamsUUID.push(currentUUID);
        }else{
            if(currentUUID == team){
                teamsUUID.push(nextUUID);
                i++;
            }
            teamsUUID.push(currentUUID);
        }
    }
    if(teamsUUID.length != teams.length){
        teamsUUID.push(teams[teams.length-1].getAttribute("data-uuid"));
    }
    var response = await fetch('/configuration/update-teams-priorities', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({NewOrder: teamsUUID})
    });
    if(response.status == 200){
        GetConfig();
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
function DateEventListner(mode){
    if(mode == 'add'){
        document.getElementById("springfestdate-input").addEventListener("change", UpdateConfig);
    }else{
        document.getElementById("springfestdate-input").removeEventListener("change", UpdateConfig);
    }
}
function ConfirmReset(){
    document.getElementById("reset-super-container").style.display = "grid";
}
async function hashValue(variable){
    var varUint8 = new TextEncoder().encode(variable);
    var hashBuffer = await crypto.subtle.digest('SHA-256', varUint8);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    var hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return(hashHex);
}