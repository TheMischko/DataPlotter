const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Mongoose schema for file object in database.
 * @type {module:mongoose.Schema<Document, Model<any, any>, undefined>}
 */
const fileSchema = new Schema({
  nickname:     {type: String, default: ''},
  filename:     {type: String, default: ''},
  mimetype:     {type: String, default: ''},
  md5:          {type: String, default: ''},
  size:         {type: Number, default: 0},
  created_at:   {type: Date, default: Date.now()},
  last_accessed:{type: Date, default: null}
});

module.exports = fileSchema;