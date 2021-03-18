const mongoose = require('mongoose');
const { Schema } = mongoose;

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