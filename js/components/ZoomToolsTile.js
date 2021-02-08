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
      .classed('zoomButton', 'true')
      .html('<i class="fas fa-undo"></i>&nbsp;Reset view')

    parent.append('button')
      .classed('zoomButton', 'true')
      .html('<i class="fas fa-trash"></i>&nbsp;Zoom delete mode')
      .classed('danger', true)
  }
}