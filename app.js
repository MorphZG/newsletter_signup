// instead of npm use pnpm: https://pnpm.io/motivation

const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");

require("dotenv").config(); // read environment variables from .env
const appID = process.env.appID; // API key
const listID = process.env.audienceID; // audience/list id
const port = process.env.PORT;  // environment variable PORT
const dataCenter = "us21";

const app = express();

// serve the static files from "public" directory when needed
app.use(express.static("public"));
// urlencoded is mode of body-parser to read <form> inputs
app.use(bodyParser.urlencoded({ extended: true }));

// handle GET requests
app.get("/", function (req, res) {
    res.sendFile(`${__dirname}/signup.html`);
});

// handle POST request comming from <form action="/", method="post">
app.post("/", function (req, res) {
    const firstName = req.body.firstName; // <input name="firstName" />
    const lastName = req.body.lastName;
    const email = req.body.email;

    // ---- compose another POST request to mailchimp
    // format the data for mailchimp
    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName,
                },
            },
        ],
    };
    // convert data to flat string
    const jsonData = JSON.stringify(data);

    // request parameters
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listID}`;
    const options = {
        method: "POST",
        auth: `user:${appID}`,
    };
    // create request object
    const request = https.request(url, options, function (response) {
        // log the response status code
        console.log(response.statusCode);
        if (response.statusCode === 200) {
            res.sendFile(`${__dirname}/success.html`); // res (object for user)
        } else {
            res.sendFile(`${__dirname}/failure.html`); // res (object for user)
        }
        // listen for "data" event and print to console
        response.on("data", function (data) {
            // response (object from mailchimp)
            //console.log(JSON.parse(data))
            process.stdout.write(data);
        });
    });
    // include jsonData in the request body and finalize the request
    request.write(jsonData);
    request.end();
});

// user fails to signup, redirect back to root
app.post("/failure", function (req, res) {
    res.redirect("/");
});

// listen for connections
app.listen(port, function () {
    console.log(`server running on port ${port}`);
});
