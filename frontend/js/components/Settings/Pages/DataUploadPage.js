import * as d3 from "d3";
import IModalPage from "./IModalPage";
import css from "../../../../css/DataUpload.css"
const $ = require('jquery-ajax');

/**
 * Page that handles uploading file with data from users input.
 */
export default class DataUploadPage extends IModalPage{

    constructor(modal) {
        super(modal);
        this.title = "Provide a file with data"
        this.jobDone = false;
        this.file = null;
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
                    <input draggable="true" type="file" name="files[]" id="fileUpload"  accept=".csv">
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
                <div id="fileNameRow" class="hidden">
                    <label for="fileName">Name the file:</label>
                    <input type="text" id="fileName" />
                </div>
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
        //Skip this page if environment has File ID already.
        if(typeof this.modal.data.file !== "undefined"
          && this.modal.data.file !== null
          && this.modal.data.file !== ""){
            this.jobDone = true;
            this.file = this.modal.data.file;
            this.modal.forceNextPage();
        }

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
        }

        form.on('drop', (e) => {
            const droppedFile = e.dataTransfer.files[0];
            this.parseFiles(droppedFile);
        });

        input.on('change', (e) => {
            const file = e.target.files[0];
            this.parseFiles(file);
        });


        d3.select('#fileName')
          .on('change', (e) => this.handleNameChange(e))
          .on('keyup', (e) => this.handleNameChange(e))
          .on('blur', (e) => this.setFileName(e));
    }


    /**
     * Validates if files from inputs are valid and shows user correct information.
     * @param file FileList
     */
    parseFiles(file) {
        const error = d3.select('.fileUpload-error')
          .classed('show', false);
        if (typeof file === "undefined" || file === null) {
            error.classed('show', true);
            error.text(error.text().replace('.', 'Error - No files were uploaded, try again.'));
            return;
        }
        const SERVER_URL = localStorage.getItem("SERVER_URL");
        const fd = new FormData();
        fd.append('file', file);
        $.ajax({
            url: SERVER_URL + '/files/upload',
            method: 'POST',
            data: fd,
            contentType: false,
            processData: false,
            beforeSend: (req) => {
                req.setRequestHeader('Access-Control-Allow-Origin', SERVER_URL)
                req.setRequestHeader('Access-Control-Allow-Credentials', 'true')
            },
            success: (res) => {
                const response = JSON.parse(res)

                const infoDiv = d3.select('.fileUpload-success').html('Uploaded:');
                infoDiv.html(infoDiv.html() + '<br />' +file.name);
                this.file = response.id;

                infoDiv.classed('show', true);
                d3.select('label[for="fileUpload"] > strong').text('Choose a new file again');

                d3.select('#fileNameRow').classed("hidden", false);
            },
            error: (res) => {
                error.classed('show', true);
                d3.select('#fileNameRow').classed("hidden", true);
                error.text(error.text().replace('.', res));
            }
        });
    }


    /**
     * Signalize if modal can be switched to other page.
     * @returns {boolean}
     */
    isAllowedToNext() {
        return this.jobDone
    }

    /**
     * Reset output value of the page to stage before any action was done.
     * Also resets already stored value in modal
     */
    resetOutputValue(){
        this.file = null;
        this.modal.data.file = null;
    }

    /**
     * Called when value of name input is changed.
     * @param e
     */
    handleNameChange(e){
        const value = e.target.value;
        if(value === ""){
            this.jobDone = false;
        }
        if(this.file !== null && this.file.length > 0){
            this.jobDone = true;
            this.modal.activePageDoneHandler();
        }
    }


    /**
     * Send request to API to change nickname of a single file.
     * File has to be saved in this.file attribute and name in e.target.value attribute.
     * @param e Event
     */
    setFileName(e){
        const value = e.target.value;
        if(value.length > 0 && this.file != null){
            const SERVER_URL = localStorage.getItem("SERVER_URL");
            $.ajax({
                url: SERVER_URL + "/files/rename",
                method: 'POST',
                data: {
                    fileID: this.file,
                    nickname: value
                },
                success: (res) => {
                    console.log(res);
                },
                error: (res) => {
                    console.error(res);
                }
            })
        }
    }

    /**
     * If page needs to return some values to other page of other classes, this function is used.
     * @returns
     */
    returnValue(){
        return new Promise(((resolve, reject) => {
            resolve([{
                key:    "file",
                value:  this.file
            }]);
        }))

    }
}