document.getElementById("login-btn").addEventListener("click", SubmitLogin);
document.getElementById("login-btn").addEventListener("keypress", function(e){
    if(e.keyCode == 13) SubmitLogin();
});

async function SubmitLogin(){
    ResetErrorMsg();
    var username = document.getElementById("username-input").value;
    var password = document.getElementById("password-input").value;
    if(!username){
        SetErrorMsg("You need to enter a username");
    }else if(!password){
        SetErrorMsg("You need to enter a password");
    }else{
        password = await hashValue(password);
        var response = await fetch('/auth/login', {
            method: "POST",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({Username: username, Password: password})
        });
        if(response.status == 200){
            window.location.href = '/dashboard';
        }else if(response.status == 401){
            SetErrorMsg((await response.json()).Error);
        }else{
            window.alert("An error occured in the servers, please try again later.");
        }
    }
}

function ResetErrorMsg(){
    document.getElementById("error-msg").innerText = "";
    document.getElementById("error-msg").style.display = "none";
}
function SetErrorMsg(error){
    document.getElementById("error-msg").innerText = error;
    document.getElementById("error-msg").style.display = "block";
}
async function hashValue(variable){
    var varUint8 = new TextEncoder().encode(variable);
    var hashBuffer = await crypto.subtle.digest('SHA-256', varUint8);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    var hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return(hashHex);
}