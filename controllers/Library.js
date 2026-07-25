const Book = require('../models/books');


const GetLibrary = async (req, res) => {
  //response will be array of book objects
  //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
try {
  const books = await Book.find({});
  if (!books){
    res.json([]);
    return;
  }
  const formatData = books.map((book) => {
    return {
      _id: book._id,
      title: book.title,
      comments: book.comments,
      commentcount: book.comments.length,
    };
  });
  res.json(formatData);
  return;
}
catch (error){
  res.send("no book exists");
}

}

const AddBook = async (req, res) => {
  let title = req.body.title;
  //response will contain new book object including atleast _id and title
  if(!title){
    res.send("missing required field title");
    return;
  }
  const newBook = new Book({ title, comments: []});
  try{
    const book = await newBook.save();
    res.json({_id: book._id, title: book.title });
  }
  catch(error){
    res.send("there was an error saving");
  }
}

const DropLibrary = async (req, res) => {
  //if successful response will be 'complete delete successful'
  try{
    const deleted = await Book.deleteMany();
    console.log("deleted :>> ", deleted);
    res.send("complete delete successful");
    return;
  }
  catch(error){
    res.send("no book exists");
  }
};

const GetBook = async (req, res) => {
  let bookid = req.params.id;
  //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
  try{
    const book = await Book.findById(bookid);
    res.json({
      _id: book._id,
      title: book.title,
      comments: book.comments,
      commentcount: book.comments.length,
    });
  }
  catch (error){
    res.send("no book exists");
  }
}

const AddComment = async (req, res) => {
  let bookid = req.params.id;
  let comment = req.body.comment;
  if(!comment){
    res.send("missing required field comment");
    return;
  }
  //json res format same as .get
  try{
    let book = await Book.findById(bookid);
    book.comments.push(comment);
    book = await book.save();

    res.json({
      _id: book._id,
      title: book.title,
      comments: book.comments,
      commentcount: book.comments.length,
    });
  }
  catch(error){
    res.send("no book exists");
  }
}

const DropBook = async (req, res) => {
  let bookid = req.params.id;
  //if successful response will be 'delete successful'
  try{
    const deleted = await Book.findByIdAndDelete(bookid);
    console.log("deleted :>> ", deleted);
    if(!deleted) throw new Error("no book exists");
    res.send("delete successful")
  }
  catch(error){
    res.send("no book exists");
  }
}

module.exports = {
    GetLibrary,
    AddBook,
    DropLibrary,
    GetBook,
    AddComment,
    DropBook
};