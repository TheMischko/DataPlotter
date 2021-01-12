import * as d3 from "d3";
import IModalPage from "./IModalPage";
import css from '/css/DataUpload.css'

export default class DataUploadPage extends IModalPage{

    constructor(modal) {
        super(modal);
        this.title = "Provide a file with data"
        this.jobDone = false;
        this.files = [];
        this.allowedTypes = [
            'application/vnd.ms-excel',
            'text/csv'
        ]
    }

    /**
     * Returns title of the page.
     * @returns {string}
     */
    getTitle(){
        return this.title;
    }


    /**
     * Returns HTML content of the page.
     * @returns {Promise}
     */
    getContent(){
        return new Promise(((resolve, reject) => {
            const html = `
                <p>
                    Provide a file either by dragging it on the upload control or by clicking on it and selecting it
                     from your computer file manager.
                </p>
                <form draggable="true" class="fileUpload-box" method="post" action="" enctype="multipart/form-data">
                <div class="fileUpload-input">
                    <i class="fas fa-file-upload"></i>
                    <input draggable="true" type="file" name="files[]" id="fileUpload"  accept=".csv" multiple>
                    <label for="fileUpload">
                        <strong>Choose a file with data</strong>
                        <span class="fileUpload-dragndrop">or drag it here</span>
                        .
                    </label>
                </div>
                <div class="fileUpload-uploading fileUpload-message">Uploading…</div>
                 <div class="fileUpload-success fileUpload-message"></div>
                 <div class="fileUpload-error fileUpload-message">Error! <span></span>.</div>
                </form>
                `;
            resolve(html);
        }));
    }


    /**
     * Checks if browser environment is suitable for drag and drop actions.
     * @returns {boolean} true = suitable
     */
    isAdvancedUpload() {
        const div = document.createElement('div');
        return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    }


    /**
     * Used for inserting JS code in runtime environment
     */
    initFunctions() {
        const form = d3.select('.fileUpload-box');
        const input = d3.select('#fileUpload');

        if(this.isAdvancedUpload()){
            form.classed('has-advanced-upload', true);

            let droppedFiles = false;

            form.on('drag dragstart dragend dragover dragenter dragleave drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            form.on('dragover dragenter', (e) => {
                form.classed('is-dragover', true);
            });

            form.on('dragleave dragend drop', (e) => {
                form.classed('is-dragover', false);
            });

            form.on('drop', (e) => {
                droppedFiles = e.dataTransfer.files;
                this.parseFiles(droppedFiles);
            });

            input.on('change', (e) => {
                const files = e.target.files;
                this.parseFiles(files);
            })
        }
    }


    /**
     * Validates if files from inputs are valid and shows user correct information.
     * @param files FileList
     */
    parseFiles(files) {
        if (files.length === 0) {
            const error = d3.select('.fileUpload-error')
                .classed('show', true);
            error.text(error.text().replace('.', 'No files to upload.'));
            return;
        }

        this.files = [];
        const infoDiv = d3.select('.fileUpload-success').html('Uploaded:');
        for(let i = 0; i < files.length; i++){
            if(!(this.allowedTypes.includes(files[i].type))){
                continue;
            } else {
                this.files.push(files[i]);
                infoDiv.html(infoDiv.html() + '<br />' +files[i].name);
            }
        }

        if(this.files.length > 0) {
            this.jobDone = true;
            this.modal.activePageDoneHandler();

            infoDiv.classed('show', true);
            d3.select('label[for="fileUpload"] > strong').text('Choose a new file again')
        }
    }


    /**
     * Signalize if modal can be switched to other page.
     * @returns {boolean}
     */
    isAllowedToNext() {
        return this.jobDone
    }

    /**
     * If page needs to return some values to other page of other classes, this function is used.
     * @returns
     */
    returnValue(){
        return {
            key:    "files",
            value:  this.files
        }
    }
}