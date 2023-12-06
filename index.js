const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

axios.interceptors.response.use(
    function (response) {
        return response.data;
    },
    function (error) {
        return Promise.reject(error);
    }
);

app.post("/v1/chat/completions", async function (request, response) {
    let { stream } = request.body;

    const { authorization } = request.headers;

    if (!stream) {
        let result = null;
        try {
            result = await axios({
                method: "POST",
                url: "https://api.openai.com/v1/chat/completions",
                data: request.body,
                headers: {
                    authorization
                }
            });
        } catch (err) {
            return response.send(err.response.data);
        }
        return response.send(result);
    }

    response.writeHead(200, {
        "Content-Type": "text/event-stream"
    });

    axios({
        method: "POST",
        url: "https://api.openai.com/v1/chat/completions",
        data: request.body,
        headers: {
            authorization
        },
        responseType: "stream"
    })
        .then((res) => {
            res.on("data", (chunk) => {
                response.write(Buffer.from(chunk.toString()));
            });
            res.on("end", () => {
                response.end();
            });
        })
        .catch((err) => {
            err.response.data.on("data", (chunk) => {
                response.write(Buffer.from(chunk.toString()));
            });
            err.response.data.on("end", () => {
                response.end();
            });
        });
});

app.get("/*", (request, response) => {
    response.send("部署完成");
});
app.post("/*", (request, response) => {
    response.send("部署完成");
});

app.listen(9000, function () {
    console.log("http://localhost:9000");
});
