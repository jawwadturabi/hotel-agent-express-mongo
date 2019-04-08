const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { WebhookClient } = require("dialogflow-fulfillment");
const app = express().use(bodyParser.json());
const dburi = "mongodb+srv://author:author123@cluster0-geoiq.mongodb.net/test?retryWrites=true";
process.env.DEBUG = "dialogflow:debug";

mongoose.connect(dburi, { useNewUrlParser: true }).catch(err => {
    console.log("error occured", err);
});
mongoose.connection.on('error', function (err) {//any error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
})
mongoose.connection.on("connected", () => {
    console.log("Connected with database");
});

mongoose.connection.on("disconnected", () => {
    console.log("Disconnected with database.");
    process.exit(1);
});

var userDetail = new mongoose.Schema(
    {
        name: { type: String, required: true },
        persons: { type: Number, required: true },
        email: { type: String, required: true }
    },
    { collection: "userData" }
);
var model = new mongoose.model("userData", userDetail);

app.post("/webhook", function (request, response, next) {
    const _agent = new WebhookClient({ request: request, response: response });

    function welcome(agent) {
        agent.add(`Good day! you want to book a room`);
    }

    function Booking(agent) {
        const name = agent.parameters.name;
        const persons = agent.parameters.persons;
        const email = agent.parameters.email;
        var data = {
            name: name,
            persons: persons,
            email: email
        }

        var saveData = new model(data);
        saveData.save((err, mydata) => {
            if (err) {
                console.log("error is:" ,err);
                agent.add(`Error while writing on database`);
            } else {
                agent.add(`${name} Your request is proceeded to concern department.
                We'll contact you on this email ${email} Thanks for choosing our Hotel.`);
                console.log("data is",mydata)
            }
        });
    }
    let intentMap = new Map();
    intentMap.set("Default Welcome Intent", welcome);
    intentMap.set("Booking", Booking);
    // intentMap.set("Complaint",complaint);

    _agent.handleRequest(intentMap);
});
app.listen(process.env.PORT || 8088, function () {
    console.log("app is running in 3000");
})