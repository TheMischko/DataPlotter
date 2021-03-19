const mongoose = require('mongoose');
const { Schema } = mongoose;

const plotSettingsSchema = new Schema({
  xColumn:  { type: String },
  yColumn:  { type: String },
  func:     { type: String }
});

const viewSchema = new Schema({
  title:        { type: String },
  fileID:       { type: String },
  plotSettings: { type: [plotSettingsSchema] }
});

module.exports = viewSchema;