import * as d3 from "d3";

export default class ZoomToolsTile {
  constructor(element, selector, options) {
    this.element = element;
    /* ZoomManager */
    this.zoomManager = options['zoomManager'];
    this.parent = options['parent'];
    this.init();
  }

  init(){
    const parent = d3.select(this.parent);
    parent.classed('option-tile', true);

    parent.append('h1')
      .text('Tools:');

    parent.append('button')
      .html('<i class="fas fa-undo"></i>&nbsp;Reset view')
      .on('click', (e) => {this.resetViewButtonOnClick(e)});

    parent.append('button')
      .html('<i class="fas fa-trash"></i>&nbsp;Delete zooms mode')
      .classed('danger', true)
      .on('click', (e) => {this.deleteModeButtonOnClick(e)})
  }


  deleteModeButtonOnClick(e) {
    let target = e.target;
    // If button is not target, but icon is, set target to button
    if(target.tagName === 'I')
      target = target.parentNode;

    let isDeleteModeOn = target.classList.contains('deleteModeOn');
    if(isDeleteModeOn){
      d3.select(target)
        .html('<i class="fas fa-trash"></i>&nbsp;Delete zooms mode')
        .classed('deleteModeOn', false);
      d3.selectAll('.zoomButton')
        .classed('deleteMode', false)
        .classed('danger', false);
      d3.selectAll('.deleteModeCross')
        .remove();
    } else {
      d3.select(target)
        .html('<i class="fas fa-trash"></i>&nbsp;Turn off delete mode')
        .classed('deleteModeOn', true);
      d3.selectAll('.zoomButton')
        .classed('deleteMode', true)
        .classed('danger', true)
        .insert('i', ':first-child')
          .classed('deleteModeCross', true)
          .classed('fas', true)
          .classed('fa-times', true);
    }
  }


  resetViewButtonOnClick(e) {
    this.zoomManager.setSelection(null);
    this.zoomManager.fireChangeEvent();
  }
}