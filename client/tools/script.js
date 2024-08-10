var CanCreateTShirtOrder = false;
var SelectedSpringfestDay = 0;
var SpringfestFirstDay = 0;
var SpringfestLastDay = 0;
var CanCreateAbsencesExcel = true;

window.onload = InitializeTools();

document.getElementById("create-tshirt-order-btn").addEventListener("click", CreateTShirtOrder);
document.getElementById("save-absences").addEventListener("click", SaveAbsences);
document.getElementById("create-absences").addEventListener("click", CreateAbsencesExcel);

function InitializeTools(){
    GetTShirtOrderErrors();
    GetSpringfestDates();
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
async function GetSpringfestDates(){
    var response = await fetch('/tool/get-springfest-dates', {method: "POST"});
    if(response.status == 200){
        var responseData = await response.json();
        SpringfestFirstDay = responseData.AbsencesFirstDay;
        SpringfestLastDay = responseData.AbsencesLastDay;
        DisplaySpringfestDate(0);
        GetAbsences();
    }else if(response.status == 428){
        document.getElementById("absences-content").innerHTML = `<p style="color: red; padding: 1rem;">Error: The start and end dates of the Springfest have not been configured yet.</p>`;
        document.getElementById("absences-content").style.border = "none";
        document.getElementById("actions-container").style.display = "none";
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function GetAbsences(){
    var response = await fetch('/tool/get-absences-config', {method: "POST"});
    if(response.status == 200){
        var responseData = await response.json();
        for(var i=0; i<responseData.length; i++){
            DisplayAbsences(responseData[i]);
        }
    }
}
async function CreateTShirtOrder(){
    if(CanCreateTShirtOrder){
        CanCreateTShirtOrder = false;
        DisplayTimer('create-tshirt-order-btn', 0);
        fetch('/tool/create-tshirt-order', {method: "POST"}).then(async function(response){
            if(response.status == 200){
                CanCreateTShirtOrder = true;
                window.open(`/tool/download/${(await response.json()).File}`, "_blank");
            }else{
                window.alert("An error occured in the servers, please try again later.");
            }
        });
    }
}
async function SaveAbsences(){
    var inputContainers = document.getElementsByClassName("periods-input-container");
    var absences = [];
    for(var i=0; i<inputContainers.length; i++){
        var teamAbsences = {};
        teamAbsences.teamUUID = inputContainers[i].getAttribute("data-uuid");
        var inputs = inputContainers[i].querySelectorAll("input");
        var arrayLength = (inputs.length-inputs.length%32)/32;
        if(inputs.length%32) arrayLength++;
        teamAbsences.Absences = new Array(arrayLength).fill(0);
        for(var j=inputs.length-1; j>=0; j--){
            var a = teamAbsences.Absences[arrayLength-1-Math.floor(j/32)];
            if(inputs[j].checked) a = ~((~a) << 1);
            else a <<= 1;
            teamAbsences.Absences[arrayLength-1-Math.floor(j/32)] = a;
        }
        absences.push(teamAbsences);
    }
    var response = await fetch('/tool/update-absences', {
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify(absences)
    });
    if(response.status != 200){
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function CreateAbsencesExcel(){
    if(SpringfestFirstDay && SpringfestLastDay && CanCreateAbsencesExcel){
        SaveAbsences();
        CanCreateAbsencesExcel = false;
        DisplayTimer('create-absences', 0);
        fetch('/tool/create-absences-excel', {method: "POST"}).then(async function(response){
            if(response.status == 200){
                CanCreateAbsencesExcel = true;
                window.open(`/tool/download/${(await response.json()).File}`, "_blank");
            }else{
                window.alert("An error occured in the servers, please try again later.");
            }
        });
    }
}
function DisplayTimer(element, time){
    var ResponseReceived = false;
    if(element == 'create-tshirt-order-btn' && CanCreateTShirtOrder) ResponseReceived=true;
    if(element == 'create-absences' && CanCreateAbsencesExcel) ResponseReceived=true;
    if(!ResponseReceived){
        document.getElementById(element).innerText = `${Math.floor(time/1000)}.${Math.floor((time%1000)/100)}`;
        setTimeout(DisplayTimer, 100, element, time+100);
    }else{
        if(element == 'create-tshirt-order-btn')document.getElementById(element).innerHTML = `Create Order`;
        if(element == 'create-absences')document.getElementById(element).innerHTML = `Create Absences`;
    }
}
function DisplayAbsences(team){
    document.getElementById("teams").innerHTML += `<div>${team.TeamName}</div>`;
    var periods = '';
    var numPeriods = ((SpringfestLastDay-SpringfestFirstDay))*9/(1000*3600*24) + 9;
    var IsExcused = false;
    for(var i=0; i<numPeriods; i++){
        IsExcused = team.Absences[team.Absences.length-1-Math.floor(i/32)]%2;
        team.Absences[team.Absences.length-1-Math.floor(i/32)] >>= 1;
        var display = (i>=9*SelectedSpringfestDay && i<9*(SelectedSpringfestDay+1)) ? "grid" : "none";
        if(!(i%9)) periods += `<div style="display: ${display};">`;
        if(IsExcused) periods += `<input type="checkbox" checked>`;
        else periods += `<input type="checkbox">`;
        if(!((i+1)%9)) periods += `</div>`
    }
    document.getElementById("timetables").innerHTML += `<div class="periods-input-container" data-uuid="${team.teamUUID}">${periods}</div>`;
}
function DisplaySpringfestDate(springfestDay){
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var currentDate = new Date();
    currentDate.setTime(SpringfestFirstDay+springfestDay*1000*3600*24);
    document.getElementById("absences-current-date").innerText = `${days[currentDate.getDay()]}, ${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getUTCFullYear()}`;
    var periodsContainers = document.getElementsByClassName("periods-input-container");
    for(var i=0; i<periodsContainers.length; i++){
        for(var j=0; j<periodsContainers[i].children.length; j++){
            if(j==springfestDay) periodsContainers[i].children[j].style.display = "grid";
            else periodsContainers[i].children[j].style.display = "none";
        }
    }
}
function UpdateAbsencesDate(mode){
    if(SelectedSpringfestDay+mode >= 0 && SelectedSpringfestDay+mode <= (SpringfestLastDay-SpringfestFirstDay)/(24*3600*1000)){
        SelectedSpringfestDay += mode;
        DisplaySpringfestDate(SelectedSpringfestDay);
    }
}