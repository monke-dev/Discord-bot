const eris = require("eris");
const mongoHelper = require("../Database/Helper");
const mongo = require('mongoose');
const guilds = require("../Database/Schemas/Guild");
module.exports = class Client extends eris.Client{
    constructor(token, options, mongoUrl, mongoOptions){
        super(token, options);



        this.cmdsAndAlli = new Map();

        this.mongoHelper = new mongoHelper(mongoUrl, mongoOptions);

        this.prefixCache = new Map();
    }

    get constants(){
        return {
            Eris: require("../Constants/Eris"),
            Config: require("../Constants/Config"),
            Colors: require("../Constants/Colors")
        };
    }

    loadAddOn(addOnDir){
        let file = require(addOnDir);
        file(eris);
    }

    loadCmd(cmdPath){
        const file = new (require(cmdPath))(this);
        this.cmdsAndAlli.set(file.name, file);
        file.alli.forEach(alli => {
            this.cmdsAndAlli.set(alli, file);
        });
    };

    loadEvent(eventPath, eventName, once){
        const file = new (require(eventPath))(this);
        if(once == true) this.once(eventName, (...args) => file.run(...args));
        else this.on(eventName, (...args) => file.run(...args));
    }

    async connectMongo(){
        return await this.mongoHelper.connect();
    }

    loadMongoEvent(eventDir, eventName){
        let file = new (require(eventDir))(this);
        mongo.connection.on(eventName, (...args) => file.run(...args))
    }

    async getGuildData(id){
        let data = await guilds.findOne({id: id});
        if(!data) data = await new guilds({id: id}).save();
        return data;
    }

    async getPrefixCache(id){
        let prefix = await this.prefixCache.get(id);
        if(!prefix) {
            await this.updatePrefixCache(id);
            prefix = await this.prefixCache.get(id);
        }
        return prefix;
    }

    async updatePrefixCache(id){
        let data = await this.getGuildData(id);
        this.prefixCache.set(id, data.config.prefix);
    }

} 