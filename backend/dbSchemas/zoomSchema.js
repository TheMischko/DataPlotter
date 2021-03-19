const mongoose = require('mongoose');
const { Schema } = mongoose;

const zoomSchema = new Schema({
  title:        {type: String},
  zoomSequence: {type: [Schema.Types.Mixed], default: [null]},
  viewID:       {type: String}
});

module.exports = zoomSchema;