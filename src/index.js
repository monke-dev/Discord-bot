require("dotenv").config();
const fs = require("fs");
const Client = require("./Structors/Client");

const bot = new Client(process.env.botToken, {
    allowedMentions: {
        roles: false,
        users: false,
        everyone: false
    },
    defaultImageFormat: "png",
    defaultImageSize: 512
});

const init = async () => {
    const Modules = fs.readdirSync(__dirname + "/Modules");
    Modules.forEach(async Module => {
        let cmdFiles = await fs.readdirSync(__dirname + "/Modules/" + Module + "/Commands");
        cmdFiles = cmdFiles.filter(x => x.endsWith(".js"));
        cmdFiles.forEach(cmd => {
            bot.loadCmd(__dirname + "/Modules/" + Module + "/Commands/" + cmd);
        });
    });

    let events = fs.readdirSync(__dirname + "/Events");
    events = events.filter(x => x.endsWith(".js"));
    console.log(events)
    events.forEach(event => {
        let once = false
        if(event == "ready.js") once = true;
        bot.loadEvent(__dirname + "/Events/" + event, event.slice(0, event.length - 3), once);
    })
};
init();

bot.connect()