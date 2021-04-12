import * as d3 from "d3";
import ImageManager from "./Managers/ImageManager";
import 'file-saver'

/**
 * Class that corresponds to menu tile that handles actions over active plot.
 */
export default class PlotToolsTile{
  constructor(element, selector, options) {
    this.element = element;
    this.init();
    this.imageManager = new ImageManager();
  }

  init() {
    const parent = d3.select(this.element);
    parent.classed('option-tile', true);
    // Menu title
    parent.append('h1')
      .text('Plot menu:');
    // Save as Bitmap Image button
    parent.append('button')
      .html('<i class="far fa-image"></i>&nbsp;Save as an image')
      .attr('title', 'Saves current plot as an image.')
      .on('click', (e) => {this.saveImageClicked(e)})
    // Save as SVG Image button
    parent.append('button')
      .html('<i class="far fa-file-image"></i>&nbsp;Save as an SVG')
      .attr('title', 'Saves current plot as an SVG image.')
      .on('click', (e) => {this.saveSVGImageClicked(e)})
    // This is used for optimization of handling the mousemove event.
    // Only if this is True, event is handled.
    this.caresAboutMouse = true
    // Registration of Event handler for mousemove event
    document.addEventListener('mousemove', (e) => {
      //Skip if handler is blocked
      if(!this.caresAboutMouse)
        return;
      // Block the next handler calls
      this.caresAboutMouse = false;
      // Enable to react after timeout
      setTimeout(() => {this.caresAboutMouse = true}, 300);
      // Get target and call right handler
      let target = e.target;
      while(target !== document){
        if(target.classList.contains('plot')){
          this.mouseOverPlot(target)
          return;
        }
        if(target.getAttribute('id') === 'plotTile'){
          this.mouseOverMenu(target);
          return;
        }
        target = target.parentNode;
      }
      this.mouseOverOther(target);
    })
  }

  /**
   * Function that is called when mouse is hovering over any plot element.
   * @param plotElement Element which is currently under the cursor.
   */
  mouseOverPlot(plotElement){
    const parent = d3.select(this.element);
    this.relatedPlot = plotElement;
    // Show menu
    parent.style('opacity', 1);
    // Show it in line with the element that is hovered over
    parent.style('margin-top', plotElement.getBoundingClientRect().y-10+'px');
  }

  /**
   * Function that is called when mouse is hovering over this element.
   * @param menuElement Element which is currently under the cursor.
   */
  mouseOverMenu(menuElement){
    const parent = d3.select(this.element);
    // If some plot is selected as "main",
    // there was mouse hover over this element, show this menu on mouse over itself.
    if(typeof this.relatedPlot != 'undefined')
      parent.style('opacity', 1);
  }

  /**
   * Function that is called when mouse is hovering over neither plot element or element of this menu.
   * @param otherElement
   */
  mouseOverOther(otherElement){
    const parent = d3.select(this.element);
    // Hide element
    parent.style('opacity', 0);
  }

  /**
   * Function that is called when the button for saving plot as image is pressed.
   *
   * Serializes the active SVG element, transform it to bitmap and download it to client.
   */
  saveImageClicked() {
    const svgString = this.imageManager.getSVGString(this.relatedPlot);
    this.imageManager.svgString2Image(
      svgString,
      this.relatedPlot.getBoundingClientRect().width,
      this.relatedPlot.getBoundingClientRect().height,
      'png',
      (dataBlob, fileSize) => {
        saveAs(dataBlob, 'test.png');
      });
  }

  /**
   * Function that extracts SVG code and all related CSS from active plot, creates SVG file out of it
   * and lets the file download to user.
   */
  saveSVGImageClicked() {
    let svgString = this.imageManager.getSVGString(this.relatedPlot);
    svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;
    let imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    const link = document.createElement('A');
    document.body.append(link);
    link.setAttribute('href', imgSrc);
    link.setAttribute('download', "plot.svg");
    link.click();
    document.body.removeChild(link);
  }
}