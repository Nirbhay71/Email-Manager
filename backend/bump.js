const { MongoClient } = require('mongodb'); 
async function run() { 
    const c = new MongoClient('mongodb://localhost:27017'); 
    await c.connect(); 
    const db = c.db('ai_email_manager'); 
    await db.collection('users').updateOne(
        {email: 'buddhdevdarshan1478@gmail.com'}, 
        {$inc: {labelVersion: 1}}
    ); 
    console.log('Bumped labelVersion'); 
    await c.close(); 
} 
run();
