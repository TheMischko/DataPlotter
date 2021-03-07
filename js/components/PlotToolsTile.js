import * as d3 from "d3";

export default class PlotToolsTile{
  constructor(element, selector, options) {
    this.element = element;
    this.init();
  }

  init() {
    const parent = d3.select(this.element);
    parent.classed('option-tile', true);
    parent.append('h1')
      .text('Plot menu:');
  }
}