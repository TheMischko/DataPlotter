const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Mongoose schema for single course of plot in database.
 * This schema is part of plotSettingsSchema.
 * @type {module:mongoose.Schema<Document, Model<any, any>, undefined>}
 */
const courseValuesSchema = new Schema({
  yColumn:  { type: String},
  func:     { type: String},
  color:    { type: String}
})

/**
 * Mongoose schema for plot settings object that is part of viewSchema.
 * @type {module:mongoose.Schema<Document, Model<any, any>, undefined>}
 */
const plotSettingsSchema = new Schema({
  xColumn:  { type: String },
  values:  { type: [courseValuesSchema] }
});

/**
 * Mongoose schema for View object in database.
 * @type {module:mongoose.Schema<Document, Model<any, any>, undefined>}
 */
const viewSchema = new Schema({
  title:        { type: String },
  fileID:       { type: String },
  plotSettings: { type: [plotSettingsSchema] }
});

module.exports = viewSchema;