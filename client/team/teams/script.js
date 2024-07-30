window.onload = GetUserData();

async function SubmitNewTeam(){
    var teamName = document.getElementById("team-name-input").value;
    if(teamName){
        var response = await fetch('/team/create-team', {
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({TeamName: teamName})
        });
        if(response.status == 200){
            var responseData = await response.json();
            window.location.href = `/team/team/${responseData.UUID}`;
        }else if(response.status == 401){
            window.location.href = "/";
        }else{
            window.alert("An error occured in the servers, please try again later.");
        }
    }
}

//TODO Fetch teams and other data
async function GetUserData(){
    var response = await fetch('/user/user-permissions', {
        method: "POST",
        headers: {"Content-type": "application/json"}
    });
    if(response.status == 200){
        var responseData = await response.json();
        AddHeader();
        if(responseData.ManageAllTeams){
            AddCreateTeamElement();
            document.getElementById("create-team-btn").addEventListener("click", function(e){
                document.getElementById("create-team-form-super-container").style.display = "grid";
            });
            document.getElementById("cancel-btn").addEventListener("click", function(e){
                document.getElementById("create-team-form-super-container").style.display = "none";
            });
            document.getElementById("create-btn").addEventListener("click", SubmitNewTeam);
        }
        FetchTeams();
    }else if(response.status == 401){
        window.location.href = "/";
    }else{
        window.alert("An error occulred in the servers, please try again later.");
    }
}
async function FetchTeams(){
    var response = await fetch('/team/list-teams', {
        method: "POST",
        headers: {"Content-type": "application/json"},
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("teams-amount").innerText = `${responseData.length} teams`;
        DisplayTeams(responseData);
    }else if(response.status == 401){
        window.location.href = "/";
    }else{
        window.alert("An error occulred in the servers, please try again later.");
    }
}
function AddHeader(){
    document.getElementById("header-container").innerHTML = `
    <div id="header">
        <h1>Teams</h1>
        <p id="teams-amount">xx teams</p>
    </div>`
}
function AddCreateTeamElement(){
    document.getElementById("header-container").innerHTML += `
    <div class="create-team-container">
        <p class="create-team-prompt">Create a new team</p>
        <div id="create-team-btn">+ Create</div>
    </div>`;
    document.getElementById("header-container").classList.toggle("create-team-enabled");
}
function DisplayTeams(teams){
    for(var i=0; i<teams.length; i++){
        document.getElementById("teams").innerHTML += `
        <a href="/team/team/${teams[i].UUID}">
            <div class="team subsection-element">
                <p>${teams[i].Name}</p>
                <p>${teams[i].Managers}</p>
                <p>${teams[i].Coaches}</p>
                <p>${teams[i].TotalMembers}</p>
            </div>    
        </a>`
    }
}