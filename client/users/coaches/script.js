window.onload = GetCoaches();

async function GetCoaches(){
    var response = await fetch('/user/get-coaches', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Output: "list"})
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("number-coaches").innerText = `${responseData.users.length} coaches`;
        for(var i=0; i<responseData.users.length; i++){
            DisplayCoach(responseData.users[i]);
        }
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}

function DisplayCoach(coach){
    var teams = "";
    for(var i=0; i<coach.Profiles.length; i++){
        if(coach.Profiles[i].RoleName == "Coach") teams += `<br>${coach.Profiles[i].TeamName}`;
    }
    teams = teams.substring(4);
    document.getElementById("users").innerHTML += `
    <a href="/user/view/${coach.ID}">
        <div class="user">
            <p>${coach.Name}</p>
            <p>${coach.Email}</p>
            <p>${coach.TShirtSize}</p>
            <p>${teams}</p>
        </div>
    </a>`;
}