const mongoClient = require('mongodb').MongoClient
require("dotenv").config();
const state={
    db:null
}
console.log(process.env.MONGODB_CONNECT);
// 'mongodb://localhost:27017'
module.exports.connect = function(done){
    const url = process.env.MONGODB_CONNECT
    const dbname = 'thefashionstore'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })

    
}

module.exports.get=function(){
    return state.db
}

