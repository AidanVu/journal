const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const PORT = process.env.PORT || 3000;
const app = express();

// process.stdin.setEncoding("utf8");
// process.stdin.on('readable', () => {
//     const dataInput = process.stdin.read();
//     if (dataInput !== null) {
//         const command = dataInput.trim();
//         if (command === 'stop') {
//             console.log("Shutting down the server...");
//             client.close();
//             process.exit(0);
//         } else {
//             console.log(`Invalid command: ${command}`);
//             process.stdout.write("Stop to shutdown the server: ");
//         }
//     }
// });

let client;
let collection;

async function connectToDatabase() {
    const uri = process.env.MONGO_CONNECTION_STRING;
    const databaseName = process.env.MONGO_DB_NAME;
    const collectionName = process.env.MONGO_COLLECTION;
    client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        const database = client.db(databaseName);
        collection = database.collection(collectionName);
        console.log("connected!");
    } catch (e) {
        console.error(e);
    } 
}

app.set("view engine", "ejs");
app.set("views", "templates");
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const router = express.Router();

router.get('/', async (req, res) => {
    let poems = [];
    try {
        poems = await collection.find().toArray();
    } catch(e) {
        console.log(e);
    }
    res.render("home", {poems});
});

router.get('/create', (req, res) => {
    res.render("create");
}); 

router.post('/create', async (req, res) => {
    const { author, title, poem } = req.body;
    const submission = { author, title, poem};
    let poems = [];
    try {
        await collection.insertOne(submission);
        poems = await collection.find().toArray(); 
    } catch (e) {
        console.error(e);
    }
    res.render("submit", { author, title, poem });
});

router.get('/read/:id', async (req, res) => {
    let curr;
    try {
        curr = await collection.findOne({ _id: new ObjectId(req.params.id) });
    } catch (e) {
        console.error(e);
    }
    res.render("poem", { author:curr.author, title:curr.title, poem:curr.poem, id:curr._id})
});

router.post('/delete/:id', async (req, res) => {
    let result;
    try {
        result = await collection.findOne({_id: new ObjectId(req.params.id)})
        await collection.deleteOne({_id: new ObjectId(req.params.id)});
    } catch (e) {
        console.error(e)
    }
    res.render("delete", { title:result.title});
});

router.get('/edit/:id', async (req, res) => {
    let result;
    try {
        result = await collection.findOne({_id: new ObjectId(req.params.id)})
    } catch (e) {
        console.error(e)
    }
    res.render("edit", { title:result.title, author:result.author, poem:result.poem, id:result._id});
});

router.post('/edit/:id', async (req, res) => {
    let { author, title, poem } = req.body;
    try {
        await collection.updateOne({_id: new ObjectId(req.params.id)}, {$set: {author, title, poem}});
    } catch (e) {
        console.error(e)
    }
    res.render("edited", { title, author, poem});
});

router.post('/edited/:id', async (req, res) => {
    let { author, title, poem} = req.body;
    res.render("edited", {author, title, poem});
});

router.get('/rhyme', async (req, res) => {
    
    const word = req.query.word;
    if (!word) {
        return res.json([]);
    }
    try {
        const response = await fetch(`https://api.datamuse.com/words?rel_rhy=${word}`);
        const rhymes = await response.json();
        res.json(rhymes);
    } catch (e) {
        console.log(e);
    }

})

app.use('/', router);

app.listen(PORT, async () => {
    await connectToDatabase();
    console.log(`Web server started and running at http://localhost:${PORT}`);
    process.stdout.write("Stop to shutdown the server: ");
});