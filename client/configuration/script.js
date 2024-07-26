window.onload = InitPage();

function InitPage(){
    var uploadBtns = document.getElementsByClassName("upload-btn");
    for(var i=0; i<uploadBtns.length; i++){
        uploadBtns[i].addEventListener("click", UploadFile);
    }
    document.getElementById("reset-btn").addEventListener("click", ConfirmReset);
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
        method: "POST",
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