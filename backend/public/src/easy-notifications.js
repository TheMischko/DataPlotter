/***
 * Easy notification
 * @description: 'Lightweight JavaScript library for displaying notifications of flash messages'
 * @author: 'Miško Dvořák'
 */
if(!$ || typeof $ === "undefined"){
    console.log('jQuery not found!');
}
const NOTIFY_MAIN_ID = "notifications--main";
const NOTIFY_STORAGE_TEXT_KEY = "easy-notification-text";
const NOTIFY_STORAGE_OPTIONS_KEY = "easy-notification-options";
const NOTIFY_BASIC_SETTINGS = {
    type: 'default',
    autoHide: 'true',
    duration: '3000',

}

$(() => {
    console.log('easy-notifications loaded');
    const wrapper = $('<div class="notifications--wrapper"></div>');
    const main = $('<div class="notifications--main" id="'+NOTIFY_MAIN_ID+'"></div>');

    wrapper.append(main);
    $(document.body).append(wrapper);

    const storageText = JSON.parse(localStorage.getItem(NOTIFY_STORAGE_TEXT_KEY ));
    let storageOptions = JSON.parse(localStorage.getItem(NOTIFY_STORAGE_OPTIONS_KEY));
    storageOptions = storageOptions ? storageOptions : {};
    if(storageText){
        localStorage.removeItem(NOTIFY_STORAGE_TEXT_KEY);
        localStorage.removeItem(NOTIFY_STORAGE_OPTIONS_KEY);
        notify(storageText, storageOptions);

    }
})

const notify = (text, options = {}) => {
    const main = $('#'+NOTIFY_MAIN_ID);

    const customClass = (typeof options.customClass !== 'undefined') ? options.customClass : "";

    const notify = $('<div class="notifications--notification '+customClass+'"></div>').text(text);

    const type = (typeof options.type !== 'undefined') ? options.type : NOTIFY_BASIC_SETTINGS.type

    switch(type){
        case 'default':
            notify.addClass('notifications--default');
            break;
        case 'danger':
            notify.addClass('notifications--danger');
            break;
        case 'success':
            notify.addClass('notifications--success');
            break;
        case 'warning':
            notify.addClass('notifications--warning');
            break;
        case 'basic':
            notify.addClass('notifications--basic');
            break;
        default:
            notify.addClass('.notifications--default');
            break;
    }


    notify.on('click', (e) => {
        notify.slideUp(250);
        setTimeout(()=>notify.remove(), 250);
    });

    main.prepend(notify);
    notify.hide();
    notify.slideDown(250);

    const autoHide = (typeof options.autoHide !== 'undefined') ? options.autoHide : NOTIFY_BASIC_SETTINGS.autoHide;
    if(autoHide == 'true') {
        const duration = (typeof options.duration !== 'undefined') ? options.duration : NOTIFY_BASIC_SETTINGS.duration
        setTimeout(() => {
            notify.slideUp(250);
            setTimeout(() => notify.remove(), 250);
        }, Number(duration));
    }
}

const storageNotify = (text, options = {}) => {
    localStorage.setItem(NOTIFY_STORAGE_TEXT_KEY,JSON.stringify(text));
    localStorage.setItem(NOTIFY_STORAGE_OPTIONS_KEY, JSON.stringify(options));
}