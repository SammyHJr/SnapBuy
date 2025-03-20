const navigationBar = Handlebars.compile(document.querySelector('#example-template').innerHTML);
const navigationItems = {
    links: ['Home',
    'About us',
    'contact']
};
document.getElementById('content').innerHTML = template(data);