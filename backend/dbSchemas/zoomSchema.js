const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Mongoose schema for zoom object in database.
 * @type {module:mongoose.Schema<Document, Model<any, any>, undefined>}
 */
const zoomSchema = new Schema({
  title:        {type: String},
  zoomSequence: {type: [Schema.Types.Mixed], default: [null]},
  viewID:       {type: String}
});

module.exports = zoomSchema;