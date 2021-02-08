/*******************************************************************
 * Class: ZoomManager
 * Has function and handlers for general situations when working
 * with plot zooms.
 ******************************************************************/
import Zoom from "../Classes/Zoom";
export default class ZoomManager {
  constructor() {
    this.ZOOMS_KEY = 'zooms';

    this.init()
  }


  init() {
    // ZoomPath represent a ordered sequence of zooms made by user.
    // This sequence is needed for reconstruction of currently zoomed area by user.
    localStorage.setItem('zoomPath', JSON.stringify([null]));
    // Fired whenever zoom is changed
    document.addEventListener('plotSelectionChanged', (e) => {this.onZoomChange()});
  }

  /**
   * Gets value of the actual selection from storage.
   * @returns {null|array} Null if no was performed of array with two values 0->start, 1->end of selection
   */
  getSelection() {
    const selection = JSON.parse(localStorage.getItem('selection'));
    if(typeof(selection) === 'undefined'){
      localStorage.setItem('selection', 'null');
      return null;
    } else {
      return selection;
    }
  }

  /**
   * Gets all zooms saved in storage.
   * @returns {Zoom[]}
   */
  getAllZooms() {
    const zooms = JSON.parse(localStorage.getItem(this.ZOOMS_KEY));
    if(typeof(zooms) === 'undefined' || zooms === null){
      localStorage.setItem('selection', JSON.stringify('[]'));
      return [];
    } else {
      return zooms.map(zoom => new Zoom(zoom.id, zoom.name, zoom.zoomSequence))
    }
  }

  /**
   * Gets sequence of zooms for current view.
   * @returns {*[]}
   */
  getCurrentZoomPath() {
    const zoomPath = JSON.parse(localStorage.getItem('zoomPath'));
    if(typeof(zoomPath) === 'undefined' || zoomPath === null){
      localStorage.setItem('selection', JSON.stringify('[null]'));
      return [null];
    } else {
      return zoomPath
    }
  }

  /**
   * Saves zoom sequence into storage.
   * @param {*[]}zoomSequence
   * @param {string}name
   * @returns {number} ID of zoom in storage.
   */
  addNewZoom(zoomSequence, name = '') {
    const zooms = this.getAllZooms();
    let newIndex = -1;
    if(zooms.length === 0)
      newIndex = 0
    else
      // Gets index of last zoom and adds one to it
      newIndex = zooms[zooms.length - 1].id + 1;

    zooms.push(new Zoom(newIndex, name, zoomSequence));
    localStorage.setItem(this.ZOOMS_KEY, JSON.stringify(zooms));
    return newIndex;
  }

  /**
   * Returns Zoom with corresponding ID.
   * @param {Number}id
   * @returns Zoom
   * @throws Error when zoom was not found
   */
  getZoomByID(id){
    const zooms = this.getAllZooms();
    for(let i = 0; i<zooms.length; i++){
      if(zooms[i].id === id)
        return zooms[i];
    }
    return null;
  }

  /**
   * Updates data to zoom in storage set by ID.
   * @param {number} id
   * @param {string} name
   * @param {*[]} zoomSequence
   */
  updateZoom(id, {name= '', zoomSequence= null}){
    const zooms = this.getAllZooms();
    zooms.forEach(zoom => {
      if(zoom.id === id)
        if(typeof name !== 'undefined')
          zoom.name = name;
        if(zoomSequence !== null && typeof zoomSequence !== 'undefined')
          zoom.zoomSequence = zoomSequence;
    });
    localStorage.setItem(this.ZOOMS_KEY, JSON.stringify(zooms));
  }

  /**
   * Deletes zoom with corresponding ID from storage.
   * @param {number}id
   */
  deleteZoom(id){
    const zooms = this.getAllZooms();
    zooms.forEach(zoom => {
      if(zoom.id === id) {
        const deleteIndex = zooms.indexOf(zoom);
        zooms.splice(deleteIndex, 1);
      }
    });
    localStorage.setItem(this.ZOOMS_KEY, JSON.stringify(zooms));
  }


  /**
   * Used for saving current zoom sequence into localStorage.
   * @returns {number} index of the sequence in storage
   */
  saveCurrentZoom() {
    console.log('Saving current zoom.');
    const zoomPath = this.getCurrentZoomPath();
    return this.addNewZoom(zoomPath);
  }


  // Handler for global Event fired when selection in plot is made.
  onZoomChange(e) {
    // Loads selection from memory
    const selection = JSON.parse(localStorage.getItem('selection'));
    // Null means whole plot is shown
    if(selection === null){
      // Therefore reset the zoomPath
      localStorage.setItem('zoomPath', JSON.stringify([null]));
    } else {
      // Otherwise get the actual zoomPath from memory
      const zoomPath = JSON.parse(localStorage.getItem('zoomPath'));
      // And append new selection to it.
      zoomPath.push(selection);
      localStorage.setItem('zoomPath', JSON.stringify(zoomPath));
    }
  }
}