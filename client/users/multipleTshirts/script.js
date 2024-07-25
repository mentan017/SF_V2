window.onload = GetUseres();

async function GetUseres(){
    var response = await fetch('/user/get-users-multiple-tshirts', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Output: "list"})
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("number-users").innerText = `${responseData.users.length} users`;
        for(var i=0; i<responseData.users.length; i++){
            DisplayUser(responseData.users[i]);
        }
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}

function DisplayUser(user){
    var teams = "";
    for(var i=0; i<user.Profiles.length; i++){
        if(user.Profiles[i].GetsTShirt) teams += `<br>${user.Profiles[i].TeamName}`;
    }
    teams = teams.substring(4);
    document.getElementById("users").innerHTML += `
    <a href="/user/view/${user.ID}">
        <div class="user">
            <p>${user.Name}</p>
            <p>${user.Email}</p>
            <p>${user.Year}</p>
            <p>${user.TShirtSize}</p>
            <p>${teams}</p>
        </div>
    </a>`;
}