import { executeOSAScript } from "./osascript";

export type Note = {
    id: string;
    name: string;
    creationDate: string;
    modificationDate: string;
    plaintext: string;
};

export type Folder = {
    id: string;
    name: string;
};

export async function createNote(
    folderId: string,
    note: {
        name: string;
        body: string;
    }
): Promise<Omit<Note, "plaintext">> {
    const escapedName = note.name.replace(/[\\'"]/g, "\\$&");
    const escapedBody = note.body
        .replace(/[\\'"]/g, "\\$&")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "");
    const result = await executeOSAScript(`
        const Notes = Application('Notes');

        const folder = Notes.folders.whose({ id: '${folderId}' })[0];
        const note = Notes.Note({
            name: "${escapedName}",
            body: "${escapedBody}"
        });

        folder.notes.push(note);
        JSON.stringify({
            id: note.id(),
            name: note.name(),
            creationDate: note.creationDate(),
            modificationDate: note.modificationDate()
        });
    `);

    return JSON.parse(result) as Omit<Note, "body" | "plaintext">;
}

export async function getFolders(): Promise<Folder[]> {
    const result = await executeOSAScript(`
        const Notes = Application('Notes');
        const folders = Notes.folders();

        JSON.stringify(folders.map(folder => {
            return {
                id: folder.id(),
                name: folder.name()
            };
        }));
    `);

    return JSON.parse(result) as Folder[];
}

export async function getNotes(
    folderId: string
): Promise<Omit<Note, "plaintext">[]> {
    // Use individual property access instead of .properties()
    // to avoid error -1741 on iCloud-synced notes
    const result = await executeOSAScript(`
        const Notes = Application('Notes');
        
        const targetFolder = Notes.folders.byId('${folderId}');
        const notes = targetFolder.notes();

        JSON.stringify(notes.map(n => {
            return {
                id: n.id(),
                name: n.name(),
                creationDate: n.creationDate(),
                modificationDate: n.modificationDate(),
            };
        }));
    `);

    const notes = JSON.parse(result);

    return notes as Omit<Note, "plaintext">[];
}

export async function getNoteById(id: string): Promise<Note> {
    // Use individual property access to avoid error -1741 on iCloud-synced notes
    const result = await executeOSAScript(`
        const Notes = Application('Notes');
        const note = Notes.notes.byId('${id}');

        JSON.stringify({
            id: note.id(),
            name: note.name(),
            plaintext: note.plaintext(),
            creationDate: note.creationDate(),
            modificationDate: note.modificationDate()
        });
    `);

    return JSON.parse(result);
}

export async function getNoteByTitle(title: string): Promise<Note> {
    // Use individual property access to avoid error -1741 on iCloud-synced notes
    const result = await executeOSAScript(`
        const Notes = Application('Notes');
        
        const notes = Notes.notes.whose({name: '${title}'});        
        const note = notes[0];

        JSON.stringify({
            id: note.id(),
            name: note.name(),
            plaintext: note.plaintext(),
            creationDate: note.creationDate(),
            modificationDate: note.modificationDate()
        });
    `);

    return JSON.parse(result);
}

export async function noteCount(): Promise<number> {
    const result = await executeOSAScript(`const Notes = Application('Notes');
const notes = Notes.notes();
notes.length`);

    return parseInt(result);
}
