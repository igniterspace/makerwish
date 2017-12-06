# MakerWish
This is the codebase of the makerwish.org application. The system is built using Serverless Framework. Technologies involved are DynamoDB, AWS Lambda, API Gateway, S3.
## Set up
* Install serverless CLI
* Configure credentials to the AWS account
* Clone this repository
* Run 'sls deploy' to deploy the stack to AWS

## APIs
Below are the REST APIs to communicate with the backend

### Get a random child from orphanage to recieve the gift
This service should be used to display the gift reciever information in the purchase workflow.

```GET ${BASEURL}/kid?level=<level>```

level should be either L1, L2 or L3

Example: 
```curl -H "Content-Type: application/json" -X GET ${BASEURL}/kid?level=L1```


### Save gift giver information
Just before the payment is made, we will save all information of the new gift purchase through this call

```POST ${BASEURL}/gifts```

POST body should contain the JSON object with all gift purchase information

Example:
```curl -H "Content-Type: application/json" -X POST ${BASEURL}/gifts -d '{"childrenhome": "Sudarshi Children House", "orphansname": "Mahesh Senarathna","orphansid": "3", "orphansage": "12", "giftlevel": "L1", "childsname": "David Merto", "childsage": "7", "deliveryadd": "PO3456, Svein Gata, Oslo 2345", "giversname": "Robert Merto", "email": "merto@gmail.com", "note": "Happy Christmas!!", "status":"NOTPAID"}'```


### Confirm after the payment is made
This method should be called after payment confirmation is recied from PayPal. Possibly we should use paypal to make this call for security purposes.

```GET ${BASEURL}/confirm?id=<timestamp>```

<timestamp> is the id of the saved gift giver record above

Example: 

```curl -H "Content-Type: application/json" -X GET ${BASEURL}/confirm?id=1512479126604```

### View all gifts purchased
Optional API to list the gifts. This is not used in the purchase workflow, but for reporting purposes may be important.

Example:
```curl -H "Content-Type: application/json" -X GET ${BASEURL}/gifts```
