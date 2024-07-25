window.onload = ExecuteQuery();

document.getElementById("search-btn").addEventListener("click", function(e){
    var input = (document.getElementById("search-input").value).toLowerCase();
    if(input){
        window.location.href = `/user/search?query=${input.split(" ").join("_")}`;
    }
});

async function ExecuteQuery(){
    var URL = window.location.href;
    var query = URL.split('?')[1];
    var response = await fetch(`/user/search?${query}`, {
        method: "POST",
    });
    if(response.status == 200){
        var responseData = await response.json();
        DisplayResults(query, responseData);
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
function DisplayResults(query, users){
    document.getElementById("header-title").innerHTML = `<h1>Search results for: <br>"${query.split("_").join(" ").substring(6)}"</h1><p>${users.length} Results</p>`;
    for(var i=0; i<users.length; i++){
        var teams = "";
        for(var j=0; j<users[i].Profiles.length; j++){
            teams += `<br>${users[i].Profiles[j].TeamName}`;
        }
        teams = teams.substring(4);
        var style = "";
        if(teams == ""){
            teams = "none";
            style = "background-color: rgba(255, 0, 0, 0.5) !important;";
        }
        document.getElementById("users").innerHTML += `
        <a href="/user/view/${users[i].ID}">
            <div class="user" style="${style}">
                <p>${users[i].Name}</p>
                <p>${users[i].Email}</p>
                <p>${users[i].Year}</p>
                <p>${users[i].TShirtSize}</p>
                <p>${teams}</p>
            </div>
        </a>`;
    }
}