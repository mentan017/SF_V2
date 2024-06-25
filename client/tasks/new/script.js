document.getElementById("submit-btn").addEventListener("click", async function(e){
    var task = document.getElementById("task-description").value;
    if(task){
        var response = await fetch('/tasks/new', {
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({Task: task})
        });
        if(response.status == 200){
            var responseData = await response.json();
            document.location.href = `/tasks/task/${responseData.UUID}`;
        }else{
            window.alert("An error occured in the servers, please try again later.");
        }
    }
});