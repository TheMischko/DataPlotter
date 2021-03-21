/*******************************************************************
 * Class: Zoom
 * Object container for information about single zoom.
 ******************************************************************/
export default class Zoom {
  /**
   * Constructor for new Zoom object instance.
   * @param {string} id
   * @param {string} name
   * @param {array} zoomSequence
   */
  constructor(id, name, zoomSequence) {
    this.id = id;
    this.name = name;
    this.zoomSequence = zoomSequence;
  }
}