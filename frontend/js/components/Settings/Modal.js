import * as d3 from "d3";
import css from "../../../css/modal.css"

/**
 * Component representing Modal window in HTML DOM.
 */
export default class Modal {
    /**
     * Creates hidden modal window to the DOM.
     * The modal window will be either appended to DOM body or to other element.
     * @param parentNode HTMLElement if null document.body will be used
     * @param selector Query selector of element this classed is tied to.
     * @param options dictionary of single options
     *  "DOM_ID" - enables to set custom ID for generated element
     */
    constructor(parentNode, selector, options) {

        this.parentNode = parentNode === null
            ? document.body
            : parentNode;

        this.DOM_ID = typeof(options.DOM_ID) === 'undefined'
            ? null
            : options.DOM_ID;
        this.create();
    }


    /**
     * Generates empty modal window structure to the DOM via D3.js
     * DOM structure is this:
     *  .modal
     *      |-  .content .modal-content
     *              |-  .header .modal-header
     *              |-  .body   .modal-body
     *              |-  .footer .modal-footer
     *
     */
    create(){
        const modal = d3.select(this.parentNode)
            .append('div')
            .classed('modal', true)
            .attr('id', this.DOM_ID);

        const content = modal.append('div')
            .classed('content', true)
            .classed('modal-content', true);

        const header = content.append('div')
            .classed('header', true)
            .classed('modal-header', true);

        this.header = header.append('div')
            .classed('header-content', true);

        const exitButton = header.append('div').classed('header-exit', true);
        exitButton.on('click',(e) => {
            this.getSelection().style('display', 'none');
        })

        exitButton.append('h1').html('<i class="fas fa-times"></i>');


        this.body = content.append('div')
            .classed('body', true)
            .classed('modal-body', true);

        this.footer = content.append('div')
            .classed('footer', true)
            .classed('modal-footer', true);

        this.element = modal;
    }


    /**
     * Gets the d3.selection instance of this modal window.
     * @returns D3.selection
     */
    getSelection(){
        return this.element;
    }


    /**
     * Enables to set HTML of the header DIV of the modal.
     * @param html string
     */
    setHeader(html){
        this.header.html(html);
        console.log('setting header');
    }


    /**
     * Applies .append function of D3.js on header library and returns its new selection of appended tag.
     * @param tagName string
     * @returns D3.selection
     */
    appendHeader(tagName){
        return this.header.append(tagName);
    }


    /**
     * Enables to set HTML of the header DIV of the modal.
     * @param html string
     */
    setBody(html){
        this.body.html(html);
    }


    /**
     * Applies .append function of D3.js on body library and returns its new selection of appended tag.
     * @param tagName string
     * @returns D3.selection
     */
    appendBody(tagName){
        return this.body.append(tagName);
    }


    /**
     * Enables to set HTML of the header DIV of the modal.
     * @param html string
     */
    setFooter(html){
        this.footer.html(html);
    }


    /**
     * Applies .append function of D3.js on footer library and returns its new selection of appended tag.
     * @param tagName string
     * @returns D3.selection
     */
    appendFooter(tagName){
        return this.footer.append(tagName);
    }
}