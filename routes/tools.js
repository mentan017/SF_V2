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
        //TODO create a logo with reverted colors (?) -> for the t-shirt image
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
                    sheetNames.push((await TeamModel.findById(users[i].TShirts[j].Team)).Name.split("&").join("and"));
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

//Export router
module.exports = router;