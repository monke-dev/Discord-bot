const data = {};
const prettyMs = require("pretty-ms");

const handleCooldown = async (id, map, cmd) => {
    let cooldown = await map.get(`${id}_${cmd.name}`)
    if(cooldown) return prettyMs(cmd.cooldown - (Date.now() - cooldown));
    else{
        map.set(`${id}_${cmd.name}`, Date.now());
        setTimeout(() => {
            map.delete(`${id}_${cmd.name}`)
        }, cmd.cooldown);
        return null;
    }
}

const checkHardCooldown = async (id, map) => {
    let hardcooldown = await map.get(id);
    if(hardcooldown) return hardcooldown;
    else{
        map.set(id, " ");
        setTimeout(() => {
            map.delete(id);
        }, 1000);
    }
}

module.exports = class{
    constructor(bot){
        this.bot = bot;
    }

    async run(msg){
        if(!msg.channel.guild || msg.author.bot) return;

        data.guild = await this.bot.getGuildDataCache(msg.channel.guild.id);
        let prefix = data.guild.config.prefix;
        if(!msg.content.startsWith(prefix)) return;

        let args = msg.content.split(/ +/)
        let cmd = args[0].toLowerCase().slice(prefix.length);
        args = args.slice(1);

        cmd = await this.bot.cmdsAndAlli.get(cmd);
        if(!cmd) return;

        if(!msg.channel.memberHasPermission(this.bot.user.id, this.bot.constants.Eris.perms.embedLinks)){
            let dmChannel = await msg.member.user.getDMChannel();
            return dmChannel.sendRedEmbed(`I do **__not__** have embedLinks permission in the channel <#${msg.channel.id}>, So you can **__NOT__** use me in that channel`);
        }

        let checkedHardCooldown = await checkHardCooldown(msg.channel.id, this.bot.hardCooldown);
        if(checkedHardCooldown) return;

        let handledCooldown = await handleCooldown(msg.author.id, this.bot.cooldowns, cmd);
        if(handledCooldown) return msg.channel.sendRedEmbed(`You are still in cooldown time left: ${handledCooldown}`);

        let neededMPerms = [];
        cmd.mPerms.forEach(perm => {
            if(!msg.channel.memberHasPermission(msg.author.id, perm)) neededMPerms.push(perm);
        })
        if(neededMPerms.length != 0) return msg.channel.sendRedEmbed(`You are **missing** permission(s) to use this comamnd,\nNeeded permission(s): \`${neededMPerms.join("`, `")}\``);

        let neededBPerms = [];
        cmd.bPerms.forEach(perm => {
            if(!msg.channel.memberHasPermission(this.bot.user.id, perm)) neededBPerms.push(perm);
        })
        if(neededBPerms.length != 0) return msg.channel.sendRedEmbed(`I am **missing** permission(s) to use this comamnd,\nNeeded permission(s): \`${neededBPerms.join("`, `")}\``);

        cmd.run(msg, args, data);
    };
}