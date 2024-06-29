document.getElementById("create-team-btn").addEventListener("click", function(e){
    document.getElementById("create-team-form-super-container").style.display = "grid";
});
document.getElementById("cancel-btn").addEventListener("click", function(e){
    document.getElementById("create-team-form-super-container").style.display = "none";
});
document.getElementById("create-btn").addEventListener("click", SubmitNewTeam);

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
            window.alert("An error occured in the servers, please try again later.")
        }
    }
}

//TODO Fetch teams and other data