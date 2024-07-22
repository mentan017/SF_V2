window.onload = GetUsersData();

document.getElementById("search-btn").addEventListener("click", function(e){
    var input = (document.getElementById("search-input").value).toLowerCase();
    if(input){
        window.location.href = `/user/search?query=${input.split(" ").join("_")}`;
    }
});

function GetUsersData(){
    GetUsers();
    GetUsersMultipleTeams();
    GetUsersMultipleTShirts();
    GetManagers();
    GetCoaches();
}
async function GetUsers(){
    var response = await fetch('/user/get-users', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Output: "count"})
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("header-title").innerHTML = `<h1>Users</h1><p>${responseData.users} Members</p>`;
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function GetUsersMultipleTeams(){
    var response = await fetch('/user/get-users-multiple-teams', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Output: "count"})
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("users-multiple-teams").innerText = responseData.users;
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function GetUsersMultipleTShirts(){
    var response = await fetch('/user/get-users-multiple-tshirts', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Output: "count"})
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("users-multiple-tshirts").innerText = responseData.users;
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function GetManagers(){
    var response = await fetch('/user/get-managers', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Output: "count"})
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("managers").innerText = responseData.users;
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function GetCoaches(){
    var response = await fetch('/user/get-coaches', {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Output: "count"})
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("coaches").innerText = responseData.users;
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}