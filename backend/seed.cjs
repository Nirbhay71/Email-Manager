const { MongoClient } = require('mongodb'); 
async function run() { 
    const c = new MongoClient('mongodb://localhost:27017'); 
    await c.connect(); 
    const db = c.db('ai_email_manager'); 
    const user = 'buddhdevdarshan1478@gmail.com'; 
    const all = await db.collection('emails').find({userEmail: user}).toArray(); 
    await db.collection('emaillabels').deleteMany({userEmail: user}); 
    const labels = []; 
    for(let i=0; i<all.length; i++){ 
        labels.push({ 
            userEmail: user, 
            emailId: all[i].messageId, 
            label: i<5 ? 'important' : 'not_important', 
            source: 'onboarding' 
        }); 
    } 
    await db.collection('emaillabels').insertMany(labels); 
    await db.collection('users').updateOne({email: user}, {$inc: {labelVersion: 1}}); 
    console.log('Seeded ' + emails.length + ' emails and ' + labels.length + ' labels.'); 
    await c.close(); 
} 
run();
