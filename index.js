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
    password: "",
    port: 5432,
  });
  db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//function to get book id to display info
let currentBookId = 0;

async function getBookId() {
    const result = await db.query("SELECT id FROM books");
    let bookIdList = [];
    bookIdList = result.rows;
    const id = bookIdList.find((bookId) => bookId.id == currentBookId);
    return id.id
}

//function to display info of current book
async function getBookInfo() {
    const book = await db.query(
        "SELECT * FROM books JOIN notes ON books.id = book_id WHERE books.id = ($1)",
        [currentBookId]
        );
    return book;
}

//function to get all notes of current book
async function getNotes() {
    const all_notes = await db.query(
        "SELECT notes.id, note FROM books JOIN notes ON books.id = book_id WHERE books.id = ($1)",
        [currentBookId]
        );
    return all_notes;
}

let book_list = [];

//Display home page with all books
app.get("/", async(req,res) => {
   try {
    const result = await db.query( 
        "SELECT * FROM books"
    );
    book_list = result.rows;
    res.render("index.ejs", {
        list: book_list,
    });
   } catch (error) {
    console.log(error.message);
   } 
})

//Order home page by date, rating or title
app.post("/sort", async (req, res) => {
    const method = req.body.sort_method;
    if (method == "date_completed") {
        const result = await db.query( 
            "SELECT * FROM books ORDER BY TO_CHAR(date_completed :: DATE, 'dd/mm/yyyy') ASC"
        );
        book_list = result.rows;
    } else if (method == "rating") {
        const result = await db.query(
            "SELECT * FROM books ORDER BY rating DESC",
        )
        book_list = result.rows;
    } else {
        const result = await db.query(
            "SELECT * FROM books ORDER BY book_title ASC",
        )
        book_list = result.rows; 
    }
    res.render("index.ejs", {
        list: book_list
    })
})

//display book page with all info
app.post("/book", async (req, res) => {
    currentBookId = req.body.current_id;
    const book = await getBookInfo();
    const all_notes = await getNotes();
    res.render("book.ejs", {
    book : book.rows[0],
    notes : all_notes.rows,
    });
   
})

app.get("/book", async (req, res) => {
   try {
    currentBookId = await getBookId();
    const book = await getBookInfo();
    const all_notes = await getNotes();
    res.render("book.ejs", {
    book : book.rows[0],
    notes : all_notes.rows,
    });
   } catch (error) {
    console.log(error);
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
    currentBookId = result.rows[0].id;
    const result_note = await db.query(
        "INSERT INTO notes (book_id, note) VALUES ($1, $2)",
        [currentBookId, req.body.note]
    );
    res.redirect("/");
})

//edit an existing note
app.post("/edit", async (req, res) => {
    const updateNote = req.body.updatedNote;
    const noteId = req.body.editNoteId;
    const result = await db.query(
        "UPDATE notes SET note = ($1) WHERE id = ($2)",
        [updateNote, noteId]
    );
    res.redirect("/book");
})

//delete a book entry
app.post("/delete", async(req, res) => {
    const id = req.body.delete_id; 
    await db.query(
        "DELETE FROM notes WHERE book_id = ($1)",
        [id]
    )
    await db.query(
        "DELETE FROM books WHERE id = ($1)",
        [id]
    )
    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
