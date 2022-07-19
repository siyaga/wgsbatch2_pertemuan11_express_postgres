const fs = require('fs');

// Membuat folder data jika belom ada
const dirPath = './data';
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
}

// Membuat file contacts.json jika belom ada
const dataPath = './data/contacts.json';
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]', 'utf8');

}
// Ambil semua data di contact.json
const loadContact = () => {

    const fileBuffer = fs.readFileSync('data/contacts.json', 'utf8');
    const contacts = JSON.parse(fileBuffer);
    return contacts;
}

// Cari contact berdasarkan nama untuk detail
const findDetailContact = (name) => {
    const contacts = loadContact();

    const contact = contacts.find(
        (contact) => contact.name.toLowerCase() === name.toLowerCase()
    );
    return contact;
}

const saveDataContacts = (contacts) => {
    fs.writeFileSync('data/contacts.json', JSON.stringify(contacts));

}

const addDataContact = (contact) => {
    const contacts = loadContact();
    contacts.push(contact)
    saveDataContacts(contacts);
}

const cekDuplikat = (name) => {
    const contacts = loadContact();
    const contact = contacts.find(
        (contact) => contact.name.toLowerCase() === name.toLowerCase())
    return contact;
}
// membat fungsion Delete data json
const deleteDataContact = (name) => {
    const contacts = loadContact();
    const filteredContacts = contacts.filter((contact) => contact.name !== name)
    saveDataContacts(filteredContacts);


}
// Membuat fungsion Update data json
const updateDataContact = (contactDataBaru) => {
    const contacts = loadContact();
    // hilangkan contact lama yang anamanya sama dengan oldNama
    const filteredContacts = contacts.filter((contact) => contact.name !== contactDataBaru.oldName);
    delete contactDataBaru.oldName;
    filteredContacts.push(contactDataBaru);
    saveDataContacts(filteredContacts);

}



module.exports = {
    loadContact,
    findDetailContact,
    addDataContact,
    cekDuplikat,
    updateDataContact,
    deleteDataContact
}