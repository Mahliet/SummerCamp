const http = require("http");
const express = require("express");
const app = express();
const fs = require("fs");

const bodyParser = require("body-parser");

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') })  

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');

portNumber = process.argv[2];

console.log(`Web server started and running at http://localhost:${portNumber}`);
const prompt = "Stop to shutdown the server: ";

process.stdout.write(prompt);

process.stdin.setEncoding("utf8"); /* encoding */
process.stdin.on('readable', () => {  /* on equivalent to addEventListener */
	let dataInput = process.stdin.read();
	if (dataInput !== null) {
		let command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0);  /* exiting */
        } 
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});


async function create_Mongo() {
    const uri = process.env.MONGO_CONNECTION_STRING;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        return client;
    } catch (e) {
        console.error(e);
    }
}
const mongo = create_Mongo();

app.use(bodyParser.urlencoded({extended:false}));

app.set("views", path.resolve(__dirname, "templates"));

app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/app", (request, response) => {
    response.render("app");
});

app.get("/reviewApp", (request, response) => {
    response.render("reviewApp");
});

app.get("/selectGPA", (request, response) => {
    response.render("selectGPA");
});

app.get("/removeApp", (request, response) => {
    response.render("removeApp");
});

app.post("/app", async (request, response) => {
    let { name, email, gpa, background} = request.body;
    const variables = { name, email, gpa, background };

    try {
        const db = (await mongo).db(databaseAndCollection.db);
        const collection = db.collection(databaseAndCollection.collection);
        await collection.insertOne(variables);

        response.render("appConfirm", variables);
    } catch (e) {
        console.error(e);
    }
});

app.post("/reviewApp", async (request, response) => {
    try {
        const email = request.body.email;
        const db = (await mongo).db(databaseAndCollection.db);
        const collection = db.collection(process.env.MONGO_COLLECTION);

        const apply = await collection.findOne({ email: email });

        if (apply) {
            response.render("appConfirm", { ...apply });
        } else {
            const vars = {
                name: 'NONE',
                email: 'NONE',
                gpa: 'NONE',
                background: 'NONE'
            };
            response.render("appConfirm", vars);
        }
    }catch (e) {
        console.error(e);
    }
});
app.post("/selectGPA", async (request, response) => {
    try {
        let {gpa}   = request.body;
        let client = await create_Mongo();
        let filter = {gpa: {$gte: gpa}};
        const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);

        const result = await cursor.toArray();
        let table = "";

        table += `<table border="1"><tr><th>Name</th><th>GPA</th></tr>`;
        result.forEach(result => {
            table += `<tr><td>${result.name}</td><td>${result.gpa}</td></tr>`;
        });
        table += '</table>';
       
        response.render("gpaConfirm", {gpasTable: table});
        
    }catch (e) {
        console.error(e);
    }
});
app.post("/removeApp", async (request, response) => {
    try {
        let client = await create_Mongo();
        
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        let count = result.deletedCount;
        await client.close();

        response.render("removeConfirm", {count: count});
    } catch (e) {
        console.error(e);
    }
})

app.listen(portNumber);