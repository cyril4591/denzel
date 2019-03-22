const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const imdb = require('./src/imdb');
const mongodbConfig =require('./config').mongodbConfig;
const actorsID=require('./config').actorsID;

const DENZEL_ID= actorsID.DENZEL_IMDB_ID;
const CONNECTION_URL = mongodbConfig.URL;
const DATABASE_NAME = "MovieDB";
const PORT=9292;

var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

app.listen(PORT, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("Movie");
        console.log(`Connected to ` + DATABASE_NAME + ` on the port ${PORT}!`);
    });
});

app.get("/movies/populate", async (requ, res) => {
	const movies= await imdb(DENZEL_ID);
    collection.insertMany(movies, (error, result) => {
        if(error) {
            return res.status(500).send(error);
        }
        res.send(result.result);
    });
});

app.get("/movies", (requ, res) => {
	collection.aggregate([
		{$match: {metascore: {$gte: 70}}},
		{$sample: {size: 1}}
	]).toArray((error, result)=>{
		if(error) {
            return res.status(500).send(error);
        }
        res.send(result[0]);
    });
});

app.get("/movies/search", (requ, res) => {
	var limit = requ.query.limit;
	var metascore = requ.query.metascore;
	if(limit==null) {
		limit = 5;
	}
	if(metascore==null) {
		metascore = 0;
	}
    collection.aggregate([
		{$match: {metascore: {$gte: metascore}}},
		{$limit: limit},
		{$sort: {metascore: -1}}
	]).toArray((error, result) => {
        if(error) {
            return res.status(500).send(error);
        }
        res.send(result);
    });
});

app.get("/movies/:id", (requ, res) => {
    collection.findOne({ "id": requ.params.id }, (error, result) => {
        if(error) {
            return res.status(500).send(error);
        }
        res.send(result);
    });
});

app.post("/movies/:id", async (requ, res) => {
    const date=requ.body.date;
	const review=requ.body.review;
    collection.updateOne(
		{ "id": requ.params.id },
		{$addToSet:{
			reviews: {
				"date": date,
				"review": review
			}
		}},(error,result) => {
			if(error) {
				return res.status(500).send(error);
			}
			var modify=result.result.nModified;
			res.send({id:requ.params.id, add:modify})
		}
	);
});


