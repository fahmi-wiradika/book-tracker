const mongoose = require('mongoose');
const BookSchema = new mongoose.Schema(
    {
        title: { type: String, require: true},
        comments: [String],
    }
);

module.exports = mongoose.model("Books", BookSchema);