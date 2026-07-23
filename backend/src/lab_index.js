import http from "http"
import { readFile } from "fs"

const server = http.createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
        try {
            console.log("hrreiufh")
            const html = readFile("D:/Study Material/FSD/Project/backend/public/index.html", (err, data) => {
                if (err) {
                    throw err;
                }
                const html = data;
                res.writeHead(200, { "Content-type": "text/html" });
                res.end(html);
            });
        } catch (err) {
            console.log("Error :- ", err);
        }
    }
    else if (req.url === "/api") {
        try {
            console.log("/api endpoint");
            const json = [
                [
                    {
                        "from": "24bce261@gmail.com",
                        "to": "nirbayshingala71@gmail.com",
                        "subject": "test subject",
                        "body": "this is a test body for the email."
                    },
                    {
                        "from": "24bce262@gmail.com",
                        "to": "nirbayshingala71@gmail.com",
                        "subject": "test subject 2",
                        "body": "this is a test body for the email."
                    }
                ],
                [
                    {
                        "from": "24bce263@gmail.<EMAIL>",
                        "to": "nirbayshingala71@gmail.com",
                        "subject": "test subject 3",
                        "body": "this is a test body for the email."
                    },
                    {
                        "from": "24bce264@gmail.com",
                        "to": "nirbayshingala71@gmail.com",
                        "subject": "test subject 4",
                        "body": "this is a test body for the email."
                    }
                ],
                [
                    {
                        "from": "24bce265@gmail.com",
                        "to": "nirbayshingala71@gmail.com",
                        "subject": "test subject 5",
                        "body": "this is a test body for the email."
                    },
                    {
                        "from": "24bce266@gmail.com",
                        "to": "nirbayshingala71@gmail.com",
                        "subject": "test subject 6",
                        "body": "this is a test body for the email."

                    }
                ]
            ]

            // let json;

            // readFile("Project/backend/src/data.json", (err, data)=>{
            //     if(err){throw err;}
            //     else json = data;
            // })

            console.log(json);

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify(json));
        } catch (err) {
            console.log("Error :- ", err);
        }
    }
})

server.listen(5000, () => {
    console.log("Server is running http://localhost:5000")
})

