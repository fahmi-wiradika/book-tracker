/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';
const Book = require('../models/books');
const {
  GetLibrary,
  AddBook,
  DropLibrary,
  GetBook,
  AddComment,
  DropBook
} = require("../controllers/Library");

module.exports = function (app) {

  app.route('/api/books')
    .get(GetLibrary)
    .post(AddBook)
    .delete(DropLibrary);

  app.route('/api/books/:id')
    .get(GetBook)
    .post(AddComment)
    .delete(DropBook);
  
};
