const mongoose = require('mongoose');
const { Schema } = mongoose;

const courseValuesSchema = new Schema({
  yColumn:  { type: String},
  func:     { type: String},
  color:    { type: String}
})

const plotSettingsSchema = new Schema({
  xColumn:  { type: String },
  values:  { type: [courseValuesSchema] }
});

const viewSchema = new Schema({
  title:        { type: String },
  fileID:       { type: String },
  plotSettings: { type: [plotSettingsSchema] }
});

module.exports = viewSchema;