window.onload = GetManageres();

async function GetManageres(){
    var response = await fetch('/user/get-managers', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Output: "list"})
    });
    if(response.status == 200){
        var responseData = await response.json();
        console.log(responseData);
        document.getElementById("number-managers").innerText = `${responseData.users.length} managers`;
        for(var i=0; i<responseData.users.length; i++){
            DisplayManager(responseData.users[i]);
        }
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}

function DisplayManager(manager){
    var teams = "";
    for(var i=0; i<manager.Profiles.length; i++){
        if(manager.Profiles[i].RoleName == "Manager") teams += `<br>${manager.Profiles[i].TeamName}`;
    }
    teams = teams.substring(4);
    document.getElementById("users").innerHTML += `
    <a href="/user/view/${manager.ID}">
        <div class="user subsection-element">
            <p>${manager.Name}</p>
            <p>${manager.Email}</p>
            <p>${manager.Year}</p>
            <p>${manager.TShirtSize}</p>
            <p>${teams}</p>
        </div>
    </a>`;
}