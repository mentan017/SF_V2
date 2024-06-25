var CurrentURL = (document.location.href).split("/");
var UUID = CurrentURL[CurrentURL.length - 1];
var Description = "";
var Progress = 0;

document.getElementById("delete-btn").addEventListener("click", DeleteTask);

async function GetTask(){
    var response = await fetch(`/tasks/task/${UUID}`, {
        method: "POST",
        headers: {"Content-type": "application/json"},
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("task-index").innerHTML = `Task #${responseData.Index}`;
        document.getElementById("task-description").value = responseData.Description;
        Description = responseData.Description;
        if(responseData.ProgressTimestamps[responseData.ProgressTimestamps.length - 1].Progress == "Undone"){
            document.getElementById("task-progress").value = 0;
            Progress = 0;
        }else if(responseData.ProgressTimestamps[responseData.ProgressTimestamps.length - 1].Progress == "In Progress"){
            document.getElementById("task-progress").value = 0.5;
            Progress = 0.5;
        }else if(responseData.ProgressTimestamps[responseData.ProgressTimestamps.length - 1].Progress == "Done"){
            document.getElementById("task-progress").value = 1;
            Progress = 1;
        }
        for(var i=responseData.ProgressTimestamps.length - 1; i>0; i--){
            document.getElementById("progress-timestamps").innerHTML += `<li>${responseData.ProgressTimestamps[i].Timestamp} : ${responseData.ProgressTimestamps[i].User} set task #${responseData.Index} to ${responseData.ProgressTimestamps[i].Progress}</li>`;
        }
        document.getElementById("progress-timestamps").innerHTML += `<li>${responseData.ProgressTimestamps[i].Timestamp} : ${responseData.ProgressTimestamps[i].User} created task #${responseData.Index}</li>`;
        setTimeout(UpdateTask, 700);
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}
async function UpdateTask(){
    var newDescription = document.getElementById("task-description").value;
    var newProgress = document.getElementById("task-progress").value;
    if(newDescription != Description || newProgress != Progress){
        var ProgressModified = false;
        if(Progress != newProgress) ProgressModified = true;
        Description = newDescription;
        Progress = newProgress;
        var response = await fetch('/tasks/update',{
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({UUID: UUID, Description: Description, Progress: Progress, ProgressModified: ProgressModified})
        });
        console.log(response.status);
    }
    setTimeout(UpdateTask, 700);
}
async function DeleteTask(){
    var response = await fetch(`/tasks/delete/${UUID}`,{
        method: "DELETE",
        headers: {"Content-type": "application/json"}
    });
    if(response.status != 500){
        window.location.href = '/';
    }else{
        window.alert("An error occured in the servers, please try again later.");
    }
}

GetTask();