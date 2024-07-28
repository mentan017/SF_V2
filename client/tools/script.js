var CanCreateTShirtOrder = false;

window.onload = GetErrors();

document.getElementById("create-tshirt-order-btn").addEventListener("click", CreateTShirtOrder);

function GetErrors(){
    GetTShirtOrderErrors();
}
async function GetTShirtOrderErrors(){
    var response = await fetch('/tool/get-tshirt-order-errors', {method: "POST"});
    document.getElementById("t-shirt-errors").innerHTML = "";
    if(response.status == 200){
        var responseData = await response.json();
        if((responseData.Errors).length == 0){
            CanCreateTShirtOrder = true;
            document.getElementById("t-shirt-errors").innerHTML = `<p>Errors: No errors, good to go</p>`;
        }else{
            document.getElementById("t-shirt-errors").innerHTML = `<p>Errors:</p>`;
            for(var i=0; i<responseData.Errors.length; i++){
                document.getElementById("t-shirt-errors").innerHTML += `<p style="padding: 0.2rem; padding-left: 20px;">${responseData.Errors[i]}</p>`;
            }
        }
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function CreateTShirtOrder(){
    if(CanCreateTShirtOrder){
        CanCreateTShirtOrder = false;
        DisplayTimer('create-tshirt-order-btn', 0);
        fetch('/tool/create-tshirt-order', {method: "POST"}).then(async function(response){
            if(response.status == 200){
                CanCreateTShirtOrder = true;
            }else{
                window.alert("An error occured in the servers, please try again later.");
            }
        });
    }
}
function DisplayTimer(element, time){
    var ResponseReceived = false;
    if(element == 'create-tshirt-order-btn' && CanCreateTShirtOrder) ResponseReceived=true;
    if(!ResponseReceived){
        document.getElementById(element).innerText = `${Math.floor(time/1000)}.${Math.floor((time%1000)/100)}`;
        setTimeout(DisplayTimer, 100, element, time+100);
    }else{
        if(element == 'create-tshirt-order-btn')document.getElementById(element).innerHTML = `Create Order`;
    }
}