import Modal from "./Modal";
import * as d3 from "d3";

export default class SettingsModal extends Modal{
    constructor(parentNode, selector, options) {
        super(parentNode, selector, options);
        this.setHeader('<h1>Step 1: Upload a file with data</h1>');
        const body = this.appendBody('p');
        body.text('Test body');
        this.setFooter('<h1>footer</h1>')
    }
}