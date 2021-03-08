/*******************************************************************
 *  Class: ImageManager
 *  Has function for SVG management and exporting SVGs into images
 *  Main logic got inspired from http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
 ******************************************************************/

export default class ImageManager{
  /**
   * Return serialized string out of SVG element with all needed CSS styles in it.
   * Used when exporting SVG to file.
   * @param svgNode Node of SVG Element to serialize.
   * @returns {string} Serialized SVG element.
   */
  getSVGString(svgNode){
    svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
    const cssStyleText = this.getCssStyles(svgNode);
    const cssElement = this.appendCss(cssStyleText, svgNode);
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgNode);
    // Fix root xlink without namespace
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=');
    // Safari NS namespace fix
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href');
    cssElement.remove();
    return svgString;
  }


  /**
   * Extracts all CSS rules related to an element and its children nodes.
   * @param parentElement Element
   * @returns {string} Serialized CSS rules.
   */
  getCssStyles(parentElement) {
    const selectorTextArr = [];
    // Add Parent element Id and Classes to the list
    selectorTextArr.push('#'+parentElement.id);
    for (let c = 0; c < parentElement.classList.length; c++) {
      if (!selectorTextArr.includes('.' + parentElement.classList[c]))
        selectorTextArr.push('.' + parentElement.classList[c]);
    }
    // Add Children element Ids and Classes to the list
    const nodes = parentElement.getElementsByTagName("*");
    for(let i = 0; i < nodes.length; i++) {
      const id = nodes[i].id;
      if (!selectorTextArr.includes('#'+id))
        selectorTextArr.push('#'+id);

      const classes = nodes[i].classList;
      for(let c = 0; c < classes.length; c++) {
        if (!selectorTextArr.includes('.' + classes[c]))
          selectorTextArr.push('.' + classes[c]);
      }
    }
    // Extracting CSS rules
    let extractedCSSText = "";
    for (let i = 0; i < document.styleSheets.length; i++) {
      const s = document.styleSheets[i];
      try {
        if(!s.cssRules) continue;
      } catch( e ) {
        if(e.name !== 'SecurityError') throw e; // for Firefox
        continue;
      }
      const cssRules = s.cssRules;
      //Iterate through all rules and compare them to all selectors and add relevant to final string.
      for(let rule = 0; rule < cssRules.length; rule++) {
        for(let selector = 0; selector < selectorTextArr.length; selector++){
          if(typeof cssRules[rule]['selectorText'] === 'undefined')
            continue;
          if(cssRules[rule]['selectorText'].includes(selectorTextArr[selector])){
            extractedCSSText += cssRules[rule]['cssText'];
          }
        }
      }
    }
    // Hide vertical cursor tooltip line
    extractedCSSText += ' .tooltip-line{ display: none; }'
    return extractedCSSText;
  }


  /**
   * Appends CSS styles to selected element.
   * @param cssText Serialized CSS styles
   * @param element Element that will contain those CSS styles.
   * @returns {HTMLStyleElement} Newly created <style></style> element.
   */
  appendCss(cssText, element){
    const styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.innerHTML = cssText;
    const refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore(styleElement, refNode);
    return styleElement;
  }


  /**
   * Exports SVG to raster graphic file.
   * @param svgString Serialized SVG string
   * @param width Width of the final image
   * @param height Height of the final image
   * @param format Raster graphic format for export, 'PNG' if null
   * @param callback Callback function after Image Blob is created,
   *                  has two params: Blob and Filesize as number
   */
  svgString2Image(svgString, width, height, format, callback){
    let format_type = format ? format : 'png';
    //Convert
    let imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');

    canvas.width = width*2;
    canvas.height = height*2;

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      // Draw image on canvas
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob => {
        const fileSize = Math.round(blob.size/1024) + 'KB';
        if(callback)
          callback(blob, fileSize);
      }));
    }
    // Set image source to SVG string
    image.src = imgSrc;
  }
}