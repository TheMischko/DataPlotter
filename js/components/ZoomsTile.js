import * as d3 from "d3";

export default class ZoomsTile {
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
      .text('Saved zooms:');

    parent.append('button')
      .attr('id', 'add-zoom')
      .html('+ Save current zoom')
      .classed('zoomButton', 'true')
      .classed('success', true)
      .on('click', (e) => {
        this.addZoomClicked(e);
      });

    const zooms = this.zoomManager.getAllZooms();
    for(let i = 0; i < zooms.length; i++){
      const name = zooms[i].name === ''
        ? 'Zoom'+zooms[i].id
        : zooms[i].name
      this.appendZoomButton(parent, zooms[i].id, name, false);
    }
  }


  appendZoomButton(barElement, zoomId, name, startWithInput){
    const button = barElement.append('button')
      .classed('zoomButton', true)
      .attr('zoom-id', zoomId)
      .on('click', (e) => {this.savedZoomButtonClicked(e)})
      .on('dblclick', (e) => {this.savedButtonDoubleClk(e)});
    button.append('div')
      .text(name)
      .style('display', startWithInput ? 'none' : 'block')
    button.append('input')
      .attr('type', 'text')
      .attr('placeholder', 'Set name...')
      .attr('zoom-id', zoomId)
      .style('display', startWithInput ? 'block' : 'none')
      .on('blur', (e) => {this.inputLostFocus(e)})
      .on('keypress', (e) => {this.inputKeyPressed(e)})
      .node().focus();
  }


  /**
   * Handler for click event on button that saves new zoom.
   * @param e Event
   */
  addZoomClicked(e) {
    const newIndex = this.zoomManager.saveCurrentZoom();
    const parent = d3.select(e.target.parentNode);
    this.appendZoomButton(parent, newIndex, '', true);
  }

  /**
   * Handler for click event on button representing saved zoom.
   * @param e
   */
  savedZoomButtonClicked(e) {
    console.log('single click');
    let target = e.target;
    while(target.tagName !== 'BUTTON'){
      target = target.parentNode;
    }
    const zoomID = Number(target.getAttribute('zoom-id'));
    const zoomSequence = this.zoomManager.getZoomByID(zoomID).zoomSequence;
    // If is current view set over whole plot ignore the first step of zoomPath aka 'Go back to default'
    if(this.zoomManager.getCurrentZoomPath().length === 1) {
      zoomSequence.splice(0, 1);
    }
    for(let i = 0; i < zoomSequence.length; i++) {
      setTimeout(() => {
        const event = new Event('plotSelectionChanged');
        event.from = 'button';
        if(i === 0 && zoomSequence[i] === null)
          localStorage.setItem('selection', JSON.stringify(null));
        else
          localStorage.setItem('selection', JSON.stringify([zoomSequence[i][0], zoomSequence[i][1]]));
        localStorage.setItem('activeZoom', JSON.stringify(zoomID));
        document.dispatchEvent(event);
      }, 300*i);
    }
  }


  savedButtonDoubleClk(e) {
    let target = e.target;
    while(target.tagName !== 'BUTTON'){
      target = target.parentNode;
    }
    // Hide button text
    d3.select(target.children[0])
      .style('display', 'none');
    // Show input
    d3.select(target.children[1])
      .style('display', 'block')
      .node().focus();
  }


  inputLostFocus(e) {
    const nameVal = e.target.value !== ''
      ? e.target.value
      : 'Zoom'+e.target.getAttribute('zoom-id');

    // Show text
    d3.select(e.target.previousSibling)
      .text(nameVal)
      .style('display', 'block');
    // Hide input
    d3.select(e.target)
      .style('display', 'none');
    this.zoomManager.updateZoom(Number(e.target.getAttribute('zoom-id')), {name: nameVal});
  }


  inputKeyPressed(e) {
    if(e.code === 'Enter' || e.code === 'NumpadEnter'){
      e.target.blur();
    }
  }

}