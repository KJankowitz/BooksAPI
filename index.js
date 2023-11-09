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
        //cover: 'https://covers.openlibrary.org/b/isbn/1591847818-M.jpg'
    });
   } catch (error) {
    console.log(error.message);
   } 
})


//Create new entry
app.get("/new",  (req, res) => {
    res.render("new.ejs");
})



app.post("/new", async (req, res) =>{
    const result = await db.query(
    "INSERT INTO books (book_title, author, isbn, rating, date_completed) VALUES ($1, $2, $3, $4, $5) RETURNING id", 
    [req.body.book_title, req.body.author, req.body.isbn, req.body.rating, req.body.date_completed]
    );
    const currentBookID = result.rows[0].id;
    const result_note = await db.query(
        "INSERT INTO notes (book_id, note) VALUES ($1, $2)",
        [currentBookID, req.body.note]
    );
    res.redirect("/");
})

app.post("/book", async (req, res) => {
    const id = req.body.current_id;
    const result = await db.query(
        "SELECT * FROM books JOIN notes ON books.id = book_id WHERE books.id = ($1)",
        [id]
        );
    const all_notes = await db.query(
        "SELECT notes.id, note FROM books JOIN notes ON books.id = book_id WHERE books.id = ($1)",
        [id]
        ); 
    res.render("book.ejs", {
    book : result.rows[0],
    notes : all_notes.rows,
    });
   console.log(all_notes.rows)
})

app.post("/edit", async (req, res) => {
    const updateNote = req.body.updatedNote;
    const noteId = req.body.editNoteId;
    const result = await db.query(
        "UPDATE notes SET note = ($1) WHERE id = ($2)",
        [updateNote, noteId]
    );
    res.redirect("book.ejs");
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});