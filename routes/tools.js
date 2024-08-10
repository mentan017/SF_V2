//Import modules
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const handlebars = require('handlebars');
const im = require('imagemagick');
const mongoose = require('mongoose');
const path = require('path');
const { execSync } = require('child_process');
const {v4: uuidv4} = require('uuid');
const { default: writeXlsxFile } = require('write-excel-file/node');
require('dotenv').config();

//Import MongoDB models
const CookieModel = require('../models/cookie.js');
const ProfileModel = require('../models/profile.js');
const RoleModel = require('../models/role.js');
const TaskModel = require('../models/task.js');
const TeamModel = require('../models/team.js');
const UserModel = require('../models/user.js');

//Connect to MongoDB database
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.PROJECT_NAME}`);
var db = mongoose.connection;

//Global variables
const router = express.Router();
const homeDir = path.join(__dirname, '..');

//Middleware
async function checkAuth(req, res, next){
    try{
        //Check for cookies
        if(req.cookies?.SID){
            //Check cookie validity
            req.AuthedUser = (await CookieModel.findOne({UUID: req.cookies.SID}))?.UserID;
            if(req.AuthedUser){
                var user = await UserModel.findById(req.AuthedUser);
                if(user?.CanUseTools){
                    next();
                }else{
                    res.status(401).redirect('/dashboard');
                }
            }else{
                res.status(401).clearCookie("SID").redirect('/auth/');
            }
        }else{
            res.status(307).redirect('/auth/');
        }    
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
}

//Configure routes

//GET routes
router.get('/', checkAuth, async function(req, res, next){
    try{
        res.status(200).sendFile(`${homeDir}/client/tools/index.html`);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/download/:file', checkAuth, async function(req, res, next){
    try{
        res.status(200).download(`${homeDir}/data/${req.params.file}`);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//POST routes
router.post('/get-tshirt-order-errors', checkAuth, async function(req, res, next){
    try{
        var teams = await TeamModel.find({});
        var errors = [];
        for(var i=0; i<teams.length; i++){
            if(await ProfileModel.countDocuments({GetsTShirt: true, Team: teams[i]._id}) > 0){
                if(!teams[i].TShirtColorName && !teams[i].TShirtColorHEX){
                    errors.push(`${teams[i].Name} is missing the T-shirt color name and HEX value`);
                }else if(!teams[i].TShirtColorName){
                    errors.push(`${teams[i].Name} is missing the T-shirt color name`);
                }else if(!teams[i].TShirtColorHEX){
                    errors.push(`${teams[i].Name} is missing the T-shirt color HEX value`);
                }else if(!(/^#[0-9A-F]{6}$/i.test(teams[i].TShirtColorHEX))){
                    errors.push(`${teams[i].Name} the T-shirt color HEX value is not valid`);
                }
            }
        }
        res.status(200).send({Errors: errors});
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/create-tshirt-order', checkAuth, async function(req, res, next){
    try{
        var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`, 'utf-8'));
        var orderUUID = uuidv4();
        execSync(`mkdir ${homeDir}/data/tshirt-order-${orderUUID}`);
        execSync(`mkdir ${homeDir}/data/tshirt-order-${orderUUID}/images`);
        var sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];
        var tshirts = [];
        var users = [];
        var usersCheck = [];
        var slides = [];
        var slideTemplate = handlebars.compile(fs.readFileSync(`${homeDir}/templates/order-slide.txt`, 'utf-8'));
        var teams = await TeamModel.find({}, null, {sort: {Name: 1}});
        var tshirtTexts = [];
        for(var i=0; i<teams.length; i++){
            var texts = await ProfileModel.distinct('TShirtText', {GetsTShirt: true, Team: teams[i]._id});
            for(var j=0; j<texts.length; j++) tshirtTexts.push({Text: texts[j], Team: teams[i]._id});
        }
        for(var i=0; i<tshirtTexts.length; i++){
            var team = await TeamModel.findById(tshirtTexts[i].Team);
            tshirts.push({
                Text: tshirtTexts[i].Text,
                Color: team.TShirtColorName,
                ColorHEX: team.TShirtColorHEX,
                UUID: uuidv4(),
                Sizes: [0, 0, 0, 0, 0, 0, 0]
            });
            var profiles = await ProfileModel.find({TShirtText: tshirtTexts[i].Text, GetsTShirt: true, Team: tshirtTexts[i].Team}, null, {sort: {Name: 1}});
            for(var j=0; j<profiles.length; j++){
                var userIndex = usersCheck.indexOf(profiles[j].User);
                if(userIndex == -1){
                    usersCheck.push(profiles[j].User);
                    users.push({
                        Name: profiles[j].Name,
                        Email: profiles[j].Email,
                        Year: (await UserModel.findById(profiles[j].User)).Year,
                        TShirts: [{
                            Team: profiles[j].Team,
                            Role: (await RoleModel.findById(profiles[j].Role)).Name,
                            Text: profiles[j].TShirtText,
                            TShirtSize: profiles[j].TShirtSize
                        }]
                    });
                }else{
                    users[userIndex].TShirts.push({
                        Team: profiles[j].Team,
                        Role: (await RoleModel.findById(profiles[j].Role)).Name,
                        Text: profiles[j].TShirtText,
                        TShirtSize: profiles[j].TShirtSize
                    });
                }
                var sizeIndex = sizes.indexOf(profiles[j].TShirtSize);
                if(sizeIndex == -1) sizeIndex = 4;
                tshirts[i].Sizes[sizeIndex]++;
            }
            //Get the color of the text
            var bigint = parseInt(tshirts[i].ColorHEX.substring(2), 16);
            var rgb = [((bigint >> 16) & 255), ((bigint >> 8) & 255), (bigint & 255)];
            var brightness = Math.round(((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) + (parseInt(rgb[2]) * 114)) / 1000);
            var textColor = (brightness > 125) ? 'black' : 'white';
            var logo = config.Logo;
            if(textColor == "white"){
                execSync(`magick ${homeDir}/client${config.Logo}_40.${config.LogoExtension} -channel RGB -negate ${homeDir}/client${config.Logo}_inverted_40.${config.LogoExtension}`);
                logo = `${logo}_inverted`;
            }
            //Create the presentation
            execSync(`magick -size 626x417 xc:${tshirts[i].ColorHEX} ${homeDir}/data/tshirt-order-${orderUUID}/${tshirts[i].Color.split(" ").join("")}.png`);
            execSync(`magick -gravity center -background none -fill ${textColor} -size 150x80 caption:"${tshirts[i].Text}" ${homeDir}/data/tshirt-order-${orderUUID}/temp.png`);
            execSync(`magick composite -geometry +0+0 ${homeDir}/templates/t-shirt-template.png ${homeDir}/data/tshirt-order-${orderUUID}/${tshirts[i].Color.split(" ").join("")}.png ${homeDir}/data/tshirt-order-${orderUUID}/${tshirts[i].Color.split(" ").join("")}.png`);
            execSync(`magick composite -geometry +190+135 ${homeDir}/client${logo}_40.${config.LogoExtension} ${homeDir}/data/tshirt-order-${orderUUID}/${tshirts[i].Color.split(" ").join("")}.png ${homeDir}/data/tshirt-order-${orderUUID}/${tshirts[i].Color.split(" ").join("")}.png`);
            execSync(`magick composite -geometry +390+120 ${homeDir}/data/tshirt-order-${orderUUID}/temp.png ${homeDir}/data/tshirt-order-${orderUUID}/${tshirts[i].Color.split(" ").join("")}.png ${homeDir}/data/tshirt-order-${orderUUID}/images/t-shirt-${tshirts[i].UUID}.png`);
            execSync(`rm ${homeDir}/data/tshirt-order-${orderUUID}/${tshirts[i].Color.split(" ").join("")}.png ${homeDir}/data/tshirt-order-${orderUUID}/temp.png`);
            slides.push(slideTemplate({
                teamName: team.Name.split("&").join("\\&"),
                text: tshirtTexts[i].Text.split("&").join("\\&"),
                colorName: tshirts[i].Color.split("&").join("\\&"),
                XXS: tshirts[i].Sizes[0],
                XS: tshirts[i].Sizes[1],
                S: tshirts[i].Sizes[2],
                M: tshirts[i].Sizes[3],
                L: tshirts[i].Sizes[4],
                XL: tshirts[i].Sizes[5],
                XXL: tshirts[i].Sizes[6],
                TShirtFile: `./images/t-shirt-${tshirts[i].UUID}.png`
            }).split("amp;").join(""));
        }
        var springfestDay = new Date();
        springfestDay.setTime(config.SpringfestDate);
        var presentation = `
        \\documentclass{beamer}
        
        \\usepackage{graphicx}
        \\graphicspath{ {./t_shirts/} }
        
        \\usetheme{Singapore}
        %\\usecolortheme{whale}
        
        \\title{T-Shirts Order for \\\\European School of Brussels III}
        \\date{${springfestDay.getUTCFullYear()}}
        
        \\begin{document}
        \\maketitle
        ${slides.join("\n")}
        \\end{document}`;
        fs.writeFileSync(`${homeDir}/data/tshirt-order-${orderUUID}/presentation.tex`, presentation);
        execSync(`cd ${homeDir}/data/tshirt-order-${orderUUID}; pdflatex presentation.tex; mv presentation.tex T_Shirt_Order_Springfest.tex; mv presentation.pdf T_Shirt_Order_Springfest.pdf; rm presentation.*`);
        //Get the users who don't have a t-shirt but get a bracelet
        var braceletUsers = await ProfileModel.find({GetsTShirt: false, User: {$nin: usersCheck}});
        var braceletCheck = [];
        for(var i=0; i<braceletUsers.length; i++){
            var userIndex = braceletCheck.indexOf(braceletUsers[i].User);
            if(userIndex == -1){
                braceletCheck.push(braceletUsers[i].User);
                users.push({
                    Name: braceletUsers[i].Name,
                    Email: braceletUsers[i].Email,
                    Year: (await UserModel.findById(braceletUsers[i].User)).Year,
                    TShirts: [{
                        Team: braceletUsers[i].Team,
                        Role: (await RoleModel.findById(braceletUsers[i].Role)).Name,
                        Text: "[No T-Shirt]",
                        TShirtSize: "/"
                    }]
                });
            }
        }
        var teamSheets = [];
        var sheetNames = [];
        var teamsCheck = [];
        var teamIndex = 0;
        var currentInputs = [];
        var row = [];
        for(var i=0; i<users.length; i++){
            for(var j=0; j<users[i].TShirts.length; j++){
                teamIndex = teamsCheck.indexOf((users[i].TShirts[j].Team).toString());
                if(teamIndex == -1){
                    teamsCheck.push((users[i].TShirts[j].Team).toString());
                    sheetNames.push((await TeamModel.findById(users[i].TShirts[j].Team)).Name.split("&").join("&amp;"));
                    teamSheets.push([]); //Creating a new Sheet
                    teamIndex = teamsCheck.length - 1;
                    currentInputs = ['Name', 'Year', 'Email', 'Role', 'T-Shirt Text', 'T-Shirt Size', 'Has Bracelet'];
                    row = [];
                    for(var k=0; k<currentInputs.length; k++){
                        row.push({
                            type: String,
                            value: currentInputs[k]
                        });
                    }
                    teamSheets[teamIndex].push(row);
                }
                currentInputs = [users[i].Name, users[i].Year, users[i].Email, users[i].TShirts[j].Role, users[i].TShirts[j].Text, users[i].TShirts[j].TShirtSize];
                row = [];
                for(var k=0; k<currentInputs.length; k++){
                    row.push({
                        value: currentInputs[k]
                    });
                }
                teamSheets[teamIndex].push(row);
            }
        }
        await writeXlsxFile(teamSheets, {
            sheets: sheetNames,
            filePath: `${homeDir}/data/tshirt-order-${orderUUID}/TShirt_Distribution.xlsx`
        });
        execSync(`cd ${homeDir}/data; zip -r TShirt_Order_${orderUUID}.zip ./tshirt-order-${orderUUID}; rm -rf ./tshirt-order-${orderUUID}`);
        res.status(200).send({File: `TShirt_Order_${orderUUID}.zip`});
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/create-absences-excel', checkAuth, async function(req, res, next){
    try{
        var absences = JSON.parse(fs.readFileSync(`${homeDir}/absences.json`, 'utf-8'));
        var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`, 'utf-8'));
        var usersRaw = await UserModel.find({}, null, {sort: {Year: 1, Name: 1}});
        var users = {};
        var years = [];
        var yearRegularExpression = /S[0-9][A-Z]{3,3}\b/;
        for(var i=0; i<usersRaw.length; i++){
            var year = (yearRegularExpression.test(usersRaw[i].Year)) ? usersRaw[i].Year.match(/S[0-9]/)[0] : "Other";
            users[`${usersRaw[i]._id.toString()}`] = {
                Name: usersRaw[i].Name,
                Email: usersRaw[i].Email,
                Year: year,
                Class: usersRaw[i].Year,
                Absences: new Array(absences[0].Absences.length).fill(0)
            };
            if(years.indexOf(year) == -1 && yearRegularExpression.test(usersRaw[i].Year)) years.push(year);
        }
        years.push("Other");
        for(var i=0; i<absences.length; i++){
            var team = await TeamModel.findOne({UUID: absences[i].teamUUID});
            var profiles = await ProfileModel.find({Team: team._id});
            for(var j=0; j<profiles.length; j++){
                for(var k=0; k<absences[i].Absences.length; k++){
                    users[`${profiles[j].User.toString()}`].Absences[k] |= absences[i].Absences[k];
                }
            }
        }
        var sheetHeaderRows = [[
            {type: String, value: "Name", rowSpan: 2, align: "center", alignVertical: "center"},
            {type: String, value: "Email", rowSpan: 2, align: "center", alignVertical: "center"},
            {type: String, value: "Class", rowSpan: 2, align: "center", alignVertical: "center"}],
            [null, null, null]];
        var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var currentSpringfestDay = new Date();
        currentSpringfestDay.setTime(config.AbsencesFirstDay);
        var springfestPeriods = (((config.AbsencesLastDay-config.AbsencesFirstDay)/(24*3600*1000))+1)*9;
        for(var i=0; i<springfestPeriods; i++){
            if(i%9){
                sheetHeaderRows[0].push(null);
                sheetHeaderRows[1].push({type: String, value:`P${(i%9)+1}`, align: "center"});
            }else{
                sheetHeaderRows[0].push({type: String, value: `${days[currentSpringfestDay.getDay()]}, ${currentSpringfestDay.getDate()} ${months[currentSpringfestDay.getMonth()]}`, span: 9, align: "center", leftBorderColor: "#000000", leftBorderStyle: "thick"});
                currentSpringfestDay.setTime(currentSpringfestDay.getTime()+1000*3600*24);
                sheetHeaderRows[1].push({type: String, value:`P${(i%9)+1}`, align: "center", leftBorderColor: "#000000", leftBorderStyle: "thick"});
            }
        }
        var yearSheets = [];
        var sheetNames = [];
        var user = {};
        var IsExcused = false;
        for(var i=0; i<usersRaw.length; i++){
            user = users[`${usersRaw[i]._id.toString()}`];
            var hasToBeExused = false;
            for(var j=0; j<user.Absences.length; j++){
                if(user.Absences[j]){
                    j=user.Absences.length;
                    hasToBeExused = true;
                }
            }
            if(hasToBeExused){
                var sheetIndex = sheetNames.indexOf(user.Year);
                if(sheetIndex == -1){
                    //yearSheets.push([sheetHeaderRows[0], sheetHeaderRows[1]])
                    yearSheets.push([]);
                    sheetNames.push(user.Year);
                    sheetIndex = sheetNames.indexOf(user.Year);
                    yearSheets[sheetIndex].push(sheetHeaderRows[0]);
                    yearSheets[sheetIndex].push(sheetHeaderRows[1]);
                }
                var userData = [
                    {type: String, value: user.Name, align: "center"},
                    {type: String, value: user.Email, align: "center"},
                    {type: String, value: user.Class, align: "center"}
                ];
                for(var j=0; j<springfestPeriods; j++){
                    IsExcused = user.Absences[user.Absences.length-1-Math.floor(j/32)]%2;
                    user.Absences[user.Absences.length-1-Math.floor(j/32)] >>= 1;
                    if(IsExcused && (j%9)) userData.push({type: String, value: "Excused", align: "center", color: "#ffffff", backgroundColor: "#00ff00"});
                    else if(IsExcused) userData.push({type: String, value: "Excused", align: "center", color: "#ffffff", backgroundColor: "#00ff00", leftBorderColor: "#000000", leftBorderStyle: "thick"});
                    else if(j%9) userData.push(null);
                    else userData.push({type: String, value: "", leftBorderColor: "#000000", leftBorderStyle: "thick"});
                }
                yearSheets[sheetIndex].push(userData);
            }
        }
        fs.writeFileSync('./data/temp.json', JSON.stringify(yearSheets));
        var uuid = uuidv4();
        await writeXlsxFile(yearSheets, {
            sheets: sheetNames,
            filePath: `${homeDir}/data/springfest-absences-${uuid}.xlsx`,
            stickyRowsCount: 2
        });
        res.status(200).send({File: `springfest-absences-${uuid}.xlsx`});
        //res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/get-absences-config', checkAuth, async function(req, res, next){
    try{
        if(fs.existsSync(`${homeDir}/absences.json`)){
            var absences = fs.readFileSync(`${homeDir}/absences.json`, 'utf-8');
            res.status(200).send(absences);
        }else{
            if(fs.existsSync(`${homeDir}/config.json`)){
                var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`, 'utf-8'));
                if(config.AbsencesFirstDay != 0 && config.AbsencesLastDay != 0){
                    var absences = [];
                    var teams = await TeamModel.find({}, null, {sort: {Name: 1}});
                    var springfestPeriods = (((config.AbsencesLastDay-config.AbsencesFirstDay)/(24*3600*1000))+1)*9;
                    var arrayLength = (springfestPeriods-springfestPeriods%32)/32;
                    if(springfestPeriods%32) arrayLength++;
                    var absencesPeriods = new Array(arrayLength).fill(0);
                    for(var i=0; i<teams.length; i++){
                        absences.push({Team: teams[i].UUID, TeamName: teams[i].Name, Absences: absencesPeriods});
                    }
                    fs.writeFileSync(`${homeDir}/absences.json`, JSON.stringify(absences));
                    res.status(200).send(absences);
                }else{
                    res.status(428).send({Error: "The start and end dates of the Springfest have not been configured yet."})
                }
            }else{
                res.status(428).send({Error: "The start and end dates of the Springfest have not been configured yet."})
            }
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/get-springfest-dates', checkAuth, async function(req, res, next){
    try{
        if(fs.existsSync(`${homeDir}/config.json`)){
            var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`, 'utf-8'));
            if(config.AbsencesFirstDay && config.AbsencesLastDay){
                res.status(200).send({AbsencesFirstDay: config.AbsencesFirstDay, AbsencesLastDay: config.AbsencesLastDay});
            }else{
                res.status(428).send({Error: "The start and end dates of the Springfest have not been configured yet."})       
            }
        }else{
            res.status(428).send({Error: "The start and end dates of the Springfest have not been configured yet."})
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//PUT routes
router.put('/update-absences', checkAuth, async function(req, res, next){
    try{
        var absences = req.body;
        for(var i=0; i<absences.length; i++){
            absences[i].TeamName = (await TeamModel.findOne({UUID: absences[i].Team})).Name;
        }
        fs.writeFileSync(`${homeDir}/absences.json`, JSON.stringify(absences));
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//Export router
module.exports = router;