var SpringfestDate = new Date(2024, 4, 2);

window.onload = GetData();

document.getElementById("new-task").addEventListener("click", function(e){
    window.location.href = "/tasks/new";
});

async function GetData(){
    await GetUserName();
    await GetSpringfestDate();
    GetTasks();
}

async function GetUserName(){
    var response = await fetch('/user/get-user-name', {method: "POST"});
    if(response.status == 200){
        document.getElementById("header").innerHTML = `<div><h1>Welcome Back<br>${(await response.json()).Name}!</h1></div><div id="countdown"><p>0 Weeks, 0 Days</p><p>00h 00m 00s</p></div>`;
    }else if(response.status == 500){
        window.alert("An error occured in the servers, please try again later.");
    }else{
        window.location.href = '/auth/logout';
    }
}
async function GetSpringfestDate(){
    var response = await fetch('/get-springfest-date', {method: "POST"});
    if(response.status == 200){
        SpringfestDate.setTime((await response.json()).SpringfestDate);
        DisplayCountdown();
    }
}
async function GetTasks(){
    var response = await fetch('/tasks/user-tasks', {
        method: "POST",
        headers: {"Content-type": "application/json"}
    });
    if(response.status == 200){
        var responseData = await response.json();
        var tasks = responseData.Tasks;
        var borderColor = ["red", "orange", "green"];
        for(var i=0; i<tasks.length; i++){
            var task = document.createElement("div");
            task.className = "task";
            task.setAttribute("data-uuid", tasks[i].UUID);
            taskDescription = tasks[i].Description;
            if(taskDescription.length > 150){
                taskDescription = taskDescription.substring(0, 150) + "..."
            }
            task.innerHTML = `
            <p>${taskDescription}</p>
            <select class="task-progress">
                <option value="0">Undone</option>
                <option value="0.5">In Progress</option>
                <option value="1">Done</option>
            </select>
            <a href="/tasks/task/${tasks[i].UUID}">+ More</a>`;
            task.getElementsByClassName("task-progress")[0].value = tasks[i].Progress;
            task.getElementsByClassName("task-progress")[0].addEventListener("change", function(e){
                UpdateTask(this.parentElement.getAttribute("data-uuid"));
            });
            task.setAttribute("style", `border-left: solid 7px ${borderColor[Math.ceil(tasks[i].Progress * 2)]}`);
            document.getElementById("tasks").appendChild(task);
        }
        if(tasks.length == 0){
            document.getElementById("tasks").innerHTML = `<p class="empty-message">All done for now :)</p>`;
        }
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}

async function UpdateTask(UUID){
    var taskElement = document.querySelector(`div[data-uuid='${UUID}'`);
    var Description = taskElement.querySelector("p").innerHTML;
    var Progress = taskElement.getElementsByClassName("task-progress")[0].value;
    var response = await fetch('/tasks/update', {
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Description: Description, Progress: Progress, UUID: UUID, ProgressModified: true})
    });
    if(response.status != 200){
        window.alert("An error occured in the servers, please try again later.");
    }
}

function DisplayCountdown(){
    var currentTime = new Date();
    var TimeLeft = SpringfestDate.getTime() - currentTime.getTime();
    if(TimeLeft > 0){
        var factors = [604800000, 86400000, 3600000, 60000, 1000];
        var values = [];
        for(var i=0; i<5; i++){
            values.push(Math.floor(TimeLeft/factors[i]));
            TimeLeft += -values[i]*factors[i];        
        }
        for(var i=2; i<5; i++){
            values[i] = parseValue(values[i]);
        }
        document.getElementById("countdown").innerHTML = `
        <p>${values[0]} Weeks, ${values[1]} Days</p>
        <p>${values[2]}h ${values[3]}m ${values[4]}s</p>`;
        setTimeout(DisplayCountdown, 500);
    }else{
        document.getElementById("countdown").style.color = "red";
    }
}

function parseValue(num){
    var str = num.toString();
    while(str.length < 2){
        str = "0" + str;
    }
    return(str);
}