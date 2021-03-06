export default class IModalPage{
    /**
     * Constructor for every derivative of this interface.
     * @param modal - instance of Modal class working as parent
     */
    constructor(modal) {
        this.modal = modal
    }
    /**
     * Returns title of the page.
     * @returns {string}
     */
    getTitle(){
        const variable = "type string";
        return variable
    }


    /**
     * Returns HTML content of the page.
     * @returns {Promise}
     */
    getContent(){
        return new Promise(((resolve, reject) => {
            resolve(null);
        }))
    }


    /**
     * Signalize if modal can be switched to other page.
     * @returns {boolean}
     */
    isAllowedToNext(){
        this.jobDone = false;
        return this.jobDone
    }

    /**
     * Used for inserting JS code in runtime environment
     */
    initFunctions(){
    }

    /**
     * If page needs to return some values to other page of other classes, this function is used.
     * @returns dict with key value and value itself
     */
    returnValue(){
        return {
            key: null,
            value: null
        }
    }
}