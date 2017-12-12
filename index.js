
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');


const GIFTS_TABLE = process.env.GIFTS_TABLE;
const KIDS_TABLE = process.env.KIDS_TABLE;

const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token");
  next();
});

// Get a Random Child endpoint
/*
  curl -H "Content-Type: application/json" -X GET ${BASEURL}/kid?level=L1
*/
app.get('/kid', function (req, res) {

  var level = req.query.level;
  // parameter validation
  if (level !== "L1" && level !== "L2" && level !== "L3") {
    res.status(404).json({ error: "Level not found" });
  }

  var currentYear = (new Date()).getFullYear();

  const yearmap = {
    "L1": {"max": currentYear - 5, "min": currentYear - 8}, //2012 - 2009
    "L2": {"max": currentYear -  9, "min": currentYear - 11}, //2008-2006
    "L3": {"max": currentYear - 12, "min": currentYear - 16} //2007-2003
  }

  var maxAge = yearmap[level].max;
  var minAge = yearmap[level].min;
  

  const params = {
   TableName: KIDS_TABLE,
   IndexName: "StatusIndex",
   KeyConditionExpression: "#status = :status",
   ExpressionAttributeNames: { "#status": "status" },
   ExpressionAttributeValues: {
     ":status": "OPEN"
   }
 };

 dynamoDb.query(params, function(err, result) {
   if (err) { console.log(err) } 
   else {
      if (result.Items) {
        console.log("# of records: " + result.Items.length);
        //take the first OPEN record to issue, incase age doesnt match
        var record = result.Items [0];
	
		console.log(minAge);
		console.log(maxAge);
		
        for (var i=0; i<result.Items.length; i++) {
          var element = result.Items[i];
          console.log(element);
		  
		  var age = element.orphansyob;
		  console.log(age);
		  
          if (age >= minAge && age <= maxAge) {
            record = element;
            break;
          }
        }
        res.json(record);
      } else {
        res.status(404).json({ error: "Records not found" });
      }
   }
 });

});

// Get all Gifts endpoint
/*
  curl -H "Content-Type: application/json" -X GET ${BASEURL}/gifts
*/
app.get('/gifts', function (req, res) {
  const params = {
    TableName: GIFTS_TABLE
  }
  // fetch all todos from the database
  dynamoDb.scan(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      res.status(501).json({ error: 'Could not create record' });
      return;
    }

    if (result.Items) {
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "Records not found" });
    }
  });

});

// Create Gifts endpoint
/*
  curl -H "Content-Type: application/json" -X POST ${BASEURL}/gifts -d '{"childrenhome": "Sudarshi Children House", "orphansname": "Mahesh Senarathna","orphansid": "3", "orphansage": "12", "giftlevel": "L1", "childsname": "David Merto", "childsage": "7", "deliveryadd": "PO3456, Svein Gata, Oslo 2345", "giversname": "Robert Merto", "email": "merto@gmail.com", "note": "Happy Christmas!!", "status":"NOTPAID"}'
*/
app.post('/gifts', function (req, res) {
  const timestamp = new Date().getTime();
  var rec = JSON.parse(req.body);
  console.log(rec);
  const { childrenhome, orphansid, orphansname, orphansage, giftlevel, childsname, childsage, deliveryadd, giversname, email, note, status } = rec;

  const params = {
    TableName: GIFTS_TABLE,
    Item: {
      timestamp: timestamp,
      childrenhome: childrenhome,
      orphansid: orphansid,
      orphansname: orphansname,
      orphansage: orphansage,
      giftlevel: giftlevel,
      childsname: childsname,
      childsage: childsage,
      deliveryadd: deliveryadd,
      giversname: giversname,
      email: email,
      status: status,
      note: note
    },
  };
  
  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create record' });
    }
    res.json({ timestamp, orphansid, orphansname });
  });
});

// Once the payment is made this service is used to update the record with payment confirmation
/*
  curl -H "Content-Type: application/json" -X GET ${BASEURL}/confirm?id=1512479126604
*/
app.get('/confirm', function (req, res) {
  var recordid = parseInt(req.query.id);

  if (!recordid) {
    res.status(404).json({ error: "ID not valid" });
  } else {
    const params = {
      TableName: GIFTS_TABLE,
      Key:{
        "timestamp": recordid
      },
      UpdateExpression: "set #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues:{
          ":status": "PAID"
      },
      ReturnValues:"UPDATED_NEW"
    };

    dynamoDb.update(params, (error, data) => {
      if (error) {
          console.error("Unable to update item. Error JSON:", JSON.stringify(error, null, 2));
          res.status(501).json({ error: 'Could not update record' });
      } else {
          console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
          res.json({ recordid });
      }
    });
  }
  
});

module.exports.handler = serverless(app);