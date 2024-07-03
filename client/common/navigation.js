window.onload = GetNavigation();

async function GetNavigation(){
    var response = await fetch('/user/get-user-navigation', {
        method: "POST",
        "headers": {"Content-type": "application/json"}
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("navigation").innerHTML = responseData.Navigation;
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}