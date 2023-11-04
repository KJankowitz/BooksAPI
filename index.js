import axios from "axios";
import bodyParser from "body-parser";
import express from "express";
import pg from "pg";

const app = express();
const port = 3000;
//const API_URL = "https://covers.openlibrary.org/b/isbn/" + $value-$size +".jpg"

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

//Display home page with all books
app.get("/", async(req,res) => {
   try {
    const result = await db.query( 
        "SELECT * FROM books ORDER BY TO_CHAR(date_completed :: DATE, 'dd/mm/yyyy') DESC"
    );
    const book_img = await axios.get("https://covers.openlibrary.org/b/isbn/1591847818-S.jpg");
    book_list = result.rows;
    res.render("index.ejs", {
        list: book_list,
        cover: 'https://covers.openlibrary.org/b/isbn/1591847818-M.jpg'
    });
   } catch (error) {
    console.log(error.message);
   } 
})


//Create new entry
app.get("/new", async (req, res) => {
    res.render("new.ejs");
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});