import axios from "axios";
import bodyParser from "body-parser";
import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books",
    password: "DizzyBean67",
    port: 5432,
  });
  db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let book_list = [];

app.get("/", async(req,res) => {
    const result = await db.query( 
        "SELECT * FROM books ORDER BY TO_CHAR(date_completed :: DATE, 'dd/mm/yyyy') DESC"
    );
    book_list = result.rows;
    res.render("index.ejs", {
        list: book_list
    });
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});