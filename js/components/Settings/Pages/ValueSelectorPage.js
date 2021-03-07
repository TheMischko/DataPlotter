import * as d3 from "d3";
import IModalPage from "./IModalPage";
import css from '/css/DataUpload.css'
import CsvLoader from "../../CsvLoader";

export default class ValueSelectorPage extends IModalPage{
    /**
     * Constructor for ValueSelectorPage class.
     * @param modal - instance of Modal class working as parent
     */
    constructor(modal) {
        super(modal)
        this.nextValue = 'x';
        this.xValue = null;
        this.yValue = null;
    }
    /**
     * Returns title of the page.
     * @returns {string}
     */
    getTitle(){
        return "Select two values (x and y) to explore"
    }


    /**
     * Returns HTML content of the page.
     * @returns {Promise}
     */
    getContent(){
        return new Promise((resolve, reject) => {
            let columns = [];
            const csv = new CsvLoader();
            csv.readFile(this.modal.data['files'][0]).then(r => {
                columns = csv.getHeaders();
                let numHTMLcolumns = 0;
                if(columns.length <= 10)
                    numHTMLcolumns = 1;
                else if(columns.length <= 20)
                    numHTMLcolumns = 2;
                else
                    numHTMLcolumns = 3;

                let html = `
            <div class="value-selector" style="columns: ${numHTMLcolumns}">
                <label class="valueCheckBox-row">
                    Linear scale
                    <input class="valueCheckBox" type="checkbox" value="linear">
                    <span class="checkmark"></span>
                </label>
            `;
                columns.forEach((i) => {
                    html += `
                    <label class="valueCheckBox-row">
                        ${i}
                        <input class="valueCheckBox" type="checkbox" value="${i}">
                        <span class="checkmark"></span>
                    </label>
                    `
                });
                html += `</div>`
                resolve(html);
            });
            /*
            csv.readFileFromPath('src/csv_test.csv').then(r => {
                columns = csv.getHeaders();
                let numHTMLcolumns = 0;
                if(columns.length <= 10)
                    numHTMLcolumns = 1;
                else if(columns.length <= 20)
                    numHTMLcolumns = 2;
                else
                    numHTMLcolumns = 3;

                let html = `
            <div class="value-selector" style="columns: ${numHTMLcolumns}">
            `;
                columns.forEach((i) => {
                    html += `
                    <input class="valueCheckBox" type="checkbox" value="${i}">
                    <label class="valueCheckBox-row">${i}</label><br/>
                    `
                });
                html += `</div>`
                resolve(html);
            });
            */
        });

    }


    /**
     * Signalize if modal can be switched to other page.
     * @returns {boolean}
     */
    isAllowedToNext(){
        return this.jobDone
    }

    /**
     * Used for inserting JS code in runtime environment
     */
    initFunctions(){
        const checkBoxes = document.querySelectorAll('.valueCheckBox');
        checkBoxes.forEach((c) => {
            c.addEventListener('click', (e) => {
                const target = d3.select(e.target);
                let futureNextValue = 'x';
                if(target.checked){
                    if(e.target.classList.contains('xValue')){
                        e.target.classList.remove('xValue', 'checked');
                        this.xValue = null;
                        e.target.checked = false;
                        this.nextValue = 'x';
                    } else {
                        e.target.classList.remove('yValue', 'checked');
                        this.yValue = null;
                        target.checked = false;
                        this.nextValue = 'y';
                    }
                } else if(e.target.classList.contains('xValue') && e.target.classList.contains('yValue')){
                    e.target.classList.remove('xValue', 'yValue');
                    this.xValue = null;
                    this.yValue = null;
                } else {
                    if (this.nextValue === 'x') {
                        const selected = document.querySelectorAll('.valueCheckBox.xValue');
                        selected.forEach((s) => {
                            s.classList.remove('xValue', 'selected');
                            s.checked = false;
                        })
                        e.target.classList.add('xValue', 'selected');
                        this.xValue = e.target.value;
                        target.checked = true;
                        this.nextValue = 'y';
                    } else {
                        const selected = document.querySelectorAll('.valueCheckBox.yValue');
                        selected.forEach((s) => {
                            s.classList.remove('yValue', 'selected');
                            s.checked = false;
                        })
                        e.target.classList.add('yValue', 'selected');
                        this.yValue = e.target.value;
                        target.checked = true;
                        this.nextValue = 'x';
                    }
                }
                if((document.querySelectorAll('.valueCheckBox.xValue').length !== 0) &&
                (document.querySelectorAll('.valueCheckBox.yValue').length !== 0)){
                    this.jobDone = true;
                    this.modal.activePageDoneHandler();

                } else if(this.jobDone){
                    this.jobDone = false;
                    this.modal.activePageDoneHandler();
                }

            })
        });
    }

    /**
     * If page needs to return some values to other page of other classes, this function is used.
     * @returns dict with key value and value itself
     */
    returnValue(){
        return {
            key: 'axes',
            value: {
                x:  this.xValue,
                y:  this.yValue
            }
        }
    }
}